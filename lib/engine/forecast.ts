import { createTrace, TraceEntry } from "./trace";

export interface ForecastMonth {
  month: number;
  monthLabel: string;
  baseIncome: number;
  weakIncome: number;
  dues: number;
  living: number;
  newEmi: number;
  mitigationFreed: number;
  baseNetFlow: number;
  weakNetFlow: number;
  baseClosingBalance: number;
  weakClosingBalance: number;
}

export interface CashFlowForecastResult {
  startingBalance: number;
  months: ForecastMonth[];
  trace: TraceEntry;
}

export function generateCashFlowForecast(input: {
  startingBalance: number;
  baseMonthlyIncome: number;
  weakMonthlyIncome: number;
  duesByMonth: number[]; // 12 months
  monthlyLivingExpenses: number;
  newMonthlyEmi?: number;
  monthlyMitigationFreed?: number;
}): CashFlowForecastResult {
  const startTime = performance.now();
  const {
    startingBalance,
    baseMonthlyIncome,
    weakMonthlyIncome,
    duesByMonth,
    monthlyLivingExpenses,
    newMonthlyEmi = 0,
    monthlyMitigationFreed = 0,
  } = input;

  const months: ForecastMonth[] = [];
  let baseRunning = startingBalance;
  let weakRunning = startingBalance;

  for (let m = 0; m < 12; m++) {
    const monthNum = m + 1;
    const dues = duesByMonth[m] !== undefined ? duesByMonth[m] : 0;
    const living = monthlyLivingExpenses;

    const baseOutflow = dues + living + newMonthlyEmi - monthlyMitigationFreed;
    const baseNet = baseMonthlyIncome - baseOutflow;
    baseRunning = Math.round(baseRunning + baseNet);

    const weakOutflow = dues + living + newMonthlyEmi - monthlyMitigationFreed;
    const weakNet = weakMonthlyIncome - weakOutflow;
    weakRunning = Math.round(weakRunning + weakNet);

    months.push({
      month: monthNum,
      monthLabel: `M${monthNum}`,
      baseIncome: baseMonthlyIncome,
      weakIncome: weakMonthlyIncome,
      dues,
      living,
      newEmi: newMonthlyEmi,
      mitigationFreed: monthlyMitigationFreed,
      baseNetFlow: Math.round(baseNet),
      weakNetFlow: Math.round(weakNet),
      baseClosingBalance: baseRunning,
      weakClosingBalance: weakRunning,
    });
  }

  const trace = createTrace(
    "CashFlowForecast",
    { startingBalance, baseMonthlyIncome, weakMonthlyIncome },
    "Project 12 months closing balance using roll-off dues and living spend",
    {
      m6BaseBalance: months[5]?.baseClosingBalance,
      m12BaseBalance: months[11]?.baseClosingBalance,
    },
    startTime
  );

  return {
    startingBalance,
    months,
    trace,
  };
}

