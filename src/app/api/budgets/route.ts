import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const budgets = await db
      .collection("budgets")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, amount, period } = body;

    if (!category || !amount || !period) {
      return NextResponse.json(
        { error: "Category, amount, and period are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const budget = {
      userId: user._id,
      category,
      amount: Number(amount),
      period,
      startDate,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("budgets").insertOne(budget);

    return NextResponse.json(
      { _id: result.insertedId, ...budget },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating budget", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { ObjectId } = await import("mongodb");
    await db.collection("budgets").deleteOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 },
    );
  }
}

