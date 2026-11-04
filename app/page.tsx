"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Wallet,
  CreditCard,
  ShoppingBag,
  Info,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { CountUp } from "@/components/ui/primitives";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/overview")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !data || !data.profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-slate-200/80 p-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/80" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200/80" />
          <div className="h-72 bg-white rounded-2xl border border-slate-200/80" />
        </div>
      </div>
    );
  }

  const { user, profile, stats, activeEmergency, timeline, cashflowTrend, insights } = data;
  const isGig = user.incomeType === "gig";

  return (
    <div className="space-y-6">
      {/* Active Emergency Banner */}
      {activeEmergency && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[15px] bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    Urgent Due
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Due: {new Date(activeEmergency.due).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#1E1B4B] mt-0.5">
                  {activeEmergency.title} — {formatINR(activeEmergency.amount)}
                </h3>
              </div>
            </div>

            <Link
              href="/decision/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-sm hover:shadow transition-all group shrink-0"
            >
              <span>Evaluate Loan vs Savings</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Card: Safe-to-Borrow Ring & Waterfall */}
      <div className="rounded-3xl border border-[#E8EAF3] bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Main Number & Context */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Affordability Engine</span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Safe-to-Borrow (Monthly EMI Capacity)
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1E1B4B]">
                  {formatINR(profile.safeToBorrow)}
                </span>
                <span className="text-base font-medium text-slate-500">/ month</span>
              </div>
              {isGig ? (
                <p className="text-xs font-semibold text-indigo-600 mt-1">
                  ₹{profile.typicalIncome.toLocaleString("en-IN")} typical month · ₹{profile.weakMonthIncome.toLocaleString("en-IN")} weak-month income basis
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Maximum monthly obligation you can service safely without tapping essential cash reserves.
                </p>
              )}
            </div>

            {/* Quick Action */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/decision/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2B2A6E] to-[#4F46E5] text-white text-xs font-bold hover:shadow-md transition-all group"
              >
                <span>Run Emergency Decision Lab</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                onClick={() => setShowFormula((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>{showFormula ? "Hide Math" : "How is this calculated?"}</span>
              </button>
            </div>
          </div>

          {/* Right Visual Breakdown */}
          <div className="lg:col-span-5 bg-[#F8F9FC] rounded-2xl p-5 border border-[#E8EAF3]/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-200/80 pb-2">
              <span>Cash Flow Breakdown</span>
              <span className="text-[11px] text-slate-400 font-mono">Monthly</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Monthly Income
                </span>
                <span className="font-bold text-[#1E1B4B]">+{formatINR(profile.headlineIncome)}</span>
              </div>

              <div className="flex justify-between items-center text-rose-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Committed Dues (DTI {profile.dtiPercent}%)
                </span>
                <span className="font-bold">−{formatINR(profile.committedDues)}</span>
              </div>

              <div className="flex justify-between items-center text-amber-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Living Essentials (3-mo avg)
                </span>
                <span className="font-bold">−{formatINR(profile.livingExpenses)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Safety Buffer Reserve
                </span>
                <span className="font-bold">−{formatINR(profile.safetyBuffer)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-700 font-bold">
                <span>Safe Monthly Borrow Limit</span>
                <span className="text-sm font-extrabold">{formatINR(profile.safeToBorrow)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Formula Explanation */}
        {showFormula && (
          <div className="mt-6 pt-6 border-t border-slate-200/80 text-xs text-slate-600 bg-indigo-50/40 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <h4 className="font-bold text-[#1E1B4B] mb-1">Safe-to-Borrow Formula</h4>
            <p className="font-mono text-[11px] text-[#2B2A6E] bg-white px-3 py-1.5 rounded-lg border border-indigo-100 inline-block mb-2">
              Safe-to-Borrow = Income ({formatINR(profile.headlineIncome)}) − Dues ({formatINR(profile.committedDues)}) − Living ({formatINR(profile.livingExpenses)}) − Buffer ({formatINR(profile.safetyBuffer)}) = {formatINR(profile.safeToBorrow)}
            </p>
            <p className="text-slate-500">
              Unlike lenders who evaluate your gross salary, Centsible subtracts committed bank debits, non-negotiable essentials, and a safety cushion to protect you from late fees and cash flow crunches.
            </p>
          </div>
        )}
      </div>

      {/* Strip of 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Income */}
        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Take-Home Income</span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B]">
            {formatINR(stats.monthlyIncome)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isGig ? "6-month average" : "Median salary credit"}
          </p>
        </div>

        {/* Stat 2: Committed Dues */}
        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Committed Dues</span>
            <CreditCard className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600">
            {formatINR(stats.committedDues)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            DTI: <span className="font-bold text-slate-700">{stats.dtiPercent}%</span> of take-home
          </p>
        </div>

        {/* Stat 3: Living Expenses */}
        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Living Essentials</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B]">
            {formatINR(stats.livingExpenses)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Food, transit, bills (3-mo avg)
          </p>
        </div>

        {/* Stat 4: Free Cash Buffer */}
        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Safety Buffer</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
            {formatINR(stats.safetyBuffer)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Emergency cash floor
          </p>
        </div>
      </div>

      {/* Main Grid: Cash Flow Trend & Next 30 Days Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6-Month Cash Flow Mini Chart (8 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8EAF3] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1E1B4B]">6-Month Cash Flow History</h3>
              <p className="text-[11.5px] text-slate-500">Income credits versus total debits (May–Oct 2026)</p>
            </div>
            <Link
              href="/cash-flow"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [formatINR(val)]}
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8EAF3", fontSize: "12px" }}
                />
                <Bar dataKey="income" name="Income" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflows" name="Outflows" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-600" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-300" />
              <span>Outflows (Dues + Living)</span>
            </div>
          </div>
        </div>

        {/* Right: Next 30 Days Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8EAF3] p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-[#1E1B4B]">Next 30 Days Schedule</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Nov 2026</span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1">
            {timeline.map((item: any) => {
              const isIncome = item.type === "income";
              const isEmergency = item.type === "emergency";

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                    isEmergency
                      ? "bg-rose-50/70 border-rose-200 text-rose-900"
                      : isIncome
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : "bg-[#F8F9FC] border-slate-200/80 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200/60 shrink-0">
                      {item.date.slice(8, 10)} Nov
                    </span>
                    <span className="font-semibold truncate">{item.title}</span>
                  </div>

                  <span
                    className={`font-bold shrink-0 ml-2 ${
                      isIncome
                        ? "text-emerald-700"
                        : isEmergency
                        ? "text-rose-700 font-extrabold"
                        : "text-slate-900"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatINR(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Synchronized with accounts</span>
            <span className="text-[10.5px] text-emerald-600 font-bold">Auto-tracked ✓</span>
          </div>
        </div>
      </div>

      {/* Insights Feed (Severity-ranked) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-[#1E1B4B]">Financial Safety Insights</h3>
          </div>
          <span className="text-xs text-slate-400">Generated from transaction patterns</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins: any) => (
            <div
              key={ins.id}
              className="bg-white rounded-2xl border border-[#E8EAF3] p-4 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {ins.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1E1B4B] mb-1">{ins.title}</h4>
                <p className="text-[11.5px] text-slate-500 leading-relaxed mb-3">
                  {ins.description}
                </p>
              </div>

              <Link
                href={ins.ctaHref}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>{ins.ctaLabel}</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
