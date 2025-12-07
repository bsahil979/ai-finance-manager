"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyReport {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    transactionCount: number;
  };
  breakdown: {
    categories: Array<{ category: string; amount: number }>;
    merchants: Array<{ merchant: string; amount: number }>;
  };
  transactions?: Array<{
    date?: string;
    amount?: number;
    merchant?: string;
    rawDescription?: string;
    category?: string;
  }>;
}

interface YearlyReport {
  period: {
    year: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    transactionCount: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    income: number;
    expense: number;
  }>;
  breakdown: {
    categories: Array<{ category: string; amount: number }>;
  };
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize with a fixed value to avoid hydration mismatch
  const [selectedYear, setSelectedYear] = useState(() => {
    if (typeof window !== "undefined") {
      return new Date().getFullYear();
    }
    return 2025; // Default fallback for SSR
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      return new Date().getMonth() + 1;
    }
    return 1; // Default fallback for SSR
  });
  const [mounted, setMounted] = useState(false);

  const loadMonthlyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      setMonthlyReport(data);
    } catch (err) {
      console.error(err);
      setError("Could not load monthly report.");
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/yearly?year=${selectedYear}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      setYearlyReport(data);
    } catch (err) {
      console.error(err);
      setError("Could not load yearly report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Set actual current date after mount to avoid hydration mismatch
    if (typeof window !== "undefined") {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      // Only update if different to avoid unnecessary re-renders
      if (selectedYear !== currentYear) {
        setSelectedYear(currentYear);
      }
      if (selectedMonth !== currentMonth) {
        setSelectedMonth(currentMonth);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't load until after mount
    if (reportType === "monthly") {
      loadMonthlyReport();
    } else {
      loadYearlyReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedYear, selectedMonth, mounted]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (reportType === "monthly" && monthlyReport && monthlyReport.transactions) {
      const csv = [
        "Date,Amount,Merchant,Description,Category",
        ...monthlyReport.transactions.map((tx) => {
          const date = tx.date ? new Date(tx.date).toLocaleDateString() : "";
          const amount = tx.amount || 0;
          const merchant = (tx.merchant || "").replace(/,/g, ";");
          const desc = (tx.rawDescription || "").replace(/,/g, ";");
          const category = tx.category || "";
          return `${date},${amount},"${merchant}","${desc}",${category}`;
        }),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monthly-report-${selectedYear}-${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financial Reports</h1>
          <p className="mt-2 text-zinc-400">
            Generate detailed monthly and yearly financial reports.
          </p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={() => setReportType("monthly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            reportType === "monthly"
              ? "bg-emerald-400 text-zinc-950"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Monthly Report
        </button>
        <button
          type="button"
          onClick={() => setReportType("yearly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            reportType === "yearly"
              ? "bg-emerald-400 text-zinc-950"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Yearly Report
        </button>
      </div>

      {/* Date Selectors */}
      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Year</label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            min="2020"
            max={mounted ? new Date().getFullYear() : 2025}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
          />
        </div>
        {reportType === "monthly" && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                // Use a consistent month name format to avoid hydration mismatch
                const monthNames = [
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ];
                return (
                  <option key={m} value={m}>
                    {monthNames[m - 1]}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        {reportType === "monthly" && monthlyReport && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
          >
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-400 border-r-transparent"></div>
        </div>
      )}

      {/* Monthly Report */}
      {!loading && reportType === "monthly" && monthlyReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Total Income</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(monthlyReport.summary.totalIncome)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(monthlyReport.summary.totalExpense)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Net</p>
              <p
                className={`text-2xl font-bold ${
                  monthlyReport.summary.net >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(monthlyReport.summary.net)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Transactions</p>
              <p className="text-2xl font-bold text-zinc-300">
                {monthlyReport.summary.transactionCount}
              </p>
            </div>
          </div>

          {/* Category Breakdown Chart */}
          {monthlyReport.breakdown.categories.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyReport.breakdown.categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="category"
                    stroke="#71717a"
                    style={{ fontSize: "12px" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#71717a"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      color: "#e4e4e7",
                    }}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Merchants */}
          {monthlyReport.breakdown.merchants.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Top Merchants</h2>
              <div className="space-y-2">
                {monthlyReport.breakdown.merchants.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/50">
                    <span className="text-sm text-zinc-300">{item.merchant}</span>
                    <span className="text-sm font-semibold text-zinc-200">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Yearly Report */}
      {!loading && reportType === "yearly" && yearlyReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Total Income</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(yearlyReport.summary.totalIncome)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(yearlyReport.summary.totalExpense)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Net</p>
              <p
                className={`text-2xl font-bold ${
                  yearlyReport.summary.net >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(yearlyReport.summary.net)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-400 mb-2">Transactions</p>
              <p className="text-2xl font-bold text-zinc-300">
                {yearlyReport.summary.transactionCount}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown Chart */}
          {yearlyReport.monthlyBreakdown.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Monthly Breakdown</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyReport.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="monthName"
                    stroke="#71717a"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#71717a"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      color: "#e4e4e7",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Categories */}
          {yearlyReport.breakdown.categories.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
              <div className="space-y-2">
                {yearlyReport.breakdown.categories.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/50">
                    <span className="text-sm text-zinc-300">{item.category}</span>
                    <span className="text-sm font-semibold text-zinc-200">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !monthlyReport && !yearlyReport && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            Select a period and generate a report to view your financial analysis.
          </p>
        </div>
      )}

      <div className="mt-6 text-xs text-zinc-500">
        <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

