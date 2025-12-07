import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// PATCH /api/accounts/[id] - update an account
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
    const accountId = new ObjectId(params.id);

    // Verify account belongs to user
    const existingAccount = await db
      .collection("accounts")
      .findOne({ _id: accountId, userId: user._id });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) update.name = body.name.trim();
    if (body.type !== undefined) update.type = body.type;
    if (body.balance !== undefined) update.balance = parseFloat(body.balance);
    if (body.currency !== undefined) update.currency = body.currency;
    if (body.isActive !== undefined) update.isActive = body.isActive;

    await db.collection("accounts").updateOne(
      { _id: accountId, userId: user._id },
      { $set: update },
    );

    const updated = await db
      .collection("accounts")
      .findOne({ _id: accountId });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating account", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}

// DELETE /api/accounts/[id] - delete an account
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
    const accountId = new ObjectId(params.id);

    // Verify account belongs to user
    const existingAccount = await db
      .collection("accounts")
      .findOne({ _id: accountId, userId: user._id });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    // Check if account has transactions
    const transactionCount = await db
      .collection("transactions")
      .countDocuments({ accountId: params.id });

    if (transactionCount > 0) {
      // Soft delete - mark as inactive instead
      await db.collection("accounts").updateOne(
        { _id: accountId, userId: user._id },
        { $set: { isActive: false, updatedAt: new Date() } },
      );
    } else {
      // Hard delete if no transactions
      await db.collection("accounts").deleteOne({
        _id: accountId,
        userId: user._id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}


