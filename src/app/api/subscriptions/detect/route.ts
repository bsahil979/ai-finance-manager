import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { generateAlerts } from "@/lib/alerts";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    
    // Get only expense transactions (exclude income/credits)
    const transactions = await db
      .collection("transactions")
      .find({ 
        userId: user._id,
        amount: { $lt: 0 } // Only expenses (negative amounts)
      })
      .sort({ date: -1 })
      .toArray();

    if (!transactions.length) {
      return NextResponse.json(
        { message: "No expense transactions found. Import some transactions first." },
        { status: 200 },
      );
    }

    // Group transactions by merchant
    const byMerchant = new Map<
      string,
      Array<{ date: Date; amount: number }>
    >();

    for (const tx of transactions as Array<{ merchant?: string; rawDescription?: string; amount?: number; date?: Date | string }>) {
      if (!tx.date) continue; // Skip transactions without dates
      
      const merchant =
        tx.merchant ||
        tx.rawDescription ||
        "Unknown";
      const date = tx.date instanceof Date ? tx.date : new Date(tx.date);
      const amount = Number(tx.amount ?? 0);

      // Double-check: only process expenses (negative amounts)
      if (amount >= 0) continue;

      if (!byMerchant.has(merchant)) {
        byMerchant.set(merchant, []);
      }
      byMerchant.get(merchant)!.push({ date, amount });
    }

    // Detect recurring patterns
    const detectedSubscriptions: Array<{
      merchant: string;
      amount: number;
      billingCycle: "weekly" | "monthly" | "yearly";
      nextRenewalDate: Date;
      occurrences: number;
    }> = [];

    for (const [merchant, txs] of byMerchant.entries()) {
      if (txs.length < 2) continue; // Need at least 2 occurrences

      // Sort by date
      txs.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Check if amounts are similar (within 5% variance)
      const amounts = txs.map((t) => Math.abs(t.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.some(
        (a) => Math.abs(a - avgAmount) / avgAmount > 0.05,
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

      // Determine billing cycle
      let billingCycle: "weekly" | "monthly" | "yearly";
      if (avgInterval >= 25 && avgInterval <= 35) {
        billingCycle = "monthly";
      } else if (avgInterval >= 6 && avgInterval <= 8) {
        billingCycle = "weekly";
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        billingCycle = "yearly";
      } else {
        continue; // Not a standard cycle
      }

      // Calculate next renewal date (from most recent transaction)
      const lastTx = txs[txs.length - 1];
      const nextRenewalDate = new Date(lastTx.date);
      if (billingCycle === "monthly") {
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
      } else if (billingCycle === "weekly") {
        nextRenewalDate.setDate(nextRenewalDate.getDate() + 7);
      } else {
        nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
      }

      detectedSubscriptions.push({
        merchant,
        amount: Math.abs(avgAmount),
        billingCycle,
        nextRenewalDate,
        occurrences: txs.length,
      });
    }

    // Save detected subscriptions to database
    const subscriptionsCollection = db.collection("subscriptions");
    const now = new Date();

    for (const sub of detectedSubscriptions) {
      await subscriptionsCollection.updateOne(
        { userId: user._id, merchant: sub.merchant },
        {
          $set: {
            userId: user._id,
            merchant: sub.merchant,
            amount: sub.amount,
            currency: "INR",
            billingCycle: sub.billingCycle,
            nextRenewalDate: sub.nextRenewalDate,
            status: "active",
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );
    }

    // Auto-generate alerts in background (fire and forget)
    generateAlerts(db, user._id).catch((err) => {
      console.error("Error auto-generating alerts:", err);
    });

    return NextResponse.json({
      detected: detectedSubscriptions.length,
      subscriptions: detectedSubscriptions,
    });
  } catch (error) {
    console.error("Error detecting subscriptions", error);
    return NextResponse.json(
      { error: "Failed to detect subscriptions" },
      { status: 500 },
    );
  }
}

