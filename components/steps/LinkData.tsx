"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Landmark,
  Loader2,
  Lock,
  MoreHorizontal,
  Smartphone,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { Category, Pipeline, Timeframe } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, Card, CountUp, Reveal, Slider, StepHeader } from "@/components/ui/primitives";

const CATEGORIES: { id: Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "medical", label: "Medical", icon: HeartPulse },
  { id: "repair", label: "Repair", icon: Wrench },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "family", label: "Family", icon: Users },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const TIMEFRAMES: { id: Timeframe; label: string; sub: string }[] = [
  { id: "today", label: "Today", sub: "Within hours" },
  { id: "week", label: "This week", sub: "In the next few days" },
  { id: "month", label: "This month", sub: "I have some time" },
];

const SOURCE_ICON = {
  salary: Landmark,
  credit_card: CreditCard,
  bnpl: Wallet,
  loan: Smartphone,
} as const;

export function LinkData({ pipeline }: { pipeline: Pipeline }) {
  const {
    persona,
    basePersona,
    category,
    setCategory,
    timeframe,
    setTimeframe,
    emergencyAmount,
    setEmergencyAmount,
    useSampleAnswers,
    goToStep,
  } = pipeline;

  const [q, setQ] = useState(0);
  const [linked, setLinked] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const first = basePersona.name.split(" ")[0];

  // Animate sources to "Linked ✓" one by one
  useEffect(() => {
    setLinked(0);
    const timers = persona.sources.map((_, i) => setTimeout(() => setLinked(i + 1), 700 + i * 650));
    return () => timers.forEach(clearTimeout);
  }, [persona.sources]);

  const advance = () => setTimeout(() => setQ((n) => Math.min(2, n + 1)), 260);

  const minAmount = Math.max(10000, basePersona.savingsDefaultApplied + 5000);
  const chips = [0.5, 1, 1.5, 2].map((m) => Math.round((basePersona.emergencyAmount * m) / 5000) * 5000);

  const questions = [
    "What's happening?",
    "How soon do you need the money?",
    "Roughly how much?",
  ];

  return (
    <div>
      <StepHeader
        step={1}
        kicker="Link Data"
        title="Let's start with what's going on"
        subtitle="Three quick taps instead of a long form. Then we securely link your accounts, read-only."
      />

      <div className="grid grid-cols-5 gap-6">
        {/* ───── Guided questions ───── */}
        <Reveal className="col-span-3">
          <Card className="flex h-[430px] flex-col p-7">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Question ${i + 1}`}
                    onClick={() => setQ(i)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === q ? "w-10 bg-primary-accent" : i < q ? "w-6 bg-indigo-300" : "w-6 bg-slate-200"
                    )}
                  />
                ))}
                <span className="ml-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  Question {q + 1} of 3
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  useSampleAnswers();
                  goToStep(2);
                }}
                className="rounded-xl bg-primary-accent px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 active:scale-[0.98]"
              >
                Use {first}&apos;s sample data
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={q}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col"
              >
                <h2 className="mb-6 text-[28px] font-extrabold tracking-tight text-navy-900">{questions[q]}</h2>

                {q === 0 && (
                  <div className="grid grid-cols-5 gap-3">
                    {CATEGORIES.map(({ id, label, icon: Icon }) => {
                      const on = category === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setCategory(id);
                            advance();
                          }}
                          className={cn(
                            "flex flex-col items-center gap-3 rounded-2xl border-2 px-2 py-6 transition-all",
                            on
                              ? "border-primary-accent bg-indigo-50 text-navy-900 shadow-md"
                              : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50"
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-12 w-12 place-items-center rounded-xl",
                              on ? "bg-primary-accent text-white" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            <Icon className="h-6 w-6" />
                          </span>
                          <span className="text-[14px] font-bold">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q === 1 && (
                  <div className="grid grid-cols-3 gap-3">
                    {TIMEFRAMES.map(({ id, label, sub }) => {
                      const on = timeframe === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setTimeframe(id);
                            advance();
                          }}
                          className={cn(
                            "rounded-2xl border-2 px-4 py-7 text-left transition-all",
                            on
                              ? "border-primary-accent bg-indigo-50 shadow-md"
                              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                          )}
                        >
                          <div className="text-[20px] font-extrabold text-navy-900">{label}</div>
                          <div className="mt-1 text-[13px] text-slate-500">{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q === 2 && (
                  <div>
                    <div className="mb-5 text-[56px] font-extrabold leading-none tracking-tight text-navy-900">
                      <CountUp value={emergencyAmount} duration={0.5} />
                    </div>
                    <div className="mb-6 flex flex-wrap gap-2">
                      {chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEmergencyAmount(c)}
                          className={cn(
                            "rounded-full border-2 px-4 py-2 text-[14px] font-bold tabular-nums transition-all",
                            emergencyAmount === c
                              ? "border-primary-accent bg-indigo-50 text-primary-accent"
                              : "border-slate-200 text-slate-600 hover:border-indigo-300"
                          )}
                        >
                          {formatINR(c)}
                        </button>
                      ))}
                    </div>
                    <Slider
                      label="Emergency amount"
                      min={minAmount}
                      max={Math.max(150000, basePersona.emergencyAmount * 2.5)}
                      step={5000}
                      value={Math.max(minAmount, emergencyAmount)}
                      onChange={setEmergencyAmount}
                    />
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setQ((n) => Math.max(0, n - 1))}
                    disabled={q === 0}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-[13px] text-slate-400">
                    {persona.emergencyTitle} · {persona.emergencyDue.toLowerCase()}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </Reveal>

        {/* ───── Connect sources ───── */}
        <Reveal className="col-span-2" delay={0.1}>
          <Card className="flex h-[430px] flex-col p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-extrabold text-navy-900">Connect sources</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> Account Aggregator (simulated)
                </p>
              </div>
              <Badge tone={linked === persona.sources.length ? "safe" : "indigo"}>
                {linked}/{persona.sources.length} linked
              </Badge>
            </div>

            <ul className="flex-1 space-y-2.5">
              {persona.sources.map((s, i) => {
                const Icon = SOURCE_ICON[s.type] || Building2;
                const done = i < linked;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                      done ? "border-safe-border bg-safe-bg/50" : "border-slate-200 bg-slate-50"
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-primary-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-navy-900">
                        {s.institution} · {s.name}
                      </span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {s.monthlyCommitment > 0
                          ? `${formatINR(s.monthlyCommitment)}/mo due`
                          : `Balance ${formatINR(s.balance || 0)}`}{" "}
                        · mock
                      </span>
                    </span>
                    {done ? (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 text-[12px] font-bold text-safe-text"
                      >
                        <Check className="h-4 w-4" strokeWidth={3} /> Linked
                      </motion.span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" /> Linking
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="mt-4 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Enter details manually instead
            </button>
          </Card>
        </Reveal>
      </div>

      {/* Manual entry modal */}
      <AnimatePresence>
        {manualOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4 backdrop-blur-sm"
            onClick={() => setManualOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-lift"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setManualOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
              <Badge tone="indigo">Coming in Phase 2</Badge>
              <h3 className="mt-4 text-[22px] font-extrabold text-navy-900">Manual entry</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
                In Phase 2, you&apos;ll be able to type in income and bills yourself or upload a statement. For this
                demo, verified Account Aggregator data keeps every number consistent.
              </p>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="mt-6 w-full rounded-xl bg-primary-accent py-3 text-[14px] font-bold text-white hover:bg-indigo-500"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
