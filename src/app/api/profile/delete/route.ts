import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// POST /api/profile/delete - delete user account
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete account" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user._id) });

    if (!userDoc) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userDoc.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 400 },
      );
    }

    const userIdObj = new ObjectId(user._id);
    
    // Delete user and all associated data
    await Promise.all([
      db.collection("users").deleteOne({ _id: userIdObj }),
      db.collection("sessions").deleteMany({ userId: user._id }),
      db.collection("transactions").deleteMany({ userId: user._id }),
      db.collection("budgets").deleteMany({ userId: user._id }),
      db.collection("subscriptions").deleteMany({ userId: user._id }),
      db.collection("alerts").deleteMany({ userId: user._id }),
      db.collection("goals").deleteMany({ userId: user._id }),
      db.collection("recurringTransactions").deleteMany({ userId: user._id }),
      db.collection("accounts").deleteMany({ userId: user._id }),
      db.collection("bills").deleteMany({ userId: user._id }),
    ]);

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}

