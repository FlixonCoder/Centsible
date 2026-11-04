"use client";

import { useEffect, useState } from "react";
import { Sliders, Leaf, Shield, Wallet, Save, Check } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useApp } from "@/components/shell/AppLayout";

export default function SettingsPage() {
  const { calmMode, toggleCalmMode, user } = useApp();
  const [bufferAmount, setBufferAmount] = useState(2000);
  const [bufferMode, setBufferMode] = useState<"fixed" | "data">("fixed");
  const [incomeBasis, setIncomeBasis] = useState<"average" | "weak_month">("average");
  const [foirCap, setFoirCap] = useState(55);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.bufferAmount) setBufferAmount(user.bufferAmount);
      if (user.bufferMode) setBufferMode(user.bufferMode);
      if (user.incomeBasis) setIncomeBasis(user.incomeBasis);
    }
  }, [user]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white border border-[#E8EAF3] p-6 sm:p-8 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
          <Sliders className="w-3.5 h-3.5" />
          <span>Engine Parameters</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#1E1B4B]">
          Preferences & Risk Parameters
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
          Adjust risk margins, buffer modes, and display aesthetics to match your risk tolerance.
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
        {/* Calm Mode */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#1E1B4B]">Calm Mode</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Softens contrast, simplifies dense charts, and uses gentle reassuring language during financial stress.
            </p>
          </div>

          <button
            onClick={toggleCalmMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              calmMode ? "bg-emerald-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                calmMode ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Safety Buffer Setting */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#1E1B4B]">Safety Buffer Reserve</h3>
              <p className="text-xs text-slate-500">
                Floor amount kept aside each month before computing Safe-to-Borrow capacity.
              </p>
            </div>
            <span className="text-sm font-mono font-bold text-indigo-600">
              {formatINR(bufferAmount)}
            </span>
          </div>

          <input
            type="range"
            min={1000}
            max={5000}
            step={500}
            value={bufferAmount}
            onChange={(e) => setBufferAmount(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                setBufferMode("fixed");
                setBufferAmount(2000);
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                bufferMode === "fixed"
                  ? "border-indigo-500 bg-indigo-50/60 font-semibold text-indigo-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="block font-bold">Fixed Floor (₹2,000)</span>
              <span className="text-[11px] text-slate-500">Baseline buffer matching pitch deck</span>
            </button>

            <button
              onClick={() => {
                setBufferMode("data");
                setBufferAmount(3000);
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                bufferMode === "data"
                  ? "border-indigo-500 bg-indigo-50/60 font-semibold text-indigo-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="block font-bold">Conservative (₹3,000)</span>
              <span className="text-[11px] text-slate-500">Derived from historical irregular spends</span>
            </button>
          </div>
        </div>

        {/* Income Basis (Gig Workers) */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">Income Basis (Variable & Gig Income)</h3>
            <p className="text-xs text-slate-500">
              Select which income baseline drives headline numbers for irregular income earners.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIncomeBasis("average")}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                incomeBasis === "average"
                  ? "border-indigo-500 bg-indigo-50/60 font-semibold text-indigo-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="block font-bold">Typical Month (Average)</span>
              <span className="text-[11px] text-slate-500">6-month mean take-home income</span>
            </button>

            <button
              onClick={() => setIncomeBasis("weak_month")}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                incomeBasis === "weak_month"
                  ? "border-indigo-500 bg-indigo-50/60 font-semibold text-indigo-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <span className="block font-bold">Weak Month (25th Percentile)</span>
              <span className="text-[11px] text-slate-500">Conservative margin for slow gigs</span>
            </button>
          </div>
        </div>

        {/* Advanced: FOIR Cap */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Lender FOIR / DTI Ceiling</span>
            <span className="font-mono font-bold text-slate-900">{foirCap}%</span>
          </div>
          <input
            type="range"
            min={40}
            max={65}
            step={5}
            value={foirCap}
            onChange={(e) => setFoirCap(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Standard Indian consumer lending threshold is 50–55% of net monthly income.
          </p>
        </div>

        {/* Save CTA */}
        <div className="pt-4 flex items-center justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-xs transition-all"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saved ? "Saved ✓" : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

