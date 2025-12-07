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
    const goals = await db
      .collection("goals")
      .find({ userId: user._id, status: "active" })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    // Calculate summary
    let totalTarget = 0;
    let totalCurrent = 0;
    let completedCount = 0;

    const allGoals = await db
      .collection("goals")
      .find({ userId: user._id })
      .toArray();

    allGoals.forEach((goal) => {
      totalTarget += Number(goal.targetAmount || 0);
      totalCurrent += Number(goal.currentAmount || 0);
      if (goal.status === "completed" || (Number(goal.currentAmount || 0) >= Number(goal.targetAmount || 0))) {
        completedCount++;
      }
    });

    return NextResponse.json({
      activeGoals: goals,
      totalGoals: allGoals.length,
      completedGoals: completedCount,
      totalTarget,
      totalCurrent,
      overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
    });
  } catch (error) {
    console.error("Error fetching goals summary", error);
    return NextResponse.json(
      { error: "Failed to fetch goals summary" },
      { status: 500 },
    );
  }
}


