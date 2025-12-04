import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

type RawCsvRow = {
  date?: string;
  amount?: string;
  merchant?: string;
  description?: string;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "CSV file is required" },
        { status: 400 },
      );
    }

    const text = await file.text();

    const rows = parseSimpleCsv(text);

    const now = new Date();

    const docs = rows
      .map((row) => {
        if (!row.date || !row.amount) return null;

        const amountNumber = Number(row.amount);
        if (Number.isNaN(amountNumber)) return null;

        return {
          date: new Date(row.date),
          amount: amountNumber,
          currency: "USD",
          merchant: row.merchant || undefined,
          rawDescription: row.description || "",
          type: amountNumber >= 0 ? "income" : "expense",
          isSubscription: false,
          source: "csv",
          createdAt: now,
          updatedAt: now,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!docs.length) {
      return NextResponse.json(
        { error: "No valid rows found in CSV" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const result = await db.collection("transactions").insertMany(docs);

    return NextResponse.json(
      { insertedCount: result.insertedCount },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading CSV", error);
    return NextResponse.json(
      { error: "Failed to process CSV" },
      { status: 500 },
    );
  }
}

// Very small CSV parser for simple, comma-separated files with a header row.
// Expects columns: date, amount, merchant, description
function parseSimpleCsv(text: string): RawCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const amountIdx = header.indexOf("amount");
  const merchantIdx = header.indexOf("merchant");
  const descriptionIdx = header.indexOf("description");

  const rows: RawCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

    const row: RawCsvRow = {};
    if (dateIdx >= 0) row.date = cols[dateIdx];
    if (amountIdx >= 0) row.amount = cols[amountIdx];
    if (merchantIdx >= 0) row.merchant = cols[merchantIdx];
    if (descriptionIdx >= 0) row.description = cols[descriptionIdx];

    rows.push(row);
  }

  return rows;
}


