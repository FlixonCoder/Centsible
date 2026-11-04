"use client";

import { useEffect, useState } from "react";
import {
  PiggyBank,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Sparkles,
  Utensils,
  Train,
  Tv,
  ShoppingBag,
  Zap,
  ShieldCheck,
  ChevronRight,
  Clock,
  Layers,
} from "lucide-react";
import { formatINR } from "@/lib/format";

const iconMap: Record<string, any> = {
  cut_food_delivery: Utensils,
  cut_cab_rides: Train,
  pause_subscriptions: Tv,
  cap_impulse_shopping: ShoppingBag,
  debt_avalanche_tip: Zap,
  roundup_emergency_fund: ShieldCheck,
};

export default function SavingsFinderPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = () => {
    fetch("/api/savings/suggestions")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleAction = async (actionId: string, status: "accepted" | "dismissed") => {
    try {
      await fetch(`/api/savings/actions/${actionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchSuggestions();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const { suggestions, totalFreedMonthly, potentialTotalFreed, acceptedCount } = data;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2B2A6E] to-[#4F46E5] text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Evidence-Based Mitigation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Savings Finder
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl">
            Detects realistic spending adjustments from your past 90 days of transactions to free up cash margin and flip emergency stress tests positive.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
          <div>
            <p className="text-[10.5px] uppercase font-bold text-indigo-200 tracking-wider">
              Freed Cash Margin
            </p>
            <p className="text-3xl font-extrabold font-mono text-emerald-300">
              +{formatINR(totalFreedMonthly)}<span className="text-sm font-normal text-white">/mo</span>
            </p>
            <p className="text-[10.5px] text-indigo-100/70 mt-0.5">
              {acceptedCount} habits accepted ({formatINR(potentialTotalFreed)} potential)
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1E1B4B]">Detected Spending Leaks & Habits</h3>
          <span className="text-xs text-slate-400">Zero shaming · 100% actionable</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((s: any) => {
            const Icon = iconMap[s.id] || Sparkles;
            const isAccepted = s.status === "accepted";
            const isDismissed = s.status === "dismissed";

            return (
              <div
                key={s.id}
                className={`rounded-2xl border p-5 space-y-4 transition-all flex flex-col justify-between ${
                  isAccepted
                    ? "bg-emerald-50/30 border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs"
                    : isDismissed
                    ? "bg-slate-50/80 border-slate-200 opacity-50"
                    : "bg-white border-[#E8EAF3] hover:border-indigo-300 shadow-xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {s.detector}
                      </span>
                    </div>

                    {s.isActionableCut && (
                      <span className="text-xs font-extrabold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        +{formatINR(s.monthlySaving)}/mo
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#1E1B4B]">{s.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  {s.rationale && (
                    <div className="p-2.5 rounded-xl bg-[#F8F9FC] border border-slate-200/80 text-[11px] text-slate-600">
                      <strong className="text-slate-800">Evidence: </strong>
                      {s.rationale}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    Effort: {s.effort}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(s.id, "dismissed")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        isDismissed
                          ? "bg-slate-200 text-slate-700"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Dismiss
                    </button>

                    <button
                      onClick={() => handleAction(s.id, "accepted")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        isAccepted
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-[#2B2A6E] text-white hover:bg-[#4F46E5]"
                      }`}
                    >
                      {isAccepted ? "Accepted ✓" : "Accept Habit"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

