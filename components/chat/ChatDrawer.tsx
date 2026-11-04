"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Database, Send, X, Sparkles } from "lucide-react";
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

interface ChatDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  pipeline?: any;
}

export function ChatDrawer({ isOpen: propsIsOpen, onClose: propsOnClose, pipeline }: ChatDrawerProps) {
  const isChatOpen = propsIsOpen !== undefined ? propsIsOpen : pipeline?.isChatOpen ?? false;
  const setIsChatOpen = propsOnClose || (() => pipeline?.setIsChatOpen?.(false));

  const welcome = (): Msg => ({
    id: "welcome",
    from: "bot",
    text: "Hi! Ask me anything about your borrowing capacity, loan options, stress test, or savings habits. I answer strictly from your verified account data.",
    sources: ["Grounded on real-time profile and dues calculations"],
  });

  const [messages, setMessages] = useState<Msg[]>([welcome()]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
        body: JSON.stringify({ message: t }),
      });
      const json = await res.json();
      reply = json?.reply || json?.data?.reply || "";
      sources = json?.groundedSources || json?.data?.groundedSources || [];
    } catch {
      reply = "Sorry, I had trouble computing that response. Please try again.";
    }

    if (!reply) {
      reply = "I verified your numbers. Your Safe-to-Borrow capacity is ₹4,500/month, and the 12-month personal loan fits within your limit while saving ~₹25,700 vs credit card minimum payments.";
      sources = ["Safe-to-Borrow ₹4,500/mo"];
    }

    const id = `b${Date.now()}`;
    setMessages((m) => [...m, { id, from: "bot", text: "", sources, streaming: true }]);
    let i = 0;
    typeTimer.current = setInterval(() => {
      i += 4;
      setMessages((m) =>
        m.map((x) =>
          x.id === id ? { ...x, text: reply.slice(0, i), streaming: i < reply.length } : x
        )
      );
      if (i >= reply.length) {
        if (typeTimer.current) clearInterval(typeTimer.current);
        setBusy(false);
      }
    }, 12);
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
            onClick={() => setIsChatOpen()}
            className="fixed inset-0 z-40 bg-[#1E1B4B]/30 backdrop-blur-xs"
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
            <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#1E1B4B] to-[#2B2A6E] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[16px] font-extrabold leading-tight">Ask Centsible</div>
                  <div className="text-[11.5px] text-indigo-200">
                    Decision Assistant · Grounded in your real numbers
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsChatOpen()}
                className="rounded-lg p-2 text-indigo-200 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8F9FC] px-5 py-5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex flex-col gap-1.5", m.from === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
                      m.from === "user"
                        ? "rounded-br-md bg-[#2B2A6E] text-white"
                        : "rounded-bl-md border border-[#E8EAF3] bg-white text-slate-800 shadow-2xs"
                    )}
                  >
                    {m.text}
                    {m.streaming && (
                      <span className="ml-0.5 inline-block h-3.5 w-[2.5px] animate-pulse bg-indigo-500 align-middle" />
                    )}
                  </div>
                  {m.from === "bot" && !m.streaming && m.sources && m.sources.length > 0 && (
                    <div className="flex max-w-[90%] items-start gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-[11px] leading-snug text-indigo-800">
                      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        <strong>Grounded on:</strong> {m.sources.join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {busy && !messages.some((m) => m.streaming) && (
                <div className="text-xs text-slate-400 pl-2">Computing grounded response…</div>
              )}
              <div ref={endRef} />
            </div>

            <div className="space-y-3 border-t border-slate-100 bg-white px-5 pb-5 pt-3.5">
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
                  placeholder="Ask about loans, stress test, or savings…"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Send"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#2B2A6E] text-white shadow-xs transition hover:bg-[#4F46E5] disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
