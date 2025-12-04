import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

export async function GET() {
  try {
    const db = await getDb();

    const transactions = await db
      .collection("transactions")
      .find({})
      .toArray();

    let totalIncome = 0;
    let totalExpense = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthIncome = 0;
    let monthExpense = 0;

    for (const tx of transactions as any[]) {
      const amount = Number(tx.amount ?? 0);
      const date = tx.date ? new Date(tx.date) : null;

      if (amount > 0) totalIncome += amount;
      if (amount < 0) totalExpense += amount;

      if (date && date >= monthStart && date <= now) {
        if (amount > 0) monthIncome += amount;
        if (amount < 0) monthExpense += amount;
      }
    }

    return NextResponse.json({
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense,
      net: totalIncome + totalExpense,
      monthIncome,
      monthExpense,
    });
  } catch (error) {
    console.error("Error building dashboard overview", error);
    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 },
    );
  }
}


