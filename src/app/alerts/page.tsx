"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Alert {
  _id: string;
  type: "renewal" | "unusual_spend";
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load alerts");
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
      setError("Could not load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate alerts");
      
      await loadAlerts();
      
      if (data.generated > 0) {
        alert(`Generated ${data.generated} new alerts!`);
      } else {
        alert("No new alerts found. Everything looks normal!");
      }
    } catch (err) {
      console.error(err);
      setError("Could not generate alerts. Make sure you have transactions and subscriptions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <main className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Alerts
            </h1>
            <p className="mt-2 text-zinc-400">
              Upcoming renewals and unusual spending patterns.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Alerts"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {unreadCount > 0 && (
          <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-900/20 p-3 text-sm text-emerald-400">
            {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
          </div>
        )}

        {loading && (
          <p className="text-sm text-zinc-400">Loading alerts...</p>
        )}

        {!loading && alerts.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400">
              No alerts yet. Click &quot;Generate Alerts&quot; to check for
              upcoming renewals and unusual spending patterns.
            </p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div className="mt-6 space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`rounded-lg border p-4 ${
                  alert.isRead
                    ? "border-zinc-800 bg-zinc-900/50"
                    : "border-zinc-700 bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          alert.type === "renewal"
                            ? "bg-orange-900/30 text-orange-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {alert.type === "renewal" ? "Renewal" : "Unusual Spend"}
                      </span>
                      {!alert.isRead && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-200">{alert.message}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkRead(alert._id, !alert.isRead)}
                    className="text-xs text-zinc-400 hover:text-zinc-300"
                  >
                    {alert.isRead ? "Mark unread" : "Mark read"}
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
