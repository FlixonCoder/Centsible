"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Calculator, Check, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Pipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, Card, CountUp, Reveal, StepHeader } from "@/components/ui/primitives";

const SHORT: Record<string, string> = {
  card_min: "Card · minimum due",
  bnpl_3m: "BNPL · 3 months",
  card_emi_12m: "Card EMI · 12 months",
  personal_loan_12m: "Personal loan · 12 months",
};

export function CompareOptions({ pipeline }: { pipeline: Pipeline }) {
  const { optionsResult, selectedOptionId, setSelectedOptionId, safeToBorrowResult } = pipeline;
  const [showMath, setShowMath] = useState(false);
  const safeLimit = safeToBorrowResult.safeCapacity;
  const best = optionsResult.recommendedOption;

  const chartData = optionsResult.options.map((o) => ({
    id: o.id,
    name: SHORT[o.id],
    total: o.totalRepaid,
  }));
  const maxTotal = Math.max(...chartData.map((d) => d.total));

  return (
    <div>
      <StepHeader
        step={4}
        kicker="Compare True Costs"
        title={`What will ${formatINR(optionsResult.creditNeeded)} really cost you?`}
        subtitle="Same loan amount, four very different outcomes. Tap a card to carry it into the next steps."
      />

      <div className="grid grid-cols-4 gap-5 pt-3">
        {optionsResult.options.map((o, i) => {
          const selected = o.id === selectedOptionId;
          const safe = o.verdict === "SAFE";
          return (
            <Reveal key={o.id} delay={i * 0.07}>
              <button
                type="button"
                onClick={() => setSelectedOptionId(o.id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex h-full w-full flex-col rounded-2xl border-2 bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift",
                  selected ? "border-primary-accent ring-4 ring-indigo-500/10" : "border-cardborder",
                  o.isRecommended && !selected && "border-indigo-200"
                )}
              >
                {o.isRecommended && (
                  <span className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-navy-800 to-primary-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="h-3 w-3 text-amber-300" /> Lowest cost &amp; safe
                  </span>
                )}
                {selected && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-primary-accent text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}

                <div className="mb-4 mt-1 pr-7">
                  <div className="text-[16px] font-extrabold leading-snug text-navy-900">{o.title}</div>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">You&apos;ll repay</div>
                <CountUp value={o.totalRepaid} className="text-[32px] font-extrabold leading-tight text-navy-900" />
                <div className="mt-0.5 text-[14px] font-semibold">
                  <span className="text-slate-500">Extra cost </span>
                  <span className={o.extraCost > 10000 ? "text-risk" : "text-slate-800"}>{formatINR(o.extraCost)}</span>
                </div>

                <div className="my-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Monthly</div>
                    <div
                      className={cn(
                        "text-[17px] font-extrabold tabular-nums",
                        o.monthlyPayment > safeLimit ? "text-risk" : "text-navy-900"
                      )}
                    >
                      {formatINR(o.monthlyPayment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Tenure</div>
                    <div className="text-[17px] font-extrabold tabular-nums text-navy-900">{o.tenureMonths} mo</div>
                  </div>
                </div>

                <Badge
                  tone={safe ? "safe" : "risk"}
                  icon={safe ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  className="self-start"
                >
                  {safe ? "Safe" : "Risky"}
                </Badge>
                <p className="mt-2.5 text-[13px] leading-snug text-slate-500">
                  {safe
                    ? o.isRecommended
                      ? "Fits your budget and costs the least."
                      : "Fits your budget, but costs more."
                    : o.id === "card_min"
                    ? `Very long tenure — ${o.tenureMonths} months of 42% interest.`
                    : `Payment is ~${(o.monthlyPayment / safeLimit).toFixed(1)}× your safe limit.`}
                </p>
              </button>
            </Reveal>
          );
        })}
      </div>

      {/* Total-cost chart */}
      <Reveal delay={0.3}>
        <Card className="mt-6 p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-navy-900">Total cost, side by side</h2>
            <button
              type="button"
              onClick={() => setShowMath((v) => !v)}
              aria-expanded={showMath}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Calculator className="h-4 w-4 text-primary-accent" /> Show math
              <ChevronDown className={cn("h-4 w-4 transition-transform", showMath && "rotate-180")} />
            </button>
          </div>
          <div className="h-[168px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 6, right: 90, left: 0, bottom: 0 }} barSize={20}>
                <XAxis type="number" hide domain={[0, maxTotal * 1.02]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={190}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#475569", fontWeight: 600 }}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]} isAnimationActive>
                  {chartData.map((d) => (
                    <Cell
                      key={d.id}
                      fill={d.id === best.id ? "#4F46E5" : d.id === "card_min" ? "#F87171" : "#CBD5E1"}
                    />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="right"
                    formatter={(v: number) => formatINR(v)}
                    style={{ fontSize: 14, fontWeight: 800, fill: "#1E1B4B" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence initial={false}>
            {showMath && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-xl bg-slate-50 p-5">
                  <div className="mb-3 font-mono text-[13px] font-semibold text-navy-900">
                    EMI = P · r · (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1) &nbsp;·&nbsp; r = annual rate ÷ 12
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {optionsResult.options.map((o) => (
                      <div key={o.id}>
                        <div className="mb-1 text-[13px] font-bold text-navy-900">{o.title}</div>
                        <ul className="space-y-0.5 text-[12.5px] leading-snug text-slate-500">
                          {o.assumptions.map((a) => (
                            <li key={a}>• {a}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Reveal>
    </div>
  );
}
