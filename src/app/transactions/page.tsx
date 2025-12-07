"use client";

import { useEffect, useState } from "react";

type Transaction = {
  _id: string;
  date?: string;
  amount?: number;
  merchant?: string;
  rawDescription?: string;
  category?: string;
  accountId?: string;
};

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<"transactions" | "recurring">("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [smsUpiText, setSmsUpiText] = useState("");
  const [parsingSms, setParsingSms] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [showSmsParser, setShowSmsParser] = useState(false);
  const [parseAccountId, setParseAccountId] = useState<string>("");
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [bulkSmsText, setBulkSmsText] = useState("");
  const [parsingBulk, setParsingBulk] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<{ min?: string; max?: string }>({});
  const [merchantFilter, setMerchantFilter] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [, setSavedFilters] = useState<Array<{ name: string; filters: Record<string, string> }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [merchants, setMerchants] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Array<{ _id: string; name: string }>>([]);
  const [accountFilter, setAccountFilter] = useState<string>("");

  // Recurring transactions state
  const [recurringTransactions, setRecurringTransactions] = useState<Array<{
    _id: string;
    name: string;
    description?: string;
    amount: number;
    type: "income" | "expense";
    category?: string;
    merchant?: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    nextOccurrence: string;
    isActive: boolean;
  }>>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [detectingRecurring, setDetectingRecurring] = useState(false);
  const [recurringFormData, setRecurringFormData] = useState({
    name: "",
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    merchant: "",
    frequency: "monthly",
    startDate: "",
    endDate: "",
  });
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter) params.append("category", categoryFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (amountFilter.min) params.append("minAmount", amountFilter.min);
      if (amountFilter.max) params.append("maxAmount", amountFilter.max);
      if (dateFilter.start) params.append("startDate", dateFilter.start);
      if (dateFilter.end) params.append("endDate", dateFilter.end);
      if (merchantFilter) params.append("merchant", merchantFilter);
      if (accountFilter) params.append("accountId", accountFilter);
      params.append("limit", "1000");

      const res = await fetch(`/api/transactions?${params.toString()}`);
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

  // Extract unique categories and merchants
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(
        transactions
          .map((tx) => tx.category)
          .filter((cat): cat is string => Boolean(cat)),
      ),
    ).sort();
    setCategories(uniqueCategories);

    const uniqueMerchants = Array.from(
      new Set(
        transactions
          .map((tx) => tx.merchant)
          .filter((m): m is string => Boolean(m)),
      ),
    ).sort();
    setMerchants(uniqueMerchants);
  }, [transactions]);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("transactionFilters");
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved filters", e);
      }
    }
  }, []);

  // Load accounts
  useEffect(() => {
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
    loadAccounts();
  }, []);

  // Initial load
  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload transactions when filters change (with debounce for search)
  useEffect(() => {
    // Skip initial render
    if (transactions.length === 0) return;

    const timeoutId = setTimeout(() => {
      loadTransactions();
    }, searchQuery ? 300 : 0); // Debounce search, immediate for other filters

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateFilter, categoryFilter, typeFilter, amountFilter, merchantFilter, accountFilter]);

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
      // Auto-detect recurring transactions after CSV import
      if (activeTab === "recurring") {
        fetch("/api/recurring-transactions/detect", { method: "POST" })
          .then(() => {
            loadRecurringTransactions();
          })
          .catch((err) => {
            console.error("Error auto-detecting recurring transactions:", err);
          });
      }
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
      category: tx.category || "",
    });
  };

  const handleSuggestCategory = async (tx: Transaction) => {
    try {
      const res = await fetch("/api/ai/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: tx.merchant,
          description: tx.rawDescription,
          amount: tx.amount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setEditForm({ ...editForm, category: data.category });
      }
    } catch (err) {
      console.error("Failed to suggest category", err);
    }
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

  // Recurring transactions handlers
  const loadRecurringTransactions = async () => {
    try {
      setRecurringLoading(true);
      setRecurringError(null);
      const res = await fetch("/api/recurring-transactions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load recurring transactions");
      setRecurringTransactions(data.recurringTransactions || []);
    } catch (err) {
      console.error(err);
      setRecurringError("Could not load recurring transactions.");
    } finally {
      setRecurringLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "recurring") {
      loadRecurringTransactions();
      // Auto-detect recurring transactions when switching to this tab
      // Only if there are transactions but no recurring transactions yet
      if (transactions.length > 0 && recurringTransactions.length === 0) {
        fetch("/api/recurring-transactions/detect", { method: "POST" })
          .then(() => {
            loadRecurringTransactions();
          })
          .catch((err) => {
            console.error("Error auto-detecting recurring transactions:", err);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingRecurringId ? "PATCH" : "POST";
      const body = editingRecurringId
        ? {
            id: editingRecurringId,
            ...recurringFormData,
            amount: Number(recurringFormData.amount),
            endDate: recurringFormData.endDate || null,
          }
        : {
            ...recurringFormData,
            amount: Number(recurringFormData.amount),
            endDate: recurringFormData.endDate || null,
          };

      const res = await fetch("/api/recurring-transactions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save recurring transaction");

      setShowRecurringForm(false);
      setEditingRecurringId(null);
      setRecurringFormData({
        name: "",
        description: "",
        amount: "",
        type: "expense",
        category: "",
        merchant: "",
        frequency: "monthly",
        startDate: "",
        endDate: "",
      });
      await loadRecurringTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to save recurring transaction");
    }
  };

  const handleRecurringDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;

    try {
      const res = await fetch(`/api/recurring-transactions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadRecurringTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete recurring transaction");
    }
  };

  const handleRecurringToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/recurring-transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await loadRecurringTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <main className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="mt-2 text-zinc-400">
            Manage your transactions and recurring income/expenses.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "transactions"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recurring")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "recurring"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Recurring Transactions
          </button>
        </div>

        {/* Transactions Tab Content */}
        {activeTab === "transactions" && (
          <>
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

            {/* SMS/UPI Parser Section */}
            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-200">
                    📱 Parse SMS/UPI Notifications
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Automatically detect and parse SMS alerts or UPI notifications (GPay/PhonePe/Paytm)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSmsParser(!showSmsParser);
                    setSmsUpiText("");
                    setParseMessage(null);
                    setParseAccountId("");
                    setBulkSmsText("");
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  {showSmsParser ? "Hide" : "Show"}
                </button>
              </div>

              {showSmsParser && (
                <div className="space-y-3">
                  {/* Auto-detect Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-md bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoDetect"
                        checked={autoDetectEnabled}
                        onChange={(e) => setAutoDetectEnabled(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-800"
                      />
                      <label htmlFor="autoDetect" className="text-xs text-zinc-300 cursor-pointer">
                        ✨ Auto-detect & parse SMS/UPI (paste to auto-parse)
                      </label>
                    </div>
                    {autoDetectEnabled && (
                      <span className="text-xs text-emerald-400 animate-pulse">
                        Auto-detect ON
                      </span>
                    )}
                  </div>

                  {/* Single SMS/UPI Parser */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Single SMS/UPI Notification
                    </label>
                    <textarea
                      value={smsUpiText}
                      onChange={(e) => {
                        setSmsUpiText(e.target.value);
                      }}
                      onPaste={async (e) => {
                        // Handle paste event with auto-detection
                        const pastedText = e.clipboardData.getData("text");
                        if (autoDetectEnabled && pastedText.trim().length > 10) {
                          // Check if pasted text looks like SMS/UPI
                          const looksLikeSms = /₹|INR|RS\.?|CREDITED|DEBITED|PAID|RECEIVED|UPI|GPay|PhonePe|Paytm|BAL|BALANCE/i.test(pastedText) &&
                            (pastedText.includes("₹") || pastedText.match(/\d+\.?\d*\s*(CREDITED|DEBITED|PAID|RECEIVED)/i));
                          
                          if (looksLikeSms) {
                            e.preventDefault();
                            setSmsUpiText(pastedText);
                            setParseMessage("🔄 Auto-detecting SMS/UPI format...");
                            
                            // Auto-parse after paste
                            setTimeout(async () => {
                              try {
                                setParsingSms(true);
                                const res = await fetch("/api/transactions/parse", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    text: pastedText.trim(),
                                    accountId: parseAccountId || undefined,
                                  }),
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  setParseMessage(
                                    `✅ Auto-detected and parsed! Transaction created: ₹${Math.abs(data.parsed.amount).toFixed(2)} (${data.parsed.type})`,
                                  );
                                  setSmsUpiText("");
                                  await loadTransactions();
                                } else {
                                  setParseMessage("Could not auto-parse. Click 'Parse & Create' to try manually.");
                                }
                              } catch {
                                setParseMessage("Auto-parse failed. Click 'Parse & Create' to try manually.");
                              } finally {
                                setParsingSms(false);
                              }
                            }, 300);
                            return;
                          }
                        }
                        // If not auto-detected, allow normal paste
                      }}
                      onBlur={async () => {
                        // Auto-detect when user leaves the field (if auto-detect is enabled)
                        if (autoDetectEnabled && smsUpiText.trim().length > 10) {
                          const looksLikeSms = /₹|INR|RS\.?|CREDITED|DEBITED|PAID|RECEIVED|UPI|GPay|PhonePe|Paytm|BAL|BALANCE/i.test(smsUpiText) &&
                            (smsUpiText.includes("₹") || smsUpiText.match(/\d+\.?\d*\s*(CREDITED|DEBITED|PAID|RECEIVED)/i));
                          
                          if (looksLikeSms && !parsingSms) {
                            try {
                              setParsingSms(true);
                              setParseMessage("🔄 Auto-detecting...");
                              const res = await fetch("/api/transactions/parse", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  text: smsUpiText.trim(),
                                  accountId: parseAccountId || undefined,
                                }),
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                setParseMessage(
                                  `✅ Auto-detected! Transaction created: ₹${Math.abs(data.parsed.amount).toFixed(2)} (${data.parsed.type})`,
                                );
                                setSmsUpiText("");
                                await loadTransactions();
                              }
                            } catch {
                              // Silent fail for auto-detect on blur
                            } finally {
                              setParsingSms(false);
                            }
                          }
                        }
                      }}
                      placeholder="Paste SMS/UPI notification here (auto-detects)...&#10;&#10;Example:&#10;₹800.00 debited from A/C **1234 on 15-Jan-2025. UPI:123456789012. Bal: ₹50,000.00&#10;&#10;Or:&#10;You received ₹5000.00 from John Doe via GPay on 20/01/2025"
                      rows={6}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={parseAccountId}
                      onChange={(e) => setParseAccountId(e.target.value)}
                      className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                    >
                      <option value="">No account (optional)</option>
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!smsUpiText.trim()) {
                          setParseMessage("Please paste SMS/UPI text first");
                          return;
                        }

                        setParsingSms(true);
                        setParseMessage(null);

                        try {
                          const res = await fetch("/api/transactions/parse", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              text: smsUpiText,
                              accountId: parseAccountId || undefined,
                            }),
                          });

                          const data = await res.json();

                          if (!res.ok) {
                            throw new Error(data.error || "Failed to parse");
                          }

                          setParseMessage(
                            `✅ Transaction created! Amount: ₹${Math.abs(data.parsed.amount).toFixed(2)} (${data.parsed.type})`,
                          );
                          setSmsUpiText("");
                          await loadTransactions();
                          // Auto-detect recurring transactions after SMS/UPI parse
                          if (activeTab === "recurring") {
                            fetch("/api/recurring-transactions/detect", { method: "POST" })
                              .then(() => {
                                loadRecurringTransactions();
                              })
                              .catch((err) => {
                                console.error("Error auto-detecting recurring transactions:", err);
                              });
                          }
                        } catch (err) {
                          console.error(err);
                          setParseMessage(
                            err instanceof Error
                              ? err.message
                              : "Failed to parse SMS/UPI. Please check the format.",
                          );
                        } finally {
                          setParsingSms(false);
                        }
                      }}
                      disabled={parsingSms || !smsUpiText.trim()}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {parsingSms ? "Parsing..." : "Parse & Create"}
                    </button>
                  </div>
                  {parseMessage && (
                    <p
                      className={`text-xs ${
                        parseMessage.startsWith("✅")
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {parseMessage}
                    </p>
                  )}

                  {/* Bulk SMS/UPI Parser */}
                  <div className="border-t border-zinc-800 pt-3 mt-3">
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Bulk SMS/UPI Notifications (One per line)
                    </label>
                    <textarea
                      value={bulkSmsText}
                      onChange={(e) => setBulkSmsText(e.target.value)}
                      placeholder="Paste multiple SMS/UPI notifications here (one per line)...&#10;&#10;Example:&#10;₹800.00 debited from A/C **1234 on 15-Jan-2025&#10;₹5000.00 credited to your account on 16-Jan-2025&#10;You paid ₹500 to Merchant via GPay on 17/01/2025"
                      rows={8}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none resize-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!bulkSmsText.trim()) {
                          setParseMessage("Please paste SMS/UPI text first");
                          return;
                        }

                        setParsingBulk(true);
                        setParseMessage(null);

                        try {
                          const lines = bulkSmsText
                            .split("\n")
                            .map((l) => l.trim())
                            .filter((l) => l.length > 0);

                          const res = await fetch("/api/transactions/parse-bulk", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              texts: lines,
                              accountId: parseAccountId || undefined,
                            }),
                          });

                          const data = await res.json();

                          if (!res.ok) {
                            throw new Error(data.error || "Failed to parse");
                          }

                          setParseMessage(
                            `✅ Parsed ${data.parsed} transaction${data.parsed !== 1 ? "s" : ""}${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
                          );
                          setBulkSmsText("");
                          await loadTransactions();
                        } catch (err) {
                          console.error(err);
                          setParseMessage("Failed to parse bulk SMS/UPI messages.");
                        } finally {
                          setParsingBulk(false);
                        }
                      }}
                      disabled={parsingBulk || !bulkSmsText.trim()}
                      className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {parsingBulk ? "Parsing..." : "Parse All"}
                    </button>
                  </div>

                  <div className="text-xs text-zinc-500 space-y-1">
                    <p className="font-medium text-zinc-400">Supported formats:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Bank SMS: &quot;₹800 debited from A/C...&quot;</li>
                      <li>UPI: &quot;You paid ₹500 to Merchant Name via GPay&quot;</li>
                      <li>Credit: &quot;₹5000 credited to your account&quot;</li>
                      <li>PhonePe/GPay/Paytm notifications</li>
                    </ul>
                    <p className="mt-2 text-zinc-600">
                      💡 Tip: Enable auto-detect and just paste SMS/UPI text - it will automatically parse!
                    </p>
                  </div>
                </div>
              )}
            </div>

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
              <>
                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            {/* Quick Filter Presets */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  setDateFilter({
                    start: startOfMonth.toISOString().split("T")[0],
                    end: today.toISOString().split("T")[0],
                  });
                  setTypeFilter("");
                  setCategoryFilter("");
                  setAmountFilter({});
                }}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today);
                  lastWeek.setDate(lastWeek.getDate() - 7);
                  setDateFilter({
                    start: lastWeek.toISOString().split("T")[0],
                    end: today.toISOString().split("T")[0],
                  });
                }}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today);
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setDateFilter({
                    start: lastMonth.toISOString().split("T")[0],
                    end: today.toISOString().split("T")[0],
                  });
                }}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("income")}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Income Only
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("expense")}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Expenses Only
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter({});
                  setCategoryFilter("");
                  setTypeFilter("");
                  setAmountFilter({});
                  setMerchantFilter("");
                }}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Clear All
              </button>
            </div>

            {/* Basic Filters */}
            <div className="mb-4 grid gap-4 sm:grid-cols-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search merchant, description..."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Account
                </label>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Merchant
                </label>
                <select
                  value={merchantFilter}
                  onChange={(e) => setMerchantFilter(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                >
                  <option value="">All Merchants</option>
                  {merchants.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="mb-4 flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            </button>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mb-4 grid gap-4 sm:grid-cols-3 border-t border-zinc-800 pt-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Min Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountFilter.min || ""}
                    onChange={(e) =>
                      setAmountFilter({ ...amountFilter, min: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Max Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountFilter.max || ""}
                    onChange={(e) =>
                      setAmountFilter({ ...amountFilter, max: e.target.value })
                    }
                    placeholder="No limit"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
            )}

            {/* Filter Summary */}
            {(searchQuery || dateFilter.start || dateFilter.end || categoryFilter || typeFilter || amountFilter.min || amountFilter.max || merchantFilter) && (
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter({});
                    setCategoryFilter("");
                    setTypeFilter("");
                    setAmountFilter({});
                    setMerchantFilter("");
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

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
                    <th className="py-2">Account</th>
                    <th className="py-2">Merchant</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Category</th>
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
                            <div className="flex gap-1">
                              <input
                                type="text"
                                list="categories"
                                value={editForm.category || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, category: e.target.value })
                                }
                                placeholder="Category"
                                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
                              />
                              <datalist id="categories">
                                <option value="Food & Dining" />
                                <option value="Groceries" />
                                <option value="Shopping" />
                                <option value="Transportation" />
                                <option value="Bills & Utilities" />
                                <option value="Entertainment" />
                                <option value="Healthcare" />
                                <option value="Travel" />
                                <option value="Subscriptions" />
                                <option value="Gas & Fuel" />
                                <option value="Income" />
                                <option value="Other" />
                              </datalist>
                              <button
                                type="button"
                                onClick={() => handleSuggestCategory(tx)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 px-2"
                                title="Suggest category"
                              >
                                ✨
                              </button>
                            </div>
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
                          <td className="py-2 text-zinc-400 text-xs">
                            {tx.accountId
                              ? accounts.find((a) => a._id === tx.accountId)?.name || "-"
                              : "-"}
                          </td>
                          <td className="py-2">{tx.merchant || "-"}</td>
                          <td className="py-2 text-zinc-400">
                            {tx.rawDescription || "-"}
                          </td>
                          <td className="py-2">
                            {tx.category ? (
                              <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                                {tx.category}
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-xs">-</span>
                            )}
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${
                              typeof tx.amount === "number" && tx.amount >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {typeof tx.amount === "number"
                              ? `₹${Math.abs(tx.amount).toFixed(2)}`
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
          </>
            )}
          </>
        )}

        {/* Recurring Transactions Tab Content */}
        {activeTab === "recurring" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recurring Transactions</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Automatically detect or manually add recurring income and expenses.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setDetectingRecurring(true);
                    setRecurringError(null);
                    try {
                      const res = await fetch("/api/recurring-transactions/detect", {
                        method: "POST",
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Failed to detect recurring transactions");
                      
                      await loadRecurringTransactions();
                      
                      if (data.saved > 0) {
                        alert(`Detected and saved ${data.saved} recurring transaction${data.saved !== 1 ? "s" : ""}!`);
                      } else {
                        alert("No new recurring transactions detected. You can add them manually.");
                      }
                    } catch (err) {
                      console.error(err);
                      setRecurringError("Could not detect recurring transactions. Make sure you have imported transactions.");
                    } finally {
                      setDetectingRecurring(false);
                    }
                  }}
                  disabled={detectingRecurring}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-sm hover:bg-zinc-600 disabled:opacity-60"
                >
                  {detectingRecurring ? "Detecting..." : "🔍 Detect Automatically"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecurringForm(!showRecurringForm);
                    setEditingRecurringId(null);
                    setRecurringFormData({
                      name: "",
                      description: "",
                      amount: "",
                      type: "expense",
                      category: "",
                      merchant: "",
                      frequency: "monthly",
                      startDate: "",
                      endDate: "",
                    });
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                >
                  {showRecurringForm ? "Cancel" : "+ Add Manually"}
                </button>
              </div>
            </div>

            {showRecurringForm && (
              <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <form onSubmit={handleRecurringSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={recurringFormData.name}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                        required
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                        placeholder="e.g., Salary, Netflix Subscription"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Type *
                      </label>
                      <select
                        value={recurringFormData.type}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, type: e.target.value as "income" | "expense" })}
                        required
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={recurringFormData.description}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, description: e.target.value })}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      placeholder="Optional description..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={recurringFormData.amount}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                        required
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Frequency *
                      </label>
                      <select
                        value={recurringFormData.frequency}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: e.target.value })}
                        required
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={recurringFormData.category}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, category: e.target.value })}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Merchant
                      </label>
                      <input
                        type="text"
                        value={recurringFormData.merchant}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, merchant: e.target.value })}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={recurringFormData.startDate}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                        required
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={recurringFormData.endDate}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-300"
                  >
                    {editingRecurringId ? "Update" : "Create"} Recurring Transaction
                  </button>
                </form>
              </div>
            )}

            {recurringError && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                {recurringError}
              </div>
            )}

            {!recurringLoading && recurringTransactions.length === 0 && (
              <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
                <p className="text-zinc-400 mb-3">
                  No recurring transactions found yet.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setDetectingRecurring(true);
                      setRecurringError(null);
                      try {
                        const res = await fetch("/api/recurring-transactions/detect", {
                          method: "POST",
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to detect");
                        await loadRecurringTransactions();
                        if (data.saved > 0) {
                          alert(`Detected ${data.saved} recurring transaction${data.saved !== 1 ? "s" : ""}!`);
                        }
                      } catch (err) {
                        console.error(err);
                        setRecurringError("Could not detect recurring transactions.");
                      } finally {
                        setDetectingRecurring(false);
                      }
                    }}
                    disabled={detectingRecurring}
                    className="inline-flex items-center justify-center rounded-md bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-sm hover:bg-zinc-600 disabled:opacity-60"
                  >
                    {detectingRecurring ? "Detecting..." : "Detect from Transactions"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRecurringForm(true)}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
                  >
                    Add Manually
                  </button>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Make sure you have imported transactions first to use automatic detection.
                </p>
              </div>
            )}

            {recurringLoading && <p className="text-sm text-zinc-400">Loading recurring transactions...</p>}


            {!recurringLoading && recurringTransactions.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">Frequency</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">Next Occurrence</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-300">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringTransactions.map((rt) => (
                      <tr key={rt._id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-zinc-200">{rt.name}</p>
                            {rt.description && (
                              <p className="text-xs text-zinc-500">{rt.description}</p>
                            )}
                            {rt.merchant && (
                              <p className="text-xs text-zinc-500">Merchant: {rt.merchant}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              rt.type === "income"
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {rt.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${
                              rt.type === "income" ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {rt.type === "expense" ? "-" : "+"}
                            {formatCurrency(Math.abs(rt.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-zinc-300">{rt.frequency}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {new Date(rt.nextOccurrence).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              rt.isActive
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {rt.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRecurringToggleActive(rt._id, rt.isActive)}
                              className="text-xs text-zinc-400 hover:text-zinc-300"
                            >
                              {rt.isActive ? "Pause" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecurringId(rt._id);
                                setRecurringFormData({
                                  name: rt.name,
                                  description: rt.description || "",
                                  amount: rt.amount.toString(),
                                  type: rt.type,
                                  category: rt.category || "",
                                  merchant: rt.merchant || "",
                                  frequency: rt.frequency,
                                  startDate: rt.startDate ? new Date(rt.startDate).toISOString().split("T")[0] : "",
                                  endDate: rt.endDate ? new Date(rt.endDate).toISOString().split("T")[0] : "",
                                });
                                setShowRecurringForm(true);
                              }}
                              className="text-xs text-zinc-400 hover:text-zinc-300"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecurringDelete(rt._id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
    </main>
  );
}
