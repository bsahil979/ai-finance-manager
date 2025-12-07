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
    const recurringTransactions = await db
      .collection("recurringTransactions")
      .find({ userId: user._id })
      .sort({ nextOccurrence: 1 })
      .toArray();

    return NextResponse.json({ recurringTransactions });
  } catch (error) {
    console.error("Error fetching recurring transactions", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring transactions" },
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
    const { name, description, amount, type, category, merchant, frequency, startDate, endDate } = body;

    if (!name || !amount || !type || !frequency || !startDate) {
      return NextResponse.json(
        { error: "Name, amount, type, frequency, and start date are required" },
        { status: 400 },
      );
    }

    if (amount === 0) {
      return NextResponse.json(
        { error: "Amount cannot be zero" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const start = new Date(startDate);
    const nextOccurrence = new Date(start);

    // Calculate next occurrence based on frequency
    if (frequency === "daily") {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    } else if (frequency === "weekly") {
      nextOccurrence.setDate(nextOccurrence.getDate() + 7);
    } else if (frequency === "monthly") {
      nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
    } else if (frequency === "yearly") {
      nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
    }

    const recurringTransaction = {
      userId: user._id,
      name,
      description: description || "",
      amount: Number(amount),
      type,
      category: category || undefined,
      merchant: merchant || undefined,
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextOccurrence,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("recurringTransactions").insertOne(recurringTransaction);

    return NextResponse.json(
      { _id: result.insertedId, ...recurringTransaction },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating recurring transaction", error);
    return NextResponse.json(
      { error: "Failed to create recurring transaction" },
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recurring transaction ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { ObjectId } = await import("mongodb");

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = Number(updates.amount);
    if (updates.type) updateData.type = updates.type;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.merchant !== undefined) updateData.merchant = updates.merchant;
    if (updates.frequency) {
      updateData.frequency = updates.frequency;
      // Recalculate next occurrence if frequency changed
      const existing = await db.collection("recurringTransactions").findOne({
        _id: new ObjectId(id),
        userId: user._id,
      });
      if (existing) {
        const nextOcc = new Date(existing.nextOccurrence || existing.startDate);
        if (updates.frequency === "daily") {
          nextOcc.setDate(nextOcc.getDate() + 1);
        } else if (updates.frequency === "weekly") {
          nextOcc.setDate(nextOcc.getDate() + 7);
        } else if (updates.frequency === "monthly") {
          nextOcc.setMonth(nextOcc.getMonth() + 1);
        } else if (updates.frequency === "yearly") {
          nextOcc.setFullYear(nextOcc.getFullYear() + 1);
        }
        updateData.nextOccurrence = nextOcc;
      }
    }
    if (updates.startDate) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate ? new Date(updates.endDate) : null;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await db.collection("recurringTransactions").updateOne(
      { _id: new ObjectId(id), userId: user._id },
      { $set: updateData },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating recurring transaction", error);
    return NextResponse.json(
      { error: "Failed to update recurring transaction" },
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
        { error: "Recurring transaction ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { ObjectId } = await import("mongodb");
    await db.collection("recurringTransactions").deleteOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring transaction", error);
    return NextResponse.json(
      { error: "Failed to delete recurring transaction" },
      { status: 500 },
    );
  }
}


