import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { generateAlerts } from "@/lib/alerts";

interface ParsedTransaction {
  amount: number;
  type: "income" | "expense";
  merchant?: string;
  rawDescription: string;
  date: Date;
  currency: string;
}

/**
 * Parse SMS/UPI notification text to extract transaction details
 * (Same function as in parse/route.ts)
 */
function parseSmsOrUpi(text: string): ParsedTransaction | null {
  const normalizedText = text.trim().toUpperCase();
  
  // Extract amount - look for ₹ symbol or "INR" followed by numbers
  const amountPatterns = [
    /₹\s*([\d,]+\.?\d*)/i,
    /INR\s*([\d,]+\.?\d*)/i,
    /RS\.?\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*CREDITED/i,
    /([\d,]+\.?\d*)\s*DEBITED/i,
    /([\d,]+\.?\d*)\s*PAID/i,
    /([\d,]+\.?\d*)\s*RECEIVED/i,
  ];

  let amount: number | null = null;
  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, "");
      amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) break;
    }
  }

  if (!amount || amount === 0) {
    return null;
  }

  // Determine transaction type
  let type: "income" | "expense" = "expense";
  const creditKeywords = [
    "CREDITED",
    "RECEIVED",
    "CREDIT",
    "DEPOSIT",
    "INCOME",
    "SALARY",
    "REFUND",
  ];
  const debitKeywords = [
    "DEBITED",
    "DEBIT",
    "PAID",
    "SPENT",
    "PURCHASE",
    "WITHDRAWAL",
  ];

  const hasCredit = creditKeywords.some((keyword) =>
    normalizedText.includes(keyword),
  );
  const hasDebit = debitKeywords.some((keyword) =>
    normalizedText.includes(keyword),
  );

  if (hasCredit && !hasDebit) {
    type = "income";
  } else if (hasDebit || normalizedText.includes("PAID")) {
    type = "expense";
    amount = -Math.abs(amount);
  } else {
    amount = -Math.abs(amount);
  }

  // Extract merchant/recipient name
  let merchant: string | undefined;
  const merchantPatterns = [
    /(?:TO|PAID TO|PAID|AT)\s+([A-Z][A-Z\s&]+?)(?:\s|\.|,|$)/i,
    /(?:FROM|RECEIVED FROM)\s+([A-Z][A-Z\s&]+?)(?:\s|\.|,|$)/i,
    /(?:UPI|PAYMENT)\s+TO\s+([A-Z][A-Z\s&]+?)(?:\s|\.|,|$)/i,
    /(?:MERCHANT|VENDOR)\s*:?\s*([A-Z][A-Z\s&]+?)(?:\s|\.|,|$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      merchant = match[1].trim();
      merchant = merchant.replace(/\s+(PVT|LTD|INC|LLP)\.?$/i, "");
      if (merchant.length > 3 && merchant.length < 50) {
        break;
      }
    }
  }

  // Extract date
  let date = new Date();
  const datePatterns = [
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (pattern === datePatterns[0]) {
          const [, day, month, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          const parsedDate = new Date(
            `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
          );
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
            break;
          }
        } else {
          const monthNames = [
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
          ];
          const [, day, monthStr, year] = match;
          const monthIndex = monthNames.findIndex(
            (m) => m === monthStr.toUpperCase().substring(0, 3),
          );
          if (monthIndex !== -1) {
            const fullYear = year.length === 2 ? `20${year}` : year;
            const parsedDate = new Date(
              `${fullYear}-${String(monthIndex + 1).padStart(2, "0")}-${day.padStart(2, "0")}`,
            );
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate;
              break;
            }
          }
        }
      } catch (e) {
        // Keep default date
      }
    }
  }

  return {
    amount,
    type,
    merchant,
    rawDescription: text.trim(),
    date,
    currency: "INR",
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { texts, accountId } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "Array of SMS/UPI texts is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const now = new Date();
    const accountObjectId = accountId ? new ObjectId(accountId) : null;

    const results = {
      success: 0,
      failed: 0,
      transactions: [] as Array<{ text: string; success: boolean; transaction?: unknown; error?: string }>,
    };

    for (const text of texts) {
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        results.failed++;
        results.transactions.push({
          text: text || "",
          success: false,
          error: "Empty or invalid text",
        });
        continue;
      }

      const parsed = parseSmsOrUpi(text.trim());

      if (!parsed) {
        results.failed++;
        results.transactions.push({
          text: text.trim(),
          success: false,
          error: "Could not parse transaction details",
        });
        continue;
      }

      try {
        const transaction = {
          userId: user._id,
          accountId: accountObjectId,
          date: parsed.date,
          amount: parsed.amount,
          currency: parsed.currency,
          merchant: parsed.merchant,
          rawDescription: parsed.rawDescription,
          type: parsed.type,
          category: undefined,
          isSubscription: false,
          source: "sms" as const,
          createdAt: now,
          updatedAt: now,
        };

        const result = await db.collection("transactions").insertOne(transaction);

        // Update account balance if account is linked
        if (accountObjectId) {
          await db.collection("accounts").updateOne(
            { _id: accountObjectId, userId: user._id },
            { $inc: { balance: parsed.amount }, $set: { updatedAt: now } },
          );
        }

        results.success++;
        results.transactions.push({
          text: text.trim(),
          success: true,
          transaction: { _id: result.insertedId, ...transaction },
        });
      } catch (error) {
        results.failed++;
        results.transactions.push({
          text: text.trim(),
          success: false,
          error: "Failed to create transaction",
        });
      }
    }

    // Auto-generate alerts in background
    if (results.success > 0) {
      generateAlerts(db, user._id).catch((err) => {
        console.error("Error auto-generating alerts:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        parsed: results.success,
        failed: results.failed,
        total: texts.length,
        results: results.transactions,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error parsing bulk SMS/UPI", error);
    return NextResponse.json(
      { error: "Failed to parse bulk SMS/UPI" },
      { status: 500 },
    );
  }
}

