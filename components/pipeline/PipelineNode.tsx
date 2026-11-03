"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Link2,
  PiggyBank,
  Scale,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { PipelineStepMeta } from "@/hooks/usePipeline";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Link2,
  PiggyBank,
  ShieldAlert,
  Scale,
  Activity,
  Sparkles,
  CheckCircle2,
};

interface Props {
  step: PipelineStepMeta;
  isActive: boolean;
  canNavigate: boolean;
  onSelect: () => void;
}

export function PipelineNode({ step, isActive, canNavigate, onSelect }: Props) {
  const Icon = ICONS[step.iconName] || CheckCircle2;
  const ref = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState<boolean | null>(null);

  useEffect(() => {
    setManual(null);
    if (isActive) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isActive]);

  const { status } = step;
  const expanded = manual ?? (isActive && status !== "idle" && status !== "running");

  const statusLine =
    status === "running"
      ? "Processing…"
      : status === "warning"
      ? `Risk detected · ${step.outputSummary}`
      : status === "done"
      ? step.outputSummary
      : step.description;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        status === "idle" && "border-white/[0.06] bg-white/[0.02]",
        status === "running" && "border-indigo-300/50 bg-indigo-400/15",
        status === "done" && "border-white/10 bg-white/[0.05]",
        status === "warning" && "border-amber-300/40 bg-amber-400/10",
        isActive && "ring-2 ring-indigo-300/60 ring-offset-0 bg-white/[0.09]"
      )}
    >
      {status === "running" && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          disabled={!canNavigate}
          onClick={onSelect}
          aria-current={isActive ? "step" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left",
            !canNavigate && "cursor-default"
          )}
        >
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors",
              status === "idle" && "border-white/10 bg-white/5 text-slate-400",
              status === "running" && "border-indigo-200/60 bg-indigo-500 text-white animate-pulse",
              status === "done" && "border-emerald-300/40 bg-emerald-400/15 text-emerald-300",
              status === "warning" && "border-amber-300/50 bg-amber-400/20 text-amber-300"
            )}
          >
            {status === "done" ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : status === "warning" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "truncate text-[14px] font-semibold leading-tight",
                  status === "idle" ? "text-slate-400" : "text-white"
                )}
              >
                <span className="mr-1.5 tabular-nums text-slate-400">{step.index}</span>
                {step.shortTitle}
              </span>
              {(status === "done" || status === "warning") && (
                <span className="shrink-0 rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  {step.executionTimeSec.toFixed(1)}s
                </span>
              )}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate text-[12px] leading-tight",
                status === "warning" ? "text-amber-200" : status === "idle" ? "text-slate-500" : "text-slate-300"
              )}
            >
              {statusLine}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setManual(!expanded)}
          aria-label={expanded ? "Hide input and output" : "Show input and output"}
          aria-expanded={expanded}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-3 space-y-2 rounded-xl bg-black/25 p-3 font-mono text-[11.5px] leading-relaxed">
              <div>
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Input</div>
                <div className="break-words text-slate-300">{step.inputSummary}</div>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="h-px flex-1 bg-white/10" />
                <span>↓</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">Output</div>
                <div className="break-words font-semibold text-cyan-200">{step.outputSummary}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
