import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

export async function GET() {
  try {
    const db = await getDb();

    const transactions = await db
      .collection("transactions")
      .find({})
      .toArray();

    // Group by merchant (or description if no merchant)
    const byMerchant = new Map<string, number>();

    for (const tx of transactions as any[]) {
      const amount = Number(tx.amount ?? 0);
      if (amount >= 0) continue; // Only expenses (negative amounts)

      const merchant =
        (tx.merchant as string | undefined) ||
        (tx.rawDescription as string | undefined) ||
        "Unknown";

      byMerchant.set(merchant, (byMerchant.get(merchant) ?? 0) + Math.abs(amount));
    }

    // Convert to array and sort by amount (descending)
    const breakdown = Array.from(byMerchant.entries())
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 merchants

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error("Error building spending breakdown", error);
    return NextResponse.json(
      { error: "Failed to load spending breakdown" },
      { status: 500 },
    );
  }
}

