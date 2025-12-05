"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  _id: string;
  email: string;
  name: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

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
            AI Finance
          </span>{" "}
          Manager
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
              <Link href="/alerts" className="hover:text-zinc-100">
                Alerts
              </Link>
              <div className="h-4 w-px bg-zinc-800"></div>
              <span className="text-zinc-500">{user.name || user.email}</span>
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

