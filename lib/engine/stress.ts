import { createTrace, TraceEntry } from "./trace";

export interface StressProjectionMonth {
  month: number;
  monthLabel: string;
  stressedIncome: number;
  dues: number;
  essentials: number;
  positionBeforeEmi: number;
  newEmi: number;
  positionWithEmi: number;
  positionWithPlan: number;
  cumulativeShortfallNoPlan: number;
  cumulativeShortfallWithPlan: number;
}

export interface StressTestEngineInput {
  baseIncome: number;
  duesByMonth?: number[]; // 12 months array
  committedDues?: number; // fallback for legacy callers
  essentials: number;
  safetyBuffer: number;
  liquidCushion?: number; // e.g. buffer (2,000) + remaining cash in savings (4,350) = 6,350
  newMonthlyEmi: number;
  incomeDropPercent?: number; // default 20
  activeMitigationMonthly?: number; // e.g. 3,283
  scenario?: "income_drop" | "job_gap" | "surprise_expense";
}

export interface StressTestEngineResult {
  incomeDropPercent: number;
  scenario: string;
  stressedIncome: number;
  month1BeforeEmi: number; // -2,500
  month1WithEmi: number; // -6,130
  monthlyPositionBeforeEmi: number; // legacy alias
  monthlyPositionWithEmi: number; // legacy alias
  status: "CRITICAL_RISK" | "HIGH_RISK" | "MODERATE_RISK" | "SAFE" | "RESILIENT";
  worstMonthlyGap: number;
  monthsInDeficit: number;
  peakCumulativeShortfall: number; // without plan
  peakCumulativeShortfallWithPlan: number;
  cushion: number;
  passesWithoutPlan: boolean;
  passesWithPlan: boolean;
  projections: StressProjectionMonth[];
  headlineBanner: string;
  trace: TraceEntry;
}

export type StressTestResult = StressTestEngineResult;

export function calculateStressTest(input: StressTestEngineInput): StressTestEngineResult {
  const startTime = performance.now();

  const {
    baseIncome,
    duesByMonth: inputDues,
    committedDues,
    essentials,
    safetyBuffer,
    liquidCushion = safetyBuffer,
    newMonthlyEmi,
    incomeDropPercent = 20,
    activeMitigationMonthly = 0,
    scenario = "income_drop",
  } = input;

  const duesByMonth = inputDues || (committedDues !== undefined ? Array(12).fill(committedDues) : Array(12).fill(24500));

  const dropFactor = incomeDropPercent / 100;
  const stressedIncome = Math.round(baseIncome * (1 - dropFactor));

  // Month 1 exact deck calculation: Stressed Income - Month 1 Dues - Essentials
  // (Buffer is NOT subtracted here to match the deck's -2,500 baseline)
  const m1Dues = duesByMonth[0] ?? 24500;
  const month1BeforeEmi = stressedIncome - m1Dues - essentials;
  const month1WithEmi = month1BeforeEmi - newMonthlyEmi;

  const projections: StressProjectionMonth[] = [];
  let cumShortfallNoPlan = 0;
  let cumShortfallWithPlan = 0;
  let peakShortfallNoPlan = 0;
  let peakShortfallWithPlan = 0;
  let monthsInDeficit = 0;
  let worstMonthlyGap = 0;

  for (let m = 0; m < 12; m++) {
    const monthNum = m + 1;
    let monthIncome = stressedIncome;

    // Scenarios handling
    if (scenario === "job_gap" && monthNum === 1) {
      monthIncome = 0; // 1 month without pay
    }

    const monthDues = duesByMonth[m] !== undefined ? duesByMonth[m] : 0;
    let monthEssentials = essentials;
    if (scenario === "surprise_expense" && monthNum === 2) {
      monthEssentials += 10000;
    }

    const posBeforeEmi = monthIncome - monthDues - monthEssentials;
    const posWithEmi = posBeforeEmi - newMonthlyEmi;
    const posWithPlan = posWithEmi + activeMitigationMonthly;

    if (posWithEmi < 0) {
      monthsInDeficit++;
      cumShortfallNoPlan += Math.abs(posWithEmi);
      worstMonthlyGap = Math.min(worstMonthlyGap, posWithEmi);
    }
    peakShortfallNoPlan = Math.max(peakShortfallNoPlan, cumShortfallNoPlan);

    if (posWithPlan < 0) {
      cumShortfallWithPlan += Math.abs(posWithPlan);
    }
    peakShortfallWithPlan = Math.max(peakShortfallWithPlan, cumShortfallWithPlan);

    projections.push({
      month: monthNum,
      monthLabel: `M${monthNum}`,
      stressedIncome: monthIncome,
      dues: monthDues,
      essentials: monthEssentials,
      positionBeforeEmi: posBeforeEmi,
      newEmi: newMonthlyEmi,
      positionWithEmi: posWithEmi,
      positionWithPlan: posWithPlan,
      cumulativeShortfallNoPlan: cumShortfallNoPlan,
      cumulativeShortfallWithPlan: cumShortfallWithPlan,
    });
  }

  const cushion = Math.max(safetyBuffer, liquidCushion);
  const passesWithoutPlan = peakShortfallNoPlan <= cushion;
  const passesWithPlan = peakShortfallWithPlan <= cushion;

  let headlineBanner = "Budget holds safely under stress.";
  if (month1BeforeEmi < 0) {
    headlineBanner = `Flagged BEFORE she borrows: −₹${Math.abs(month1BeforeEmi).toLocaleString("en-IN")}/mo deficit in Month 1!`;
  } else if (month1WithEmi < 0) {
    headlineBanner = "Caution: New EMI breaches stressed cash flow in early months.";
  }

  const trace = createTrace(
    "StressAndShock",
    { incomeDropPercent, newMonthlyEmi, activeMitigationMonthly, cushion },
    "Project 12 months with dues roll-off; check peak cumulative shortfall <= cushion",
    {
      month1BeforeEmi,
      month1WithEmi,
      peakShortfallNoPlan,
      peakShortfallWithPlan,
      passesWithoutPlan,
      passesWithPlan,
    },
    startTime
  );

  const status =
    month1BeforeEmi < 0 || month1WithEmi < 0
      ? "CRITICAL_RISK"
      : monthsInDeficit > 0
      ? "HIGH_RISK"
      : "RESILIENT";

  return {
    incomeDropPercent,
    scenario,
    stressedIncome,
    month1BeforeEmi,
    month1WithEmi,
    monthlyPositionBeforeEmi: month1BeforeEmi,
    monthlyPositionWithEmi: month1WithEmi,
    status,
    worstMonthlyGap,
    monthsInDeficit,
    peakCumulativeShortfall: peakShortfallNoPlan,
    peakCumulativeShortfallWithPlan: peakShortfallWithPlan,
    cushion,
    passesWithoutPlan,
    passesWithPlan,
    projections,
    headlineBanner,
    trace,
  };
}
