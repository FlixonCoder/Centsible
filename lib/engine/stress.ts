export interface StressTestInput {
  baseIncome: number;
  committedDues: number;
  essentials: number;
  safetyBuffer: number;
  newMonthlyEmi: number;
  incomeDropPercent: number; // e.g. 20 for 20%
  tenureMonths?: number;
}

export interface MonthProjection {
  month: number;
  monthLabel: string;
  stressedIncome: number;
  committedDues: number;
  essentials: number;
  positionBeforeEmi: number; // Stressed Income - Dues - Essentials
  newEmi: number;
  positionWithEmi: number; // Position before EMI - newEmi
  isDeficit: boolean;
  cumulativeShortfall: number;
}

export interface StressTestResult {
  incomeDropPercent: number;
  stressedIncome: number;
  incomeDropAmount: number;
  committedDues: number;
  essentials: number;
  monthlyPositionBeforeEmi: number; // -2,500 for Priya at 20%
  monthlyPositionWithEmi: number; // -6,130 for Priya with 3,630 EMI
  status: "CRITICAL_RISK" | "MODERATE_RISK" | "RESILIENT";
  flagBanner: string;
  headlineExplanation: string;
  projections: MonthProjection[];
  shortfallTotal6Months: number;
  shortfallTotal12Months: number;
}

export function calculateStressTest(input: StressTestInput): StressTestResult {
  const {
    baseIncome,
    committedDues,
    essentials,
    newMonthlyEmi,
    incomeDropPercent,
    tenureMonths = 12,
  } = input;

  const dropFactor = incomeDropPercent / 100;
  const stressedIncome = Math.round(baseIncome * (1 - dropFactor));
  const incomeDropAmount = baseIncome - stressedIncome;

  // Exact deck calculation: Stressed Income - Committed Dues - Essentials
  // (Buffer is NOT subtracted here to match the deck's -2,500 baseline)
  const monthlyPositionBeforeEmi = stressedIncome - committedDues - essentials;
  const monthlyPositionWithEmi = monthlyPositionBeforeEmi - newMonthlyEmi;

  const projections: MonthProjection[] = [];
  let runningShortfall = 0;

  for (let m = 1; m <= tenureMonths; m++) {
    const isDeficit = monthlyPositionWithEmi < 0;
    if (isDeficit) {
      runningShortfall += Math.abs(monthlyPositionWithEmi);
    }
    projections.push({
      month: m,
      monthLabel: `M${m}`,
      stressedIncome,
      committedDues,
      essentials,
      positionBeforeEmi: monthlyPositionBeforeEmi,
      newEmi: newMonthlyEmi,
      positionWithEmi: monthlyPositionWithEmi,
      isDeficit,
      cumulativeShortfall: runningShortfall,
    });
  }

  const shortfallTotal6Months = Math.abs(Math.min(0, monthlyPositionWithEmi)) * 6;
  const shortfallTotal12Months = Math.abs(Math.min(0, monthlyPositionWithEmi)) * 12;

  let status: "CRITICAL_RISK" | "MODERATE_RISK" | "RESILIENT" = "RESILIENT";
  let flagBanner = "Your budget holds safely under stress.";
  let headlineExplanation = "Even with an income dip, cash flow remains positive.";

  if (monthlyPositionBeforeEmi < 0) {
    status = "CRITICAL_RISK";
    flagBanner = "Flagged BEFORE she borrows: Deficit detected even without new EMI!";
    headlineExplanation = `A ${incomeDropPercent}% drop causes a ₹${Math.abs(monthlyPositionBeforeEmi).toLocaleString("en-IN")}/mo shortfall on fixed obligations alone. Adding EMI pushes deficit to ₹${Math.abs(monthlyPositionWithEmi).toLocaleString("en-IN")}/mo.`;
  } else if (monthlyPositionWithEmi < 0) {
    status = "MODERATE_RISK";
    flagBanner = "Caution: New EMI breaches your stressed cash flow.";
    headlineExplanation = `Your baseline expenses are covered, but adding ₹${newMonthlyEmi.toLocaleString("en-IN")}/mo causes a ₹${Math.abs(monthlyPositionWithEmi).toLocaleString("en-IN")}/mo monthly deficit.`;
  }

  return {
    incomeDropPercent,
    stressedIncome,
    incomeDropAmount,
    committedDues,
    essentials,
    monthlyPositionBeforeEmi,
    monthlyPositionWithEmi,
    status,
    flagBanner,
    headlineExplanation,
    projections,
    shortfallTotal6Months,
    shortfallTotal12Months,
  };
}

