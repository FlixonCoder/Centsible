"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";

export default function DedicatedStressTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stress parameters
  const [incomeDropPercent, setIncomeDropPercent] = useState(20);
  const [scenario, setScenario] = useState<"income_drop" | "job_gap" | "surprise_expense">("income_drop");
  const [withPlan, setWithPlan] = useState(true);
  const [testEmi, setTestEmi] = useState(3630);

  const fetchStressData = async () => {
    try {
      const res = await fetch("/api/decision/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomeDropPercent,
          scenario,
          activeMitigationIds: withPlan
            ? ["cut_food_delivery", "cut_cab_rides", "pause_subscriptions", "cap_impulse_shopping"]
            : [],
        }),
      });
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStressData();
  }, [incomeDropPercent, scenario, withPlan, testEmi]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-slate-200" />
        <div className="h-96 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const { profile, stressResult, mitigation } = data;
  const isResilient = withPlan ? stressResult.passesWithPlan : stressResult.passesWithoutPlan;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2B2A6E] to-[#4F46E5] text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5 text-cyan-300" />
            <span>Dedicated Stress Testing Lab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Income Shock & Scenario Resilience
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl">
            Stress-test obligations against sudden salary cuts, job gaps, and unexpected expenses before taking on new debt.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
          <div>
            <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
              Resilience Status
            </p>
            <p className="text-xl font-extrabold mt-0.5">
              {isResilient ? (
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5" />
                  Passes Shock
                </span>
              ) : (
                <span className="text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5" />
                  Critical Deficit
                </span>
              )}
            </p>
            <p className="text-[10.5px] text-indigo-100/70">
              {withPlan ? "With ₹3,283/mo savings plan active" : "Without savings plan"}
            </p>
          </div>
        </div>
      </div>

      {/* Flagged Headline Alert */}
      <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-2">
        <div className="flex items-center gap-2 font-extrabold text-sm text-rose-700">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>Flagged BEFORE she borrows: Month 1 Deficit</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-700">
          At a <strong>−{incomeDropPercent}% income drop</strong>, take-home drops from {formatINR(profile.headlineIncome)} to <strong className="font-mono text-rose-700">{formatINR(stressResult.stressedIncome)}</strong>. Before adding any new loan EMI, committed dues ({formatINR(profile.committedDues)}) and essentials ({formatINR(profile.livingExpenses)}) already exceed income by <strong className="font-mono text-rose-700">{formatINR(stressResult.month1BeforeEmi)}</strong>. Adding the ₹3,630 EMI widens the Month 1 deficit to <strong className="font-mono text-rose-700">{formatINR(stressResult.month1WithEmi)}</strong>.
        </p>
      </div>

      {/* Interactive Controls Card */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-7 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-[#1E1B4B]">Stress Testing Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider: Income Drop */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Income Drop Simulation</span>
              <span className="font-mono font-bold text-rose-600 text-sm">−{incomeDropPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={incomeDropPercent}
              onChange={(e) => setIncomeDropPercent(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Normal)</span>
              <span>20% (Standard)</span>
              <span>40% (Extreme)</span>
            </div>
          </div>

          {/* Scenario Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Shock Scenario</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="income_drop">Standard Income Drop (−{incomeDropPercent}%)</option>
              <option value="job_gap">1-Month Job Gap (₹0 pay in Month 1)</option>
              <option value="surprise_expense">Surprise Expense (+₹10,000 in Month 2)</option>
            </select>
          </div>

          {/* Mitigation Plan Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Mitigation Layer</label>
            <button
              onClick={() => setWithPlan((v) => !v)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-bold flex items-center justify-between transition-all ${
                withPlan
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              <span>{withPlan ? "Plan Active (+₹3,283/mo)" : "No Plan Applied"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white font-semibold">
                {withPlan ? "On" : "Off"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 12-Month Surplus/Deficit Chart */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">
              12-Month Net Cash Position with Dues Roll-Off
            </h3>
            <p className="text-xs text-slate-500">
              Notice how the red deficit bars vanish after Month 3 as BNPL and phone EMIs roll off.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              Surplus
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-3 h-3 rounded bg-rose-500" />
              Deficit
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stressResult.projections}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F8" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                formatter={(val: number) => [formatINR(val), "Net Cash Position"]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  border: "1px solid #E8EAF3",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine y={0} stroke="#94A3B8" />
              <Bar
                dataKey={withPlan ? "positionWithPlan" : "positionWithEmi"}
                radius={[4, 4, 4, 4]}
              >
                {stressResult.projections.map((entry: any, index: number) => {
                  const val = withPlan ? entry.positionWithPlan : entry.positionWithEmi;
                  return <Cell key={`cell-${index}`} fill={val < 0 ? "#EF4444" : "#10B981"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress Metrics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
            Month 1 Gap (Pre-EMI)
          </span>
          <span className="text-xl font-extrabold font-mono text-rose-600">
            {formatINR(stressResult.month1BeforeEmi)}
          </span>
          <p className="text-[10.5px] text-slate-500 mt-1">Existing bills breach income</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
            Month 1 Gap (With EMI)
          </span>
          <span className="text-xl font-extrabold font-mono text-rose-600">
            {formatINR(stressResult.month1WithEmi)}
          </span>
          <p className="text-[10.5px] text-slate-500 mt-1">With ₹3,630/mo loan EMI</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
            Peak Cumulative Gap
          </span>
          <span className="text-xl font-extrabold font-mono text-amber-600">
            {formatINR(withPlan ? stressResult.peakCumulativeShortfallWithPlan : stressResult.peakCumulativeShortfall)}
          </span>
          <p className="text-[10.5px] text-slate-500 mt-1">Max cumulative cash needed</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAF3] p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
            Safety Cushion
          </span>
          <span className="text-xl font-extrabold font-mono text-emerald-600">
            {formatINR(stressResult.cushion)}
          </span>
          <p className="text-[10.5px] text-slate-500 mt-1">Buffer + remaining savings</p>
        </div>
      </div>
    </div>
  );
}

