import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { generateAlerts } from "@/lib/alerts";

// GET /api/transactions - list transactions for current user with advanced filtering
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const merchant = searchParams.get("merchant");
    const accountId = searchParams.get("accountId");
    const limit = parseInt(searchParams.get("limit") || "1000");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const db = await getDb();
    
    // Build query
    const query: Record<string, unknown> = { userId: user._id };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Type filter
    if (type === "income") {
      query.amount = { $gt: 0 };
    } else if (type === "expense") {
      query.amount = { $lt: 0 };
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      const amountQuery: Record<string, unknown> = {};
      if (minAmount) {
        amountQuery.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        amountQuery.$lte = parseFloat(maxAmount);
      }
      query.amount = { ...query.amount as Record<string, unknown>, ...amountQuery };
    }

    // Date range filter
    if (startDate || endDate) {
      const dateQuery: Record<string, unknown> = {};
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      query.date = dateQuery;
    }

    // Merchant filter
    if (merchant) {
      query.merchant = { $regex: merchant, $options: "i" };
    }

    // Account filter
    if (accountId) {
      query.accountId = accountId;
    }

    // Search filter (searches in merchant, description, category)
    if (search) {
      query.$or = [
        { merchant: { $regex: search, $options: "i" } },
        { rawDescription: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const transactions = await db
      .collection("transactions")
      .find(query)
      .sort(sort)
      .limit(limit)
      .toArray();

    // Get total count for pagination info
    const totalCount = await db.collection("transactions").countDocuments(query);

    return NextResponse.json({ 
      transactions,
      totalCount,
      filteredCount: transactions.length,
    });
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const db = await getDb();
    const now = new Date();

    const doc = {
      ...body,
      userId: user._id,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("transactions").insertOne(doc);

    // Auto-generate alerts in background (fire and forget)
    generateAlerts(db, user._id).catch((err) => {
      console.error("Error auto-generating alerts:", err);
    });

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


