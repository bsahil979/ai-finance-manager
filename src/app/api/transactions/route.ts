import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

// GET /api/transactions - list latest transactions for now (no auth yet)
export async function GET() {
  try {
    const db = await getDb();
    const transactions = await db
      .collection("transactions")
      .find({})
      .sort({ date: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}

// POST /api/transactions - create a single transaction (simple MVP)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const db = await getDb();
    const now = new Date();

    const doc = {
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("transactions").insertOne(doc);

    return NextResponse.json(
      { _id: result.insertedId, ...doc },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating transaction", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}


