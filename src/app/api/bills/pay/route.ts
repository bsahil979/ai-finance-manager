import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// POST /api/bills/pay - mark bill as paid and optionally create transaction
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { billId, createTransaction, accountId } = body;

    if (!billId) {
      return NextResponse.json(
        { error: "Bill ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const billObjectId = new ObjectId(billId);

    // Verify bill belongs to user
    const bill = await db
      .collection("bills")
      .findOne({ _id: billObjectId, userId: user._id });

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 },
      );
    }

    if (bill.isPaid) {
      return NextResponse.json(
        { error: "Bill is already paid" },
        { status: 400 },
      );
    }

    const now = new Date();

    // Mark bill as paid
    await db.collection("bills").updateOne(
      { _id: billObjectId, userId: user._id },
      {
        $set: {
          isPaid: true,
          paidDate: now,
          updatedAt: now,
        },
      },
    );

    // Create transaction if requested
    if (createTransaction) {
      await db.collection("transactions").insertOne({
        userId: user._id,
        accountId: accountId || bill.accountId || null,
        date: now,
        amount: -Math.abs(bill.amount), // Negative for expense
        merchant: bill.name,
        rawDescription: `Bill payment: ${bill.name}`,
        category: bill.category || "Bills & Utilities",
        type: "expense",
        billId: billId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // If recurring, create next bill
    if (bill.isRecurring) {
      const nextDueDate = new Date(bill.dueDate);
      if (bill.recurringFrequency === "monthly") {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else if (bill.recurringFrequency === "weekly") {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (bill.recurringFrequency === "yearly") {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }

      await db.collection("bills").insertOne({
        userId: user._id,
        name: bill.name,
        amount: bill.amount,
        dueDate: nextDueDate,
        category: bill.category,
        isRecurring: true,
        recurringFrequency: bill.recurringFrequency,
        accountId: bill.accountId,
        notes: bill.notes,
        isPaid: false,
        paidDate: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    const updatedBill = await db
      .collection("bills")
      .findOne({ _id: billObjectId });

    return NextResponse.json({
      success: true,
      bill: updatedBill,
    });
  } catch (error) {
    console.error("Error paying bill", error);
    return NextResponse.json(
      { error: "Failed to pay bill" },
      { status: 500 },
    );
  }
}


