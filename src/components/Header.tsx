"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  _id: string;
  email: string;
  name: string;
}

interface Alert {
  _id: string;
  type: "renewal" | "unusual_spend";
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Error checking auth:", err);
      }
    };
    checkAuth();
  }, []);

  const loadAlerts = async () => {
    if (!user) return;
    try {
      setLoadingAlerts(true);
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (res.ok && data.alerts) {
        setAlerts(data.alerts);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAlerts();
      // Auto-generate alerts on page load
      fetch("/api/alerts/generate", { method: "POST" }).then(() => {
        loadAlerts();
      });
      
      // Refresh alerts every 30 seconds
      const interval = setInterval(() => {
        loadAlerts();
      }, 30000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkRead = async (id: string, isRead: boolean) => {
    try {
      await fetch(`/api/alerts?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      await loadAlerts();
    } catch (err) {
      console.error("Error updating alert:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
      <div className="flex w-full items-center justify-between px-8 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            LEDG
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-xs text-zinc-400">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-zinc-100">
                Dashboard
              </Link>
              <Link href="/transactions" className="hover:text-zinc-100">
                Transactions
              </Link>
              <Link href="/subscriptions" className="hover:text-zinc-100">
                Subscriptions
              </Link>
              <Link href="/bills" className="hover:text-zinc-100">
                Bills
              </Link>
              <Link href="/alerts" className="hover:text-zinc-100">
                Alerts
              </Link>
              <Link href="/budgets" className="hover:text-zinc-100">
                Budgets
              </Link>
              <Link href="/goals" className="hover:text-zinc-100">
                Goals
              </Link>
              <Link href="/reports" className="hover:text-zinc-100">
                Reports
              </Link>
              <Link href="/accounts" className="hover:text-zinc-100">
                Accounts
              </Link>
              <div className="h-4 w-px bg-zinc-800"></div>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      loadAlerts();
                    }
                  }}
                  className="relative p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                  aria-label="Notifications"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                        <h3 className="text-sm font-semibold text-zinc-200">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-zinc-400">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {loadingAlerts ? (
                          <div className="p-4 text-center text-sm text-zinc-400">
                            Loading...
                          </div>
                        ) : alerts.length === 0 ? (
                          <div className="p-4 text-center text-sm text-zinc-400">
                            No notifications
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-800">
                            {alerts.slice(0, 10).map((alert) => (
                              <div
                                key={alert._id}
                                className={`p-3 hover:bg-zinc-800/50 transition-colors ${
                                  !alert.isRead ? "bg-zinc-800/30" : ""
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                          alert.type === "renewal"
                                            ? "bg-orange-900/30 text-orange-400"
                                            : "bg-red-900/30 text-red-400"
                                        }`}
                                      >
                                        {alert.type === "renewal"
                                          ? "Renewal"
                                          : "Spending"}
                                      </span>
                                      {!alert.isRead && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                      )}
                                    </div>
                                    <p className="text-xs text-zinc-200 line-clamp-2">
                                      {alert.message}
                                    </p>
                                    <p className="mt-1 text-[10px] text-zinc-500">
                                      {new Date(
                                        alert.createdAt,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  {!alert.isRead && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMarkRead(alert._id, true)
                                      }
                                      className="text-[10px] text-zinc-500 hover:text-zinc-300"
                                      title="Mark as read"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {alerts.length > 0 && (
                        <div className="border-t border-zinc-800 px-4 py-2">
                          <Link
                            href="/alerts"
                            onClick={() => setShowNotifications(false)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 text-center block"
                          >
                            View all alerts →
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <Link href="/profile" className="text-zinc-500 hover:text-zinc-300">
                {user.name || user.email}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md border border-zinc-700 px-3 py-1.5 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/demo" className="hover:text-zinc-100">
                Demo
              </Link>
              <Link href="/about" className="hover:text-zinc-100">
                About
              </Link>
              <div className="h-4 w-px bg-zinc-800"></div>
              <Link href="/login" className="hover:text-zinc-100">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-400 px-3 py-1.5 text-zinc-950 font-semibold hover:bg-emerald-300 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

