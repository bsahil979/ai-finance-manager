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
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get active recurring transactions
    const recurringTransactions = await db
      .collection("recurringTransactions")
      .find({
        userId: user._id,
        isActive: true,
        $or: [
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      })
      .toArray();

    // Project future transactions for next 30 days
    const projections: Array<{
      date: Date;
      amount: number;
      type: string;
      name: string;
      category?: string;
      merchant?: string;
    }> = [];

    for (const rt of recurringTransactions as Array<{
      name: string;
      amount: number;
      type: string;
      frequency: string;
      nextOccurrence: Date | string;
      endDate?: Date | string | null;
      category?: string;
      merchant?: string;
    }>) {
      let currentDate = new Date(rt.nextOccurrence);
      const endDate = rt.endDate ? new Date(rt.endDate) : null;

      while (currentDate <= thirtyDaysFromNow) {
        if (endDate && currentDate > endDate) break;

        projections.push({
          date: new Date(currentDate),
          amount: rt.amount,
          type: rt.type,
          name: rt.name,
          category: rt.category,
          merchant: rt.merchant,
        });

        // Calculate next occurrence
        if (rt.frequency === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (rt.frequency === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (rt.frequency === "monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (rt.frequency === "yearly") {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else {
          break; // Unknown frequency
        }
      }
    }

    // Sort by date
    projections.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    projections.forEach((p) => {
      if (p.type === "income") {
        totalIncome += p.amount;
      } else {
        totalExpense += Math.abs(p.amount);
      }
    });

    return NextResponse.json({
      projections,
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        transactionCount: projections.length,
      },
    });
  } catch (error) {
    console.error("Error projecting future transactions", error);
    return NextResponse.json(
      { error: "Failed to project future transactions" },
      { status: 500 },
    );
  }
}


