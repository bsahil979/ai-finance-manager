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
    
    // Get last 6 months of data
    const months: Array<{ month: string; income: number; expense: number }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const transactions = await db
        .collection("transactions")
        .find({
          userId: user._id,
          date: { $gte: monthStart, $lte: monthEnd },
        })
        .toArray();

      let income = 0;
      let expense = 0;

      transactions.forEach((tx) => {
        const amount = Number(tx.amount ?? 0);
        if (amount > 0) income += amount;
        if (amount < 0) expense += Math.abs(amount);
      });

      months.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        income,
        expense,
      });
    }

    return NextResponse.json({ trends: months });
  } catch (error) {
    console.error("Error fetching spending trends", error);
    return NextResponse.json(
      { error: "Failed to fetch spending trends" },
      { status: 500 },
    );
  }
}


