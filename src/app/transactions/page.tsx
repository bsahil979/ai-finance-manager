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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setTransactions(data.transactions ?? []);
    } catch (err) {
      setError("Could not load transactions yet.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="w-full px-8 py-10">
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
          {!loading && !error && transactions.length > 0 && (
            <table className="mt-2 w-full text-left text-sm">
              <thead className="border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Merchant</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-zinc-900">
                    <td className="py-2">
                      {tx.date ? new Date(tx.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2">{tx.merchant ?? tx.rawDescription}</td>
                    <td className="py-2 text-right">
                      {typeof tx.amount === "number" ? tx.amount.toFixed(2) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}



