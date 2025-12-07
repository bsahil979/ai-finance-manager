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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all budgets
    const budgets = await db
      .collection("budgets")
      .find({ userId: user._id })
      .toArray();

    // Get transactions for current month
    const transactions = await db
      .collection("transactions")
      .find({
        userId: user._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        type: "expense",
        amount: { $lt: 0 },
      })
      .toArray();

    // Calculate spending per category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach((tx) => {
      const category = tx.category || "Uncategorized";
      spendingByCategory[category] =
        (spendingByCategory[category] || 0) + Math.abs(tx.amount);
    });

    // Calculate summary stats
    let totalBudget = 0;
    let totalSpent = 0;
    let budgetsExceeded = 0;
    let budgetsWarning = 0;

    budgets.forEach((budget) => {
      totalBudget += budget.amount;
      const spent = spendingByCategory[budget.category] || 0;
      totalSpent += spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      if (percentage >= 100) budgetsExceeded++;
      else if (percentage >= 80) budgetsWarning++;
    });

    return NextResponse.json({
      totalBudgets: budgets.length,
      totalBudget,
      totalSpent,
      budgetsExceeded,
      budgetsWarning,
      budgetsOk: budgets.length - budgetsExceeded - budgetsWarning,
    });
  } catch (error) {
    console.error("Error fetching budget summary", error);
    return NextResponse.json(
      { error: "Failed to fetch budget summary" },
      { status: 500 },
    );
  }
}


