"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
} from "lucide-react";
import { formatINR } from "@/lib/format";

export default function DecisionHistoryPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/decisions").then((res) => res.json()),
      fetch("/api/events").then((res) => res.json()),
    ])
      .then(([decData, evData]) => {
        setDecisions(decData.decisions || []);
        setEvents(evData.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeEvent = events.find((e) => e.status === "active" || e.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header & Launch CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Emergency Borrowing Support</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1E1B4B]">Emergency Decision Lab</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Evaluate instant loans vs savings, test income shocks, and verify true borrowing costs before signing any loan agreement.
          </p>
        </div>

        <Link
          href="/decision/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2B2A6E] to-[#4F46E5] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all group shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Decision Check</span>
        </Link>
      </div>

      {/* Active Pending Event Card */}
      {activeEvent && (
        <div className="bg-amber-50/60 rounded-3xl border border-amber-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Pending Bill
                </span>
                <span className="text-xs text-slate-500">
                  Due: {activeEvent.due}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#1E1B4B] mt-0.5">
                {activeEvent.title} — {formatINR(activeEvent.amount)}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Urgency: <span className="font-semibold capitalize">{activeEvent.urgency}</span> · Non-delayable
              </p>
            </div>
          </div>

          <Link
            href="/decision/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-xs transition-colors shrink-0"
          >
            <span>Run Decision Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Decision Records */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#1E1B4B]">Past Decision Analyses</h3>

        {decisions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No saved decision analyses yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Launch the Decision Lab to run a multi-step check and store a snapshot here.
            </p>
            <Link
              href="/decision/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold mt-2"
            >
              <span>Start New Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisions.map((dec) => {
              const res = JSON.parse(dec.resultJson || "{}");
              const isSafeWithPlan = dec.verdict === "SAFE_WITH_PLAN";

              return (
                <div
                  key={dec.id}
                  className="rounded-2xl border border-slate-200/90 p-5 space-y-3 hover:border-indigo-300 transition-colors bg-[#FAFBFC]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSafeWithPlan
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {dec.verdict}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(dec.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#1E1B4B]">
                      {dec.event?.title || "Emergency Expense"}
                    </h4>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      Amount: {formatINR(dec.event?.amount || 0)} · Option: {dec.selectedOptionId}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-indigo-600 font-bold">
                      Saved ≈ {formatINR(res.heroSavingsVsWorst || 25700)} vs card min
                    </span>
                    <Link
                      href={`/decision/${dec.id}`}
                      className="text-slate-600 font-semibold hover:text-[#1E1B4B] flex items-center gap-1"
                    >
                      <span>View Snapshot</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

