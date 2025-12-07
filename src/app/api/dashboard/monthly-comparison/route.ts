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
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month transactions
    const currentMonthTxns = await db
      .collection("transactions")
      .find({
        userId: user._id,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      })
      .toArray();

    // Get last month transactions
    const lastMonthTxns = await db
      .collection("transactions")
      .find({
        userId: user._id,
        date: { $gte: lastMonthStart, $lte: lastMonthEnd },
      })
      .toArray();

    let currentIncome = 0;
    let currentExpense = 0;
    let lastIncome = 0;
    let lastExpense = 0;

    currentMonthTxns.forEach((tx) => {
      const amount = Number(tx.amount ?? 0);
      if (amount > 0) {
        currentIncome += amount;
      } else if (amount < 0) {
        currentExpense += Math.abs(amount); // Store as positive value for consistency
      }
    });

    lastMonthTxns.forEach((tx) => {
      const amount = Number(tx.amount ?? 0);
      if (amount > 0) {
        lastIncome += amount;
      } else if (amount < 0) {
        lastExpense += Math.abs(amount); // Store as positive value for consistency
      }
    });

    const incomeChange = lastIncome > 0 
      ? ((currentIncome - lastIncome) / lastIncome) * 100 
      : 0;
    const expenseChange = lastExpense > 0 
      ? ((currentExpense - lastExpense) / lastExpense) * 100 
      : 0;

    return NextResponse.json({
      currentMonth: {
        income: currentIncome,
        expense: currentExpense, // Already positive
      },
      lastMonth: {
        income: lastIncome,
        expense: lastExpense, // Already positive
      },
      incomeChange: incomeChange.toFixed(1),
      expenseChange: expenseChange.toFixed(1),
    });
  } catch (error) {
    console.error("Error fetching monthly comparison", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly comparison" },
      { status: 500 },
    );
  }
}


