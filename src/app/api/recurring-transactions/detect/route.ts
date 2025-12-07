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

    // Group transactions by merchant/description and amount
    const byKey = new Map<
      string,
      Array<{ date: Date; amount: number; merchant?: string; description?: string; category?: string }>
    >();

    for (const tx of transactions as Array<{
      merchant?: string;
      rawDescription?: string;
      amount?: number;
      date?: Date | string;
      category?: string;
    }>) {
      if (!tx.date) continue;

      const merchant = tx.merchant || "";
      const description = tx.rawDescription || "";
      const amount = Math.abs(Number(tx.amount ?? 0));

      // Create a key based on merchant/description and similar amount
      // Group by merchant if available, otherwise by description
      const key = merchant
        ? `${merchant}_${Math.round(amount / 10) * 10}` // Round to nearest 10 for grouping
        : `${description.substring(0, 30)}_${Math.round(amount / 10) * 10}`;

      const date = tx.date instanceof Date ? tx.date : new Date(tx.date);

      if (!byKey.has(key)) {
        byKey.set(key, []);
      }
      byKey.get(key)!.push({
        date,
        amount,
        merchant: merchant || undefined,
        description: description || undefined,
        category: tx.category || undefined,
      });
    }

    // Detect recurring patterns
    const detectedRecurring: Array<{
      name: string;
      description: string;
      amount: number;
      type: "income" | "expense";
      category?: string;
      merchant?: string;
      frequency: "daily" | "weekly" | "monthly" | "yearly";
      startDate: Date;
      nextOccurrence: Date;
      occurrences: number;
    }> = [];

    for (const [key, txs] of byKey.entries()) {
      if (txs.length < 2) continue; // Need at least 2 occurrences

      // Sort by date
      txs.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Check if amounts are similar (within 10% variance for recurring transactions)
      const amounts = txs.map((t) => Math.abs(t.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.some(
        (a) => Math.abs(a - avgAmount) / avgAmount > 0.1,
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
      let frequency: "daily" | "weekly" | "monthly" | "yearly";
      if (avgInterval >= 0.8 && avgInterval <= 1.5) {
        frequency = "daily";
      } else if (avgInterval >= 6 && avgInterval <= 8) {
        frequency = "weekly";
      } else if (avgInterval >= 25 && avgInterval <= 35) {
        frequency = "monthly";
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        frequency = "yearly";
      } else {
        continue; // Not a standard cycle
      }

      // Determine transaction type (income or expense)
      const firstAmount = txs[0].amount;
      const type: "income" | "expense" = firstAmount >= 0 ? "income" : "expense";

      // Get name and merchant
      const firstTx = txs[0];
      const name = firstTx.merchant || firstTx.description || "Recurring Transaction";
      const description = firstTx.description || firstTx.merchant || "";

      // Calculate next occurrence (from most recent transaction)
      const lastTx = txs[txs.length - 1];
      const nextOccurrence = new Date(lastTx.date);
      if (frequency === "daily") {
        nextOccurrence.setDate(nextOccurrence.getDate() + 1);
      } else if (frequency === "weekly") {
        nextOccurrence.setDate(nextOccurrence.getDate() + 7);
      } else if (frequency === "monthly") {
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
      } else {
        nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
      }

      detectedRecurring.push({
        name,
        description,
        amount: Math.abs(avgAmount),
        type,
        category: firstTx.category,
        merchant: firstTx.merchant,
        frequency,
        startDate: txs[0].date,
        nextOccurrence,
        occurrences: txs.length,
      });
    }

    // Save detected recurring transactions to database
    const recurringCollection = db.collection("recurringTransactions");
    const now = new Date();
    let savedCount = 0;

    for (const rec of detectedRecurring) {
      // Check if similar recurring transaction already exists
      const existing = await recurringCollection.findOne({
        userId: user._id,
        name: rec.name,
        frequency: rec.frequency,
        amount: { $gte: rec.amount * 0.9, $lte: rec.amount * 1.1 }, // Within 10%
      });

      if (!existing) {
        await recurringCollection.insertOne({
          userId: user._id,
          name: rec.name,
          description: rec.description,
          amount: rec.type === "expense" ? -rec.amount : rec.amount,
          type: rec.type,
          category: rec.category,
          merchant: rec.merchant,
          frequency: rec.frequency,
          startDate: rec.startDate,
          endDate: null,
          nextOccurrence: rec.nextOccurrence,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        savedCount++;
      }
    }

    return NextResponse.json({
      detected: detectedRecurring.length,
      saved: savedCount,
      recurring: detectedRecurring,
    });
  } catch (error) {
    console.error("Error detecting recurring transactions", error);
    return NextResponse.json(
      { error: "Failed to detect recurring transactions" },
      { status: 500 },
    );
  }
}

