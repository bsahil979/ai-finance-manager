"use client";

import { useEffect, useState } from "react";

type Transaction = {
  _id: string;
  date?: string;
  amount?: number;
  merchant?: string;
  rawDescription?: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const txs = data.transactions ?? [];
      setTransactions(txs);
      setFilteredTransactions(txs);
    } catch (err) {
      setError("Could not load transactions yet.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search and date
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.merchant?.toLowerCase().includes(query) ||
          tx.rawDescription?.toLowerCase().includes(query) ||
          tx.amount?.toString().includes(query),
      );
    }

    // Date filter
    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter((tx) => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        if (dateFilter.start && txDate < new Date(dateFilter.start)) return false;
        if (dateFilter.end) {
          const endDate = new Date(dateFilter.end);
          endDate.setHours(23, 59, 59, 999);
          if (txDate > endDate) return false;
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, dateFilter]);

  useEffect(() => {
    const load = async () => {
      await loadTransactions();
    };
    load();
  }, []);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setUploadMessage("Please choose a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    setUploading(true);
    setUploadMessage(null);

    try {
      const res = await fetch("/api/transactions/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      setUploadMessage(
        `Imported ${data.insertedCount ?? 0} transactions from CSV.`,
      );
      fileInput.value = "";
      await loadTransactions();
    } catch (err) {
      console.error(err);
      setUploadMessage("There was a problem importing that CSV file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction");
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx._id);
    setEditForm({
      date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : "",
      amount: tx.amount,
      merchant: tx.merchant || "",
      rawDescription: tx.rawDescription || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const res = await fetch(`/api/transactions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      await loadTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update transaction");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <main className="p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Transactions
        </h1>
        <p className="mt-2 text-zinc-400">
          This page will show your imported transactions. Right now it&apos;s
          reading from the `/api/transactions` endpoint.
        </p>

        <form
          onSubmit={handleUpload}
          className="mt-6 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Import transactions from CSV
            </label>
            <p className="text-xs text-zinc-500">
              Expected columns: <code>date</code>, <code>amount</code>,{" "}
              <code>merchant</code>, <code>description</code>.
            </p>
          </div>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="text-sm text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
          />
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
        </form>

        {uploadMessage && (
          <p className="mt-2 text-sm text-zinc-400">{uploadMessage}</p>
        )}

        {transactions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/transactions/export");
                  if (!res.ok) throw new Error("Export failed");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (err) {
                  console.error(err);
                  alert("Failed to export transactions");
                }
              }}
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900"
            >
              Export as CSV
            </button>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by merchant, description..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.start || ""}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, start: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.end || ""}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, end: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
            </div>
            {(searchQuery || dateFilter.start || dateFilter.end) && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  Showing {filteredTransactions.length} of {transactions.length}{" "}
                  transactions
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter({});
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          {loading && (
            <p className="text-sm text-zinc-400">Loading transactions...</p>
          )}
          {error && (
            <p className="text-sm text-red-400">
              {error} Configure MongoDB to continue.
            </p>
          )}
          {!loading && !error && transactions.length === 0 && (
            <p className="text-sm text-zinc-400">
              No transactions found yet. Soon you&apos;ll be able to upload a
              CSV file here.
            </p>
          )}
          {!loading && !error && filteredTransactions.length === 0 && transactions.length > 0 && (
            <p className="text-sm text-zinc-400">
              No transactions match your filters.
            </p>
          )}
          {!loading && !error && filteredTransactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="mt-2 w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Merchant</th>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-zinc-900 hover:bg-zinc-800/50">
                      {editingId === tx._id ? (
                        <>
                          <td className="py-2">
                            <input
                              type="date"
                              value={editForm.date || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, date: e.target.value })
                              }
                              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="text"
                              value={editForm.merchant || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, merchant: e.target.value })
                              }
                              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="text"
                              value={editForm.rawDescription || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  rawDescription: e.target.value,
                                })
                              }
                              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.amount || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  amount: Number(e.target.value),
                                })
                              }
                              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="text-xs text-emerald-400 hover:text-emerald-300"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-xs text-zinc-400 hover:text-zinc-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2">
                            {tx.date ? new Date(tx.date).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-2">{tx.merchant || "-"}</td>
                          <td className="py-2 text-zinc-400">
                            {tx.rawDescription || "-"}
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${
                              typeof tx.amount === "number" && tx.amount >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {typeof tx.amount === "number"
                              ? `$${Math.abs(tx.amount).toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleEdit(tx)}
                                className="text-xs text-zinc-400 hover:text-zinc-300"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(tx._id)}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </main>
  );
}
