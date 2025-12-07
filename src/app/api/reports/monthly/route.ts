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
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    const db = await getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get transactions for the month
    const transactions = await db
      .collection("transactions")
      .find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      })
      .toArray();

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};
    const merchantBreakdown: Record<string, number> = {};

    transactions.forEach((tx) => {
      const amount = Number(tx.amount ?? 0);
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpense += Math.abs(amount);
      }

      const category = tx.category || "Uncategorized";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(amount);

      const merchant = tx.merchant || tx.rawDescription || "Unknown";
      merchantBreakdown[merchant] = (merchantBreakdown[merchant] || 0) + Math.abs(amount);
    });

    // Get top categories and merchants
    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topMerchants = Object.entries(merchantBreakdown)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json({
      period: {
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        transactionCount: transactions.length,
      },
      breakdown: {
        categories: topCategories,
        merchants: topMerchants,
      },
      transactions: transactions.slice(0, 100), // Limit for response size
    });
  } catch (error) {
    console.error("Error generating monthly report", error);
    return NextResponse.json(
      { error: "Failed to generate monthly report" },
      { status: 500 },
    );
  }
}


