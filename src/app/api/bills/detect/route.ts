import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    // Get all transactions for this user
    const transactions = await db
      .collection("transactions")
      .find({ userId: user._id })
      .sort({ date: -1 })
      .toArray();

    if (!transactions.length) {
      return NextResponse.json(
        { message: "No transactions found. Import some transactions first." },
        { status: 200 },
      );
    }

    const detectedBills: Array<{
      name: string;
      amount: number;
      dueDate: Date;
      category: string;
      isRecurring: boolean;
      recurringFrequency?: string;
      occurrences: number;
    }> = [];

    // Look for bill-related transactions
    // Common bill keywords in merchant/description
    const billKeywords = [
      "bill",
      "electricity",
      "water",
      "gas",
      "internet",
      "phone",
      "rent",
      "insurance",
      "loan",
      "credit card",
      "utility",
      "maintenance",
      "tax",
      "subscription",
    ];

    // Group transactions by merchant/description that contain bill keywords
    const byBillName = new Map<
      string,
      Array<{ date: Date; amount: number; category?: string }>
    >();

    for (const tx of transactions as Array<{
      merchant?: string;
      rawDescription?: string;
      amount?: number;
      date?: Date | string;
      category?: string;
    }>) {
      if (!tx.date) continue;

      const merchant = (tx.merchant || "").toLowerCase();
      const description = (tx.rawDescription || "").toLowerCase();
      const combined = `${merchant} ${description}`;

      // Check if transaction is bill-related
      const isBill = billKeywords.some((keyword) =>
        combined.includes(keyword.toLowerCase()),
      );

      if (isBill && tx.amount && tx.amount < 0) {
        // Only expenses
        const billName =
          tx.merchant ||
          tx.rawDescription ||
          "Unknown Bill";
        const amount = Math.abs(Number(tx.amount));

        const date = tx.date instanceof Date ? tx.date : new Date(tx.date);

        if (!byBillName.has(billName)) {
          byBillName.set(billName, []);
        }
        byBillName.get(billName)!.push({
          date,
          amount,
          category: tx.category,
        });
      }
    }

    // Detect recurring bills
    for (const [billName, txs] of byBillName.entries()) {
      if (txs.length < 2) continue; // Need at least 2 occurrences

      // Sort by date
      txs.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Check if amounts are similar (within 15% variance for bills)
      const amounts = txs.map((t) => Math.abs(t.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.some(
        (a) => Math.abs(a - avgAmount) / avgAmount > 0.15,
      );
      if (variance) continue; // Amounts vary too much

      // Calculate average interval between transactions
      const intervals: number[] = [];
      for (let i = 1; i < txs.length; i++) {
        const daysDiff =
          (txs[i].date.getTime() - txs[i - 1].date.getTime()) /
          (1000 * 60 * 60 * 24);
        intervals.push(daysDiff);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Determine frequency
      let recurringFrequency: "weekly" | "monthly" | "yearly" | undefined;
      let isRecurring = false;

      if (avgInterval >= 6 && avgInterval <= 8) {
        recurringFrequency = "weekly";
        isRecurring = true;
      } else if (avgInterval >= 25 && avgInterval <= 35) {
        recurringFrequency = "monthly";
        isRecurring = true;
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        recurringFrequency = "yearly";
        isRecurring = true;
      }

      // Calculate next due date (from most recent transaction)
      const lastTx = txs[txs.length - 1];
      const dueDate = new Date(lastTx.date);

      if (isRecurring && recurringFrequency) {
        // Set next due date based on frequency
        if (recurringFrequency === "monthly") {
          dueDate.setMonth(dueDate.getMonth() + 1);
        } else if (recurringFrequency === "weekly") {
          dueDate.setDate(dueDate.getDate() + 7);
        } else {
          dueDate.setFullYear(dueDate.getFullYear() + 1);
        }
      } else {
        // For non-recurring, set due date to 30 days from last payment
        dueDate.setDate(dueDate.getDate() + 30);
      }

      // Determine category
      const category =
        txs[0].category ||
        (billName.toLowerCase().includes("rent")
          ? "Rent"
          : billName.toLowerCase().includes("insurance")
          ? "Insurance"
          : billName.toLowerCase().includes("loan")
          ? "Loan Payment"
          : billName.toLowerCase().includes("credit")
          ? "Credit Card"
          : "Bills & Utilities");

      detectedBills.push({
        name: billName,
        amount: avgAmount,
        dueDate,
        category,
        isRecurring,
        recurringFrequency,
        occurrences: txs.length,
      });
    }

    // Save detected bills to database
    const billsCollection = db.collection("bills");
    const nowDate = new Date();
    let savedCount = 0;

    for (const bill of detectedBills) {
      // Check if similar bill already exists (to avoid duplicates)
      const existing = await billsCollection.findOne({
        userId: user._id,
        name: bill.name,
        isPaid: false,
        dueDate: {
          $gte: new Date(bill.dueDate.getTime() - 7 * 24 * 60 * 60 * 1000), // Within 7 days
          $lte: new Date(bill.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      if (!existing) {
        await billsCollection.insertOne({
          userId: user._id,
          name: bill.name,
          amount: bill.amount,
          dueDate: bill.dueDate,
          category: bill.category,
          isRecurring: bill.isRecurring,
          recurringFrequency: bill.recurringFrequency || null,
          accountId: null,
          notes: `Auto-detected from ${bill.occurrences} transaction(s)`,
          isPaid: false,
          paidDate: null,
          createdAt: nowDate,
          updatedAt: nowDate,
        });
        savedCount++;
      }
    }

    return NextResponse.json({
      detected: detectedBills.length,
      saved: savedCount,
      bills: detectedBills,
    });
  } catch (error) {
    console.error("Error detecting bills", error);
    return NextResponse.json(
      { error: "Failed to detect bills" },
      { status: 500 },
    );
  }
}

