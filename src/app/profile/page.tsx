"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  _id: string;
  email: string;
  name: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "danger">("profile");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setUser(data.user);
      setProfileForm({
        name: data.user.name || "",
        email: data.user.email || "",
      });
    } catch (err) {
      setError("Could not load profile.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setUser(data.user);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you absolutely sure? This will permanently delete your account and all your data. This action cannot be undone.")) {
      return;
    }

    if (!confirm("This is your last warning. All your transactions, budgets, goals, and other data will be permanently deleted. Continue?")) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      
      // Logout and redirect
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete account",
      });
      setSaving(false);
    }
  };

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Account Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your LEDG account and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "profile"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "password"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Change Password
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("danger")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "danger"
              ? "border-red-400 text-red-400"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Danger Zone
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-emerald-800 bg-emerald-900/20 text-emerald-400"
              : "border-red-800 bg-red-900/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-400 border-r-transparent"></div>
        </div>
      )}

      {!loading && user && (
        <>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Account Information</h3>
                <div className="space-y-2 text-xs text-zinc-400">
                  <p>
                    <span className="text-zinc-500">Account created:</span>{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Last updated:</span>{" "}
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Must be at least 6 characters long
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    required
                    minLength={6}
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <div className="rounded-xl border border-red-800 bg-red-900/20 p-6">
              <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deleteForm.password}
                    onChange={(e) =>
                      setDeleteForm({ ...deleteForm, password: e.target.value })
                    }
                    className="w-full rounded-md border border-red-800 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    required
                    placeholder="Your password"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {saving ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </form>
              <div className="mt-4 p-3 rounded-lg border border-red-800 bg-red-900/30">
                <p className="text-xs text-red-300">
                  <strong>Warning:</strong> This will permanently delete:
                </p>
                <ul className="mt-2 ml-4 list-disc text-xs text-red-300/80 space-y-1">
                  <li>All your transactions</li>
                  <li>All your budgets and goals</li>
                  <li>All your subscriptions and bills</li>
                  <li>All your accounts and alerts</li>
                  <li>All your financial data</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
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

