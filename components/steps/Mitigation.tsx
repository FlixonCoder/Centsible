"use client";

import { usePipeline } from "@/hooks/usePipeline";
import { formatINR } from "@/lib/format";
import {
  DEFAULT_MITIGATION_ACTIONS,
  MitigationAction,
} from "@/lib/engine/mitigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Utensils,
  Train,
  Tv,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface MitigationProps {
  pipeline: ReturnType<typeof usePipeline>;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Train,
  Tv,
  ShoppingBag,
  Zap,
  ShieldCheck,
};

export function Mitigation({ pipeline }: MitigationProps) {
  const {
    activeMitigationIds,
    toggleMitigationAction,
    mitigationImpact,
    safeToBorrowResult,
    stressTestResult,
    goToStep,
  } = pipeline;

  const {
    totalFreedMonthly,
    newSafeCapacity,
    newStressPositionBeforeEmi,
    prepaymentMonthly,
    prepaymentTenureMonths,
    monthsSaved,
    interestSaved,
    categorySpendingBefore,
  } = mitigationImpact;

  // Donut chart data for spending categories
  const pieColors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#F59E0B"];
  const donutData = categorySpendingBefore.map((c, i) => ({
    name: c.name,
    value: c.amount - c.freed,
    cut: c.freed,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Step 6 of 7</span>
          <span>•</span>
          <span>Mitigation Layer & Cash Flow Recovery</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Where can you free up cash to strengthen your finances?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Zero shaming. Gentle, realistic micro-adjustments identified from your verified statements that instantly restore cash flow resilience.
        </p>
      </div>

      {/* Hero Summary Badge Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200/80 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Recoverable Monthly Capacity Found
            </span>
            <div className="text-2xl font-black font-mono text-emerald-950">
              +{formatINR(totalFreedMonthly)} / month
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500">Active Adjustments</span>
          <div className="text-sm font-semibold font-mono text-emerald-700">
            {activeMitigationIds.filter((id) => !id.includes("tip")).length} of 4 applied
          </div>
        </div>
      </div>

      {/* Main Grid: Suggestion Cards (Left) + Live Before/After Recalculation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Suggestion Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Actionable Adjustments & Financial Strategies</span>
            <span className="text-xs font-normal text-slate-500">Toggle on/off to see live impact</span>
          </h2>

          {DEFAULT_MITIGATION_ACTIONS.map((action) => {
            const isEnabled = activeMitigationIds.includes(action.id);
            const IconComp = ACTION_ICONS[action.iconName] || Sparkles;

            return (
              <div
                key={action.id}
                onClick={() => toggleMitigationAction(action.id)}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 bg-white shadow-subtle hover:border-indigo-300",
                  isEnabled
                    ? "border-emerald-300 ring-1 ring-emerald-200/50 bg-emerald-50/10"
                    : "border-slate-200 opacity-60"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      action.isActionableCut
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    )}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900">
                        {action.title}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-100 text-slate-600">
                        {action.effort}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {action.description}
                    </p>

                    {action.monthlySaving > 0 && (
                      <div className="text-[11px] font-mono font-bold text-emerald-700 mt-1">
                        Saves +{formatINR(action.monthlySaving)}/month
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggle switch */}
                <div className="shrink-0 pt-0.5">
                  <div
                    className={cn(
                      "w-10 h-6 rounded-full transition-colors p-0.5 flex items-center",
                      isEnabled ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Live Recalculation Before vs After + Donut Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Live Before vs After Impact
          </h2>

          <div className="p-4 rounded-2xl bg-white border border-cardborder shadow-subtle space-y-4">
            {/* Metric 1: Safe-to-Borrow capacity */}
            <div>
              <div className="text-xs text-slate-500 flex items-center justify-between mb-1">
                <span>Safe-to-Borrow Capacity</span>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">
                  +{formatINR(totalFreedMonthly)} boost
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-slate-400 line-through">
                  {formatINR(safeToBorrowResult.safeCapacity)}/mo
                </span>
                <span className="text-lg font-extrabold text-emerald-600">
                  {formatINR(newSafeCapacity)}/mo
                </span>
              </div>
            </div>

            {/* Metric 2: Stress Test Position */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center justify-between mb-1">
                <span>Stressed Cash Position (-20% drop)</span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    newStressPositionBeforeEmi >= 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  )}
                >
                  {newStressPositionBeforeEmi >= 0 ? "DEFICIT SOLVED ✓" : "DEFICIT PERSISTS"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-rose-600 line-through">
                  {formatINR(stressTestResult.monthlyPositionBeforeEmi)}/mo
                </span>
                <span
                  className={cn(
                    "text-lg font-extrabold",
                    newStressPositionBeforeEmi >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {newStressPositionBeforeEmi >= 0 ? "+" : ""}
                  {formatINR(newStressPositionBeforeEmi)}/mo
                </span>
              </div>
            </div>

            {/* Metric 3: Prepayment Acceleration Impact */}
            <div className="pt-3 border-t border-slate-100 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Prepay 50% of Freed Cash ({formatINR(prepaymentMonthly)}/mo)
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Tenure reduces to:</span>
                  <strong className="font-mono text-indigo-700">
                    {prepaymentTenureMonths} months ({monthsSaved} mos earlier)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Interest saved:</span>
                  <strong className="font-mono text-emerald-700">
                    ~{formatINR(interestSaved)} saved
                  </strong>
                </div>
              </div>
            </div>

            {/* Donut Chart Visualizing Category Spending */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-700 mb-1">
                Spending Adjustments Breakdown
              </div>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={3}
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${formatINR(Number(val))} (Cut: ${formatINR(item.payload.cut)})`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-center text-slate-400">
                Food delivery, cabs, unused apps, impulse spend caps
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => goToStep(5)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stress Test</span>
        </button>

        <button
          onClick={() => goToStep(7)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>View Final Decision & Action Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

