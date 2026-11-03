"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  PiggyBank,
  ShieldAlert,
  Scale,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PipelineStepMeta, StepStatus } from "@/hooks/usePipeline";
import { cn } from "@/lib/utils";

interface PipelineNodeProps {
  step: PipelineStepMeta;
  isActive: boolean;
  onSelect: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Link2,
  PiggyBank,
  ShieldAlert,
  Scale,
  Activity,
  Sparkles,
  CheckCircle2,
};

export function PipelineNode({ step, isActive, onSelect }: PipelineNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = ICON_MAP[step.iconName] || CheckCircle2;

  const isIdle = step.status === "idle";
  const isRunning = step.status === "running";
  const isDone = step.status === "done";
  const isWarning = step.status === "warning";

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden text-left relative",
        // Active border & ring
        isActive
          ? "border-indigo-400/90 bg-indigo-900/60 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-400/30"
          : isDone
          ? "border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/40"
          : isWarning
          ? "border-amber-500/60 bg-amber-950/30 hover:bg-amber-950/40"
          : "border-slate-800/60 bg-slate-950/40 opacity-70"
      )}
    >
      {/* Node Main Header Button */}
      <button
        onClick={onSelect}
        className="w-full p-2.5 flex items-start gap-2.5 text-left focus:outline-none cursor-pointer group"
      >
        {/* Step Indicator Badge / Icon */}
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5 transition-all",
            isRunning && "bg-indigo-600 text-white animate-pulse shadow-glow",
            isDone && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
            isWarning && "bg-amber-500/20 text-amber-400 border border-amber-500/50",
            isIdle && "bg-slate-800 text-slate-400"
          )}
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-300" />
          ) : isWarning ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <span className="text-[11px] font-mono">{step.index}</span>
          )}
        </div>

        {/* Title, Subtitle, and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span
              className={cn(
                "text-xs font-medium truncate tracking-tight",
                isActive ? "text-white font-semibold" : "text-slate-200"
              )}
            >
              {step.index}. {step.shortTitle}
            </span>

            {/* Execution time badge when done */}
            {(isDone || isWarning) && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50 flex items-center gap-1 shrink-0">
                <Clock className="w-2.5 h-2.5 text-slate-400" />
                {step.executionTimeSec}s
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
            {isRunning
              ? "Computing in real time..."
              : isWarning
              ? "Risk flagged · Stress deficit detected"
              : isDone
              ? "Verified · Ready"
              : step.description}
          </p>
        </div>

        {/* Accordion toggle button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/60 transition-colors"
          title="Toggle Input/Output details"
        >
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Accordion Content: Compact Input -> Output mini-view (§2A) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-2.5 pt-1 border-t border-slate-800/60 bg-slate-950/60 text-[11px] font-mono"
          >
            <div className="space-y-1">
              <div className="flex items-start gap-1.5 text-slate-300">
                <span className="text-slate-400 shrink-0 uppercase text-[9px] tracking-wider font-semibold">
                  IN:
                </span>
                <span className="text-slate-200 truncate">{step.inputSummary || "Pending inputs..."}</span>
              </div>
              <div className="flex items-start gap-1.5 text-cyan-300">
                <span className="text-slate-400 shrink-0 uppercase text-[9px] tracking-wider font-semibold flex items-center gap-0.5">
                  <ArrowRight className="w-2 h-2" /> OUT:
                </span>
                <span className="text-cyan-200 font-medium truncate">
                  {step.outputSummary || "Pending calculation..."}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

