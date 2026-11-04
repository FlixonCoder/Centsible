import { createTrace, TraceEntry } from "./trace";

export interface ObligationItem {
  id: string;
  name: string;
  kind: string; // "credit_card_revolving" | "bnpl_order" | "consumer_emi" | "loan"
  monthlyAmount: number;
  outstanding: number;
  apr: number;
  dueDay?: number | null;
  remainingMonths?: number | null;
}

export interface ObligationRollOffResult {
  duesByMonth: number[]; // Length 12
  debtFreeMonthIndex: number; // 1-indexed, or >12
  avalancheOrder: Array<{
    id: string;
    name: string;
    apr: number;
    outstanding: number;
    monthlyAmount: number;
    recommendedOrder: number;
    interestSavingsTip: string;
  }>;
  scheduleByObligation: Array<{
    id: string;
    name: string;
    kind: string;
    monthlyAmounts: number[];
  }>;
  trace: TraceEntry;
}

export function calculateObligationRollOff(
  obligations: ObligationItem[]
): ObligationRollOffResult {
  const startTime = performance.now();
  const duesByMonth = new Array(12).fill(0);
  const scheduleByObligation: Array<{
    id: string;
    name: string;
    kind: string;
    monthlyAmounts: number[];
  }> = [];

  for (const ob of obligations) {
    const obSchedule = new Array(12).fill(0);

    if (ob.kind === "credit_card_revolving" || ob.remainingMonths === null || ob.remainingMonths === undefined) {
      // Revolving balance amortization
      let balance = ob.outstanding;
      const monthlyRate = ob.apr / 12 / 100;
      const fixedPmt = ob.monthlyAmount;

      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break;
        const interest = balance * monthlyRate;
        const totalDue = balance + interest;
        const payment = Math.min(totalDue, fixedPmt);
        obSchedule[m] = Math.round(payment);
        balance = Math.max(0, totalDue - payment);
      }
    } else {
      // Fixed term obligation
      const months = Math.min(12, ob.remainingMonths);
      for (let m = 0; m < months; m++) {
        obSchedule[m] = Math.round(ob.monthlyAmount);
      }
    }

    scheduleByObligation.push({
      id: ob.id,
      name: ob.name,
      kind: ob.kind,
      monthlyAmounts: obSchedule,
    });

    for (let m = 0; m < 12; m++) {
      duesByMonth[m] += obSchedule[m];
    }
  }

  // Find when dues hit 0
  let debtFreeMonthIndex = 13;
  for (let m = 0; m < 12; m++) {
    if (duesByMonth[m] === 0) {
      debtFreeMonthIndex = m + 1;
      break;
    }
  }

  // Avalanche order: highest APR first
  const sorted = [...obligations].sort((a, b) => b.apr - a.apr);
  const avalancheOrder = sorted.map((ob, idx) => ({
    id: ob.id,
    name: ob.name,
    apr: ob.apr,
    outstanding: ob.outstanding,
    monthlyAmount: ob.monthlyAmount,
    recommendedOrder: idx + 1,
    interestSavingsTip:
      ob.apr > 30
        ? `Highest APR (${ob.apr}%). Prepaying this card first saves the most interest.`
        : `Lower APR (${ob.apr}%). Maintain regular minimum payments until high-APR debt clears.`,
  }));

  const trace = createTrace(
    "ObligationRollOff",
    { totalObligations: obligations.length },
    "Amortise revolving cards at APR/12; decrement fixed remainingMonths",
    {
      m1Dues: duesByMonth[0],
      m3Dues: duesByMonth[2],
      m4Dues: duesByMonth[3],
      debtFreeMonthIndex,
    },
    startTime
  );

  return {
    duesByMonth,
    debtFreeMonthIndex,
    avalancheOrder,
    scheduleByObligation,
    trace,
  };
}

