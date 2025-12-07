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

    const transactions = await db
      .collection("transactions")
      .find({ userId: user._id })
      .sort({ date: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching recent transactions", error);
    return NextResponse.json(
      { error: "Failed to fetch recent transactions" },
      { status: 500 },
    );
  }
}


