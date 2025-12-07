import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    const transactions = await db
      .collection("transactions")
      .find({ userId: user._id })
      .toArray();

    let totalIncome = 0;
    let totalExpense = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthIncome = 0;
    let monthExpense = 0;

    for (const tx of transactions as Array<{ amount?: number; date?: Date | string }>) {
      const amount = Number(tx.amount ?? 0);
      const date = tx.date ? new Date(tx.date) : null;

      if (amount > 0) {
        totalIncome += amount;
      } else if (amount < 0) {
        totalExpense += Math.abs(amount); // Store as positive value for consistency
      }

      if (date && date >= monthStart && date <= now) {
        if (amount > 0) {
          monthIncome += amount;
        } else if (amount < 0) {
          monthExpense += Math.abs(amount); // Store as positive value for consistency
        }
      }
    }

    return NextResponse.json({
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense, // Now stored as positive value
      net: totalIncome - totalExpense, // Subtract expenses from income
      monthIncome,
      monthExpense, // Now stored as positive value
    });
  } catch (error) {
    console.error("Error building dashboard overview", error);
    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 },
    );
  }
}


