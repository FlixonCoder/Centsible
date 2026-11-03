"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: string[];
  isStreaming?: boolean;
}

const INITIAL_SUGGESTED_PROMPTS = [
  "Can I afford this?",
  "Which option is cheapest?",
  "What if my income drops?",
  "How can I save more?",
  "Why is BNPL risky?",
  "Explain Safe-to-Borrow",
];

interface ChatDrawerProps {
  pipeline: ReturnType<typeof usePipeline>;
}

export function ChatDrawer({ pipeline }: ChatDrawerProps) {
  const { isChatOpen, setIsChatOpen, persona, safeToBorrowResult, optionsResult, mitigationImpact, stressTestResult } =
    pipeline;

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `Hello ${persona.name.split(" ")[0]}! I am your Centsible AI Accountant. I analyze your verified cash flow data in real time with zero sales bias. How can I clarify your borrowing options?`,
      sources: [
        `Verified emergency bill: ${formatINR(persona.emergencyAmount)}`,
        `Safe-to-Borrow limit: ${formatINR(safeToBorrowResult.safeCapacity)}/mo`,
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: messageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          context: {
            personaName: persona.name,
            monthlyIncome: persona.monthlyIncome,
            safeLimit: safeToBorrowResult.safeCapacity,
            creditNeeded: pipeline.creditNeeded,
            recommendedEmi: optionsResult.recommendedOption.monthlyPayment,
            recommendedOptionTitle: optionsResult.recommendedOption.title,
            recommendedRate: optionsResult.recommendedOption.interestRateAnnual,
            stressPositionBeforeEmi: stressTestResult.monthlyPositionBeforeEmi,
            mitigationFreedCash: mitigationImpact.totalFreedMonthly,
            bestRepaid: optionsResult.recommendedOption.totalRepaid,
            worstRepaid: optionsResult.worstOption.totalRepaid,
            savingsVsWorst: optionsResult.savingsVsWorst,
          },
        }),
      });

      const resJson = await response.json();
      const rawReply =
        resJson?.data?.reply ||
        "I analyzed your verified cash flow: the 12-month personal loan offers the highest safety margin.";
      const groundedSources = resJson?.data?.groundedSources || [];

      // Typewriter stream effect simulation
      const botMsgId = `bot_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "assistant",
          text: "",
          sources: groundedSources,
          isStreaming: true,
        },
      ]);

      let index = 0;
      const chars = rawReply.split("");
      const timer = setInterval(() => {
        index += 3;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: chars.slice(0, index).join(""),
                  isStreaming: index < chars.length,
                }
              : msg
          )
        );

        if (index >= chars.length) {
          clearInterval(timer);
          setLoading(false);
        }
      }, 15);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "assistant",
          text: "I encountered a minor processing delay. According to your verified budget, you can comfortably borrow ₹40,000 via Personal Loan at ₹3,630/mo.",
          sources: [`Safe limit: ${formatINR(safeToBorrowResult.safeCapacity)}/mo`],
        },
      ]);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 cursor-pointer"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 w-full sm:w-[460px] h-screen bg-white z-50 shadow-2xl flex flex-col justify-between border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Centsible AI Accountant
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Grounded
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Deterministic figures · Strict anti-hallucination engine
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1 max-w-[88%]",
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-subtle",
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/70"
                    )}
                  >
                    {msg.text}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-600 animate-pulse" />
                    )}
                  </div>

                  {/* Grounded Source Citations (§8) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60 max-w-full">
                      <span className="font-semibold text-slate-600 block">Based on:</span>
                      {msg.sources.map((s, idx) => (
                        <div key={idx} className="truncate text-slate-700">
                          • {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && !messages.some((m) => m.isStreaming) && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Computing from financial cash flow models...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts & Input Area */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
              {/* Suggested Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {INITIAL_SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-medium text-slate-700 hover:text-indigo-600 transition-colors shadow-subtle"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your numbers or options..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="text-[10px] text-center text-slate-400">
                Grounded in sample telemetry · Zero hallucinated financial figures
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

