"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "subscriptions" | "ai">("dashboard");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="w-full px-8 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl mb-4">
              See{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                AI Finance Manager
              </span>{" "}
              in Action
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Explore our features and see how we can help you manage your finances
              better. No account required to view the demo.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 flex flex-wrap justify-center gap-2 border-b border-zinc-800">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "border-b-2 border-emerald-400 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "transactions"
                  ? "border-b-2 border-emerald-400 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "subscriptions"
                  ? "border-b-2 border-emerald-400 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "ai"
                  ? "border-b-2 border-emerald-400 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              AI Insights
            </button>
          </div>

          {/* Demo Content */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Financial Dashboard</h2>
                  <p className="text-zinc-400 mb-6">
                    Get a comprehensive overview of your financial health at a glance.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-xs text-zinc-500 mb-2">Net Worth</p>
                    <p className="text-2xl font-semibold text-emerald-400">$12,450.00</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-xs text-zinc-500 mb-2">This Month - Income</p>
                    <p className="text-2xl font-semibold text-emerald-400">$3,200.00</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-xs text-zinc-500 mb-2">This Month - Expenses</p>
                    <p className="text-2xl font-semibold text-red-400">-$1,750.00</p>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Spending by Merchant</h3>
                  <div className="space-y-3">
                    {[
                      { merchant: "Amazon", amount: 450, percentage: 100 },
                      { merchant: "Starbucks", amount: 180, percentage: 40 },
                      { merchant: "Netflix", amount: 15, percentage: 3 },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300">{item.merchant}</span>
                          <span className="text-zinc-400">${item.amount.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-orange-800 bg-orange-900/20 p-4">
                  <p className="text-sm font-medium text-orange-400 mb-1">
                    2 unread alerts
                  </p>
                  <p className="text-xs text-orange-300/80">
                    Check for upcoming renewals and unusual spending patterns.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Transaction Management</h2>
                  <p className="text-zinc-400 mb-6">
                    Import, view, search, and manage all your financial transactions in one place.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-zinc-800 text-zinc-400">
                        <tr>
                          <th className="py-2 text-left">Date</th>
                          <th className="py-2 text-left">Merchant</th>
                          <th className="py-2 text-left">Description</th>
                          <th className="py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { date: "2025-01-15", merchant: "Amazon", desc: "Online purchase", amount: -89.99 },
                          { date: "2025-01-14", merchant: "Starbucks", desc: "Coffee", amount: -5.50 },
                          { date: "2025-01-10", merchant: "Salary", desc: "Monthly salary", amount: 3200.00 },
                          { date: "2025-01-08", merchant: "Netflix", desc: "Subscription", amount: -15.99 },
                        ].map((tx, idx) => (
                          <tr key={idx} className="border-b border-zinc-900">
                            <td className="py-2 text-zinc-300">{tx.date}</td>
                            <td className="py-2 text-zinc-300">{tx.merchant}</td>
                            <td className="py-2 text-zinc-400">{tx.desc}</td>
                            <td
                              className={`py-2 text-right font-medium ${
                                tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              ${Math.abs(tx.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="text-sm font-semibold mb-2">CSV Import</h3>
                  <p className="text-xs text-zinc-400 mb-3">
                    Easily import your bank statements by uploading a CSV file.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".csv"
                      className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-1"
                      disabled
                    />
                    <button
                      className="rounded-md bg-zinc-700 px-3 py-1 text-xs text-zinc-300"
                      disabled
                    >
                      Upload CSV
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Smart Subscription Detection</h2>
                  <p className="text-zinc-400 mb-6">
                    Automatically identify and track your recurring payments and subscriptions.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                  <div className="mb-4 flex justify-end">
                    <button
                      className="rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950"
                      disabled
                    >
                      Detect Subscriptions
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-zinc-800 text-zinc-400">
                        <tr>
                          <th className="py-2 text-left">Merchant</th>
                          <th className="py-2 text-left">Amount</th>
                          <th className="py-2 text-left">Billing Cycle</th>
                          <th className="py-2 text-left">Next Renewal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { merchant: "Netflix", amount: 15.99, cycle: "Monthly", renewal: "2025-02-08" },
                          { merchant: "Spotify", amount: 9.99, cycle: "Monthly", renewal: "2025-02-05" },
                          { merchant: "Amazon Prime", amount: 14.99, cycle: "Monthly", renewal: "2025-02-12" },
                        ].map((sub, idx) => (
                          <tr key={idx} className="border-b border-zinc-900">
                            <td className="py-2 font-medium text-zinc-300">{sub.merchant}</td>
                            <td className="py-2 text-zinc-300">${sub.amount.toFixed(2)}</td>
                            <td className="py-2 text-zinc-400 capitalize">{sub.cycle}</td>
                            <td className="py-2 text-zinc-400">{sub.renewal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="text-sm font-semibold mb-2">How It Works</h3>
                  <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                    <li>Upload your transaction history via CSV</li>
                    <li>Our algorithm analyzes patterns in your spending</li>
                    <li>Automatically detects weekly, monthly, and yearly subscriptions</li>
                    <li>Track renewal dates and total subscription spending</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">AI-Powered Insights</h2>
                  <p className="text-zinc-400 mb-6">
                    Get natural language explanations of your spending patterns powered by
                    Google&apos;s Gemini AI.
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                  <div className="mb-4 flex justify-end">
                    <button
                      className="rounded-md bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950"
                      disabled
                    >
                      Explain my spending
                    </button>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="space-y-3 text-sm text-zinc-300">
                      <p>
                        <strong className="text-emerald-400">This month&apos;s spending analysis:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                        <li>
                          You&apos;ve spent <strong className="text-red-400">$450 on Amazon</strong> this
                          month, which is 2x your average. Consider reviewing these purchases.
                        </li>
                        <li>
                          Your <strong className="text-emerald-400">subscription spending</strong> totals
                          $40.97/month. Cancelling one unused service could save you $120/year.
                        </li>
                        <li>
                          <strong className="text-emerald-400">Coffee expenses</strong> at Starbucks
                          ($180/month) could be reduced by 50% with a home setup, saving $1,080/year.
                        </li>
                      </ul>
                      <p className="mt-4 pt-4 border-t border-zinc-800">
                        <strong className="text-emerald-400">Recommendations:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-zinc-400 ml-4">
                        <li>Review Amazon purchases and set a monthly budget limit</li>
                        <li>Consider cancelling Netflix if you&apos;re not using it regularly</li>
                        <li>Invest in a coffee maker to reduce Starbucks spending</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="text-sm font-semibold mb-2">Powered by Google Gemini AI</h3>
                  <p className="text-xs text-zinc-400">
                    Our AI analyzes your transaction data, identifies patterns, and provides
                    actionable insights to help you save money and make better financial decisions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Try It Yourself?</h2>
            <p className="text-zinc-400 mb-6">
              Create a free account and start managing your finances with AI-powered insights.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-400"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

