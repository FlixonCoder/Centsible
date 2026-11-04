"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Zap,
  TrendingDown,
  Clock,
  ArrowRight,
  ShieldCheck,
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
} from "recharts";

export default function ObligationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/obligations")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-slate-200" />
        <div className="h-72 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const { obligations, totalMonthlyDues, totalOutstanding, rollOff, avalancheOrder } = data;

  // Format chart data for roll-off
  const chartData = rollOff.duesByMonth.map((amt: number, idx: number) => ({
    month: `M${idx + 1}`,
    amount: amt,
  }));

  return (
    <div className="space-y-6">
      {/* Debt Freedom Milestone Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#2B2A6E] to-[#4F46E5] text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Dues Roll-Off Timeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {rollOff.headlineDebtFree}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl">
              Your obligations drop sharply over the next 4 months as BNPL orders and phone EMIs finish, opening up ₹24,500/month in free cash flow.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
            <div>
              <p className="text-[10.5px] uppercase font-bold text-indigo-200 tracking-wider">
                Current Monthly Dues
              </p>
              <p className="text-2xl font-extrabold">{formatINR(totalMonthlyDues)}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10.5px] uppercase font-bold text-indigo-200 tracking-wider">
                Total Outstanding
              </p>
              <p className="text-2xl font-extrabold">{formatINR(totalOutstanding)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Roll-off Chart */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">
              Committed Monthly Dues Roll-Off Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Shows how your monthly payment burden declines to ₹0 as each obligation is cleared.
            </p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                formatter={(val: number) => [formatINR(val), "Committed Dues"]}
                contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8EAF3", fontSize: "12px" }}
              />
              <Bar dataKey="amount" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Obligations List */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">Active Loans & Cards</h3>
            <p className="text-xs text-slate-500">
              Verified against last 60 days of bank debits
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Lender / Facility</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">APR</th>
                <th className="pb-3">Due Day</th>
                <th className="pb-3">Remaining</th>
                <th className="pb-3">Bank Match</th>
                <th className="pb-3 text-right">Outstanding</th>
                <th className="pb-3 pr-2 text-right">Monthly Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {obligations.map((ob: any) => (
                <tr key={ob.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 pl-2 font-bold text-slate-900">
                    <div>{ob.name}</div>
                    <div className="text-[10.5px] text-slate-400 font-normal">{ob.institution}</div>
                  </td>
                  <td className="py-3.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                      {ob.kind.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 font-semibold text-rose-600 font-mono">
                    {ob.apr}%
                  </td>
                  <td className="py-3.5 text-slate-600">
                    Day {ob.dueDay} of month
                  </td>
                  <td className="py-3.5 text-slate-600">
                    {ob.remainingMonths ? `${ob.remainingMonths} months` : "Revolving (~4m)"}
                  </td>
                  <td className="py-3.5">
                    {ob.matchedToBank ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right font-mono font-medium text-slate-700">
                    {formatINR(ob.outstanding)}
                  </td>
                  <td className="py-3.5 pr-2 text-right font-bold font-mono text-[13px] text-[#1E1B4B]">
                    {formatINR(ob.monthlyAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debt Avalanche Payoff Strategy */}
      <div className="bg-white rounded-3xl border border-[#E8EAF3] p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B]">
              Debt Avalanche Payoff Strategy (Highest APR First)
            </h3>
            <p className="text-xs text-slate-500">
              Mathematical order that minimizes total interest paid across your debts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {avalancheOrder.map((item: any) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border ${
                item.priority === 1
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-[#F8F9FC] border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.priority === 1
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  Priority #{item.priority}
                </span>
                <span className="text-xs font-mono font-bold text-rose-600">
                  {item.apr}% APR
                </span>
              </div>

              <h4 className="text-xs font-bold text-[#1E1B4B]">{item.name}</h4>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Outstanding: {formatINR(item.outstanding)} · {formatINR(item.monthlyAmount)}/mo
              </p>
              <p className="text-[11.5px] text-slate-600 mt-2 font-medium">
                {item.strategyTip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

