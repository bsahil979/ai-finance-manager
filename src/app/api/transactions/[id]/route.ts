import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.date) updateData.date = new Date(body.date);
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.merchant !== undefined) updateData.merchant = body.merchant;
    if (body.rawDescription !== undefined)
      updateData.rawDescription = body.rawDescription;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.amount !== undefined) {
      updateData.type = Number(body.amount) >= 0 ? "income" : "expense";
    }

    await db.collection("transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating transaction", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await db.collection("transactions").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}

