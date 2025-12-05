import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

export async function GET() {
  try {
    const db = await getDb();
    const transactions = await db
      .collection("transactions")
      .find({})
      .sort({ date: -1 })
      .toArray();

    // Convert to CSV format
    const headers = "date,amount,merchant,description,type\n";
    const rows = (transactions as any[])
      .map((tx) => {
        const date = tx.date instanceof Date 
          ? tx.date.toISOString().split("T")[0]
          : new Date(tx.date).toISOString().split("T")[0];
        const amount = tx.amount ?? 0;
        const merchant = (tx.merchant || "").replace(/,/g, ";");
        const description = (tx.rawDescription || "").replace(/,/g, ";");
        const type = tx.type || (amount >= 0 ? "income" : "expense");
        
        return `${date},${amount},"${merchant}","${description}",${type}`;
      })
      .join("\n");

    const csv = headers + rows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting transactions", error);
    return NextResponse.json(
      { error: "Failed to export transactions" },
      { status: 500 },
    );
  }
}

