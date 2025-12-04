import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

// Use Gemini (Google AI Studio) instead of OpenAI.
// Get an API key from: https://aistudio.google.com
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

export async function GET() {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add it to your environment to enable AI insights.",
      },
      { status: 500 },
    );
  }

  try {
    const db = await getDb();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First try current month
    let transactions = await db
      .collection("transactions")
      .find({
        date: { $gte: monthStart, $lte: now },
      })
      .toArray();

    // If no transactions this month, fall back to last 30 days
    if (!transactions.length) {
      transactions = await db
        .collection("transactions")
        .find({
          date: { $gte: thirtyDaysAgo, $lte: now },
        })
        .toArray();
    }

    // If still no transactions, try all transactions
    if (!transactions.length) {
      transactions = await db
        .collection("transactions")
        .find({})
        .sort({ date: -1 })
        .limit(50)
        .toArray();
    }

    if (!transactions.length) {
      return NextResponse.json(
        {
          message:
            "No transactions found. Import a CSV to get AI insights.",
        },
        { status: 200 },
      );
    }

    // Aggregate by merchant for a compact prompt
    const byMerchant = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions as any[]) {
      const amount = Number(tx.amount ?? 0);
      const merchant =
        (tx.merchant as string | undefined) ||
        (tx.rawDescription as string | undefined) ||
        "Unknown";

      byMerchant.set(merchant, (byMerchant.get(merchant) ?? 0) + amount);

      if (amount > 0) totalIncome += amount;
      if (amount < 0) totalExpense += amount;
    }

    const merchantLines = Array.from(byMerchant.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 15)
      .map(([merchant, amount]) => `${merchant}: ${amount.toFixed(2)}`)
      .join("\n");

    const systemPrompt =
      "You are a concise personal finance coach. You are given a summary of this month's transactions grouped by merchant. Explain in 3–5 short bullet points why this person's expenses look the way they do, call out any unusual patterns, and suggest 2–3 concrete actions to save money. Be friendly, practical, and avoid generic advice.";

    const userContent = [
      `Month: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      `Total income: ${totalIncome.toFixed(2)}`,
      `Total expenses: ${totalExpense.toFixed(2)}`,
      "",
      "Net per merchant (positive = income, negative = expense):",
      merchantLines,
    ].join("\n\n");

    // Gemini API uses API key as query parameter, not Bearer token
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\n" + userContent },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json(
        { 
          error: "Failed to get AI insight",
          details: errorText.substring(0, 200) // Include first 200 chars for debugging
        },
        { status: 500 },
      );
    }

    const json = (await response.json()) as any;
    const text =
      json.candidates?.[0]?.content?.parts?.[0]?.text ??
      "The AI did not return any content.";

    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error("Error generating AI spending explanation", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to generate AI insight",
        details: errorMessage
      },
      { status: 500 },
    );
  }
}


