"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bill = {
  _id: string;
  name: string;
  amount: number;
  dueDate: string | Date;
  category: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  accountId?: string;
  notes?: string;
  isPaid: boolean;
  paidDate?: string | Date | null;
};

type Account = {
  _id: string;
  name: string;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "Bills & Utilities",
    isRecurring: false,
    recurringFrequency: "monthly",
    accountId: "",
    notes: "",
  });

  const loadBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/bills${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bills");
      setBills(data.bills || []);
    } catch (err) {
      setError("Could not load bills.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccounts(data.accounts.filter((a: { isActive: boolean }) => a.isActive));
      }
    } catch (err) {
      console.error("Failed to load accounts", err);
    }
  };

  useEffect(() => {
    loadBills();
    loadAccounts();
    // Auto-detect bills on page load if no bills exist
    if (bills.length === 0) {
      fetch("/api/bills/detect", { method: "POST" })
        .then(() => {
          loadBills();
        })
        .catch((err) => {
          console.error("Error auto-detecting bills:", err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/bills/${editingId}` : "/api/bills";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save bill");
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        amount: "",
        dueDate: "",
        category: "Bills & Utilities",
        isRecurring: false,
        recurringFrequency: "monthly",
        accountId: "",
        notes: "",
      });
      loadBills();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save bill");
    }
  };

  const handlePay = async (billId: string, createTransaction: boolean) => {
    try {
      const bill = bills.find((b) => b._id === billId);
      const accountId = bill?.accountId || formData.accountId || "";

      const res = await fetch("/api/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId,
          createTransaction,
          accountId: accountId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to pay bill");
      loadBills();
      alert("Bill marked as paid!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pay bill");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete bill");
      loadBills();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete bill");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getDaysUntilDue = (dueDate: string | Date) => {
    const due = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const upcomingBills = bills.filter((b) => !b.isPaid && getDaysUntilDue(b.dueDate) >= 0);
  const overdueBills = bills.filter((b) => !b.isPaid && getDaysUntilDue(b.dueDate) < 0);
  const paidBills = bills.filter((b) => b.isPaid);
  const totalUpcoming = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bill Reminders</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Automatically detect or manually add bills and track payments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              setDetecting(true);
              setError(null);
              try {
                const res = await fetch("/api/bills/detect", { method: "POST" });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to detect bills");
                
                await loadBills();
                
                if (data.saved > 0) {
                  alert(`Detected and saved ${data.saved} bill${data.saved !== 1 ? "s" : ""}!`);
                } else {
                  alert("No new bills detected. You can add them manually.");
                }
              } catch (err) {
                console.error(err);
                setError("Could not detect bills. Make sure you have imported transactions.");
              } finally {
                setDetecting(false);
              }
            }}
            disabled={detecting}
            className="inline-flex items-center justify-center rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 shadow-sm hover:bg-zinc-600 disabled:opacity-60"
          >
            {detecting ? "Detecting..." : "🔍 Detect Automatically"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setFormData({
                name: "",
                amount: "",
                dueDate: "",
                category: "Bills & Utilities",
                isRecurring: false,
                recurringFrequency: "monthly",
                accountId: "",
                notes: "",
              });
            }}
            className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
          >
            + Add Manually
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && bills.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-400 mb-1">Upcoming Bills</p>
            <p className="text-xl font-bold text-zinc-200">
              {upcomingBills.length}
            </p>
            <p className="text-sm text-emerald-400 mt-1">
              {formatCurrency(totalUpcoming)}
            </p>
          </div>
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4">
            <p className="text-xs text-zinc-400 mb-1">Overdue Bills</p>
            <p className="text-xl font-bold text-red-400">
              {overdueBills.length}
            </p>
            <p className="text-sm text-red-400 mt-1">
              {formatCurrency(totalOverdue)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-400 mb-1">Paid This Month</p>
            <p className="text-xl font-bold text-zinc-200">
              {paidBills.length}
            </p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-emerald-400 text-zinc-950"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("upcoming")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "upcoming"
              ? "bg-emerald-400 text-zinc-950"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("overdue")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "overdue"
              ? "bg-emerald-400 text-zinc-950"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Overdue
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("paid")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "paid"
              ? "bg-emerald-400 text-zinc-950"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Paid
        </button>
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

      {/* Bills List */}
      {!loading && (
        <div className="space-y-3">
          {bills.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400 mb-4">No bills found.</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    setDetecting(true);
                    setError(null);
                    try {
                      const res = await fetch("/api/bills/detect", { method: "POST" });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Failed to detect");
                      await loadBills();
                      if (data.saved > 0) {
                        alert(`Detected ${data.saved} bill${data.saved !== 1 ? "s" : ""}!`);
                      }
                    } catch (err) {
                      console.error(err);
                      setError("Could not detect bills.");
                    } finally {
                      setDetecting(false);
                    }
                  }}
                  disabled={detecting}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 shadow-sm hover:bg-zinc-600 disabled:opacity-60"
                >
                  {detecting ? "Detecting..." : "Detect from Transactions"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                >
                  Add Manually
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Make sure you have imported transactions first to use automatic detection.
              </p>
            </div>
          ) : (
            bills.map((bill) => {
              const daysUntil = getDaysUntilDue(bill.dueDate);
              const isOverdue = !bill.isPaid && daysUntil < 0;
              const isDueSoon = !bill.isPaid && daysUntil >= 0 && daysUntil <= 3;

              return (
                <div
                  key={bill._id}
                  className={`rounded-xl border p-4 ${
                    isOverdue
                      ? "border-red-800 bg-red-900/20"
                      : isDueSoon
                      ? "border-orange-800 bg-orange-900/20"
                      : bill.isPaid
                      ? "border-zinc-800 bg-zinc-900/30"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-zinc-200">
                          {bill.name}
                        </h3>
                        {bill.isRecurring && (
                          <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                            {bill.recurringFrequency === "monthly" ? "Monthly" : bill.recurringFrequency === "weekly" ? "Weekly" : "Yearly"}
                          </span>
                        )}
                        {bill.isPaid && (
                          <span className="inline-flex items-center rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-800">
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-zinc-400 mb-1">Amount</p>
                          <p className="text-lg font-bold text-zinc-200">
                            {formatCurrency(bill.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 mb-1">Due Date</p>
                          <p className={`text-sm font-medium ${
                            isOverdue ? "text-red-400" : isDueSoon ? "text-orange-400" : "text-zinc-300"
                          }`}>
                            {new Date(bill.dueDate).toLocaleDateString()}
                            {!bill.isPaid && (
                              <span className="ml-2 text-xs">
                                ({daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : daysUntil === 0 ? "Due today" : `${daysUntil} days left`})
                              </span>
                            )}
                          </p>
                        </div>
                        {bill.category && (
                          <div>
                            <p className="text-xs text-zinc-400 mb-1">Category</p>
                            <p className="text-sm text-zinc-300">{bill.category}</p>
                          </div>
                        )}
                        {bill.accountId && accounts.find((a) => a._id === bill.accountId) && (
                          <div>
                            <p className="text-xs text-zinc-400 mb-1">Account</p>
                            <p className="text-sm text-zinc-300">
                              {accounts.find((a) => a._id === bill.accountId)?.name}
                            </p>
                          </div>
                        )}
                        {bill.paidDate && (
                          <div>
                            <p className="text-xs text-zinc-400 mb-1">Paid On</p>
                            <p className="text-sm text-zinc-300">
                              {new Date(bill.paidDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {bill.notes && (
                        <p className="mt-2 text-xs text-zinc-500">{bill.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {!bill.isPaid && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePay(bill._id, true)}
                            className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                          >
                            Mark Paid + Transaction
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePay(bill._id, false)}
                            className="inline-flex items-center justify-center rounded-md border border-emerald-700 bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-900/30"
                          >
                            Mark Paid
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(bill._id);
                          setFormData({
                            name: bill.name,
                            amount: bill.amount.toString(),
                            dueDate: new Date(bill.dueDate).toISOString().split("T")[0],
                            category: bill.category,
                            isRecurring: bill.isRecurring,
                            recurringFrequency: bill.recurringFrequency || "monthly",
                            accountId: bill.accountId || "",
                            notes: bill.notes || "",
                          });
                          setShowAddForm(true);
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bill._id)}
                        className="inline-flex items-center justify-center rounded-md border border-red-800 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add/Edit Bill Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Bill" : "Add New Bill"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({
                    name: "",
                    amount: "",
                    dueDate: "",
                    category: "Bills & Utilities",
                    isRecurring: false,
                    recurringFrequency: "monthly",
                    accountId: "",
                    notes: "",
                  });
                }}
                className="text-zinc-400 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Bill Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    placeholder="e.g., Electricity Bill"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Rent">Rent</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Loan Payment">Loan Payment</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Account (Optional)
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) =>
                      setFormData({ ...formData, accountId: e.target.value })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="">No account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Recurring Frequency
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRecurring: e.target.checked,
                          })
                        }
                        className="rounded border-zinc-700 bg-zinc-800"
                      />
                      <span className="text-xs text-zinc-400">Recurring</span>
                    </label>
                    {formData.isRecurring && (
                      <select
                        value={formData.recurringFrequency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurringFrequency: e.target.value,
                          })
                        }
                        className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                >
                  {editingId ? "Update Bill" : "Create Bill"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({
                      name: "",
                      amount: "",
                      dueDate: "",
                      category: "Bills & Utilities",
                      isRecurring: false,
                      recurringFrequency: "monthly",
                      accountId: "",
                      notes: "",
                    });
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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


