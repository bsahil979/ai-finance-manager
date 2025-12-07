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

    const subscriptions = await db
      .collection("subscriptions")
      .find({
        userId: user._id,
        status: "active",
        nextRenewalDate: {
          $gte: now,
          $lte: thirtyDaysFromNow,
        },
      })
      .sort({ nextRenewalDate: 1 })
      .limit(5)
      .toArray();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching upcoming subscriptions", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming subscriptions" },
      { status: 500 },
    );
  }
}


