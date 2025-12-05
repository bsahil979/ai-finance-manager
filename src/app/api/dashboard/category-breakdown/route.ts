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

    // Group by category
    const categoryMap: Record<string, number> = {};
    transactions.forEach((tx) => {
      const category = tx.category || "Uncategorized";
      categoryMap[category] = (categoryMap[category] || 0) + Math.abs(tx.amount);
    });

    // Convert to array and sort
    const breakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error("Error fetching category breakdown", error);
    return NextResponse.json(
      { error: "Failed to fetch category breakdown" },
      { status: 500 },
    );
  }
}

