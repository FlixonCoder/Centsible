"use client";

import { motion } from "framer-motion";
import { AlertCircle, Info, PiggyBank, Sparkles } from "lucide-react";
import { Pipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { Badge, Card, CountUp, Reveal, Slider, StepHeader } from "@/components/ui/primitives";

export function ApplySavings({ pipeline }: { pipeline: Pipeline }) {
  const { persona, savingsApplied, setSavingsApplied, creditNeeded } = pipeline;

  const bill = persona.emergencyAmount;
  const sliderMax = Math.min(Math.max(30000, persona.savingsAvailable), bill - 5000);
  const savingsPct = bill > 0 ? (savingsApplied / bill) * 100 : 0;
  const overAvailable = savingsApplied > persona.savingsAvailable;

  return (
    <div>
      <StepHeader
        step={2}
        kicker="Apply Savings"
        title="Use savings first, borrow only the gap"
        subtitle="Every rupee you cover from savings is a rupee you don't pay interest on."
      />

      <Reveal>
        <Card className="p-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {persona.emergencyTitle} · {persona.emergencyDue.toLowerCase()}
              </div>
              <div className="mt-1 text-[56px] font-extrabold leading-none tracking-tight text-navy-900">
                {formatINR(bill)}
              </div>
            </div>
            <Badge tone="neutral" icon={<PiggyBank className="h-3.5 w-3.5" />}>
              {formatINR(persona.savingsAvailable)} in savings
            </Badge>
          </div>

          {/* Bill split bar */}
          <div className="flex h-16 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
            <motion.div
              className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-[14px] font-bold text-white"
              animate={{ width: `${savingsPct}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            >
              {savingsPct > 14 && <span className="whitespace-nowrap px-2">Savings</span>}
            </motion.div>
            <motion.div
              className="flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-[14px] font-bold text-white"
              layout
            >
              {100 - savingsPct > 14 && <span className="whitespace-nowrap px-2">Credit gap</span>}
            </motion.div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-safe-border bg-safe-bg p-5">
              <div className="text-[12px] font-bold uppercase tracking-wider text-safe-text">From your savings</div>
              <CountUp
                value={savingsApplied}
                duration={0.4}
                className="mt-1 block text-[40px] font-extrabold leading-tight text-safe"
              />
              <div className="text-[13px] text-safe-text/80">No interest, no fees</div>
            </div>
            <div className="rounded-2xl border border-caution-border bg-caution-bg p-5">
              <div className="text-[12px] font-bold uppercase tracking-wider text-caution-text">Credit you need</div>
              <CountUp
                value={creditNeeded}
                duration={0.4}
                className="mt-1 block text-[40px] font-extrabold leading-tight text-caution"
              />
              <div className="text-[13px] text-caution-text/80">This is what we&apos;ll test next</div>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-bold text-navy-900">How much savings do you want to use?</span>
              <span className="text-[13px] text-slate-400">Slide between ₹0 and {formatINR(sliderMax)}</span>
            </div>
            <Slider
              label="Savings to apply"
              min={0}
              max={sliderMax}
              step={1000}
              value={Math.min(savingsApplied, sliderMax)}
              onChange={setSavingsApplied}
              color="#16A34A"
            />
            {overAvailable && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-caution-bg px-3 py-2 text-[13px] font-medium text-caution-text">
                <AlertCircle className="h-4 w-4" />
                That&apos;s more than the {formatINR(persona.savingsAvailable)} linked. Shown for illustration only.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-[14px] text-indigo-900">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-accent" />
            <span>
              <strong>Using savings first lowers what you need to borrow.</strong>{" "}
              <span className="inline-flex items-center gap-1 text-indigo-700/80">
                <Info className="h-3.5 w-3.5" /> Keep a small cushion if you can.
              </span>
            </span>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
