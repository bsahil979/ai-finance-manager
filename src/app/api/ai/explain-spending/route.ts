import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { getCurrentUser } from "@/lib/auth";

// Use Gemini (Google AI Studio) instead of OpenAI.
// Get an API key from: https://aistudio.google.com
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not set. Add it to your .env file as GEMINI_API_KEY=your_key_here",
        },
        { status: 500 },
      );
    }
    
    // Log partial key for debugging (first 10 chars only)
    console.log("Using Gemini API key:", GEMINI_API_KEY.substring(0, 10) + "...");

    const db = await getDb();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First try current month
    let transactions = await db
      .collection("transactions")
      .find({
        userId: user._id,
        date: { $gte: monthStart, $lte: now },
      })
      .toArray();

    // If no transactions this month, fall back to last 30 days
    if (!transactions.length) {
      transactions = await db
        .collection("transactions")
        .find({
          userId: user._id,
          date: { $gte: thirtyDaysAgo, $lte: now },
        })
        .toArray();
    }

    // If still no transactions, try all user transactions
    if (!transactions.length) {
      transactions = await db
        .collection("transactions")
        .find({ userId: user._id })
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

    for (const tx of transactions as Array<{ amount?: number; merchant?: string; rawDescription?: string }>) {
      const amount = Number(tx.amount ?? 0);
      const merchant =
        tx.merchant ||
        tx.rawDescription ||
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

    const prompt = [
      "You are a concise personal finance coach. You are given a summary of transactions grouped by merchant.",
      "Explain in 3–5 short bullet points why this person's expenses look the way they do, call out any unusual patterns, and suggest 2–3 concrete actions to save money.",
      "Be friendly, practical, and avoid generic advice.",
      "",
      `Month: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      `Total income: ${totalIncome.toFixed(2)}`,
      `Total expenses: ${totalExpense.toFixed(2)}`,
      "",
      "Net per merchant (positive = income, negative = expense):",
      merchantLines,
    ].join("\n");

    // Gemini API - try v1 API first (more stable), then fallback to v1beta
    // Use the newer Gemini 2.x models that are actually available
    const apiVersions = ["v1", "v1beta"];
    const modelsToTry = [
      "gemini-2.5-flash",      // Fast and cost-effective (newest)
      "gemini-2.0-flash",      // Fast alternative
      "gemini-2.5-pro",        // More capable (newest)
      "gemini-2.0-flash-001",  // Specific version
      "gemini-1.5-flash",      // Fallback to older models
      "gemini-1.5-pro",        // Fallback to older models
    ];
    
    let lastError: string | null = null;
    let response: Response | null = null;
    let successfulModel: string | null = null;
    
    // Try each API version with each model
    for (const apiVersion of apiVersions) {
      for (const modelName of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
          
          console.log(`Trying ${apiVersion} with model ${modelName}...`);
          
          response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
            }),
          });

          if (response.ok) {
            successfulModel = `${apiVersion}/${modelName}`;
            console.log(`Success with ${successfulModel}`);
            break; // Success, exit inner loop
          } else {
            const errorText = await response.text();
            let errorJson;
            try {
              errorJson = JSON.parse(errorText);
            } catch {
              errorJson = { message: errorText };
            }
            
            lastError = errorJson?.error?.message || errorJson?.message || errorText.substring(0, 300);
            
            // If model not found, try next model
            if (lastError.includes("not found") || lastError.includes("not supported")) {
              console.log(`Model ${modelName} not available in ${apiVersion}, trying next...`);
              continue;
            } else {
              // Other error, log and continue
              console.log(`Error with ${apiVersion}/${modelName}: ${lastError}`);
              continue;
            }
          }
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.log(`Network error with ${apiVersion}/${modelName}: ${lastError}`);
          continue; // Try next model
        }
      }
      
      if (response && response.ok) {
        break; // Success, exit outer loop
      }
    }

    if (!response || !response.ok) {
      const errorMessage = lastError || "Failed to connect to Gemini API";
      console.error("Gemini API error after trying all models:", errorMessage);
      
      // Try to list available models for debugging
      let availableModelsInfo = "";
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(GEMINI_API_KEY)}`;
        const listResponse = await fetch(listUrl);
        if (listResponse.ok) {
          const listData = await listResponse.json();
          if (listData.models && Array.isArray(listData.models)) {
            const modelNames = listData.models
              .map((m: { name?: string }) => m.name?.replace("models/", "") || "")
              .filter((n: string) => n)
              .slice(0, 5);
            availableModelsInfo = ` Available models: ${modelNames.join(", ")}`;
          }
        }
      } catch {
        // Ignore errors when listing models
      }
      
      return NextResponse.json(
        { 
          error: `Gemini API error: ${errorMessage}.${availableModelsInfo} Please verify your API key is valid and has access to Gemini models. You can check available models at https://aistudio.google.com`,
        },
        { status: 500 },
      );
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      text?: string;
    };
    
    // Handle different possible response structures
    let text = "The AI did not return any content.";
    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = json.candidates[0].content.parts[0].text;
    } else if (json.text) {
      text = json.text;
    } else {
      console.error("Unexpected Gemini response format:", JSON.stringify(json, null, 2));
    }

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


