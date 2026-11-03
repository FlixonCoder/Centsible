"use client";

import { usePipeline } from "@/hooks/usePipeline";
import { PipelinePanel } from "@/components/pipeline/PipelinePanel";
import { LinkData } from "@/components/steps/LinkData";
import { ApplySavings } from "@/components/steps/ApplySavings";
import { SafeToBorrow } from "@/components/steps/SafeToBorrow";
import { CompareOptions } from "@/components/steps/CompareOptions";
import { StressTest } from "@/components/steps/StressTest";
import { Mitigation } from "@/components/steps/Mitigation";
import { Decision } from "@/components/steps/Decision";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bot,
  Eye,
  Shield,
  HelpCircle,
  CheckCircle,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const pipeline = usePipeline();
  const {
    currentStep,
    goToStep,
    persona,
    calmMode,
    setCalmMode,
    isChatOpen,
    setIsChatOpen,
  } = pipeline;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <LinkData pipeline={pipeline} />;
      case 2:
        return <ApplySavings pipeline={pipeline} />;
      case 3:
        return <SafeToBorrow pipeline={pipeline} />;
      case 4:
        return <CompareOptions pipeline={pipeline} />;
      case 5:
        return <StressTest pipeline={pipeline} />;
      case 6:
        return <Mitigation pipeline={pipeline} />;
      case 7:
        return <Decision pipeline={pipeline} />;
      default:
        return <LinkData pipeline={pipeline} />;
    }
  };

  return (
    <div
      className={cn(
        "flex h-screen w-screen overflow-hidden",
        calmMode ? "bg-[#F3F4F9]" : "bg-background"
      )}
    >
      {/* Zone A: Left panel — "Processing Flow" (~320px fixed) */}
      <PipelinePanel pipeline={pipeline} />

      {/* Zone B: Main stage (flex-1) */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Slim Top Bar */}
        <header className="h-14 px-6 border-b border-cardborder bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
          {/* Left: Step progress dots */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Pipeline Stage:
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => goToStep(num)}
                  className={cn(
                    "w-6 h-6 rounded-full text-[11px] font-mono font-semibold flex items-center justify-center transition-all",
                    currentStep === num
                      ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                      : num < currentStep
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  )}
                  title={`Step ${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Persona chip, Calm Mode toggle, & AI button */}
          <div className="flex items-center gap-3">
            {/* Persona Chip */}
            <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span className="font-semibold">{persona.name.split(" ")[0]}, {persona.age}</span>
              <span className="text-slate-400 hidden md:inline">({persona.role})</span>
            </div>

            {/* Calm Mode Toggle (§6) */}
            <button
              onClick={() => setCalmMode(!calmMode)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all",
                calmMode
                  ? "bg-purple-100 border-purple-300 text-purple-800"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              title="Calm Mode softens harsh alert colors into soothing tones"
            >
              <Heart className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Calm Mode</span>
            </button>

            {/* Floating / Header Ask Centsible AI Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask Centsible</span>
            </button>
          </div>
        </header>

        {/* Main Content View with Page Transition */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex-1"
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>

          {/* Small Projector & Pitch Footer */}
          <footer className="mt-8 pt-4 border-t border-slate-200/60 text-center text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-400" />
              Centsible — Financial Emergency Decision Assistant · IDEATHON 2026
            </span>
            <span>Illustrative figures · Sample data</span>
          </footer>
        </div>
      </main>

      {/* Zone C: AI Accountant (right-side slide-over drawer) */}
      <ChatDrawer pipeline={pipeline} />
    </div>
  );
}

