"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Link2,
  PiggyBank,
  Scale,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { DataPacket } from "./DataPacket";

interface StepNodeData {
  index: number;
  id: string;
  title: string;
  subtitle: string;
  status: "idle" | "running" | "done" | "warning";
  computeMs: number;
  inputOutput: {
    inputs: string;
    output: string;
  };
}

interface MinimizableDataFlowProps {
  currentStep: number;
  onSelectStep: (stepIndex: number) => void;
  engineData?: any;
}

export function MinimizableDataFlow({
  currentStep,
  onSelectStep,
  engineData,
}: MinimizableDataFlowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedNode, setExpandedNode] = useState<number | null>(currentStep);

  const profile = engineData?.profile;
  const decision = engineData?.decision;
  const mitigation = engineData?.mitigation;

  const nodes: StepNodeData[] = [
    {
      index: 1,
      id: "expense",
      title: "1. Emergency Bill",
      subtitle: "Verified non-delayable event",
      status: currentStep > 1 ? "done" : "running",
      computeMs: 0.2,
      inputOutput: {
        inputs: "Medical bill due Fri 6 Nov",
        output: "₹60,000",
      },
    },
    {
      index: 2,
      id: "savings",
      title: "2. Apply Savings",
      subtitle: "Lower debt requirement",
      status: currentStep > 2 ? "done" : currentStep === 2 ? "running" : "idle",
      computeMs: 0.3,
      inputOutput: {
        inputs: "Bill ₹60k − ₹20k savings",
        output: "₹40,000 credit",
      },
    },
    {
      index: 3,
      id: "capacity",
      title: "3. Safe-to-Borrow",
      subtitle: "Monthly capacity limit",
      status: currentStep > 3 ? "done" : currentStep === 3 ? "running" : "idle",
      computeMs: 0.4,
      inputOutput: {
        inputs: "₹45k − ₹24.5k − ₹14k − ₹2k",
        output: `${formatINR(profile?.safeToBorrow || 4500)}/mo`,
      },
    },
    {
      index: 4,
      id: "options",
      title: "4. Compare Options",
      subtitle: "True lifetime cost comparison",
      status: currentStep > 4 ? "done" : currentStep === 4 ? "running" : "idle",
      computeMs: 0.6,
      inputOutput: {
        inputs: "4 Options evaluated",
        output: "Personal Loan (₹3,630/mo)",
      },
    },
    {
      index: 5,
      id: "mitigation",
      title: "5. Mitigation Layer",
      subtitle: "Freed monthly cash margin",
      status: currentStep > 5 ? "done" : currentStep === 5 ? "running" : "idle",
      computeMs: 0.5,
      inputOutput: {
        inputs: "4 Actionable habit cuts",
        output: `+${formatINR(mitigation?.activeMitigationMonthly || 3283)}/mo`,
      },
    },
    {
      index: 6,
      id: "verdict",
      title: "6. Decision Verdict",
      subtitle: "Final recommendation & plan",
      status: currentStep === 6 ? "done" : "idle",
      computeMs: 0.3,
      inputOutput: {
        inputs: "Safe with plan & dues roll-off",
        output: `Save ≈ ${formatINR(decision?.heroSavingsVsWorst || 25700)}`,
      },
    },
  ];

  if (isMinimized) {
    return (
      <div className="fixed left-0 top-24 z-30">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-[#1E1B4B] hover:bg-[#2B2A6E] text-white py-2.5 px-3 rounded-r-2xl border-y border-r border-indigo-500/40 shadow-xl transition-all group"
          title="Expand Data Flow Pipeline"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-bold tracking-tight">Data Flow</span>
          <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-[#1E1B4B] rounded-3xl border border-indigo-900/60 p-4 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Processing Flow
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Minimize Window"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Pipeline Nodes List */}
        <div className="py-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {nodes.map((node, i) => {
            const isActive = currentStep === node.index;
            const isExpanded = expandedNode === node.index;
            const isDone = node.status === "done";
            const nextNode = nodes[i + 1];

            return (
              <div key={node.id}>
                <div
                  onClick={() => {
                    onSelectStep(node.index);
                    setExpandedNode(isExpanded ? null : node.index);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? "bg-white/15 border-indigo-400/80 shadow-[0_0_12px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400"
                      : isDone
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-tight text-white">
                      {node.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                        {node.computeMs}s
                      </span>
                      {isDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-indigo-200/80 mt-0.5 truncate">
                    {node.subtitle}
                  </p>

                  {/* Input -> Output Mini View */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-white/10 text-[10.5px] font-mono space-y-1 bg-black/20 p-2 rounded-lg"
                    >
                      <div className="text-slate-300">
                        <span className="text-slate-500">In: </span>
                        {node.inputOutput.inputs}
                      </div>
                      <div className="text-cyan-300 font-bold">
                        <span className="text-slate-500">Out: </span>
                        {node.inputOutput.output}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Animated Data Packet Connector */}
                {nextNode && (
                  <DataPacket
                    active={isActive || node.status === "running"}
                    warning={node.status === "warning"}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10.5px] text-indigo-200/70">
        <span>Deterministic engine</span>
        <span className="font-mono text-cyan-300">v2.0</span>
      </div>
    </aside>
  );
}

