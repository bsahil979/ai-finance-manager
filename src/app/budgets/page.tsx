"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Budget {
  _id: string;
  category: string;
  amount: number;
  period: "monthly" | "yearly";
}

interface BudgetTracking {
  _id: string;
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
}

export default function BudgetsPage() {
  const [, setBudgets] = useState<Budget[]>([]);
  const [tracking, setTracking] = useState<BudgetTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly" as "monthly" | "yearly",
  });

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [budgetsRes, trackingRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/budgets/tracking"),
      ]);

      const budgetsData = await budgetsRes.json();
      const trackingData = await trackingRes.json();

      if (!budgetsRes.ok) throw new Error(budgetsData.error || "Failed to load budgets");
      if (!trackingRes.ok) throw new Error(trackingData.error || "Failed to load tracking");

      setBudgets(budgetsData.budgets || []);
      setTracking(trackingData.tracking || []);
    } catch (err) {
      console.error(err);
      setError("Could not load budgets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create budget");
      
      setShowForm(false);
      setFormData({ category: "", amount: "", period: "monthly" });
      await loadBudgets();
    } catch (err) {
      console.error(err);
      alert("Failed to create budget");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadBudgets();
    } catch (err) {
      console.error(err);
      alert("Failed to delete budget");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exceeded":
        return "text-red-400 bg-red-900/20 border-red-800";
      case "warning":
        return "text-orange-400 bg-orange-900/20 border-orange-800";
      default:
        return "text-emerald-400 bg-emerald-900/20 border-emerald-800";
    }
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Budgets</h1>
          <p className="mt-2 text-zinc-400">
            Set monthly budgets and track your spending by category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
        >
          {showForm ? "Cancel" : "+ Add Budget"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  list="categories"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
                <datalist id="categories">
                  <option value="Food & Dining" />
                  <option value="Groceries" />
                  <option value="Shopping" />
                  <option value="Transportation" />
                  <option value="Bills & Utilities" />
                  <option value="Entertainment" />
                  <option value="Healthcare" />
                  <option value="Travel" />
                  <option value="Subscriptions" />
                  <option value="Gas & Fuel" />
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      period: e.target.value as "monthly" | "yearly",
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
            >
              Create Budget
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-zinc-400">Loading budgets...</p>}

      {!loading && tracking.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            No budgets set yet. Create a budget to start tracking your spending.
          </p>
        </div>
      )}

      {!loading && tracking.length > 0 && (
        <div className="space-y-4">
          {tracking.map((item) => (
            <div
              key={item._id}
              className={`rounded-lg border p-4 ${getStatusColor(item.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{item.category}</h3>
                  <p className="text-xs opacity-80">
                    {formatCurrency(item.spent)} of {formatCurrency(item.budget)} spent
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {item.percentage.toFixed(0)}%
                  </p>
                  <p className="text-xs opacity-80">
                    {formatCurrency(item.remaining)} remaining
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-zinc-800/50 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    item.status === "exceeded"
                      ? "bg-red-400"
                      : item.status === "warning"
                        ? "bg-orange-400"
                        : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  className="text-xs text-zinc-400 hover:text-zinc-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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

