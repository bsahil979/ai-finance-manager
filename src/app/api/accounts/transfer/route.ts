import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// POST /api/accounts/transfer - transfer money between accounts
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fromAccountId, toAccountId, amount, description } = body;

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json(
        { error: "From account, to account, and amount are required" },
        { status: 400 },
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: "Cannot transfer to the same account" },
        { status: 400 },
      );
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      return NextResponse.json(
        { error: "Transfer amount must be greater than 0" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const fromId = new ObjectId(fromAccountId);
    const toId = new ObjectId(toAccountId);

    // Verify both accounts belong to user
    const [fromAccount, toAccount] = await Promise.all([
      db.collection("accounts").findOne({ _id: fromId, userId: user._id }),
      db.collection("accounts").findOne({ _id: toId, userId: user._id }),
    ]);

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { error: "One or both accounts not found" },
        { status: 404 },
      );
    }

    if (!fromAccount.isActive || !toAccount.isActive) {
      return NextResponse.json(
        { error: "Cannot transfer from/to inactive accounts" },
        { status: 400 },
      );
    }

    if (fromAccount.balance < transferAmount) {
      return NextResponse.json(
        { error: "Insufficient balance in source account" },
        { status: 400 },
      );
    }

    const now = new Date();

    // Update account balances
    await Promise.all([
      db.collection("accounts").updateOne(
        { _id: fromId },
        { $inc: { balance: -transferAmount }, $set: { updatedAt: now } },
      ),
      db.collection("accounts").updateOne(
        { _id: toId },
        { $inc: { balance: transferAmount }, $set: { updatedAt: now } },
      ),
    ]);

    // Create transfer transactions
    const transferDescription = description || `Transfer to ${toAccount.name}`;
    const transferFromDescription = description || `Transfer from ${fromAccount.name}`;

    await Promise.all([
      // Outgoing transaction from source account
      db.collection("transactions").insertOne({
        userId: user._id,
        accountId: fromAccountId,
        date: now,
        amount: -transferAmount,
        merchant: toAccount.name,
        rawDescription: transferDescription,
        category: "Transfer",
        type: "expense",
        isTransfer: true,
        transferToAccountId: toAccountId,
        createdAt: now,
        updatedAt: now,
      }),
      // Incoming transaction to destination account
      db.collection("transactions").insertOne({
        userId: user._id,
        accountId: toAccountId,
        date: now,
        amount: transferAmount,
        merchant: fromAccount.name,
        rawDescription: transferFromDescription,
        category: "Transfer",
        type: "income",
        isTransfer: true,
        transferFromAccountId: fromAccountId,
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    // Get updated accounts
    const [updatedFrom, updatedTo] = await Promise.all([
      db.collection("accounts").findOne({ _id: fromId }),
      db.collection("accounts").findOne({ _id: toId }),
    ]);

    return NextResponse.json({
      success: true,
      fromAccount: updatedFrom,
      toAccount: updatedTo,
      amount: transferAmount,
    });
  } catch (error) {
    console.error("Error processing transfer", error);
    return NextResponse.json(
      { error: "Failed to process transfer" },
      { status: 500 },
    );
  }
}


