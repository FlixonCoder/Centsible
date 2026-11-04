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
  HelpCircle,
  Calculator,
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
import { MinimizableDataFlow } from "@/components/pipeline/MinimizableDataFlow";

const STEPS = [
  { id: 1, name: "Expense", label: "Emergency Bill" },
  { id: 2, name: "Savings", label: "Apply Savings" },
  { id: 3, name: "Capacity", label: "Safe-to-Borrow" },
  { id: 4, name: "Options", label: "Compare Options" },
  { id: 5, name: "Plan", label: "Mitigation Plan" },
  { id: 6, name: "Verdict", label: "Decision Verdict" },
];

export default function DecisionLabPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);
  const [showMath, setShowMath] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState("personal_loan_12m");

  // Decision inputs
  const [emergencyAmount, setEmergencyAmount] = useState(60000);
  const [savingsApplied, setSavingsApplied] = useState(20000);
  const [activeMitigationIds, setActiveMitigationIds] = useState<string[]>([
    "cut_food_delivery",
    "cut_cab_rides",
    "pause_subscriptions",
    "cap_impulse_shopping",
  ]);

  // Engine run response
  const [engineData, setEngineData] = useState<any>(null);

  const runEngine = async () => {
    try {
      const res = await fetch("/api/decision/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyAmount,
          savingsApplied,
          activeMitigationIds,
          incomeDropPercent: 20,
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
  }, [emergencyAmount, savingsApplied, activeMitigationIds]);

  const toggleMitigation = (id: string) => {
    setActiveMitigationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveDecision = async (): Promise<boolean> => {
    if (!engineData) return false;
    setSavingDecision(true);
    try {
      const res = await fetch("/api/decision/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: engineData.eventId,
          inputsJson: { emergencyAmount, savingsApplied, activeMitigationIds },
          resultJson: engineData.decision,
          traceJson: engineData.traces,
          selectedOptionId: selectedOptionId || "personal_loan_12m",
          verdict: engineData.decision?.verdictTier || "SAFE_WITH_PLAN",
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setDecisionSaved(true);
        setSavingDecision(false);
        return true;
      }
      setSavingDecision(false);
      return false;
    } catch (err) {
      console.error("Failed to save decision", err);
      setSavingDecision(false);
      return false;
    }
  };

  const handleFinishAndSave = async () => {
    const ok = await handleSaveDecision();
    if (ok) {
      router.push("/decision");
      router.refresh();
    } else {
      router.push("/decision");
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

  const { profile, optionsComparison, mitigation, decision, traces } = engineData;
  const creditNeeded = Math.max(0, emergencyAmount - savingsApplied);

  // Chart data for side-by-side total costs
  const comparisonChartData = optionsComparison.options.map((opt: any) => ({
    name: opt.title.split("(")[0].trim(),
    total: opt.totalRepaid,
    extra: opt.extraCost,
    isRec: opt.isRecommended,
  }));

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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
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
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Minimizable Data Flow Panel on Left + Main Simulation Stage */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left-Side Minimizable Data Flow Window */}
        <MinimizableDataFlow
          currentStep={currentStep}
          onSelectStep={(s) => setCurrentStep(s)}
          engineData={engineData}
        />

        {/* Main Stage */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* STEP 1: EXPENSE EVENT */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 1 of 6
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                  Urgent Emergency Expense
                </h2>
                <p className="text-xs text-slate-500">
                  Specify the emergency bill requiring immediate financing.
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
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-medium"
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
                  Step 2 of 6
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
                  Step 3 of 6
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

          {/* STEP 4: COMPARE TRUE COSTS (REDESIGNED PREMIUM CARDS) */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Step 4 of 6
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] mt-1">
                    What will {formatINR(creditNeeded)} really cost you?
                  </h2>
                  <p className="text-xs text-slate-500">
                    Same loan amount, four very different outcomes. Compare true monthly burdens and total repayments.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Illustrative Rates</span>
              </div>

              {/* Break-even APR Callout */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-3">
                <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Break-even APR is ~59%:</strong> Priya only breaches her ₹4,500/mo Safe-to-Borrow limit if loan interest exceeds 59% p.a.
                </span>
              </div>

              {/* Redesigned 4 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {optionsComparison.options.map((opt: any) => {
                  const isRec = opt.isRecommended;
                  const isSafe = opt.verdict === "SAFE";
                  const isSelected = selectedOptionId === opt.id;
                  const isUnavailable = opt.eligibility !== "available";

                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`relative rounded-3xl p-6 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isRec
                          ? "border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-md ring-4 ring-indigo-500/10"
                          : isUnavailable
                          ? "border border-slate-200 bg-slate-50/80 opacity-75"
                          : "border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                              isSafe
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {isSafe ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>{isSafe ? "Safe to Carry" : "High Risk"}</span>
                          </span>

                          {isUnavailable && (
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Limit Exceeded
                            </span>
                          )}
                        </div>

                        {isRec && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full shadow-xs">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Recommended</span>
                          </span>
                        )}
                      </div>

                      {/* Facility Title */}
                      <div className="mb-4">
                        <h3 className="text-base font-extrabold text-[#1E1B4B]">{opt.title}</h3>
                        <p className="text-[11.5px] text-slate-500 font-medium">{opt.subtitle}</p>
                      </div>

                      {/* Hero Repayment Amount */}
                      <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-slate-200/80 mb-4 space-y-1">
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                          Total You&apos;ll Repay
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-[#1E1B4B] font-mono">
                            {formatINR(opt.totalRepaid)}
                          </span>
                        </div>
                        <div className="text-xs font-semibold">
                          <span className="text-slate-500">Extra borrowing cost: </span>
                          <span className={opt.extraCost > 10000 ? "text-rose-600 font-bold" : "text-[#1E1B4B] font-bold"}>
                            +{formatINR(opt.extraCost)}
                          </span>
                        </div>
                      </div>

                      {/* Key Parameters Pill Strip */}
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs mb-3">
                        <div>
                          <span className="text-[10.5px] text-slate-400 block font-semibold">Monthly EMI</span>
                          <span
                            className={`text-base font-extrabold font-mono ${
                              opt.monthlyPayment > profile.safeToBorrow ? "text-rose-600" : "text-[#1E1B4B]"
                            }`}
                          >
                            {formatINR(opt.monthlyPayment)}
                            <span className="text-[11px] font-normal text-slate-500">/mo</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10.5px] text-slate-400 block font-semibold">Payoff Tenure</span>
                          <span className="text-base font-extrabold text-[#1E1B4B]">
                            {opt.tenureMonths} <span className="text-[11px] font-normal text-slate-500">months</span>
                          </span>
                        </div>
                      </div>

                      {/* Plain-Language Verdict Explanation */}
                      <p className="text-xs leading-relaxed text-slate-600">
                        {isSafe
                          ? isRec
                            ? "Comfortably within your ₹4,500/mo limit, leaving an ₹870 surplus every month."
                            : "Within your budget limit, but accumulates higher interest or upfront conversion fees."
                          : opt.id === "card_min"
                          ? `Extremely long payoff — ~35 months of 42% revolving interest accumulates ₹30k extra cost.`
                          : `Monthly payment is ~${(opt.monthlyPayment / profile.safeToBorrow).toFixed(1)}× your safe limit.`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Side-by-Side Visual Comparison Chart */}
              <div className="bg-[#F8F9FC] rounded-2xl p-5 border border-[#E8EAF3] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1B4B]">
                      Side-by-Side Lifetime Cost Comparison
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Visualizing the ₹25,700 cost difference between the worst and best financing route
                    </p>
                  </div>

                  <button
                    onClick={() => setShowMath((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{showMath ? "Hide Math" : "Show Formula & Fees"}</span>
                  </button>
                </div>

                <div className="h-44 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8EAF3" />
                      <XAxis type="number" tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <YAxis type="category" dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: "#1E1B4B", fontWeight: 600 }} />
                      <Tooltip
                        formatter={(val: number) => [formatINR(val), "Total Repaid"]}
                        contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8EAF3", fontSize: "12px" }}
                      />
                      <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                        {comparisonChartData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isRec ? "#4F46E5" : entry.total > 60000 ? "#EF4444" : "#94A3B8"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {showMath && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-2 bg-white p-4 rounded-xl">
                    <p className="font-mono text-[11px] text-[#2B2A6E]">
                      Standard Amortization EMI: P · r · (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)
                    </p>
                    <p className="text-[11.5px] text-slate-500">
                      Card minimum amortizes monthly at 3.5%/month (42% APR). Personal loan applies 1.5% processing fee (+18% GST). Card EMI applies ₹999 fee (+18% GST).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: MITIGATION PLAN */}
          {currentStep === 5 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 5 of 6
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
                  <span className="font-bold">Lifts Safe Margin to {formatINR(profile.safeToBorrow + mitigation.activeMitigationMonthly)}/mo</span>
                  <p className="text-[11px]">Protects your buffer against sudden expenses</p>
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

          {/* STEP 6: DECISION VERDICT */}
          {currentStep === 6 && (
            <div className="bg-white rounded-3xl border border-[#E8EAF3] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Step 6 of 6 · Final Recommendation
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

              {/* Dedicated Stress Test Link Card */}
              <div className="p-4.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/60 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">
                      Income Shock & Scenario Resilience Test
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Test job loss or a 20% salary cut in the separate Stress Testing Lab.
                    </p>
                  </div>
                </div>

                <Link
                  href="/stress-test"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-700 text-xs font-bold border border-indigo-200 hover:bg-indigo-50 transition-colors shrink-0"
                >
                  <span>Open Stress Lab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
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

              {/* Action Buttons: Save & Finish */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleFinishAndSave}
                  disabled={savingDecision}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingDecision ? "Saving to History..." : "Finish & Save to Decision History"}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export PDF / Print</span>
                </button>

                {decisionSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Added to Decision History!</span>
                  </span>
                )}

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

            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2B2A6E] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-xs transition-all"
              >
                <span>Continue to {STEPS[currentStep].name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishAndSave}
                disabled={savingDecision}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all"
              >
                <span>{savingDecision ? "Saving..." : "Finish & Save to History"}</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
