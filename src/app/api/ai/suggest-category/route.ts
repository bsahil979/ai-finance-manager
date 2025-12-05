import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { merchant, description, amount } = body;

    if (!merchant && !description) {
      return NextResponse.json(
        { error: "Merchant or description is required" },
        { status: 400 },
      );
    }

    // Simple rule-based category suggestion (can be enhanced with AI)
    const text = `${merchant || ""} ${description || ""}`.toLowerCase();

    if (
      text.includes("restaurant") ||
      text.includes("cafe") ||
      text.includes("food") ||
      text.includes("dining") ||
      text.includes("uber eats") ||
      text.includes("doordash")
    ) {
      return NextResponse.json({ category: "Food & Dining" });
    }

    if (
      text.includes("grocery") ||
      text.includes("walmart") ||
      text.includes("target") ||
      text.includes("supermarket")
    ) {
      return NextResponse.json({ category: "Groceries" });
    }

    if (
      text.includes("gas") ||
      text.includes("fuel") ||
      text.includes("shell") ||
      text.includes("bp") ||
      text.includes("chevron")
    ) {
      return NextResponse.json({ category: "Gas & Fuel" });
    }

    if (
      text.includes("netflix") ||
      text.includes("spotify") ||
      text.includes("subscription") ||
      text.includes("premium")
    ) {
      return NextResponse.json({ category: "Subscriptions" });
    }

    if (
      text.includes("electric") ||
      text.includes("water") ||
      text.includes("utility") ||
      text.includes("internet") ||
      text.includes("phone")
    ) {
      return NextResponse.json({ category: "Bills & Utilities" });
    }

    if (
      text.includes("amazon") ||
      text.includes("shop") ||
      text.includes("store") ||
      text.includes("retail")
    ) {
      return NextResponse.json({ category: "Shopping" });
    }

    if (
      text.includes("uber") ||
      text.includes("lyft") ||
      text.includes("taxi") ||
      text.includes("transport")
    ) {
      return NextResponse.json({ category: "Transportation" });
    }

    if (
      text.includes("hospital") ||
      text.includes("doctor") ||
      text.includes("pharmacy") ||
      text.includes("medical")
    ) {
      return NextResponse.json({ category: "Healthcare" });
    }

    if (
      text.includes("hotel") ||
      text.includes("flight") ||
      text.includes("airline") ||
      text.includes("travel")
    ) {
      return NextResponse.json({ category: "Travel" });
    }

    if (amount && amount > 0) {
      return NextResponse.json({ category: "Income" });
    }

    return NextResponse.json({ category: "Other" });
  } catch (error) {
    console.error("Error suggesting category", error);
    return NextResponse.json(
      { error: "Failed to suggest category" },
      { status: 500 },
    );
  }
}

