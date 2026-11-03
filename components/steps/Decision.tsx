"use client";

import { Banknote, CheckCircle2, Clock, ShieldCheck, TrendingDown } from "lucide-react";
import { Pipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, Card, CountUp, Reveal, StepHeader } from "@/components/ui/primitives";

const VERDICT_LABEL = {
  BORROW: "Borrow",
  BORROW_LESS: "Borrow less",
  USE_SAVINGS: "Use savings",
  DELAY: "Delay",
} as const;

const REASON_ICONS = [TrendingDown, Banknote, ShieldCheck];
const REASON_TITLES = ["Lowest cost", "Within your safe limit", "Protected after mitigation"];

export function Decision({ pipeline }: { pipeline: Pipeline }) {
  const { decisionResult: d, persona, safeToBorrowResult, mitigationImpact, optionsResult } = pipeline;

  const urgency = d.urgencyCheck.urgency;
  const verdict = VERDICT_LABEL[d.primaryVerdict];

  const reasonBodies = [
    `Only ${formatINR(d.recommendedOption.extraCost)} in interest and fees — the cheapest of the safe options.`,
    `${formatINR(d.recommendedOption.monthlyPayment)}/month against a safe limit of ${formatINR(safeToBorrowResult.safeCapacity)}.`,
    `Freeing ${formatINR(mitigationImpact.totalFreedMonthly)}/month lifts your limit to ${formatINR(mitigationImpact.newSafeCapacity)}.`,
  ];

  return (
    <div>
      <StepHeader
        step={7}
        kicker="Decision"
        title="Here's what we'd do"
        subtitle="A calm, commission-free recommendation built from every number you've just seen."
      />

      {/* Hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 p-9 text-white shadow-lift">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-24 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative grid grid-cols-[1.25fr_1fr] items-center gap-10">
            <div>
              <Badge tone="safe" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                Recommended
              </Badge>
              <h2 className="mt-4 text-[34px] font-extrabold leading-[1.15] tracking-tight">{d.headlineTitle.replace(/^Recommended:\s*/, "")}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-indigo-100/85">
                {formatINR(persona.emergencyAmount)} {persona.emergencyTitle.toLowerCase()}: {formatINR(pipeline.savingsApplied)} from
                savings, {formatINR(pipeline.creditNeeded)} borrowed at about{" "}
                {formatINR(d.recommendedOption.monthlyPayment)}/month.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur">
              <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-indigo-200">
                Smarter choice saves you
              </div>
              <div className="mt-1 text-[60px] font-extrabold leading-none tracking-tight text-emerald-300">
                ≈ <CountUp value={d.heroSavingsVsWorst} duration={1.4} />
              </div>
              <div className="mt-2 text-[13px] text-indigo-100/80">
                vs paying only the card minimum ({formatINR(optionsResult.worstOption.totalRepaid)})
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Reasons */}
      <div className="mt-5 grid grid-cols-3 gap-5">
        {d.reasons.map((_, i) => {
          const Icon = REASON_ICONS[i];
          return (
            <Reveal key={i} delay={0.15 + i * 0.08}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-safe-bg text-safe">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="text-[16px] font-extrabold text-navy-900">{REASON_TITLES[i]}</div>
                </div>
                <p className="mt-2.5 text-[14px] leading-snug text-slate-500">{reasonBodies[i]}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Want / Need check + alternatives */}
      <Reveal delay={0.4}>
        <div className="mt-5 grid grid-cols-[auto_1fr] items-stretch gap-5">
          <Card className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-primary-accent">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Want / need check</div>
              <div className="flex items-center gap-2 text-[15px] font-extrabold text-navy-900">
                <Badge tone={urgency === "high" ? "risk" : "caution"}>Urgency {urgency}</Badge>
                <span className="text-slate-300">→</span>
                <Badge tone="safe">{verdict}</Badge>
                {!d.urgencyCheck.canDelay && <span className="text-[12.5px] font-semibold text-slate-500">(not delay)</span>}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            {d.alternatives.map((a) => (
              <div
                key={a.type}
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  a.isRecommended ? "border-safe-border bg-safe-bg" : "border-slate-200 bg-slate-50"
                )}
              >
                <div className={cn("text-[13px] font-extrabold", a.isRecommended ? "text-safe-text" : "text-slate-500")}>
                  {VERDICT_LABEL[a.type]}
                </div>
                <div className="mt-0.5 line-clamp-3 text-[12px] leading-snug text-slate-400">{a.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <p className="mt-6 text-center text-[13px] font-medium text-slate-400">
        <ShieldCheck className="mr-1 inline h-4 w-4 align-text-bottom" />
        {d.disclaimer}
      </p>
    </div>
  );
}
