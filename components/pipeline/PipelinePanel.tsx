"use client";

import { usePipeline } from "@/hooks/usePipeline";
import { PipelineNode } from "./PipelineNode";
import { DataPacket } from "./DataPacket";
import { Play, Pause, RotateCcw, ShieldCheck, UserCheck, Sparkles } from "lucide-react";
import { PERSONAS } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

interface PipelinePanelProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function PipelinePanel({ pipeline }: PipelinePanelProps) {
  const {
    currentStep,
    goToStep,
    stepStates,
    isPlayingDemo,
    setIsPlayingDemo,
    resetPipeline,
    personaId,
    setPersonaId,
    persona,
  } = pipeline;

  return (
    <aside className="w-[320px] shrink-0 h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white border-r border-slate-800 flex flex-col justify-between select-none z-20 shadow-2xl overflow-y-auto">
      {/* Top Header & Brand */}
      <div className="p-4 pb-3 border-b border-slate-800/80 bg-navy-950/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-500 flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">
                Centsible
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                IDEATHON
              </span>
            </div>
            <p className="text-[11px] text-slate-300 tracking-tight leading-none mt-0.5">
              Borrow with clarity, not panic.
            </p>
          </div>
        </div>

        {/* Pipeline Engine Sub-bar */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Decision Engine v2.4
          </span>
          <span className="text-slate-300 font-medium">Step {currentStep} of 7</span>
        </div>
      </div>

      {/* Center: 7 Processing Nodes with animated DataPackets */}
      <div className="p-3.5 space-y-0.5 flex-1 overflow-y-auto">
        {stepStates.map((step, idx) => {
          const isCurrent = currentStep === step.index;
          const isNextRunning =
            step.index === currentStep && isPlayingDemo;

          return (
            <div key={step.id}>
              <PipelineNode
                step={step}
                isActive={isCurrent}
                onSelect={() => goToStep(step.index)}
              />

              {/* Data packet connector between nodes */}
              {idx < stepStates.length - 1 && (
                <DataPacket
                  isRunning={isCurrent || isNextRunning}
                  isWarning={step.index === 5 && step.hasRiskWarning}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Controls: Persona Switcher + Play Demo + Reset */}
      <div className="p-3.5 border-t border-slate-800 bg-navy-950/70 backdrop-blur-md space-y-2.5">
        {/* Persona Selector Chips */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-300 uppercase tracking-wider font-semibold mb-1">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-indigo-400" />
              Demo Persona
            </span>
            <span className="text-indigo-400 capitalize">{persona.role}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            {Object.values(PERSONAS).map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonaId(p.id)}
                className={cn(
                  "py-1 px-1.5 rounded-md text-[11px] font-medium transition-all text-center truncate",
                  personaId === p.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )}
                title={`${p.name} (${p.tagline})`}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Play Demo & Reset */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => setIsPlayingDemo(!isPlayingDemo)}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer",
              isPlayingDemo
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50"
            )}
          >
            {isPlayingDemo ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Demo (Auto)</span>
              </>
            )}
          </button>

          <button
            onClick={resetPipeline}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Keyboard navigation helper */}
        <div className="text-[10px] text-slate-400 text-center font-mono flex items-center justify-center gap-2 pt-0.5">
          <span>
            <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">←</kbd>{" "}
            <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">→</kbd> Steps
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">Space</kbd> Play
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">C</kbd> AI
          </span>
        </div>
      </div>
    </aside>
  );
}

