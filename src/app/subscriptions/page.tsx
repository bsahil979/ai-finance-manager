"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Subscription {
  _id: string;
  merchant: string;
  amount: number;
  currency: string;
  billingCycle: "weekly" | "monthly" | "yearly";
  nextRenewalDate?: string;
  status: string;
  occurrences?: number;
}


export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load subscriptions");
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error(err);
      setError("Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/detect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to detect subscriptions");
      
      // Reload subscriptions after detection
      await loadSubscriptions();
      
      alert(`Detected ${data.detected || 0} subscriptions!`);
    } catch (err) {
      console.error(err);
      setError("Could not detect subscriptions. Make sure you have imported transactions.");
    } finally {
      setDetecting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscription?")) return;
    
    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadSubscriptions();
    } catch (err) {
      console.error(err);
      setError("Could not delete subscription.");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <main className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Subscriptions
          </h1>
          <p className="mt-2 text-zinc-400">
            Manage your recurring subscription payments.
          </p>
        </div>

        <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Subscriptions</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Recurring payments detected from your transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDetect}
                disabled={detecting}
                className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60"
              >
                {detecting ? "Detecting..." : "Detect Subscriptions"}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <p className="text-sm text-zinc-400">Loading subscriptions...</p>
            )}

            {!loading && subscriptions.length === 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                <p className="text-zinc-400">
                  No subscriptions detected yet. Click &quot;Detect Subscriptions&quot; to
                  analyze your transactions for recurring payments.
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Make sure you have imported transactions first.
                </p>
              </div>
            )}

            {!loading && subscriptions.length > 0 && (
              <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">
                        Merchant
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">
                        Billing Cycle
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">
                        Next Renewal
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr
                        key={sub._id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3 font-medium">{sub.merchant}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(sub.amount, sub.currency)}
                        </td>
                        <td className="px-4 py-3 capitalize">{sub.billingCycle}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {formatDate(sub.nextRenewalDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(sub._id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </>

        <div className="mt-6 text-xs text-zinc-500">
          <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">
            ← Back to Dashboard
          </Link>
        </div>
    </main>
  );
}
