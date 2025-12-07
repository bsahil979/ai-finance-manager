import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// PATCH /api/bills/[id] - update a bill
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const db = await getDb();
    const billId = new ObjectId(params.id);

    // Verify bill belongs to user
    const existingBill = await db
      .collection("bills")
      .findOne({ _id: billId, userId: user._id });

    if (!existingBill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 },
      );
    }

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) update.name = body.name.trim();
    if (body.amount !== undefined) update.amount = parseFloat(body.amount);
    if (body.dueDate !== undefined) update.dueDate = new Date(body.dueDate);
    if (body.category !== undefined) update.category = body.category;
    if (body.isRecurring !== undefined) {
      update.isRecurring = Boolean(body.isRecurring);
      if (!body.isRecurring) {
        update.recurringFrequency = null;
      }
    }
    if (body.recurringFrequency !== undefined && body.isRecurring) {
      update.recurringFrequency = body.recurringFrequency;
    }
    if (body.accountId !== undefined) update.accountId = body.accountId || null;
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.isPaid !== undefined) {
      update.isPaid = Boolean(body.isPaid);
      if (body.isPaid) {
        update.paidDate = new Date();
      } else {
        update.paidDate = null;
      }
    }

    await db.collection("bills").updateOne(
      { _id: billId, userId: user._id },
      { $set: update },
    );

    // If marked as paid and is recurring, create next bill
    if (body.isPaid && existingBill.isRecurring && !existingBill.isPaid) {
      const nextDueDate = new Date(existingBill.dueDate);
      if (existingBill.recurringFrequency === "monthly") {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else if (existingBill.recurringFrequency === "weekly") {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (existingBill.recurringFrequency === "yearly") {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }

      await db.collection("bills").insertOne({
        userId: user._id,
        name: existingBill.name,
        amount: existingBill.amount,
        dueDate: nextDueDate,
        category: existingBill.category,
        isRecurring: true,
        recurringFrequency: existingBill.recurringFrequency,
        accountId: existingBill.accountId,
        notes: existingBill.notes,
        isPaid: false,
        paidDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const updated = await db
      .collection("bills")
      .findOne({ _id: billId });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating bill", error);
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 },
    );
  }
}

// DELETE /api/bills/[id] - delete a bill
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const billId = new ObjectId(params.id);

    // Verify bill belongs to user
    const existingBill = await db
      .collection("bills")
      .findOne({ _id: billId, userId: user._id });

    if (!existingBill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 },
      );
    }

    await db.collection("bills").deleteOne({
      _id: billId,
      userId: user._id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bill", error);
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 },
    );
  }
}


