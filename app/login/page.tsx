"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Zap, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelectPersona = async (userId: string) => {
    setLoading(true);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2B2A6E] to-[#4F46E5] text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-100">
            <span className="font-extrabold text-xl">C₹</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1E1B4B]">Welcome to Centsible</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Choose a verified sample persona to explore real-time decision testing and cash flow stress analysis.
          </p>
        </div>

        <div className="space-y-3">
          {/* Priya */}
          <button
            onClick={() => handleSelectPersona("priya")}
            disabled={loading}
            className="w-full p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-500 bg-[#FAFBFC] hover:bg-indigo-50/30 text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#1E1B4B]">Priya, 26</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                    Default
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Salaried · ₹45,000/mo take-home
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                  Emergency: ₹60,000 dental surgery
                </p>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Arjun */}
          <button
            onClick={() => handleSelectPersona("arjun")}
            disabled={loading}
            className="w-full p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-500 bg-[#FAFBFC] hover:bg-indigo-50/30 text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#1E1B4B]">Arjun, 29</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700">
                    Gig Worker
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Variable Income · avg ₹30,000/mo (±25%)
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                  Emergency: ₹25,000 laptop repair
                </p>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
          <span>Single-device local SQLite · 100% offline & privacy-safe</span>
        </div>
      </div>
    </div>
  );
}

