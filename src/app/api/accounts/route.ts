import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

// GET /api/accounts - list all accounts for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const accounts = await db
      .collection("accounts")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

// POST /api/accounts - create a new account
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, balance, currency } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const account = {
      userId: user._id,
      name: name.trim(),
      type: type, // "checking", "savings", "credit", "cash", "investment", "other"
      balance: parseFloat(balance || 0),
      currency: currency || "INR",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("accounts").insertOne(account);

    return NextResponse.json(
      { _id: result.insertedId, ...account },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating account", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}


