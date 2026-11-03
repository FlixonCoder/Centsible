"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { Pipeline } from "@/hooks/usePipeline";
import { PERSONAS } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { PipelineNode } from "./PipelineNode";
import { DataPacket } from "./DataPacket";

export function PipelinePanel({ pipeline }: { pipeline: Pipeline }) {
  const {
    currentStep,
    maxReached,
    goToStep,
    stepStates,
    isPlayingDemo,
    togglePlayDemo,
    resetPipeline,
    personaId,
    setPersonaId,
  } = pipeline;

  return (
    <aside className="left-panel-bg relative z-20 flex h-screen w-[320px] shrink-0 flex-col text-white shadow-2xl">
      {/* Brand */}
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 text-xl font-black shadow-glow">
            C
          </div>
          <div>
            <div className="text-[22px] font-extrabold leading-none tracking-tight">Centsible</div>
            <div className="mt-1 text-[12.5px] text-indigo-200/90">Borrow with clarity, not panic.</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px]">
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
            Processing flow
          </span>
          <span className="font-mono text-slate-400">{currentStep}/7</span>
        </div>
      </div>

      {/* Nodes */}
      <nav aria-label="Processing flow" className="dark-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        {stepStates.map((step, i) => {
          const next = stepStates[i + 1];
          return (
            <div key={step.id}>
              <PipelineNode
                step={step}
                isActive={currentStep === step.index}
                canNavigate={step.index <= maxReached}
                onSelect={() => goToStep(step.index)}
              />
              {next && (
                <DataPacket
                  active={step.status === "running" || next.status === "running"}
                  warning={step.hasRiskWarning}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Controls */}
      <div className="space-y-3 border-t border-white/10 bg-black/20 px-4 pb-4 pt-3.5 backdrop-blur">
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Persona</div>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {Object.values(PERSONAS).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonaId(p.id)}
                title={`${p.name} — ${p.tagline}`}
                className={cn(
                  "rounded-lg px-1 py-1.5 text-[12.5px] font-semibold transition-all",
                  personaId === p.id
                    ? "bg-white text-navy-900 shadow"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {p.name.split(" ")[0]}
                <span className="ml-1 font-normal opacity-60">{p.age}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={togglePlayDemo}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold shadow-lg transition-all active:scale-[0.98]",
              isPlayingDemo
                ? "bg-amber-500 text-navy-950 hover:bg-amber-400"
                : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400"
            )}
          >
            {isPlayingDemo ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            {isPlayingDemo ? "Pause" : "Play Demo"}
          </button>
          <button
            type="button"
            onClick={resetPipeline}
            aria-label="Reset"
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="hidden justify-center gap-3 text-[10.5px] text-slate-500 [@media(min-height:860px)]:flex">
          <span>
            <kbd className="rounded bg-white/10 px-1 text-slate-300">←</kbd>{" "}
            <kbd className="rounded bg-white/10 px-1 text-slate-300">→</kbd> steps
          </span>
          <span>
            <kbd className="rounded bg-white/10 px-1 text-slate-300">Space</kbd> play
          </span>
          <span>
            <kbd className="rounded bg-white/10 px-1 text-slate-300">C</kbd> chat
          </span>
        </div>
      </div>
    </aside>
  );
}
