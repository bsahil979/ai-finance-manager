import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const db = await getDb();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    // Get transactions for the year
    const transactions = await db
      .collection("transactions")
      .find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      })
      .toArray();

    // Calculate monthly breakdown
    const monthlyData: Array<{ month: number; monthName: string; income: number; expense: number }> = [];
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m + 1, 0, 23, 59, 59, 999);
      
      let monthIncome = 0;
      let monthExpense = 0;

      transactions.forEach((tx) => {
        const txDate = tx.date ? new Date(tx.date) : null;
        if (txDate && txDate >= monthStart && txDate <= monthEnd) {
          const amount = Number(tx.amount ?? 0);
          if (amount > 0) monthIncome += amount;
          else monthExpense += Math.abs(amount);
        }
      });

      monthlyData.push({
        month: m + 1,
        monthName: new Date(year, m).toLocaleDateString("en-US", { month: "short" }),
        income: monthIncome,
        expense: monthExpense,
      });
    }

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    transactions.forEach((tx) => {
      const amount = Number(tx.amount ?? 0);
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpense += Math.abs(amount);
      }

      const category = tx.category || "Uncategorized";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(amount);
    });

    // Get top categories
    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json({
      period: {
        year,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        transactionCount: transactions.length,
      },
      monthlyBreakdown: monthlyData,
      breakdown: {
        categories: topCategories,
      },
    });
  } catch (error) {
    console.error("Error generating yearly report", error);
    return NextResponse.json(
      { error: "Failed to generate yearly report" },
      { status: 500 },
    );
  }
}


