import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const alerts = await db
      .collection("alerts")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = alerts.filter((a: any) => !a.isRead).length;

    return NextResponse.json({ alerts, unreadCount });
  } catch (error) {
    console.error("Error fetching alerts", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db.collection("alerts").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isRead: body.isRead ?? true,
          ...(body.data && { data: body.data }),
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alert", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 },
    );
  }
}

