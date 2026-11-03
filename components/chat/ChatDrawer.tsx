"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Database, Send, X } from "lucide-react";
import { Pipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SuggestedPrompts } from "./SuggestedPrompts";

interface Msg {
  id: string;
  from: "user" | "bot";
  text: string;
  sources?: string[];
  streaming?: boolean;
}

export function ChatDrawer({ pipeline }: { pipeline: Pipeline }) {
  const {
    isChatOpen,
    setIsChatOpen,
    persona,
    basePersona,
    safeToBorrowResult,
    optionsResult,
    mitigationImpact,
    stressTestResult,
    creditNeeded,
  } = pipeline;

  const first = basePersona.name.split(" ")[0];
  const welcome = (): Msg => ({
    id: "welcome",
    from: "bot",
    text: `Hi ${first}! Ask me anything about your numbers. I only answer from what Centsible has calculated — no guesses.`,
    sources: [`Safe-to-Borrow ${formatINR(safeToBorrowResult.safeCapacity)}/mo`, `Credit needed ${formatINR(creditNeeded)}`],
  });

  const [messages, setMessages] = useState<Msg[]>([welcome()]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fresh conversation when persona changes
  useEffect(() => {
    setMessages([welcome()]);
    setBusy(false);
    if (typeTimer.current) clearInterval(typeTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePersona.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(
    () => () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
    },
    []
  );

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: "user", text: t }]);
    setInput("");
    setBusy(true);

    let reply = "";
    let sources: string[] = [];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: t,
          context: {
            personaName: persona.name,
            monthlyIncome: persona.monthlyIncome,
            safeLimit: safeToBorrowResult.safeCapacity,
            creditNeeded,
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
      const json = await res.json();
      reply = json?.data?.reply;
      sources = json?.data?.groundedSources || [];
    } catch {
      /* fall through to offline answer */
    }
    if (!reply) {
      reply = `Based on your numbers: a safe limit of ${formatINR(safeToBorrowResult.safeCapacity)}/month and a ${formatINR(
        creditNeeded
      )} gap. The ${optionsResult.recommendedOption.title.toLowerCase()} at ${formatINR(
        optionsResult.recommendedOption.monthlyPayment
      )}/month fits.`;
      sources = [`Safe-to-Borrow ${formatINR(safeToBorrowResult.safeCapacity)}/mo`];
    }

    const id = `b${Date.now()}`;
    setMessages((m) => [...m, { id, from: "bot", text: "", sources, streaming: true }]);
    let i = 0;
    typeTimer.current = setInterval(() => {
      i += 3;
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: reply.slice(0, i), streaming: i < reply.length } : x)));
      if (i >= reply.length) {
        if (typeTimer.current) clearInterval(typeTimer.current);
        setBusy(false);
      }
    }, 14);
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 z-40 bg-navy-950/35 backdrop-blur-[2px]"
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Ask Centsible"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full flex-col bg-white shadow-2xl sm:w-[480px]"
          >
            <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-navy-900 to-navy-800 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[17px] font-extrabold leading-tight">Ask Centsible</div>
                  <div className="text-[12px] text-indigo-200">AI Accountant · answers only from your data</div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsChatOpen(false)}
                className="rounded-lg p-2 text-indigo-200 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-5 py-5">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex flex-col gap-1.5", m.from === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed",
                      m.from === "user"
                        ? "rounded-br-md bg-primary-accent text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
                    )}
                  >
                    {m.text}
                    {m.streaming && <span className="ml-0.5 inline-block h-4 w-[3px] animate-pulse bg-primary-accent align-middle" />}
                  </div>
                  {m.from === "bot" && !m.streaming && m.sources && m.sources.length > 0 && (
                    <div className="flex max-w-[90%] items-start gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-[12px] leading-snug text-indigo-800">
                      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        <strong>Based on:</strong> {m.sources.join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {busy && !messages.some((m) => m.streaming) && (
                <div className="text-[13px] text-slate-400">Checking your numbers…</div>
              )}
              <div ref={endRef} />
            </div>

            <div className="space-y-3 border-t border-slate-100 bg-white px-5 pb-5 pt-4">
              <SuggestedPrompts onPick={send} disabled={busy} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your options…"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14.5px] outline-none transition focus:border-primary-accent focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Send"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-accent text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-40"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
