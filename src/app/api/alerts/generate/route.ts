import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

export async function POST() {
  try {
    const db = await getDb();
    const now = new Date();
    const alerts: Array<{
      type: "renewal" | "unusual_spend";
      message: string;
      data?: Record<string, unknown>;
    }> = [];

    // 1. Check for upcoming subscription renewals (within 7 days)
    const subscriptions = await db
      .collection("subscriptions")
      .find({ status: "active" })
      .toArray();

    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const sub of subscriptions as Array<{ nextRenewalDate?: Date | string; merchant?: string; amount?: number; _id?: unknown }>) {
      if (sub.nextRenewalDate) {
        const renewalDate = new Date(sub.nextRenewalDate);
        if (renewalDate >= now && renewalDate <= sevenDaysFromNow) {
          alerts.push({
            type: "renewal",
            message: `${sub.merchant} subscription renews in ${Math.ceil(
              (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            )} days for $${sub.amount.toFixed(2)}`,
            data: {
              subscriptionId: sub._id,
              merchant: sub.merchant,
              amount: sub.amount,
              renewalDate: sub.nextRenewalDate,
            },
          });
        }
      }
    }

    // 2. Check for unusual spending (spending 2x average in a category/merchant this month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get this month's transactions
    const thisMonthTxns = await db
      .collection("transactions")
      .find({
        date: { $gte: monthStart, $lte: now },
        amount: { $lt: 0 }, // Only expenses
      })
      .toArray();

    // Get last month's transactions for comparison
    const lastMonthTxns = await db
      .collection("transactions")
      .find({
        date: { $gte: lastMonthStart, $lte: lastMonthEnd },
        amount: { $lt: 0 },
      })
      .toArray();

    // Calculate average spending per merchant
    const thisMonthByMerchant = new Map<string, number>();
    const lastMonthByMerchant = new Map<string, number>();

    for (const tx of thisMonthTxns as Array<{ merchant?: string; rawDescription?: string; amount?: number }>) {
      const merchant =
        tx.merchant ||
        tx.rawDescription ||
        "Unknown";
      const amount = Math.abs(Number(tx.amount ?? 0));
      thisMonthByMerchant.set(
        merchant,
        (thisMonthByMerchant.get(merchant) ?? 0) + amount,
      );
    }

    for (const tx of lastMonthTxns as Array<{ merchant?: string; rawDescription?: string; amount?: number }>) {
      const merchant =
        tx.merchant ||
        tx.rawDescription ||
        "Unknown";
      const amount = Math.abs(Number(tx.amount ?? 0));
      lastMonthByMerchant.set(
        merchant,
        (lastMonthByMerchant.get(merchant) ?? 0) + amount,
      );
    }

    // Find merchants with 2x spending increase
    for (const [merchant, thisMonthSpend] of thisMonthByMerchant.entries()) {
      const lastMonthSpend = lastMonthByMerchant.get(merchant) ?? 0;
      if (lastMonthSpend > 0 && thisMonthSpend >= lastMonthSpend * 2) {
        alerts.push({
          type: "unusual_spend",
          message: `Unusual spending on ${merchant}: $${thisMonthSpend.toFixed(2)} this month vs $${lastMonthSpend.toFixed(2)} last month`,
          data: {
            merchant,
            thisMonthSpend,
            lastMonthSpend,
          },
        });
      }
    }

    // Save alerts to database
    const alertsCollection = db.collection("alerts");
    const savedAlerts = [];

    for (const alert of alerts) {
      // Check if similar alert already exists (to avoid duplicates)
      const existing = await alertsCollection.findOne({
        type: alert.type,
        message: alert.message,
        isRead: false,
      });

      if (!existing) {
        const result = await alertsCollection.insertOne({
          type: alert.type,
          message: alert.message,
          data: alert.data,
          isRead: false,
          createdAt: now,
        });
        savedAlerts.push(result.insertedId);
      }
    }

    return NextResponse.json({
      generated: alerts.length,
      saved: savedAlerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Error generating alerts", error);
    return NextResponse.json(
      { error: "Failed to generate alerts" },
      { status: 500 },
    );
  }
}

