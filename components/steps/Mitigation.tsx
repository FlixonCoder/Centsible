"use client";

import { ArrowRight, Lightbulb, ShieldCheck, ShoppingBag, Sparkles, Train, Tv, Utensils, Zap } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Pipeline } from "@/hooks/usePipeline";
import { DEFAULT_MITIGATION_ACTIONS } from "@/lib/engine/mitigation";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, Card, CountUp, Reveal, StepHeader, Switch } from "@/components/ui/primitives";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Train,
  Tv,
  ShoppingBag,
  Zap,
  ShieldCheck,
};

const KEPT = ["#4F46E5", "#7C3AED", "#6366F1", "#818CF8"];

export function Mitigation({ pipeline }: { pipeline: Pipeline }) {
  const {
    activeMitigationIds,
    toggleMitigationAction,
    mitigationImpact: m,
    safeToBorrowResult,
    stressTestResult,
    selectedOption,
    incomeDropPercent,
  } = pipeline;

  const baseSafe = safeToBorrowResult.safeCapacity;
  const baseStress = stressTestResult.monthlyPositionBeforeEmi;

  // Donut: kept spend (indigo) + freed portions (green)
  const donut: { name: string; value: number; color: string; freed: boolean }[] = [];
  m.categorySpendingBefore.forEach((c, i) => {
    donut.push({ name: c.name, value: c.amount - c.freed, color: KEPT[i % KEPT.length], freed: false });
    if (c.freed > 0) donut.push({ name: `${c.name} · freed`, value: c.freed, color: "#34D399", freed: true });
  });
  const totalSpend = m.categorySpendingBefore.reduce((a, c) => a + c.amount, 0);

  return (
    <div>
      <StepHeader
        step={6}
        kicker="Mitigation Layer"
        title="Where can you free up some cash?"
        subtitle="Small, gentle tweaks — nothing drastic. Switch any off to see what changes."
      />

      <Reveal>
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-5 text-white shadow-lift">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-wider text-emerald-50/90">
                Good news — we found
              </div>
              <div className="text-[30px] font-extrabold leading-tight">
                <CountUp value={m.totalFreedMonthly} duration={0.5} />
                <span className="text-[18px] font-bold text-emerald-50/90">/month you can free up</span>
              </div>
            </div>
          </div>
          <div className="text-right text-[13px] text-emerald-50/90">
            {formatINR(m.totalFreedMonthly * 12)} a year, without touching essentials
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-12 gap-6">
        {/* Suggestions */}
        <div className="col-span-7 space-y-2.5">
          {DEFAULT_MITIGATION_ACTIONS.map((a, i) => {
            const on = activeMitigationIds.includes(a.id);
            const Icon = ICONS[a.iconName] || Lightbulb;
            const tip = !a.isActionableCut;
            return (
              <Reveal key={a.id} delay={0.05 + i * 0.05}>
                <div
                  onClick={() => toggleMitigationAction(a.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-2xl border bg-white px-4 py-3.5 shadow-card transition-all",
                    on ? "border-emerald-200" : "border-cardborder opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                      tip ? "bg-indigo-50 text-primary-accent" : "bg-emerald-50 text-emerald-600"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold leading-snug text-navy-900">{a.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-500">{a.description}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {tip ? (
                      <Badge tone="indigo">Tip</Badge>
                    ) : (
                      <span className="text-[17px] font-extrabold tabular-nums text-safe">
                        +{formatINR(a.monthlySaving)}
                      </span>
                    )}
                    <Badge tone={a.effort === "Easy" ? "neutral" : "caution"}>{a.effort}</Badge>
                  </div>
                  <Switch checked={on} onChange={() => toggleMitigationAction(a.id)} label={a.title} />
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Before vs after + donut */}
        <div className="col-span-5 space-y-5">
          <Reveal delay={0.1}>
            <Card className="p-6">
              <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Before vs after · live
              </div>

              <Metric label="Safe-to-Borrow" before={`${formatINR(baseSafe)}/mo`} after={`${formatINR(m.newSafeCapacity)}/mo`} good />
              <Metric
                label={`Stress test (−${incomeDropPercent}% income)`}
                before={`${formatINR(baseStress)}/mo`}
                after={`${m.newStressPositionBeforeEmi > 0 ? "+" : ""}${formatINR(m.newStressPositionBeforeEmi)}/mo`}
                good={m.newStressPositionBeforeEmi >= 0}
                note="before new EMI"
              />
              <Metric
                label="Months to clear the loan"
                before={`${selectedOption.tenureMonths} mo`}
                after={`${m.prepaymentTenureMonths} mo`}
                good={m.monthsSaved > 0}
                note={
                  m.prepaymentMonthly > 0
                    ? `prepaying ${formatINR(m.prepaymentMonthly)}/mo (50% of freed) · saves ~${formatINR(m.interestSaved)} interest`
                    : "switch ideas on to prepay faster"
                }
                last
              />
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="flex items-center gap-4 p-5">
              <div className="relative h-[150px] w-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut}
                      dataKey="value"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donut.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [formatINR(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Spend</div>
                    <div className="text-[15px] font-extrabold tabular-nums text-navy-900">
                      {formatINR(totalSpend - m.totalFreedMonthly)}
                    </div>
                  </div>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 text-[13px]">
                {m.categorySpendingBefore.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: KEPT[i % KEPT.length] }} />
                      {c.name}
                    </span>
                    {c.freed > 0 ? (
                      <span className="font-bold tabular-nums text-safe">−{formatINR(c.freed)}</span>
                    ) : (
                      <span className="tabular-nums text-slate-400">{formatINR(c.amount)}</span>
                    )}
                  </li>
                ))}
                <li className="flex items-center gap-2 pt-1 text-[12px] text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Green = freed up
                </li>
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  before,
  after,
  good,
  note,
  last,
}: {
  label: string;
  before: string;
  after: string;
  good: boolean;
  note?: string;
  last?: boolean;
}) {
  return (
    <div className={cn("py-3.5", !last && "border-b border-slate-100")}>
      <div className="text-[13px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 flex items-center gap-3">
        <span className="text-[18px] font-bold tabular-nums text-slate-400 line-through decoration-slate-300">{before}</span>
        <ArrowRight className="h-4 w-4 text-slate-300" />
        <span className={cn("text-[26px] font-extrabold tabular-nums", good ? "text-safe" : "text-risk")}>{after}</span>
      </div>
      {note && <div className="mt-0.5 text-[12px] text-slate-400">{note}</div>}
    </div>
  );
}
