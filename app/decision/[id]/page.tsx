"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Activity,
  Calendar,
} from "lucide-react";
import { formatINR } from "@/lib/format";

export default function SavedDecisionViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/decision/${id}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.decision);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const { event, result, inputs, trace, createdAt } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/decision"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Decisions</span>
        </Link>

        <span className="text-xs text-slate-400">
          Saved on: {new Date(createdAt).toLocaleString("en-IN")}
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {result.verdictTier || data.verdict}
              </span>
              <span className="text-xs text-slate-500">Decision Snapshot</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
              {event?.title || "Emergency Check"} — {formatINR(event?.amount || 0)}
            </h2>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Hero Savings */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Computed Lifetime Savings
            </p>
            <p className="text-3xl font-extrabold mt-0.5">
              Saved ≈ {formatINR(result.heroSavingsVsWorst || 25700)}
            </p>
            <p className="text-xs text-emerald-100 mt-1">
              Vs revolving credit card minimum dues at 42% APR
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-emerald-200 hidden sm:block" />
        </div>

        {/* Reasons */}
        {result.reasons && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verdict Rationales
            </h3>
            <div className="space-y-2">
              {result.reasons.map((r: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

