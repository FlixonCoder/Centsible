"use client";

import { motion } from "framer-motion";
import { Building2, Check, ShieldCheck } from "lucide-react";
import { Pipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CountUp, Reveal, Ring, StepHeader } from "@/components/ui/primitives";

export function SafeToBorrow({ pipeline }: { pipeline: Pipeline }) {
  const { safeToBorrowResult: r } = pipeline;
  const { income, committedDues, essentials, safetyBuffer, safeCapacity, lenderLimitMock } = r;

  // Build waterfall: each bar floats between running totals
  let running = income;
  const rows = [
    { label: "Take-home income", amount: income, start: 0, end: income, tone: "income", sign: "" },
  ] as { label: string; amount: number; start: number; end: number; tone: string; sign: string }[];
  for (const [label, amount] of [
    ["Committed dues", committedDues],
    ["Essentials", essentials],
    ["Safety buffer", safetyBuffer],
  ] as const) {
    const start = Math.max(0, running - amount);
    rows.push({ label, amount, start, end: running, tone: "minus", sign: "−" });
    running = start;
  }
  rows.push({ label: "Safe monthly EMI", amount: safeCapacity, start: 0, end: safeCapacity, tone: "result", sign: "" });

  const BAR = {
    income: "bg-slate-300",
    minus: "bg-gradient-to-r from-rose-300 to-rose-400",
    result: "bg-gradient-to-r from-indigo-500 to-violet-500",
  } as const;

  return (
    <div>
      <StepHeader
        step={3}
        kicker="Safe-to-Borrow"
        title="What can you safely repay every month?"
        subtitle="Not what a lender will approve — what your real monthly budget can carry."
      />

      <div className="grid grid-cols-5 gap-6">
        {/* Waterfall */}
        <Reveal className="col-span-3">
          <Card className="h-full p-7">
            <div className="mb-5 text-[13px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Where your monthly income goes
            </div>
            <div className="space-y-3.5">
              {rows.map((row, i) => {
                const left = (row.start / income) * 100;
                const width = Math.max(((row.end - row.start) / income) * 100, row.tone === "result" ? 2.5 : 0);
                const isResult = row.tone === "result";
                return (
                  <div key={row.label} className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-36 shrink-0 text-[14px]",
                        isResult ? "font-extrabold text-navy-900" : "font-semibold text-slate-600"
                      )}
                    >
                      {row.label}
                    </div>
                    <div className="relative h-9 flex-1 rounded-lg bg-slate-100">
                      <motion.div
                        className={cn("absolute inset-y-0 rounded-lg", BAR[row.tone as keyof typeof BAR])}
                        style={{ left: `${left}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: "easeOut" }}
                      />
                    </div>
                    <div
                      className={cn(
                        "w-24 shrink-0 text-right text-[16px] font-extrabold tabular-nums",
                        isResult ? "text-primary-accent" : row.tone === "minus" ? "text-rose-500" : "text-navy-900"
                      )}
                    >
                      {row.sign}
                      {formatINR(row.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>

        {/* Gauge */}
        <Reveal className="col-span-2" delay={0.1}>
          <Card className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-white to-indigo-50/60 p-7">
            <Ring pct={(safeCapacity / income) * 100} size={250} stroke={20}>
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">Safe-to-Borrow</div>
                <CountUp value={safeCapacity} className="block text-[48px] font-extrabold leading-tight text-navy-900" />
                <div className="text-[15px] font-semibold text-slate-500">per month</div>
              </div>
            </Ring>
            <div className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-safe-text">
              <ShieldCheck className="h-4 w-4" /> {Math.round((safeCapacity / income) * 100)}% of take-home, with buffer kept
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Approval ≠ Affordability */}
      <Reveal delay={0.25}>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-slate-500">Lender says you&apos;re eligible for</div>
              <div className="text-[24px] font-extrabold leading-tight text-slate-700 tabular-nums">
                {formatINR(lenderLimitMock)}
              </div>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          </div>

          <div className="rounded-full bg-navy-900 px-4 py-2 text-[13px] font-extrabold tracking-wide text-white">≠</div>

          <div className="flex items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 shadow-card">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-accent text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-indigo-700">You can safely handle</div>
              <div className="text-[24px] font-extrabold leading-tight text-navy-900 tabular-nums">
                {formatINR(safeCapacity)}
                <span className="text-[15px] font-semibold text-slate-500"> /month</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[14px] font-medium text-slate-500">
          Credit approval ≠ Affordability. A lender may approve {formatINR(lenderLimitMock)} — your budget can only
          carry {formatINR(safeCapacity)} a month.
        </p>
      </Reveal>
    </div>
  );
}
