"use client";

import { useState } from "react";
import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareOptionsProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function CompareOptions({ pipeline }: CompareOptionsProps) {
  const {
    optionsResult,
    selectedOptionId,
    setSelectedOptionId,
    safeToBorrowResult,
    goToStep,
  } = pipeline;

  const [showMath, setShowMath] = useState(false);
  const safeLimit = safeToBorrowResult.safeCapacity;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <span>Step 4 of 7</span>
          <span>•</span>
          <span>True Cost Comparison</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Comparing True Borrowing Costs for {formatINR(optionsResult.creditNeeded)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Avenues that look cheap or convenient on promotional banners often carry hidden compounding traps or unbearable monthly spikes.
        </p>
      </div>

      {/* 4 Option Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {optionsResult.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isSafe = opt.verdict === "SAFE";

          return (
            <div
              key={opt.id}
              onClick={() => setSelectedOptionId(opt.id)}
              className={cn(
                "rounded-2xl p-4 transition-all duration-200 cursor-pointer relative flex flex-col justify-between border bg-white shadow-subtle hover:shadow-md",
                isSelected
                  ? "border-indigo-600 ring-2 ring-indigo-500/30 shadow-indigo-100"
                  : "border-cardborder hover:border-slate-300",
                opt.isRecommended && "bg-gradient-to-b from-indigo-50/40 via-white to-white"
              )}
            >
              {/* Recommended Top Ribbon */}
              {opt.isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                  Lowest Cost & Safe
                </div>
              )}

              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {opt.title}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {opt.providerType}
                    </div>
                  </div>

                  {/* Verdict Badge */}
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1",
                      isSafe
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    )}
                  >
                    {isSafe ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                    )}
                    {opt.verdict}
                  </span>
                </div>

                {/* Total You'll Repay (The Hero Number) */}
                <div className="my-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                    Total You&apos;ll Repay
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {formatINR(opt.totalRepaid)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Extra cost: <span className="font-semibold text-rose-600">{formatINR(opt.extraCost)}</span>
                  </div>
                </div>

                {/* Key Monthly Metric */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Monthly payment:</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        opt.monthlyPayment > safeLimit ? "text-rose-600" : "text-emerald-700"
                      )}
                    >
                      {formatINR(opt.monthlyPayment)}/mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tenure:</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {opt.tenureMonths} months
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Interest / APR:</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {opt.interestRateAnnual}% p.a.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Risk / Fit Reason */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 leading-tight min-h-[44px]">
                {opt.riskReason}
              </div>

              {/* Select radio pill */}
              <div className="mt-3 pt-1">
                <button
                  type="button"
                  className={cn(
                    "w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selected for Plan</span>
                    </>
                  ) : (
                    <span>Select Option</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Total Cost Horizontal Bar Comparison */}
      <div className="p-5 rounded-2xl bg-white border border-cardborder shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Total Cost of Borrowing Compared
          </h3>
          <span className="text-xs text-slate-500">
            Principal borrowed: <strong className="font-mono text-slate-800">{formatINR(optionsResult.creditNeeded)}</strong>
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {optionsResult.options.map((opt) => {
            const maxCost = optionsResult.worstOption.totalRepaid;
            const widthPct = Math.round((opt.totalRepaid / maxCost) * 100);
            const isBest = opt.id === optionsResult.recommendedOption.id;
            const isWorst = opt.id === optionsResult.worstOption.id;

            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    {opt.title}
                    {isBest && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        BEST
                      </span>
                    )}
                    {isWorst && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        WORST
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(opt.totalRepaid)}
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isWorst ? "bg-rose-500" : isBest ? "bg-indigo-600" : "bg-slate-400"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Savings Highlight Hero Chip */}
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Choosing the <strong>Personal Loan</strong> over paying the <strong>Card Minimum</strong> directly protects you from wasting:
            </span>
          </div>
          <div className="text-base font-extrabold font-mono text-emerald-700 shrink-0 pl-2">
            ≈ {formatINR(optionsResult.savingsVsWorst)} saved
          </div>
        </div>
      </div>

      {/* Show Math / Assumptions Accordion Drawer */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-subtle">
        <button
          onClick={() => setShowMath(!showMath)}
          className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            Show Calculation Math & Assumptions (Pitch Deck Spec)
          </span>
          {showMath ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMath && (
          <div className="p-4 pt-1 border-t border-slate-100 text-xs text-slate-600 space-y-3 bg-slate-50/60 font-mono">
            <div>
              <strong className="text-slate-800">Formula Used:</strong>
              <div className="text-[11px] text-slate-700 mt-0.5">
                Standard EMI = P · r · (1 + r)ⁿ / ((1 + r)ⁿ − 1)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong>Card Minimum (42% APR):</strong> Month-by-month revolving amortization paying ₹2,000/mo. Takes ~35 months, ₹29,900+ in pure interest.
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong>Personal Loan (16% p.a.):</strong> 12 installments of ₹3,630 + 1.5% processing fee (₹600) + 18% GST (₹108) = ₹44,259 total.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => goToStep(3)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Safe-to-Borrow</span>
        </button>

        <button
          onClick={() => goToStep(5)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Run Cash Flow Stress Test</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

