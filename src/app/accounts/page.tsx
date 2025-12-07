"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Account = {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isActive: boolean;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "INR",
  });
  const [transferData, setTransferData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
  });

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load accounts");
      setAccounts(data.accounts || []);
    } catch (err) {
      setError("Could not load accounts.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          balance: parseFloat(formData.balance) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");
      setShowAddForm(false);
      setFormData({ name: "", type: "checking", balance: "", currency: "INR" });
      loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const account = accounts.find((a) => a._id === id);
      if (!account) return;

      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || account.name,
          type: formData.type || account.type,
          balance: formData.balance ? parseFloat(formData.balance) : account.balance,
          currency: formData.currency || account.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account");
      setEditingId(null);
      setFormData({ name: "", type: "checking", balance: "", currency: "INR" });
      loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update account");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transfer");
      setShowTransferForm(false);
      setTransferData({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        description: "",
      });
      loadAccounts();
      alert("Transfer completed successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to transfer");
    }
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      checking: "Checking",
      savings: "Savings",
      credit: "Credit Card",
      cash: "Cash",
      investment: "Investment",
      other: "Other",
    };
    return labels[type] || type;
  };

  const totalBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your bank accounts, wallets, and other financial accounts.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowTransferForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Transfer Money
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
          >
            Add Account
          </button>
        </div>
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

      {/* Total Balance Card */}
      {!loading && accounts.length > 0 && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-400 mb-2">Total Balance (All Accounts)</p>
          <p className="text-3xl font-bold text-emerald-400">
            {formatCurrency(totalBalance)}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {accounts.filter((a) => a.isActive).length} active account{accounts.filter((a) => a.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Accounts List */}
      {!loading && (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400 mb-4">No accounts yet.</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
              >
                Add Your First Account
              </button>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account._id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-zinc-200">
                        {account.name}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {getAccountTypeLabel(account.type)}
                      </span>
                      {!account.isActive && (
                        <span className="inline-flex items-center rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-400 border border-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(account._id);
                        setFormData({
                          name: account.name,
                          type: account.type,
                          balance: account.balance.toString(),
                          currency: account.currency,
                        });
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(account._id)}
                      className="inline-flex items-center justify-center rounded-md border border-red-800 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                {editingId === account._id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate(account._id);
                    }}
                    className="mt-4 pt-4 border-t border-zinc-800 space-y-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                          <option value="credit">Credit Card</option>
                          <option value="cash">Cash</option>
                          <option value="investment">Investment</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Balance
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.balance}
                          onChange={(e) =>
                            setFormData({ ...formData, balance: e.target.value })
                          }
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Currency
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) =>
                            setFormData({ ...formData, currency: e.target.value })
                          }
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setFormData({
                            name: "",
                            type: "checking",
                            balance: "",
                            currency: "INR",
                          });
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add New Account</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    name: "",
                    type: "checking",
                    balance: "",
                    currency: "INR",
                  });
                }}
                className="text-zinc-400 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="e.g., Main Checking Account"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      name: "",
                      type: "checking",
                      balance: "",
                      currency: "INR",
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

      {/* Transfer Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transfer Money</h2>
              <button
                type="button"
                onClick={() => {
                  setShowTransferForm(false);
                  setTransferData({
                    fromAccountId: "",
                    toAccountId: "",
                    amount: "",
                    description: "",
                  });
                }}
                className="text-zinc-400 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  From Account
                </label>
                <select
                  value={transferData.fromAccountId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      fromAccountId: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  required
                >
                  <option value="">Select account</option>
                  {accounts
                    .filter((a) => a.isActive)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatCurrency(a.balance, a.currency)})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  To Account
                </label>
                <select
                  value={transferData.toAccountId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      toAccountId: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  required
                >
                  <option value="">Select account</option>
                  {accounts
                    .filter((a) => a.isActive && a._id !== transferData.fromAccountId)
                    .map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatCurrency(a.balance, a.currency)})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData({ ...transferData, amount: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={transferData.description}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="e.g., Monthly savings transfer"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                >
                  Transfer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferForm(false);
                    setTransferData({
                      fromAccountId: "",
                      toAccountId: "",
                      amount: "",
                      description: "",
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


