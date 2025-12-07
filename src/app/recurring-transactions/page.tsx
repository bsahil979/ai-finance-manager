"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecurringTransaction {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  merchant?: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  isActive: boolean;
}

export default function RecurringTransactionsPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    merchant: "",
    frequency: "monthly" as string,
    startDate: "",
    endDate: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadRecurringTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recurring-transactions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load recurring transactions");
      setRecurringTransactions(data.recurringTransactions || []);
    } catch (err) {
      console.error(err);
      setError("Could not load recurring transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId
        ? {
            id: editingId,
            ...formData,
            amount: Number(formData.amount),
            endDate: formData.endDate || null,
          }
        : {
            ...formData,
            amount: Number(formData.amount),
            endDate: formData.endDate || null,
          };

      const res = await fetch("/api/recurring-transactions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save recurring transaction");

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        amount: "",
        type: "expense",
        category: "",
        merchant: "",
        frequency: "monthly",
        startDate: "",
        endDate: "",
      });
      await loadRecurringTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to save recurring transaction");
    }
  };

  const handleEdit = (rt: RecurringTransaction) => {
    setEditingId(rt._id);
    setFormData({
      name: rt.name,
      description: rt.description || "",
      amount: rt.amount.toString(),
      type: rt.type,
      category: rt.category || "",
      merchant: rt.merchant || "",
      frequency: rt.frequency,
      startDate: rt.startDate ? new Date(rt.startDate).toISOString().split("T")[0] : "",
      endDate: rt.endDate ? new Date(rt.endDate).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;

    try {
      const res = await fetch(`/api/recurring-transactions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadRecurringTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete recurring transaction");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/recurring-transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await loadRecurringTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recurring Transactions</h1>
          <p className="mt-2 text-zinc-400">
            Manage your recurring income and expenses for better cash flow planning.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: "",
              description: "",
              amount: "",
              type: "expense",
              category: "",
              merchant: "",
              frequency: "monthly",
              startDate: "",
              endDate: "",
            });
          }}
          className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
        >
          {showForm ? "Cancel" : "+ New Recurring"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="e.g., Salary, Netflix Subscription"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
            >
              {editingId ? "Update" : "Create"} Recurring Transaction
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-zinc-400">Loading recurring transactions...</p>}

      {!loading && recurringTransactions.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            No recurring transactions set up yet. Create one to start tracking recurring income and expenses!
          </p>
        </div>
      )}

      {!loading && recurringTransactions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Type</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Frequency</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Next Occurrence</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recurringTransactions.map((rt) => (
                <tr key={rt._id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-zinc-200">{rt.name}</p>
                      {rt.description && (
                        <p className="text-xs text-zinc-500">{rt.description}</p>
                      )}
                      {rt.merchant && (
                        <p className="text-xs text-zinc-500">Merchant: {rt.merchant}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        rt.type === "income"
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {rt.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        rt.type === "income" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {rt.type === "expense" ? "-" : "+"}
                      {formatCurrency(Math.abs(rt.amount))}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-300">{rt.frequency}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(rt.nextOccurrence)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        rt.isActive
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {rt.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(rt._id, rt.isActive)}
                        className="text-xs text-zinc-400 hover:text-zinc-300"
                      >
                        {rt.isActive ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(rt)}
                        className="text-xs text-zinc-400 hover:text-zinc-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rt._id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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


