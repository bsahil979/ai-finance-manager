import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { generateAlerts } from "@/lib/alerts";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const result = await generateAlerts(db, user._id);

    return NextResponse.json({
      generated: result.generated,
      saved: result.saved,
    });
  } catch (error) {
    console.error("Error generating alerts", error);
    return NextResponse.json(
      { error: "Failed to generate alerts" },
      { status: 500 },
    );
  }
}

