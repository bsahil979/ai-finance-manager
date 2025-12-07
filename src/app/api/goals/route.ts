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
    const goals = await db
      .collection("goals")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Error fetching goals", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
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
    const { name, description, targetAmount, deadline, category } = body;

    if (!name || !targetAmount || !category) {
      return NextResponse.json(
        { error: "Name, target amount, and category are required" },
        { status: 400 },
      );
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: "Target amount must be greater than 0" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const goal = {
      userId: user._id,
      name,
      description: description || "",
      targetAmount: Number(targetAmount),
      currentAmount: 0,
      deadline: deadline ? new Date(deadline) : null,
      category,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("goals").insertOne(goal);

    return NextResponse.json(
      { _id: result.insertedId, ...goal },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating goal", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, currentAmount, status, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { ObjectId } = await import("mongodb");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (currentAmount !== undefined) {
      updateData.currentAmount = Number(currentAmount);
    }

    if (status) {
      updateData.status = status;
    }

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.targetAmount) updateData.targetAmount = Number(updates.targetAmount);
    if (updates.deadline) updateData.deadline = new Date(updates.deadline);
    if (updates.category) updateData.category = updates.category;

    // Auto-complete goal if currentAmount >= targetAmount
    const goal = await db.collection("goals").findOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    if (goal && updateData.currentAmount !== undefined) {
      const newAmount = Number(updateData.currentAmount);
      const targetAmount = Number(goal.targetAmount);
      if (newAmount >= targetAmount && goal.status === "active") {
        updateData.status = "completed";
      }
    }

    await db.collection("goals").updateOne(
      { _id: new ObjectId(id), userId: user._id },
      { $set: updateData },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating goal", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
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
        { error: "Goal ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { ObjectId } = await import("mongodb");
    await db.collection("goals").deleteOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 },
    );
  }
}


