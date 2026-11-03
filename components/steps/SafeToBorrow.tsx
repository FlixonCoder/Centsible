"use client";

import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Building,
  CheckCircle,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SafeToBorrowProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function SafeToBorrow({ pipeline }: SafeToBorrowProps) {
  const { persona, safeToBorrowResult, goToStep } = pipeline;
  const { safeCapacity, income, committedDues, essentials, safetyBuffer, breakdown, lenderLimitMock } =
    safeToBorrowResult;

  // Affordability gauge calculation (percentage of income available as safe EMI)
  const capacityPct = Math.min(100, Math.round((safeCapacity / income) * 100));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <span>Step 3 of 7</span>
          <span>•</span>
          <span>Affordability Diagnostic</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Safe-to-Borrow Engine
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Credit approval is NOT affordability. Lenders assess risk to their balance sheet; Centsible calculates the exact monthly EMI your real life can endure.
        </p>
      </div>

      {/* Hero Contrast Banner: Approval vs Affordability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Lender Illusion */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-subtle relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 mb-2">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Traditional Lender App
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px]">
              DANGEROUS CEILING
            </span>
          </div>

          <div className="text-xs text-slate-500 mb-1">
            Lender algorithm approved you for:
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
            {formatINR(lenderLimitMock)}
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Lenders only look at gross salary (₹45,000) and ignore food inflation, utility swings, and active BNPLs. Taking this full loan risks an immediate default.
          </p>

          <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Approval ≠ Affordability
          </div>
        </div>

        {/* Right: True Centsible Safe Capacity Ring/Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-navy-950 text-white shadow-xl relative overflow-hidden border border-indigo-500/40">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 mb-2">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Centsible Safe Engine
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
              VERIFIED LIMIT
            </span>
          </div>

          <div className="text-xs text-indigo-200 mb-1">
            True Safe Monthly EMI Capacity:
          </div>
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-2">
            <span>{formatINR(safeCapacity)}</span>
            <span className="text-xs text-indigo-300 font-normal">/ month max</span>
          </div>

          <p className="text-xs text-indigo-200/90 mt-2">
            Guarantees Priya will never be forced to skip essential food, default on committed EMIs, or drain emergency reserves.
          </p>

          <div className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-800/60 border border-indigo-700/60 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            100% budget protected: {capacityPct}% of take-home cash
          </div>
        </div>
      </div>

      {/* Waterfall Breakdown Step-by-Step */}
      <div className="p-6 rounded-2xl bg-white border border-cardborder shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Cash Flow Waterfall Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Every rupee is accounted for before calculating your borrowing margin.
        </p>

        <div className="space-y-2.5">
          {breakdown.map((item, idx) => {
            const isPositive = item.type === "positive";
            const isNegative = item.type === "negative";
            const isResult = item.type === "result";

            return (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-xl flex items-center justify-between border transition-all",
                  isResult
                    ? "bg-indigo-50/80 border-indigo-300 shadow-sm"
                    : isPositive
                    ? "bg-slate-50/80 border-slate-200"
                    : "bg-white border-slate-200/80"
                )}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0",
                      isResult
                        ? "bg-indigo-600 text-white"
                        : isPositive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {isResult ? "=" : isPositive ? "+" : "−"}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "font-mono text-sm font-bold shrink-0 pl-3",
                    isResult
                      ? "text-indigo-700 text-base"
                      : isPositive
                      ? "text-emerald-600"
                      : "text-slate-700"
                  )}
                >
                  {isNegative ? `−${formatINR(Math.abs(item.amount))}` : formatINR(item.amount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Formula Pill */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-xs text-slate-700">
          <span>₹45,000 (Income)</span>
          <span className="text-slate-400 mx-1.5">−</span>
          <span>₹24,500 (Dues)</span>
          <span className="text-slate-400 mx-1.5">−</span>
          <span>₹14,000 (Essentials)</span>
          <span className="text-slate-400 mx-1.5">−</span>
          <span>₹2,000 (Buffer)</span>
          <span className="text-indigo-600 font-bold mx-1.5">=</span>
          <strong className="text-indigo-700 font-extrabold text-sm">₹4,500 / month</strong>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => goToStep(2)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Apply Savings</span>
        </button>

        <button
          onClick={() => goToStep(4)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Compare Loan True Costs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

