"use client";

import { useEffect, useState } from "react";

type Overview = {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  monthIncome: number;
  monthExpense: number;
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/overview");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load overview");
        setOverview(data);
      } catch (err) {
        console.error(err);
        setError("Could not load overview yet.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExplainSpending = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/explain-spending");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI insight");
      }
      if (data.message) {
        setAiInsight(data.message);
      } else {
        setAiInsight(data.insight ?? "No insight returned.");
      }
    } catch (err) {
      console.error(err);
      setAiError(
        "Could not generate AI explanation. Check your API key and try again.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="w-full px-8 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Finance Overview
        </h1>
        <p className="mt-2 text-zinc-400">
          High-level snapshot of your income, expenses, and this month&apos;s
          activity.
        </p>

        {loading && (
          <p className="mt-6 text-sm text-zinc-400">Loading overview...</p>
        )}
        {error && (
          <p className="mt-6 text-sm text-red-400">
            {error} Try importing some transactions first.
          </p>
        )}

        {overview && !loading && !error && (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <StatCard
              label="Net worth from imported data"
              value={overview.net}
              highlight={overview.net >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="This month - income"
              value={overview.monthIncome}
              highlight="positive"
            />
            <StatCard
              label="This month - expenses"
              value={overview.monthExpense}
              highlight="negative"
            />
          </div>
        )}

        {overview && !loading && !error && (
          <p className="mt-4 text-xs text-zinc-500">
            Based on {overview.totalTransactions} imported transactions.
          </p>
        )}

        <section className="mt-10 max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                AI explanation for this month
              </h2>
              <p className="text-sm text-zinc-400">
                Let the model analyze your imported transactions and highlight
                patterns and saving opportunities.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExplainSpending}
              disabled={aiLoading}
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60"
            >
              {aiLoading ? "Thinking..." : "Explain my spending"}
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
            {aiError && <p className="text-red-400">{aiError}</p>}
            {!aiError && aiLoading && (
              <p className="text-zinc-400">
                Analyzing this month&apos;s data with AI...
              </p>
            )}
            {!aiError && !aiLoading && aiInsight && (
              <div className="whitespace-pre-wrap text-zinc-100">
                {aiInsight}
              </div>
            )}
            {!aiError && !aiLoading && !aiInsight && (
              <p className="text-zinc-500">
                Click &quot;Explain my spending&quot; to generate a summary of
                this month&apos;s income and expenses.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  highlight?: "positive" | "negative";
};

function StatCard({ label, value, highlight }: StatCardProps) {
  const formatted = value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  const color =
    highlight === "positive"
      ? "text-emerald-400"
      : highlight === "negative"
        ? "text-red-400"
        : "text-zinc-50";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{formatted}</p>
    </div>
  );
}



