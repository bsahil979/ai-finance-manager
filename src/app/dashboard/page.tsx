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

type SpendingBreakdown = {
  merchant: string;
  amount: number;
};

type CategoryBreakdown = {
  category: string;
  amount: number;
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [spendingBreakdown, setSpendingBreakdown] = useState<SpendingBreakdown[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

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

    const loadBreakdown = async () => {
      try {
        const [merchantRes, categoryRes] = await Promise.all([
          fetch("/api/dashboard/spending-breakdown"),
          fetch("/api/dashboard/category-breakdown"),
        ]);
        const merchantData = await merchantRes.json();
        const categoryData = await categoryRes.json();
        if (merchantRes.ok && merchantData.breakdown) {
          setSpendingBreakdown(merchantData.breakdown);
        }
        if (categoryRes.ok && categoryData.breakdown) {
          setCategoryBreakdown(categoryData.breakdown);
        }
      } catch (err) {
        console.error("Failed to load spending breakdown", err);
      }
    };
    loadBreakdown();

    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/alerts");
        const data = await res.json();
        if (res.ok && data.unreadCount !== undefined) {
          setUnreadAlerts(data.unreadCount);
        }
      } catch (err) {
        console.error("Failed to load alerts", err);
      }
    };
    loadAlerts();
  }, []);

  const handleExplainSpending = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/explain-spending");
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || data.details || "Failed to get AI insight";
        console.error("API error:", data);
        setAiError(errorMsg);
        return;
      }
      if (data.message) {
        setAiInsight(data.message);
      } else {
        setAiInsight(data.insight ?? "No insight returned.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMsg = err instanceof Error ? err.message : "Network error. Check your connection.";
      setAiError(`Could not generate AI explanation: ${errorMsg}`);
    } finally {
      setAiLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <main className="p-8">
        {/* Top Bar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Welcome back! Here&apos;s your financial overview.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-400 border-r-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
            {error} Try importing some transactions first.
          </div>
        )}

        {overview && !loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <p className="text-sm text-zinc-400 mb-2">Net Worth</p>
                <p
                  className={`text-3xl font-bold ${
                    overview.net >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(overview.net)}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  From {overview.totalTransactions} transactions
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-400">This Month - Income</p>
                  <span className="text-emerald-400">↑</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(overview.monthIncome)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-400">This Month - Expenses</p>
                  <span className="text-red-400">↓</span>
                </div>
                <p className="text-3xl font-bold text-red-400">
                  {formatCurrency(Math.abs(overview.monthExpense))}
                </p>
              </div>
            </div>

            {/* Alerts Banner */}
            {unreadAlerts > 0 && (
              <div className="mb-8 rounded-xl border border-orange-800 bg-orange-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-400">
                      {unreadAlerts} unread alert{unreadAlerts !== 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 text-xs text-orange-300/80">
                      Check for upcoming renewals and unusual spending patterns.
                    </p>
                  </div>
                  <a
                    href="/alerts"
                    className="inline-flex items-center justify-center rounded-md bg-orange-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-orange-300 transition-colors"
                  >
                    View Alerts
                  </a>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Spending Breakdown by Merchant */}
              {spendingBreakdown.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <h2 className="text-lg font-semibold mb-4">Top Spending by Merchant</h2>
                  <div className="space-y-4">
                    {spendingBreakdown.slice(0, 5).map((item, idx) => {
                      const maxAmount = spendingBreakdown[0]?.amount || 1;
                      const percentage = (item.amount / maxAmount) * 100;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300">{item.merchant}</span>
                            <span className="text-zinc-400 font-medium">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spending Breakdown by Category */}
              {categoryBreakdown.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
                  <div className="space-y-4">
                    {categoryBreakdown.slice(0, 5).map((item, idx) => {
                      const maxAmount = categoryBreakdown[0]?.amount || 1;
                      const percentage = (item.amount / maxAmount) * 100;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300">{item.category}</span>
                            <span className="text-zinc-400 font-medium">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">AI Insights</h2>
                  <button
                    type="button"
                    onClick={handleExplainSpending}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60 transition-colors"
                  >
                    {aiLoading ? "Analyzing..." : "Get Insights"}
                  </button>
                </div>

                <div className="min-h-[200px]">
                  {aiError && (
                    <div className="text-red-400 text-sm">
                      <p className="font-medium">{aiError}</p>
                    </div>
                  )}
                  {!aiError && aiLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-solid border-emerald-400 border-r-transparent"></div>
                    </div>
                  )}
                  {!aiError && !aiLoading && aiInsight && (
                    <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">
                      {aiInsight}
                    </div>
                  )}
                  {!aiError && !aiLoading && !aiInsight && (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-sm mb-4">
                        Click &quot;Get Insights&quot; to receive AI-powered analysis of your spending patterns.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
    </main>
  );
}
