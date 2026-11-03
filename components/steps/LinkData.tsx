"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  CreditCard,
  Smartphone,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface LinkDataProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function LinkData({ pipeline }: LinkDataProps) {
  const { persona, goToStep } = pipeline;

  const [emergencyCat, setEmergencyCat] = useState(persona.emergencyCategory);
  const [urgency, setUrgency] = useState(persona.emergencyUrgency);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <span>Step 1 of 7</span>
          <span>•</span>
          <span>Data Ingestion & Verification</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          What financial emergency are we navigating today?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Centsible connects to India&apos;s RBI-regulated Account Aggregator framework
          to fetch real, verified cash flow without storing banking credentials.
        </p>
      </div>

      {/* Guided 3-Question Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Q1: What's happening? */}
        <div className="p-4 rounded-2xl bg-white border border-cardborder shadow-subtle hover:border-indigo-300 transition-all">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Question 1
          </div>
          <h2 className="text-sm font-semibold text-slate-800 mb-2.5">
            What emergency occurred?
          </h2>
          <div className="space-y-1.5">
            {[
              { id: "medical", label: "Medical Bill", sub: "Dental surgery" },
              { id: "repair", label: "Device Repair", sub: "Laptop board" },
              { id: "education", label: "Fee Due", sub: "Upskilling cert" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setEmergencyCat(cat.id as any)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between",
                  emergencyCat === cat.id
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">{cat.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Q2: How soon? */}
        <div className="p-4 rounded-2xl bg-white border border-cardborder shadow-subtle hover:border-indigo-300 transition-all">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Question 2
          </div>
          <h2 className="text-sm font-semibold text-slate-800 mb-2.5">
            When is this due?
          </h2>
          <div className="space-y-1.5">
            {[
              { id: "high", label: "Due Friday (High)", desc: "Within 48-72 hours" },
              { id: "medium", label: "This month (Medium)", desc: "Within 2-3 weeks" },
              { id: "low", label: "Flexible (Low)", desc: "Can be rescheduled" },
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => setUrgency(u.id as any)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  urgency === u.id
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="font-medium">{u.label}</div>
                <div className="text-[10px] text-slate-400">{u.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Q3: Roughly how much? */}
        <div className="p-4 rounded-2xl bg-white border border-cardborder shadow-subtle hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Question 3
            </div>
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Total bill required
            </h2>
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight my-2">
              {formatINR(persona.emergencyAmount)}
            </div>
            <div className="text-xs text-slate-500">
              Verified hospital invoice uploaded: Dental Surgery (Friday).
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Invoice
            </span>
            <span className="font-mono text-[11px]">{formatINR(persona.emergencyAmount)}</span>
          </div>
        </div>
      </div>

      {/* Linked Sources Section (Account Aggregator Simulated) */}
      <div className="p-5 rounded-2xl bg-white border border-cardborder shadow-subtle">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Connected Financial Sources
              </h2>
              <p className="text-xs text-slate-500">
                Simulated via Account Aggregator · Read-only tokenized sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 4 Sources Linked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {persona.sources.map((src) => (
            <div
              key={src.id}
              className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 shadow-sm">
                  {src.type === "salary" && <Building2 className="w-4 h-4 text-indigo-600" />}
                  {src.type === "credit_card" && <CreditCard className="w-4 h-4 text-purple-600" />}
                  {src.type === "bnpl" && <Sparkles className="w-4 h-4 text-amber-600" />}
                  {src.type === "loan" && <Smartphone className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {src.institution} · {src.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {src.accountMask}{" "}
                    {src.monthlyCommitment > 0
                      ? `• Monthly: ${formatINR(src.monthlyCommitment)}`
                      : `• Balance: ${formatINR(src.balance || 0)}`}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md shrink-0">
                Linked ✓
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Need to add an unlisted account or cash record?
          </span>
          <button
            onClick={() => setManualModalOpen(true)}
            className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
          >
            Manual Entry (Phase 2 preview) →
          </button>
        </div>
      </div>

      {/* Manual Entry Modal Simulation */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-cardborder shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" /> Manual Data Ingestion
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              In production (Phase 2), users can upload bank statement PDFs or manually enter cash income. For this national ideathon demo, the system uses verified Account Aggregator telemetry to ensure deterministic calculations.
            </p>
            <button
              onClick={() => setManualModalOpen(false)}
              className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              Understood · Return to Demo
            </button>
          </div>
        </div>
      )}

      {/* Bottom Continue Action Bar */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Loaded Profile: <strong className="text-slate-800">{persona.name} ({persona.age}y)</strong>
        </div>
        <button
          onClick={() => goToStep(2)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Continue to Apply Savings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

