import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

// GET /api/bills - list all bills for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "upcoming", "overdue", "paid", "all"

    const db = await getDb();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const query: Record<string, unknown> = { userId: user._id };

    if (status === "upcoming") {
      query.isPaid = false;
      query.dueDate = { $gte: now };
    } else if (status === "overdue") {
      query.isPaid = false;
      query.dueDate = { $lt: now };
    } else if (status === "paid") {
      query.isPaid = true;
    }

    const bills = await db
      .collection("bills")
      .find(query)
      .sort({ dueDate: 1 })
      .toArray();

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Error fetching bills", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 },
    );
  }
}

// POST /api/bills - create a new bill
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, amount, dueDate, category, isRecurring, recurringFrequency, accountId, notes } = body;

    if (!name || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Name, amount, and due date are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();

    const bill = {
      userId: user._id,
      name: name.trim(),
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      category: category || "Bills & Utilities",
      isRecurring: Boolean(isRecurring),
      recurringFrequency: isRecurring ? (recurringFrequency || "monthly") : null,
      accountId: accountId || null,
      notes: notes || "",
      isPaid: false,
      paidDate: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("bills").insertOne(bill);

    return NextResponse.json(
      { _id: result.insertedId, ...bill },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating bill", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 },
    );
  }
}


