"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CountUp, Reveal, Slider, StepHeader } from "@/components/ui/primitives";

const fmtK = (v: number) => `${v < 0 ? "−" : ""}₹${Math.abs(v / 1000).toFixed(0)}k`;

export function StressTest({ pipeline }: { pipeline: Pipeline }) {
  const { persona, basePersona, incomeDropPercent, setIncomeDropPercent, stressTestResult: s, selectedOption } = pipeline;
  const first = basePersona.name.split(" ")[0];
  const pronoun = basePersona.pronoun;

  const risky = s.status !== "RESILIENT";
  const critical = s.status === "CRITICAL_RISK";

  const tone = critical
    ? { box: "border-risk-border bg-risk-bg", icon: "bg-risk text-white", title: "text-risk-text", Icon: AlertTriangle }
    : risky
    ? { box: "border-caution-border bg-caution-bg", icon: "bg-caution text-white", title: "text-caution-text", Icon: ShieldAlert }
    : { box: "border-safe-border bg-safe-bg", icon: "bg-safe text-white", title: "text-safe-text", Icon: CheckCircle2 };

  const heading = critical
    ? `Flagged BEFORE ${pronoun} borrows.`
    : risky
    ? "The new EMI is what tips the budget."
    : "Holds up, even under stress.";

  const detail = critical
    ? `At −${incomeDropPercent}% income, ${first} is already ${formatINR(Math.abs(s.monthlyPositionBeforeEmi))} short each month — before any new EMI. With the ${formatINR(selectedOption.monthlyPayment)} EMI it becomes ${formatINR(s.monthlyPositionWithEmi)}.`
    : risky
    ? `Existing bills are covered at −${incomeDropPercent}%, but the ${formatINR(selectedOption.monthlyPayment)} EMI leaves ${formatINR(s.monthlyPositionWithEmi)} a month.`
    : `At −${incomeDropPercent}% income there's still ${formatINR(s.monthlyPositionWithEmi)} left each month after the EMI.`;

  const data = s.projections.map((p: any) => ({
    name: `M${p.month}`,
    withEmi: p.positionWithEmi,
    beforeEmi: p.positionBeforeEmi,
  }));

  const horizons = [3, 6, 12];

  return (
    <div>
      <StepHeader
        step={5}
        kicker="Stress Test"
        title="What if your income drops?"
        subtitle="Drag the slider to see how the next 12 months would look before you commit."
      />

      <Reveal>
        <div className={cn("mb-6 flex items-center gap-5 rounded-2xl border-2 px-6 py-5", tone.box)}>
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", tone.icon)}>
            <tone.Icon className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <div className={cn("text-[26px] font-extrabold leading-tight", tone.title)}>{heading}</div>
            <div className="mt-1 text-[15px] leading-snug text-slate-700">{detail}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Before new EMI</div>
            <CountUp
              value={s.monthlyPositionBeforeEmi}
              duration={0.4}
              className={cn("text-[40px] font-extrabold leading-none", critical ? "text-risk" : "text-safe")}
            />
            <div className="text-[12px] text-slate-500">per month</div>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-5 gap-6">
        {/* Controls */}
        <Reveal className="col-span-2" delay={0.08}>
          <Card className="h-full p-6">
            <div className="flex items-end justify-between">
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-400">Income drop</span>
              <span className="text-[34px] font-extrabold leading-none tabular-nums text-navy-900">
                −{incomeDropPercent}%
              </span>
            </div>
            <div className="mt-4">
              <Slider
                label="Income drop percentage"
                min={0}
                max={40}
                step={1}
                value={incomeDropPercent}
                onChange={setIncomeDropPercent}
                color={critical ? "#DC2626" : "#4F46E5"}
              />
              <div className="mt-2 flex justify-between text-[12px] font-medium text-slate-400">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
              </div>
            </div>

            <div className="mt-5 text-[13px] text-slate-500">
              Income {formatINR(persona.monthlyIncome)} →{" "}
              <strong className="text-navy-900">{formatINR(s.stressedIncome)}</strong>
            </div>

            <table className="mt-4 w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="pb-2 font-bold">Over</th>
                  <th className="pb-2 text-right font-bold">No new EMI</th>
                  <th className="pb-2 text-right font-bold">With EMI</th>
                </tr>
              </thead>
              <tbody>
                {horizons.map((n) => {
                  const a = s.monthlyPositionBeforeEmi * n;
                  const b = s.monthlyPositionWithEmi * n;
                  return (
                    <tr key={n} className="border-t border-slate-100">
                      <td className="py-2 font-semibold text-slate-600">{n} months</td>
                      <td className={cn("py-2 text-right font-bold tabular-nums", a < 0 ? "text-risk" : "text-safe")}>
                        {formatINR(a)}
                      </td>
                      <td className={cn("py-2 text-right font-bold tabular-nums", b < 0 ? "text-risk" : "text-safe")}>
                        {formatINR(b)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Reveal>

        {/* Chart */}
        <Reveal className="col-span-3" delay={0.16}>
          <Card className="h-full p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-extrabold text-navy-900">Monthly surplus / deficit</h2>
                <p className="text-[12.5px] text-slate-500">With the {formatINR(selectedOption.monthlyPayment)} EMI</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-safe" /> Surplus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-risk" /> Deficit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t-2 border-dashed border-slate-400" /> Before EMI
                </span>
              </div>
            </div>
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#EEF0F7" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis
                    tickFormatter={fmtK}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                    formatter={(v: number, n: string) => [formatINR(v), n === "withEmi" ? "With EMI" : "Before EMI"]}
                    labelFormatter={(l) => `Month ${String(l).replace("M", "")}`}
                  />
                  <ReferenceLine y={0} stroke="#94A3B8" />
                  <Bar dataKey="withEmi" radius={[4, 4, 4, 4]} maxBarSize={34}>
                    {data.map((d: any, i: number) => (
                      <Cell key={i} fill={d.withEmi >= 0 ? "#16A34A" : "#DC2626"} />
                    ))}
                  </Bar>
                  <Line
                    dataKey="beforeEmi"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
