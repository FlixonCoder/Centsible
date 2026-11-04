"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle,
  Tag,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function CashFlowPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");

  // Inline recategorize modal/popup state
  const [editingTxn, setEditingTxn] = useState<any>(null);
  const [newCategory, setNewCategory] = useState("");
  const [applyToSimilar, setApplyToSimilar] = useState(true);

  const fetchTransactions = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category !== "all") params.append("category", category);
    if (month !== "all") params.append("month", month);

    fetch(`/api/transactions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        if (data.categories) setCategories(data.categories);
        if (data.months) setMonths(data.months);
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, [category, month]);

  useEffect(() => {
    fetch("/api/forecast")
      .then((res) => res.json())
      .then((data) => {
        setForecast(data);
        setLoading(false);
      });
  }, []);

  const handleRecategorize = async () => {
    if (!editingTxn || !newCategory) return;

    try {
      await fetch(`/api/transactions/${editingTxn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          applyToSimilar,
        }),
      });

      setEditingTxn(null);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 12-Month Liquidity Forecast Chart */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Forward Forecast
              </span>
              <span className="text-xs text-slate-400">Roll-off aware</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#1E1B4B] mt-1">
              12-Month Projected Savings Balance
            </h2>
            <p className="text-xs text-slate-500">
              Simulates baseline cash growth as committed obligations roll off over the next 12 months.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600" />
              <span>Base Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-200" />
              <span>Weak-Month Band</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {forecast?.months ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F8" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [formatINR(val)]}
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8EAF3", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="baseClosingBalance"
                  name="Base Balance"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBase)"
                />
                <Area
                  type="monotone"
                  dataKey="weakClosingBalance"
                  name="Weak Month Balance"
                  stroke="#A5B4FC"
                  strokeDasharray="4 4"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading forecast projection...
            </div>
          )}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-5 sm:p-7 shadow-xs space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Verified Bank & Card Debits</h3>
            <p className="text-xs text-slate-500">
              {transactions.length} transactions synced from Account Aggregator / Seed sources
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search merchant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="all">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Date</th>
                <th className="pb-3">Merchant / Narration</th>
                <th className="pb-3">Account</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Tag</th>
                <th className="pb-3 pr-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const isIncome = t.category === "income" && t.amount > 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2 font-mono text-slate-500 text-[11px]">
                      {t.date}
                    </td>
                    <td className="py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{t.merchant || t.narration}</span>
                        {t.isRecurring && (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-500">
                      {t.account?.name || "Bank Account"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          setEditingTxn(t);
                          setNewCategory(t.category);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 hover:border-indigo-400 text-[11px] font-medium text-slate-700 bg-white group transition-colors"
                      >
                        <Tag className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                        <span className="capitalize">{t.category.replace(/_/g, " ")}</span>
                      </button>
                    </td>
                    <td className="py-3">
                      {t.userFlag ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {t.userFlag.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td
                      className={`py-3 pr-2 text-right font-bold font-mono text-[13px] ${
                        isIncome ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {isIncome ? "+" : ""}
                      {formatINR(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recategorise Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#1E1B4B]">
              Recategorize Transaction
            </h3>
            <p className="text-xs text-slate-500">
              {editingTxn.merchant || editingTxn.narration} ({formatINR(editingTxn.amount)})
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="food">Food & Delivery</option>
                <option value="transport">Transport & Cabs</option>
                <option value="subscriptions">Subscriptions</option>
                <option value="shopping">Shopping & Misc</option>
                <option value="utilities">Utilities & Bills</option>
                <option value="rent">Rent</option>
                <option value="debt_repayment">Debt Repayment</option>
                <option value="one_off">One-off / Irregular</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={applyToSimilar}
                onChange={(e) => setApplyToSimilar(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Apply to all similar past & future transactions (creates rule)</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingTxn(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRecategorize}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

