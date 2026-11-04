"use client";

import { usePathname } from "next/navigation";
import { Sparkles, Leaf, UserCircle, Bell, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  user: {
    id: string;
    name: string;
    age?: number;
    incomeType?: string;
    occupation?: string;
  } | null;
  calmMode: boolean;
  onToggleCalm: () => void;
  onOpenChat: () => void;
}

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Financial Safety Overview",
    subtitle: "Your real-time borrowing capacity and committed debt position",
  },
  "/cash-flow": {
    title: "Cash Flow & Projections",
    subtitle: "Track living expenses and 12-month forward liquidity balance",
  },
  "/obligations": {
    title: "Debts & Obligations",
    subtitle: "Active loan schedule, dues roll-off, and payoff priority",
  },
  "/decision": {
    title: "Emergency Decision History",
    subtitle: "Past analyses and active emergency expense reviews",
  },
  "/decision/new": {
    title: "Decision Lab",
    subtitle: "Evaluate affordability, true costs, and savings before borrowing",
  },
  "/stress-test": {
    title: "Stress Testing Lab",
    subtitle: "Test income drops, 1-month job gaps, and cash flow shock resilience",
  },
  "/savings": {
    title: "Savings Finder",
    subtitle: "Evidence-backed spending adjustments to unlock monthly cash margin",
  },
  "/data": {
    title: "Data & Consent Management",
    subtitle: "Connected sources, DPDP consent records, and data ownership",
  },
  "/settings": {
    title: "Preferences & Risk Parameters",
    subtitle: "Customize buffers, income basis, and display modes",
  },
};

export function TopBar({ user, calmMode, onToggleCalm, onOpenChat }: TopBarProps) {
  const pathname = usePathname();
  const current = titles[pathname] || {
    title: "Centsible",
    subtitle: "Borrow with clarity, not panic",
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#E8EAF3] bg-white/90 backdrop-blur-md px-4 sm:px-6">
      {/* Page Title */}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-[#1E1B4B] tracking-tight">
          {current.title}
        </h1>
        <p className="hidden sm:block text-[11.5px] text-slate-500 font-medium">
          {current.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Calm Mode quick toggle */}
        <button
          onClick={onToggleCalm}
          aria-label="Toggle Calm Mode"
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            calmMode
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
        >
          <Leaf className={cn("w-3.5 h-3.5", calmMode ? "text-emerald-600" : "text-slate-400")} />
          <span className="hidden md:inline">Calm</span>
        </button>

        {/* Persona Chip */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100/80 text-[#2B2A6E]">
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
            {user?.name?.[0] || "P"}
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold leading-none block">{user?.name || "Priya"}</span>
            <span className="text-[10px] text-slate-500 font-medium capitalize">
              {user?.incomeType || "Salaried"}
            </span>
          </div>
        </div>

        {/* Ask Centsible button */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2B2A6E] to-[#4F46E5] text-white text-xs font-bold shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>Ask Centsible</span>
          <span className="hidden lg:inline-block text-[10px] px-1 py-0.2 bg-white/20 rounded font-mono">
            C
          </span>
        </button>
      </div>
    </header>
  );
}

