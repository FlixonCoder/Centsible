"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MessageCircleQuestion, RotateCcw } from "lucide-react";
import { STEP_DEFINITIONS, usePipeline } from "@/hooks/usePipeline";
import { PipelinePanel } from "@/components/pipeline/PipelinePanel";
import { LinkData } from "@/components/steps/LinkData";
import { ApplySavings } from "@/components/steps/ApplySavings";
import { SafeToBorrow } from "@/components/steps/SafeToBorrow";
import { CompareOptions } from "@/components/steps/CompareOptions";
import { StressTest } from "@/components/steps/StressTest";
import { Mitigation } from "@/components/steps/Mitigation";
import { Decision } from "@/components/steps/Decision";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { StepSkeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const CTA = [
  "Apply savings",
  "Check safe-to-borrow",
  "Compare true costs",
  "Run the stress test",
  "Find ways to fix this",
  "See my decision",
];

export default function Home() {
  const pipeline = usePipeline();
  const {
    currentStep,
    maxReached,
    processingStep,
    goToStep,
    persona,
    stepStates,
    calmMode,
    setCalmMode,
    setIsChatOpen,
    resetPipeline,
  } = pipeline;

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  const processing = processingStep !== null;
  const meta = STEP_DEFINITIONS[currentStep - 1];

  const screens = [LinkData, ApplySavings, SafeToBorrow, CompareOptions, StressTest, Mitigation, Decision];
  const Screen = screens[currentStep - 1];

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("app-bg flex h-screen w-screen overflow-hidden", calmMode && "calm")}>
        <PipelinePanel pipeline={pipeline} />

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-cardborder bg-white/75 px-10 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Progress">
                {stepStates.map((s) => {
                  const active = s.index === currentStep;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Step ${s.index}: ${s.title}`}
                      disabled={s.index > maxReached}
                      onClick={() => goToStep(s.index)}
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-300",
                        active ? "w-9" : "w-2.5",
                        active
                          ? "bg-primary-accent"
                          : s.status === "warning"
                          ? "bg-amber-400"
                          : s.index <= maxReached
                          ? "bg-indigo-300 hover:bg-indigo-400"
                          : "bg-slate-200"
                      )}
                    />
                  );
                })}
              </div>
              <div className="text-[14px] font-semibold text-slate-500">
                Step {currentStep} of 7 <span className="mx-1.5 text-slate-300">·</span>
                <span className="text-navy-900">{meta.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 rounded-full border border-cardborder bg-white py-1 pl-1 pr-4 shadow-sm">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[13px] font-bold text-white">
                  {persona.name[0]}
                </span>
                <span className="text-[14px] font-bold text-navy-900">
                  {persona.name.split(" ")[0]}, {persona.age}
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={calmMode}
                onClick={() => setCalmMode(!calmMode)}
                title="Calm Mode: softer colours, no pulsing motion"
                className="flex items-center gap-2.5 text-[14px] font-semibold text-slate-600"
              >
                Calm Mode
                <span className={cn("relative h-6 w-11 rounded-full transition-colors", calmMode ? "bg-violet-500" : "bg-slate-300")}>
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      calmMode ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </span>
              </button>
            </div>
          </header>

          {/* Stage */}
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1200px] px-10 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep}-${processing}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {processing ? <StepSkeleton /> : <Screen pipeline={pipeline} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom bar */}
          <footer className="flex h-[76px] shrink-0 items-center justify-between border-t border-cardborder bg-white/85 px-10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <span className="hidden text-[12px] font-medium text-slate-400 lg:block">
              Illustrative figures · Sample data
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 rounded-full bg-navy-900 px-5 py-3 text-[14px] font-bold text-white shadow-lift transition hover:bg-navy-800 active:scale-[0.98]"
              >
                <MessageCircleQuestion className="h-[18px] w-[18px] text-amber-300" />
                Ask Centsible
              </button>

              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={() => goToStep(currentStep + 1)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-accent to-violet-600 px-6 py-3 text-[14.5px] font-bold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]"
                >
                  {CTA[currentStep - 1]} <ArrowRight className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetPipeline}
                  className="flex items-center gap-2 rounded-full border-2 border-navy-900 px-6 py-[10px] text-[14.5px] font-bold text-navy-900 transition hover:bg-navy-900 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" /> Restart demo
                </button>
              )}
            </div>
          </footer>
        </main>

        <ChatDrawer pipeline={pipeline} />
      </div>
    </MotionConfig>
  );
}
