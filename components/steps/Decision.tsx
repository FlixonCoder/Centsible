"use client";

import { useEffect, useState } from "react";
import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function Decision({ pipeline }: DecisionProps) {
  const {
    persona,
    creditNeeded,
    decisionResult,
    optionsResult,
    mitigationImpact,
    goToStep,
    resetPipeline,
    setIsChatOpen,
  } = pipeline;

  const {
    headlineTitle,
    recommendedOption,
    heroSavingsVsWorst,
    reasons,
    alternatives,
    actionSteps,
    urgencyCheck,
    disclaimer,
  } = decisionResult;

  // Count-up animation for the hero ₹26,000 savings
  const [displayedSavings, setDisplayedSavings] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = heroSavingsVsWorst;
    const duration = 1200;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayedSavings(Math.round(start + (end - start) * ease));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [heroSavingsVsWorst]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Award className="w-3.5 h-3.5 text-indigo-600" />
          <span>Step 7 of 7</span>
          <span>•</span>
          <span>Decision & Execution Roadmap</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Centsible Financial Decision Matrix
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Objective, commission-free guidance grounded in mathematical safety.
        </p>
      </div>

      {/* Hero Recommendation Card (§6 Step 7) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-navy-950 text-white shadow-2xl border border-indigo-400/40 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold tracking-wide uppercase font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Path Selected
            </span>

            <span className="text-xs text-indigo-200">
              Emergency: {persona.emergencyTitle}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            {headlineTitle}
          </h2>

          <p className="text-xs md:text-sm text-indigo-200/90 max-w-2xl leading-relaxed mb-6">
            Borrowing {formatINR(creditNeeded)} closes the medical hospital gap while leaving your core finances completely intact.
          </p>

          {/* Hero Saving Stat Callout with Count-up */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold block">
                Direct Financial Protection
              </span>
              <div className="text-3xl md:text-4xl font-black font-mono text-emerald-400 tracking-tight">
                ≈ {formatINR(displayedSavings)} Saved
              </div>
              <div className="text-xs text-indigo-200 mt-0.5">
                Compared to revolving minimum card payments (~₹70,000 over 35 months)
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold block">
                Fixed Monthly EMI
              </span>
              <div className="text-2xl md:text-3xl font-bold font-mono text-white">
                {formatINR(recommendedOption.monthlyPayment)}/mo
              </div>
              <div className="text-xs text-emerald-300 font-medium mt-0.5">
                Well within safe limit ({formatINR(pipeline.safeToBorrowResult.safeCapacity)}/mo)
              </div>
            </div>
          </div>

          {/* 3 Pillars / Reasons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {reasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-100 flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5">
                  ✓
                </div>
                <div className="leading-tight">{reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Want vs Need Check & Non-Loan Alternatives Evaluated */}
      <div className="p-5 rounded-2xl bg-white border border-cardborder shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Why Other Non-Loan Paths Were Rejected
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Urgency: {urgencyCheck.urgency.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alternatives.map((alt, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {alt.title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                    EVALUATED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {alt.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Action Steps Roadmap */}
      <div className="p-5 rounded-2xl bg-white border border-cardborder shadow-subtle space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Your 3-Step Execution Checklist
        </h3>

        <div className="space-y-2.5">
          {actionSteps.map((step) => (
            <div
              key={step.step}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {step.step}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Card */}
      <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-400" />
        <span>{disclaimer}</span>
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => goToStep(6)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Mitigation</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChatOpen(true)}
            className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Accountant</span>
          </button>

          <button
            onClick={resetPipeline}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Demo Flow</span>
          </button>
        </div>
      </div>
    </div>
  );
}

