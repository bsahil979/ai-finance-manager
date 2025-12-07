"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Goal {
  _id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  status: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    deadline: "",
    category: "other" as string,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load goals");
      setGoals(data.goals || []);
    } catch (err) {
      console.error(err);
      setError("Could not load goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? "/api/goals" : "/api/goals";
      const body = editingId
        ? { id: editingId, ...formData, targetAmount: Number(formData.targetAmount) }
        : { ...formData, targetAmount: Number(formData.targetAmount) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save goal");

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "", targetAmount: "", deadline: "", category: "other" });
      await loadGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to save goal");
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal._id);
    setFormData({
      name: goal.name,
      description: goal.description || "",
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
      category: goal.category,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to delete goal");
    }
  };

  const handleUpdateProgress = async (id: string, newAmount: number) => {
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, currentAmount: newAmount }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      await loadGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to update progress");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-400 bg-emerald-900/20 border-emerald-800";
      case "paused":
        return "text-orange-400 bg-orange-900/20 border-orange-800";
      case "cancelled":
        return "text-red-400 bg-red-900/20 border-red-800";
      default:
        return "text-sky-400 bg-sky-900/20 border-sky-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      emergency: "🛡️",
      vacation: "✈️",
      car: "🚗",
      house: "🏠",
      education: "📚",
      other: "🎯",
    };
    return icons[category] || "🎯";
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financial Goals</h1>
          <p className="mt-2 text-zinc-400">
            Set and track your savings goals to achieve your financial dreams.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: "", description: "", targetAmount: "", deadline: "", category: "other" });
          }}
          className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
        >
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="emergency">🛡️ Emergency Fund</option>
                  <option value="vacation">✈️ Vacation</option>
                  <option value="car">🚗 Car</option>
                  <option value="house">🏠 House</option>
                  <option value="education">📚 Education</option>
                  <option value="other">🎯 Other</option>
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
                placeholder="Add a description for this goal..."
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                  min="0.01"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
            >
              {editingId ? "Update Goal" : "Create Goal"}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-zinc-400">Loading goals...</p>}

      {!loading && goals.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            No goals set yet. Create your first financial goal to start tracking your progress!
          </p>
        </div>
      )}

      {!loading && goals.length > 0 && (
        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
            const remaining = goal.targetAmount - goal.currentAmount;
            const isCompleted = goal.status === "completed" || percentage >= 100;

            return (
              <div
                key={goal._id}
                className={`rounded-lg border p-6 ${getStatusColor(goal.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                      <h3 className="text-lg font-semibold">{goal.name}</h3>
                      <span className="inline-flex items-center rounded-full bg-zinc-800/50 px-2 py-0.5 text-xs font-medium">
                        {goal.category}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-zinc-400 mb-2">{goal.description}</p>
                    )}
                    {goal.deadline && (
                      <p className="text-xs text-zinc-500">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(goal)}
                      className="text-xs text-zinc-400 hover:text-zinc-300 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(goal._id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-300">
                      {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                    </span>
                    <span className="font-semibold">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-800/50 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isCompleted
                          ? "bg-emerald-400"
                          : percentage >= 75
                            ? "bg-sky-400"
                            : "bg-emerald-400"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-zinc-500">
                      {isCompleted
                        ? "🎉 Goal Completed!"
                        : remaining > 0
                          ? `${formatCurrency(remaining)} remaining`
                          : "Goal reached!"}
                    </span>
                  </div>
                </div>

                {!isCompleted && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={goal.targetAmount}
                      placeholder="Add amount"
                      className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget;
                          const amount = parseFloat(input.value);
                          if (!isNaN(amount) && amount >= 0) {
                            handleUpdateProgress(goal._id, goal.currentAmount + amount);
                            input.value = "";
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const amount = parseFloat(input.value);
                        if (!isNaN(amount) && amount >= 0) {
                          handleUpdateProgress(goal._id, goal.currentAmount + amount);
                          input.value = "";
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-300"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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


