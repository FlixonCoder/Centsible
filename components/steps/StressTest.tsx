"use client";

import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Activity,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface StressTestProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function StressTest({ pipeline }: StressTestProps) {
  const {
    persona,
    incomeDropPercent,
    setIncomeDropPercent,
    stressTestResult,
    selectedOption,
    goToStep,
  } = pipeline;

  const {
    stressedIncome,
    incomeDropAmount,
    monthlyPositionBeforeEmi,
    monthlyPositionWithEmi,
    projections,
    flagBanner,
  } = stressTestResult;

  const isDeficit = monthlyPositionBeforeEmi < 0 || monthlyPositionWithEmi < 0;

  // Chart data formatting
  const chartData = projections.map((p) => ({
    name: p.monthLabel,
    position: p.positionWithEmi,
    beforeEmi: p.positionBeforeEmi,
    isDeficit: p.positionWithEmi < 0,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-2">
          <span>Step 5 of 7</span>
          <span>•</span>
          <span>Income Vulnerability Simulation</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          What happens if your income takes a shock?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Simulating real-world scenarios—delayed salary credits, lost gig contracts, or medical leave—before committing to monthly loan debt.
        </p>
      </div>

      {/* Bold Red Hero Warning Banner (§5 & §6) */}
      <div
        className={cn(
          "p-4 rounded-2xl border flex items-start gap-3.5 transition-all shadow-subtle",
          isDeficit
            ? "bg-rose-50 border-rose-200 text-rose-950"
            : "bg-emerald-50 border-emerald-200 text-emerald-950"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
            isDeficit ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
          )}
        >
          {isDeficit ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <ShieldAlert className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                isDeficit
                  ? "bg-rose-200/80 text-rose-800"
                  : "bg-emerald-200/80 text-emerald-800"
              )}
            >
              {isDeficit ? "RISK DETECTED" : "RESILIENT BUFFER"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              At -{incomeDropPercent}% income drop
            </span>
          </div>

          <h2 className="text-base font-extrabold text-slate-900 mt-1">
            {flagBanner}
          </h2>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            At a <strong>{incomeDropPercent}% income drop</strong>, Priya&apos;s take-home falls from{" "}
            {formatINR(persona.monthlyIncome)} to <strong>{formatINR(stressedIncome)}</strong>. Her committed dues ({formatINR(persona.committedDues)}) and essentials ({formatINR(persona.essentialsAmount)}) create an immediate baseline shortfall of{" "}
            <strong className="text-rose-600 font-mono font-bold">
              {formatINR(monthlyPositionBeforeEmi)}/month BEFORE
            </strong>{" "}
            any new EMI. Adding the loan EMI ({formatINR(selectedOption.monthlyPayment)}/mo) creates a severe{" "}
            <strong className="text-rose-600 font-mono font-bold">
              {formatINR(monthlyPositionWithEmi)}/month
            </strong>{" "}
            monthly hole.
          </p>
        </div>
      </div>

      {/* Interactive Income Drop Slider Card */}
      <div className="p-5 rounded-2xl bg-white border border-cardborder shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Simulate Income Shock (% Reduction)
            </h2>
          </div>
          <span className="font-mono text-sm font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-900 border border-slate-200">
            -{incomeDropPercent}% Drop
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={40}
          step={5}
          value={incomeDropPercent}
          onChange={(e) => setIncomeDropPercent(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
        />

        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>0% (Normal Income: {formatINR(persona.monthlyIncome)})</span>
          <span className="text-rose-600 font-bold">Default Stress: 20% (-{formatINR(incomeDropAmount)})</span>
          <span>40% Severe Shock</span>
        </div>

        {/* 3-Column Numbers Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              Stressed Monthly Income
            </div>
            <div className="text-lg font-bold font-mono text-slate-800">
              {formatINR(stressedIncome)}
            </div>
            <div className="text-[10px] text-slate-500">
              Drop of {formatINR(incomeDropAmount)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="text-[10px] uppercase font-semibold text-rose-700">
              Position BEFORE New EMI
            </div>
            <div className="text-lg font-bold font-mono text-rose-600">
              {formatINR(monthlyPositionBeforeEmi)}
            </div>
            <div className="text-[10px] text-rose-500">
              Dues + essentials exceed income
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-100/60 border border-rose-300">
            <div className="text-[10px] uppercase font-semibold text-rose-800">
              Position WITH Loan EMI
            </div>
            <div className="text-lg font-bold font-mono text-rose-700">
              {formatINR(monthlyPositionWithEmi)}
            </div>
            <div className="text-[10px] text-rose-600">
              Includes {formatINR(selectedOption.monthlyPayment)}/mo EMI
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Projections Bar Chart (Recharts) */}
      <div className="p-5 rounded-2xl bg-white border border-cardborder shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              12-Month Cash Flow Projection with New Loan
            </h2>
            <p className="text-xs text-slate-500">
              Monthly surplus (green) vs monthly deficit (red) over the loan repayment tenure
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Surplus
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Deficit
            </span>
          </div>
        </div>

        {/* Chart area */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: any) => [formatINR(Number(val)), "Monthly Cash Flow"]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
              <Bar dataKey="position" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.position >= 0 ? "#16A34A" : "#DC2626"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 text-center text-xs text-slate-500">
          This vulnerability triggers Step 6: Centsible discovers hidden spending to protect your cash flow.
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => goToStep(4)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Loan Comparison</span>
        </button>

        <button
          onClick={() => goToStep(6)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Find Ways to Fix This (Mitigation Layer)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

