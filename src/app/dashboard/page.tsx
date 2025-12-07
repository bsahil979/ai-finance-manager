"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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

type RecentTransaction = {
  _id: string;
  date?: string;
  amount?: number;
  merchant?: string;
  rawDescription?: string;
  category?: string;
};

type BudgetSummary = {
  totalBudgets: number;
  totalBudget: number;
  totalSpent: number;
  budgetsExceeded: number;
  budgetsWarning: number;
  budgetsOk: number;
};

type MonthlyComparison = {
  currentMonth: { income: number; expense: number };
  lastMonth: { income: number; expense: number };
  incomeChange: string;
  expenseChange: string;
};

type UpcomingSubscription = {
  _id: string;
  merchant: string;
  amount: number;
  nextRenewalDate?: string;
  billingCycle: string;
};

type SpendingTrend = {
  month: string;
  income: number;
  expense: number;
};

type Goal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  status: string;
};

type GoalsSummary = {
  activeGoals: Goal[];
  totalGoals: number;
  completedGoals: number;
  totalTarget: number;
  totalCurrent: number;
  overallProgress: number;
};

type CashFlowProjection = {
  projections: Array<{
    date: string | Date;
    amount: number;
    type: string;
    name: string;
    category?: string;
    merchant?: string;
  }>;
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    transactionCount: number;
  };
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
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison | null>(null);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<UpcomingSubscription[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [showDetailedReview, setShowDetailedReview] = useState(false);
  const [goalsSummary, setGoalsSummary] = useState<GoalsSummary | null>(null);
  const [cashFlowProjection, setCashFlowProjection] = useState<CashFlowProjection | null>(null);

  // Colors for charts
  const CHART_COLORS = [
    "#10b981", // emerald-400
    "#3b82f6", // blue-500
    "#8b5cf6", // purple-500
    "#ec4899", // pink-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#f97316", // orange-500
    "#6366f1", // indigo-500
  ];

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

    const loadAdditionalData = async () => {
      try {
        const [recentRes, budgetRes, comparisonRes, subscriptionsRes] = await Promise.all([
          fetch("/api/dashboard/recent-transactions"),
          fetch("/api/dashboard/budget-summary"),
          fetch("/api/dashboard/monthly-comparison"),
          fetch("/api/dashboard/upcoming-subscriptions"),
        ]);

        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentTransactions(data.transactions || []);
        }

        if (budgetRes.ok) {
          const data = await budgetRes.json();
          setBudgetSummary(data);
        }

        if (comparisonRes.ok) {
          const data = await comparisonRes.json();
          setMonthlyComparison(data);
        }

        if (subscriptionsRes.ok) {
          const data = await subscriptionsRes.json();
          setUpcomingSubscriptions(data.subscriptions || []);
        }

        // Load spending trends
        const trendsRes = await fetch("/api/dashboard/spending-trends");
        if (trendsRes.ok) {
          const data = await trendsRes.json();
          setSpendingTrends(data.trends || []);
        }

        // Load goals summary
        const goalsRes = await fetch("/api/dashboard/goals-summary");
        if (goalsRes.ok) {
          const data = await goalsRes.json();
          setGoalsSummary(data);
        }

        // Load cash flow projection
        const projectionRes = await fetch("/api/recurring-transactions/project");
        if (projectionRes.ok) {
          const data = await projectionRes.json();
          setCashFlowProjection(data);
        }
      } catch (err) {
        console.error("Failed to load additional dashboard data", err);
      }
    };
    loadAdditionalData();
  }, []);

  const handleExplainSpending = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/explain-spending");
      
      // Check if response is ok before trying to parse JSON
      if (!res.ok) {
        let errorMsg = `Request failed with status ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.details || errorData.message || errorMsg;
          console.error("API error response:", {
            status: res.status,
            statusText: res.statusText,
            error: errorData,
          });
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await res.text();
            errorMsg = errorText || errorMsg;
            console.error("API error (text):", errorText);
          } catch (textError) {
            console.error("API error (unable to parse):", res.status, res.statusText);
          }
        }
        setAiError(errorMsg);
        return;
      }
      
      // Parse successful response
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        setAiError("Received invalid response from server. Please try again.");
        return;
      }
      
      if (data.message) {
        setAiInsight(data.message);
      } else if (data.insight) {
        setAiInsight(data.insight);
      } else {
        setAiError("No insight returned from AI. Please try again.");
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
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
            <div className="grid gap-6 mb-8 md:grid-cols-4">
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
                {monthlyComparison && parseFloat(monthlyComparison.incomeChange) !== 0 && (
                  <p className={`mt-2 text-xs ${parseFloat(monthlyComparison.incomeChange) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {parseFloat(monthlyComparison.incomeChange) > 0 ? "↑" : "↓"} {Math.abs(parseFloat(monthlyComparison.incomeChange))}% vs last month
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-400">This Month - Expenses</p>
                  <span className="text-red-400">↓</span>
                </div>
                <p className="text-3xl font-bold text-red-400">
                  {formatCurrency(overview.monthExpense)}
                </p>
                {monthlyComparison && parseFloat(monthlyComparison.expenseChange) !== 0 && (
                  <p className={`mt-2 text-xs ${parseFloat(monthlyComparison.expenseChange) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {parseFloat(monthlyComparison.expenseChange) > 0 ? "↑" : "↓"} {Math.abs(parseFloat(monthlyComparison.expenseChange))}% vs last month
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <p className="text-sm text-zinc-400 mb-2">Savings Rate</p>
                <p className="text-3xl font-bold text-sky-400">
                  {overview.monthIncome > 0
                    ? `${((overview.monthIncome - overview.monthExpense) / overview.monthIncome * 100).toFixed(1)}%`
                    : "0%"}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {overview.monthIncome > 0
                    ? formatCurrency(overview.monthIncome - overview.monthExpense)
                    : "No income"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8 flex flex-wrap gap-3">
              <a
                href="/transactions"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                View All Transactions
              </a>
              <a
                href="/budgets"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Manage Budgets
              </a>
              <a
                href="/goals"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Financial Goals
              </a>
              <a
                href="/subscriptions"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                View Subscriptions
              </a>
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

            {/* Budget Summary */}
            {budgetSummary && budgetSummary.totalBudgets > 0 && (
              <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Budget Overview</h2>
                  <a
                    href="/budgets"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    View All →
                  </a>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Total Budget</p>
                    <p className="text-xl font-semibold text-zinc-200">
                      {formatCurrency(budgetSummary.totalBudget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Spent</p>
                    <p className="text-xl font-semibold text-zinc-200">
                      {formatCurrency(budgetSummary.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Status</p>
                    <div className="flex gap-2 mt-1">
                      {budgetSummary.budgetsOk > 0 && (
                        <span className="inline-flex items-center rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-800">
                          {budgetSummary.budgetsOk} OK
                        </span>
                      )}
                      {budgetSummary.budgetsWarning > 0 && (
                        <span className="inline-flex items-center rounded-full bg-orange-900/30 px-2 py-0.5 text-xs text-orange-400 border border-orange-800">
                          {budgetSummary.budgetsWarning} Warning
                        </span>
                      )}
                      {budgetSummary.budgetsExceeded > 0 && (
                        <span className="inline-flex items-center rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-400 border border-red-800">
                          {budgetSummary.budgetsExceeded} Exceeded
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Remaining</p>
                    <p className={`text-xl font-semibold ${
                      budgetSummary.totalBudget - budgetSummary.totalSpent >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}>
                      {formatCurrency(budgetSummary.totalBudget - budgetSummary.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Goals Summary */}
            {goalsSummary && goalsSummary.totalGoals > 0 && (
              <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Financial Goals</h2>
                  <a
                    href="/goals"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    View All →
                  </a>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-400">
                      {goalsSummary.completedGoals} of {goalsSummary.totalGoals} goals completed
                    </span>
                    <span className="font-semibold text-emerald-400">
                      {goalsSummary.overallProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all"
                      style={{ width: `${Math.min(goalsSummary.overallProgress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatCurrency(goalsSummary.totalCurrent)} of {formatCurrency(goalsSummary.totalTarget)} saved
                  </p>
                </div>
                {goalsSummary.activeGoals.length > 0 && (
                  <div className="space-y-2">
                    {goalsSummary.activeGoals.map((goal) => {
                      const percentage = goal.targetAmount > 0
                        ? (goal.currentAmount / goal.targetAmount) * 100
                        : 0;
                      return (
                        <div
                          key={goal._id}
                          className="flex items-center justify-between p-2 rounded-lg border border-zinc-800 bg-zinc-950/50"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">{goal.name}</p>
                            <p className="text-xs text-zinc-500">
                              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-400">
                              {percentage.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Subscriptions */}
            {upcomingSubscriptions.length > 0 && (
              <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Upcoming Subscriptions</h2>
                  <a
                    href="/subscriptions"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    View All →
                  </a>
                </div>
                <div className="space-y-3">
                  {upcomingSubscriptions.map((sub) => {
                    const renewalDate = sub.nextRenewalDate ? new Date(sub.nextRenewalDate) : null;
                    const daysUntil = renewalDate
                      ? Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{sub.merchant}</p>
                          <p className="text-xs text-zinc-400">
                            {formatCurrency(sub.amount)} • {sub.billingCycle}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-zinc-300">
                            {daysUntil !== null ? `In ${daysUntil} day${daysUntil !== 1 ? "s" : ""}` : "Soon"}
                          </p>
                          {renewalDate && (
                            <p className="text-xs text-zinc-500">
                              {renewalDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cash Flow Projection */}
            {cashFlowProjection && cashFlowProjection.summary.transactionCount > 0 && (
              <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">30-Day Cash Flow Projection</h2>
                  <a
                    href="/transactions"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Manage Recurring →
                  </a>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Projected Income</p>
                    <p className="text-xl font-semibold text-emerald-400">
                      {formatCurrency(cashFlowProjection.summary.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Projected Expenses</p>
                    <p className="text-xl font-semibold text-red-400">
                      {formatCurrency(cashFlowProjection.summary.totalExpense)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Net Cash Flow</p>
                    <p
                      className={`text-xl font-semibold ${
                        cashFlowProjection.summary.net >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatCurrency(cashFlowProjection.summary.net)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Transactions</p>
                    <p className="text-xl font-semibold text-zinc-300">
                      {cashFlowProjection.summary.transactionCount}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  Based on your recurring transactions for the next 30 days
                </p>
              </div>
            )}

            {/* Detailed Review Section with Charts */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowDetailedReview(!showDetailedReview)}
                className="w-full flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Detailed Review</h2>
                  <span className="text-xs text-zinc-500">
                    Charts and visualizations
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-zinc-400 transition-transform ${
                    showDetailedReview ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDetailedReview && (
                <div className="mt-4 space-y-6">
                  {/* Charts Section */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Category Pie Chart */}
                    {categoryBreakdown.length > 0 && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={categoryBreakdown.map((item) => ({
                                name: item.category,
                                value: item.amount,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {categoryBreakdown.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: "#18181b",
                                border: "1px solid #27272a",
                                borderRadius: "8px",
                                color: "#e4e4e7",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Merchant Pie Chart */}
                    {spendingBreakdown.length > 0 && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <h2 className="text-lg font-semibold mb-4">Top Spending by Merchant</h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={spendingBreakdown.slice(0, 8).map((item) => ({
                                name: item.merchant,
                                value: item.amount,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {spendingBreakdown.slice(0, 8).map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: "#18181b",
                                border: "1px solid #27272a",
                                borderRadius: "8px",
                                color: "#e4e4e7",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Spending Trends Line Chart */}
                  {spendingTrends.length > 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                      <h2 className="text-lg font-semibold mb-4">Spending Trends (Last 6 Months)</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={spendingTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis
                            dataKey="month"
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
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Income"
                            dot={{ fill: "#10b981", r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expense"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="Expenses"
                            dot={{ fill: "#ef4444", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Monthly Comparison Bar Chart */}
                  {monthlyComparison && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                      <h2 className="text-lg font-semibold mb-4">Monthly Comparison</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              month: "Last Month",
                              income: monthlyComparison.lastMonth.income,
                              expense: monthlyComparison.lastMonth.expense,
                            },
                            {
                              month: "This Month",
                              income: monthlyComparison.currentMonth.income,
                              expense: monthlyComparison.currentMonth.expense,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis
                            dataKey="month"
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
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

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

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Transactions</h2>
                    <a
                      href="/transactions"
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      View All →
                    </a>
                  </div>
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">
                            {tx.merchant || tx.rawDescription || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {tx.date && (
                              <p className="text-xs text-zinc-500">
                                {new Date(tx.date).toLocaleDateString()}
                              </p>
                            )}
                            {tx.category && (
                              <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                                {tx.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            typeof tx.amount === "number" && tx.amount >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {typeof tx.amount === "number"
                            ? formatCurrency(tx.amount)
                            : "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
    </main>
  );
}
