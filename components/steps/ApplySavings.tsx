"use client";

import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { ArrowLeft, ArrowRight, PiggyBank, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplySavingsProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function ApplySavings({ pipeline }: PipelinePanelContextProps) {
  const {
    persona,
    savingsApplied,
    setSavingsApplied,
    creditNeeded,
    goToStep,
  } = pipeline;

  const totalBill = persona.emergencyAmount;
  const maxSavingsAvailable = Math.min(persona.savingsAvailable, totalBill);
  const savingsPct = Math.round((savingsApplied / totalBill) * 100);
  const creditPct = 100 - savingsPct;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <span>Step 2 of 7</span>
          <span>•</span>
          <span>Capital Allocation</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          How much existing savings should cushion the bill?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Using savings first lowers what you need to borrow—slashing total interest, fees, and monthly EMI burdens.
        </p>
      </div>

      {/* Hero Bill Split Visual Bar */}
      <div className="p-6 rounded-2xl bg-white border border-cardborder shadow-subtle space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Total Emergency Bill
            </span>
            <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {formatINR(totalBill)}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Savings in Account</span>
            <div className="text-sm font-semibold font-mono text-slate-800">
              {formatINR(persona.savingsAvailable)} available
            </div>
          </div>
        </div>

        {/* Visual Progress Split Bar */}
        <div>
          <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 p-1 border border-slate-200">
            <div
              style={{ width: `${savingsPct}%` }}
              className="h-full bg-emerald-500 rounded-lg transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white tracking-wider truncate px-1 shadow-sm"
            >
              {savingsPct > 15 ? `Savings (${savingsPct}%)` : ""}
            </div>
            <div
              style={{ width: `${creditPct}%` }}
              className="h-full bg-amber-500 rounded-lg transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white tracking-wider truncate px-1 shadow-sm ml-1"
            >
              {creditPct > 15 ? `Credit Gap Needed (${creditPct}%)` : ""}
            </div>
          </div>

          {/* Legend and Numbers under Bar */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  1. Savings Applied
                </span>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {formatINR(savingsApplied)}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">
                  Direct cash contribution · 0% interest
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  2. Credit Gap Needed
                </span>
                <div className="text-xl font-bold font-mono text-amber-700">
                  {formatINR(creditNeeded)}
                </div>
                <div className="text-[11px] text-amber-600 mt-0.5">
                  Amount to be evaluated for safe borrowing
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>Adjust Savings Allocation Slider:</span>
            <span className="font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {formatINR(savingsApplied)} applied
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={maxSavingsAvailable}
            step={1000}
            value={savingsApplied}
            onChange={(e) => setSavingsApplied(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1.5">
            <span>₹0 (Borrow All)</span>
            <span>Recommended: {formatINR(persona.savingsDefaultApplied)}</span>
            <span>Max Available: {formatINR(maxSavingsAvailable)}</span>
          </div>
        </div>

        {/* Smart Rule Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800">Centsible Principle:</strong> Applying{" "}
            {formatINR(savingsApplied)} reduces Priya&apos;s borrowing need from{" "}
            {formatINR(totalBill)} down to <strong>{formatINR(creditNeeded)}</strong>. This cuts 12 months of compounded interest by nearly 33% before a single loan agreement is signed.
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => goToStep(1)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Data Ingestion</span>
        </button>

        <button
          onClick={() => goToStep(3)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Calculate Safe-to-Borrow Limit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

type PipelinePanelContextProps = {
  pipeline: ReturnType<typeof usePipeline>;
};

