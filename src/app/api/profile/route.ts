import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// GET /api/profile - get current user profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne(
      { _id: new ObjectId(user._id) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!userDoc) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ user: userDoc });
  } catch (error) {
    console.error("Error fetching profile", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/profile - update user profile
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email } = body;

    const db = await getDb();

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await db.collection("users").findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: new ObjectId(user._id) },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 },
        );
      }
    }

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      update.name = name.trim();
    }

    if (email !== undefined) {
      update.email = email.trim().toLowerCase();
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      { $set: update },
    );

    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(user._id) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating profile", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

