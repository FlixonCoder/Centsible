"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
  Calendar,
  Wallet,
  CreditCard,
  Zap,
  Clock,
  Sparkles,
  Download,
  Save,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Layers,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const STEPS = [
  { id: 1, name: "Expense", label: "Expense Event" },
  { id: 2, name: "Savings", label: "Apply Savings" },
  { id: 3, name: "Capacity", label: "Safe-to-Borrow" },
  { id: 4, name: "Options", label: "Compare Options" },
  { id: 5, name: "Stress", label: "Stress Test" },
  { id: 6, name: "Plan", label: "Mitigation Plan" },
  { id: 7, name: "Verdict", label: "Decision Verdict" },
];

export default function DecisionLabPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);

  // Decision inputs
  const [emergencyAmount, setEmergencyAmount] = useState(60000);
  const [savingsApplied, setSavingsApplied] = useState(20000);
  const [incomeDropPercent, setIncomeDropPercent] = useState(20);
  const [scenario, setScenario] = useState("income_drop");
  const [activeMitigationIds, setActiveMitigationIds] = useState<string[]>([
    "cut_food_delivery",
    "cut_cab_rides",
    "pause_subscriptions",
    "cap_impulse_shopping",
  ]);

  // Engine run response
  const [engineData, setEngineData] = useState<any>(null);
  const [selectedTraceStage, setSelectedTraceStage] = useState<string | null>(null);

  const runEngine = async () => {
    try {
      const res = await fetch("/api/decision/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyAmount,
          savingsApplied,
          incomeDropPercent,
          activeMitigationIds,
          scenario,
        }),
      });
      const data = await res.json();
      setEngineData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    runEngine();
  }, [emergencyAmount, savingsApplied, incomeDropPercent, activeMitigationIds, scenario]);

  const toggleMitigation = (id: string) => {
    setActiveMitigationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveDecision = async () => {
    if (!engineData) return;
    setSavingDecision(true);
    try {
      await fetch("/api/decision/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: engineData.eventId,
          inputsJson: { emergencyAmount, savingsApplied, incomeDropPercent, activeMitigationIds },
          resultJson: engineData.decision,
          traceJson: engineData.traces,
          selectedOptionId: engineData.decision.selectedOption?.id || "personal_loan_12m",
          verdict: engineData.decision.verdictTier,
        }),
      });
      setDecisionSaved(true);
      setSavingDecision(false);
    } catch (err) {
      console.error(err);
      setSavingDecision(false);
    }
  };

  if (loading || !engineData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-200" />
        <div className="h-96 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const { profile, optionsComparison, stressResult, mitigation, decision, traces } = engineData;
  const creditNeeded = Math.max(0, emergencyAmount - savingsApplied);

  return (
    <div className="space-y-6">
      {/* Horizontal Stepper */}
      <div className="bg-white rounded-2xl border border-[#E8EAF3] p-3 shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-1 sm:pb-0">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-[#2B2A6E] text-white shadow-xs"
                    : isDone
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isActive
                      ? "bg-white text-[#2B2A6E]"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isDone ? "✓" : step.id}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Screen Stage (8 cols) + Real-Time Decision Trace Audit Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Stage */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: EXPENSE EVENT */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 1 of 7
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                  Urgent Emergency Bill
                </h2>
                <p className="text-xs text-slate-500">
                  Specify the emergency expense requiring immediate financing.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Emergency Title & Category
                  </label>
                  <input
                    type="text"
                    defaultValue="Emergency Dental Surgery"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Total Bill Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={emergencyAmount}
                      onChange={(e) => setEmergencyAmount(Math.max(1000, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Payment Due Date
                    </label>
                    <input
                      type="text"
                      defaultValue="Friday, 6 Nov 2026"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Urgency & Delay Feasibility</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    Medical and critical repair expenses cannot be safely postponed. Centsible will evaluate how to fund this without triggering revolving credit card debt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: APPLY SAVINGS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 2 of 7
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                  Bill Split: Savings vs Credit Gap
                </h2>
                <p className="text-xs text-slate-500">
                  Using liquid savings first reduces interest and loan fees.
                </p>
              </div>

              {/* Visual Split Bar */}
              <div className="p-5 rounded-2xl bg-[#F8F9FC] border border-[#E8EAF3] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-700">Savings Applied: {formatINR(savingsApplied)}</span>
                  <span className="text-amber-700">Credit Needed: {formatINR(creditNeeded)}</span>
                </div>

                <div className="h-5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${(savingsApplied / emergencyAmount) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                  />
                  <div
                    style={{ width: `${(creditNeeded / emergencyAmount) * 100}%` }}
                    className="bg-amber-500 transition-all duration-300"
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>₹0</span>
                  <span className="font-semibold text-slate-600">Total: {formatINR(emergencyAmount)}</span>
                </div>
              </div>

              {/* Savings Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Apply Earmarked Liquid Savings
                  </label>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    {formatINR(savingsApplied)}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={Math.min(24350, emergencyAmount)}
                  step={1000}
                  value={savingsApplied}
                  onChange={(e) => setSavingsApplied(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <p className="text-[11.5px] text-slate-500">
                  Priya has ₹24,350 total in HDFC Savings, of which ₹20,000 is earmarked for emergencies.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SAFE-TO-BORROW CAPACITY */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 3 of 7
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                  Safe-to-Borrow Waterfall
                </h2>
                <p className="text-xs text-slate-500">
                  Real monthly capacity computed by deducting committed debits and buffer from verified income.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2B2A6E]">
                    Monthly Safe Limit
                  </p>
                  <p className="text-3xl font-extrabold text-[#1E1B4B] mt-0.5">
                    {formatINR(profile.safeToBorrow)} <span className="text-sm font-normal text-slate-500">/ mo</span>
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <span className="font-bold text-slate-700">DTI / FOIR: {profile.dtiPercent}%</span>
                  <p className="text-[10.5px]">Lender ceiling is typically 55%</p>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-2 text-slate-700">
                  <span>Take-home Income</span>
                  <span className="font-bold text-[#1E1B4B]">+{formatINR(profile.headlineIncome)}</span>
                </div>
                <div className="flex justify-between py-2 text-rose-600">
                  <span>Committed Dues (BNPL + Card + Phone EMI)</span>
                  <span className="font-bold">−{formatINR(profile.committedDues)}</span>
                </div>
                <div className="flex justify-between py-2 text-amber-600">
                  <span>Essential Living Spend (Food, Travel, Bills)</span>
                  <span className="font-bold">−{formatINR(profile.livingExpenses)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-500">
                  <span>Safety Buffer (Floor Cushion)</span>
                  <span className="font-bold">−{formatINR(profile.safetyBuffer)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPARE TRUE COSTS */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Step 4 of 7
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                    Compare True Borrowing Options ({formatINR(creditNeeded)})
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Illustrative Rates</span>
              </div>

              {/* Break-even APR Callout */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-3">
                <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Break-even APR is ~59%:</strong> Priya only exceeds her Safe-to-Borrow capacity if loan interest surpasses 59% p.a.
                </span>
              </div>

              {/* Options Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {optionsComparison.options.map((opt: any) => {
                  const isRec = opt.isRecommended;
                  const isAvail = opt.eligibility === "available";

                  return (
                    <div
                      key={opt.id}
                      className={`rounded-2xl border p-4.5 space-y-3 transition-all ${
                        isRec
                          ? "border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-500/20"
                          : !isAvail
                          ? "border-slate-200 bg-slate-50 opacity-75"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              opt.verdict === "SAFE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {opt.verdict}
                          </span>
                          {!isAvail && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Limit Exceeded
                            </span>
                          )}
                        </div>
                        {isRec && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            RECOMMENDED
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#1E1B4B]">{opt.title}</h4>
                        <p className="text-[11px] text-slate-500">{opt.subtitle}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Monthly</p>
                          <p className="font-extrabold text-[#1E1B4B] font-mono">
                            {formatINR(opt.monthlyPayment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Tenure</p>
                          <p className="font-bold text-slate-700">{opt.tenureMonths} mos</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Repaid</p>
                          <p className="font-mono font-bold text-slate-800">{formatINR(opt.totalRepaid)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Extra Cost</p>
                          <p className="font-mono font-bold text-rose-600">+{formatINR(opt.extraCost)}</p>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-slate-500 italic pt-1">
                        {opt.riskReason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: STRESS TEST */}
          {currentStep === 5 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 5 of 7
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                  12-Month Stress Test with Dues Roll-Off
                </h2>
                <p className="text-xs text-slate-500">
                  Tests what happens if income drops by 20% while paying the new loan EMI.
                </p>
              </div>

              {/* Stress Headline Banner */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Flagged BEFORE she borrows:</span>
                </div>
                <p className="text-xs leading-relaxed">
                  In Month 1 at −20% income, Priya faces a <strong className="font-mono">{formatINR(stressResult.month1BeforeEmi)}/mo</strong> deficit before any new loan, worsening to <strong className="font-mono">{formatINR(stressResult.month1WithEmi)}</strong> with the loan.
                </p>
              </div>

              {/* Income Drop Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Simulate Income Drop</span>
                  <span className="font-bold font-mono text-rose-600">{incomeDropPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={5}
                  value={incomeDropPercent}
                  onChange={(e) => setIncomeDropPercent(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* 12-Month Projections Bar Chart */}
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stressResult.projections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F8" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: number) => [formatINR(val)]}
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8EAF3", fontSize: "12px" }}
                    />
                    <Bar dataKey="positionWithEmi" name="Cash Position with EMI">
                      {stressResult.projections.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.positionWithEmi < 0 ? "#EF4444" : "#10B981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* STEP 6: MITIGATION PLAN */}
          {currentStep === 6 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 6 of 7
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                  Mitigation Layer: Freeing Cash
                </h2>
                <p className="text-xs text-slate-500">
                  Evidence-based spending adjustments detected from actual transaction history.
                </p>
              </div>

              {/* Freed Cash Hero */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Total Cash Freed Monthly
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-700 mt-0.5">
                    +{formatINR(mitigation.activeMitigationMonthly)} <span className="text-sm font-normal">/ mo</span>
                  </p>
                </div>
                <div className="text-right text-xs text-emerald-800">
                  <span className="font-bold">Flips Month 1 Stress Positive!</span>
                  <p className="text-[11px]">Safe-to-Borrow expands to {formatINR(profile.safeToBorrow + mitigation.activeMitigationMonthly)}</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {mitigation.suggestions
                  .filter((s: any) => s.isActionableCut)
                  .map((action: any) => {
                    const isChecked = activeMitigationIds.includes(action.id);

                    return (
                      <div
                        key={action.id}
                        onClick={() => toggleMitigation(action.id)}
                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                            : "bg-[#FAFBFC] border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                              isChecked
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && "✓"}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#1E1B4B]">{action.title}</h4>
                            <p className="text-[11px] text-slate-500">{action.description}</p>
                          </div>
                        </div>

                        <span className="text-xs font-bold font-mono text-emerald-700 shrink-0 ml-3">
                          +{formatINR(action.monthlySaving)}/mo
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 7: DECISION VERDICT */}
          {currentStep === 7 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 7 of 7 · Final Recommendation
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-extrabold text-[#1E1B4B]">
                    {decision.headlineTitle}
                  </h2>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {decision.verdictTier}
                  </span>
                </div>
              </div>

              {/* Hero Savings vs Worst */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 shadow-md flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    Lifetime True-Cost Savings
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold mt-0.5">
                    Save ≈ {formatINR(decision.heroSavingsVsWorst)}
                  </p>
                  <p className="text-xs text-emerald-100 mt-1">
                    Compared to revolving ₹40,000 on credit card minimum payments (~₹70,000 total).
                  </p>
                </div>
                <Sparkles className="w-10 h-10 text-emerald-200 shrink-0 hidden sm:block" />
              </div>

              {/* Why This Verdict */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Plain-Language Verdict Reasons
                </h3>
                <div className="space-y-2">
                  {decision.reasons.map((r: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prepayment Strategy */}
              {decision.prepaymentPlan && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 text-xs text-indigo-900">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Month 4 Prepayment Acceleration</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    {decision.prepaymentPlan.note}. By Month 4, your other debts drop to ₹0. Prepaying ₹{decision.prepaymentPlan.amountToPrepay.toLocaleString("en-IN")} saves an additional ~₹{decision.prepaymentPlan.interestSaved.toLocaleString("en-IN")} in interest and closes the loan {decision.prepaymentPlan.tenureReducedMonths} months early!
                  </p>
                </div>
              )}

              {/* Action Buttons: Save & Export */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveDecision}
                  disabled={savingDecision || decisionSaved}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-xs disabled:opacity-50 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{decisionSaved ? "Decision Saved ✓" : savingDecision ? "Saving..." : "Save Decision Snapshot"}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export PDF / Print</span>
                </button>

                <p className="w-full text-[10.5px] text-slate-400 mt-2">
                  {decision.disclaimer}
                </p>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {currentStep < 7 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-xs transition-all"
              >
                <span>Continue to {STEPS[currentStep].name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/decision"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all"
              >
                <span>Finish & View All</span>
                <Check className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Right-Hand Decision Trace Audit Panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8EAF3] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1B4B]">
                Engine Trace (Audit Trail)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">100% Deterministic</span>
          </div>

          <p className="text-[11px] text-slate-500">
            Real compute timing and formula execution from the local engine. Click any stage to audit inputs and formulas.
          </p>

          <div className="space-y-2.5">
            {traces.map((t: any, idx: number) => {
              const isSelected = selectedTraceStage === t.stage;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedTraceStage(isSelected ? null : t.stage)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-50/50 shadow-2xs"
                      : "border-slate-200/80 bg-[#FAFBFC] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E1B4B]">{t.stage}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {t.executionTimeMs?.toFixed(2)}ms
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                    {t.formula}
                  </p>

                  {isSelected && (
                    <div className="mt-2.5 pt-2.5 border-t border-indigo-100 text-[11px] font-mono space-y-2 bg-white p-2.5 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-400 block text-[9.5px] uppercase">
                          Formula / Logic
                        </span>
                        <span className="text-indigo-900">{t.formula}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block text-[9.5px] uppercase">
                          Inputs
                        </span>
                        <pre className="text-[10px] text-slate-600 overflow-x-auto">
                          {JSON.stringify(t.inputs, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block text-[9.5px] uppercase">
                          Outputs
                        </span>
                        <pre className="text-[10px] text-slate-600 overflow-x-auto">
                          {JSON.stringify(t.outputs, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

