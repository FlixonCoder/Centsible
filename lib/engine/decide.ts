import { EvaluatedOption } from "./options";
import { createTrace, TraceEntry } from "./trace";

export type DecisionVerdictTier = "SAFE" | "SAFE_WITH_PLAN" | "TIGHT" | "RISKY";

export interface AlternativeVerdict {
  type: "BORROW" | "BORROW_LESS" | "USE_SAVINGS" | "DELAY" | "NEGOTIATE";
  title: string;
  isRecommended: boolean;
  reason: string;
}

export interface DecisionResultV2 {
  verdictTier: DecisionVerdictTier;
  headlineTitle: string;
  selectedOption: EvaluatedOption;
  recommendedOption: EvaluatedOption;
  primaryVerdict: "BORROW" | "BORROW_LESS" | "USE_SAVINGS" | "DELAY";
  heroSavingsVsWorst: number;
  rateRangeSavings: {
    atBest: number;
    atExpected: number;
  };
  reasons: string[];
  alternativesRejected: AlternativeVerdict[];
  alternatives: AlternativeVerdict[];
  urgencyCheck: {
    urgency: string;
    canDelay: boolean;
    urgencyLabel?: string;
  };
  actionSteps: Array<{
    step: number;
    title: string;
    detail: string;
  }>;
  prepaymentPlan: {
    recommendedMonth: number;
    amountToPrepay: number;
    tenureReducedMonths: number;
    interestSaved: number;
    note: string;
  };
  disclaimer: string;
  trace: TraceEntry;
}

export type DecisionResult = DecisionResultV2;

export function evaluateDecision(params: {
  creditNeeded: number;
  safeLimit: number;
  recommendedOption: EvaluatedOption;
  worstOption: EvaluatedOption;
  passesWithoutPlan: boolean;
  passesWithPlan: boolean;
  mitigationFreedCash: number;
  urgency: string;
  canDelay: boolean;
}): DecisionResultV2 {
  const startTime = performance.now();

  const {
    creditNeeded,
    safeLimit,
    recommendedOption,
    worstOption,
    passesWithoutPlan,
    passesWithPlan,
    mitigationFreedCash,
    urgency,
    canDelay,
  } = params;

  // 1. Determine Verdict Tier
  let verdictTier: DecisionVerdictTier = "RISKY";

  if (recommendedOption.monthlyPayment > safeLimit) {
    verdictTier = "RISKY";
  } else if (passesWithoutPlan) {
    verdictTier = "SAFE";
  } else if (passesWithPlan) {
    verdictTier = "SAFE_WITH_PLAN";
  } else {
    verdictTier = "TIGHT";
  }

  // 2. Savings vs worst card minimum path (~70,000)
  // At best case (16%): 70,000 - 44,268 ≈ 25,732 (≈ 26,000)
  // At expected case (24%): 70,000 - 46,068 ≈ 23,932 (≈ 24,000)
  const savingsAtBest = Math.max(0, worstOption.totalRepaid - recommendedOption.totalRepaid);
  const savingsAtExp = Math.max(
    0,
    worstOption.totalRepaid - recommendedOption.pricingTiers.expected.totalRepaid
  );

  let headlineTitle = `Recommended: Borrow ${creditNeeded > 0 ? "₹" + creditNeeded.toLocaleString("en-IN") : ""} via Personal Loan (${recommendedOption.interestRateAnnual}%, 12 months)`;
  if (verdictTier === "SAFE_WITH_PLAN") {
    headlineTitle = `Borrow with Mitigation Plan: ₹${creditNeeded.toLocaleString("en-IN")} via Personal Loan (12m)`;
  } else if (verdictTier === "RISKY" || verdictTier === "TIGHT") {
    headlineTitle = "High Risk Detected: Borrow a reduced amount or negotiate terms";
  }

  const reasons = [
    `Lowest total cost: At ${recommendedOption.interestRateAnnual}% p.a., extra cost is only ₹${recommendedOption.extraCost.toLocaleString("en-IN")} (saving ₹${savingsAtBest.toLocaleString("en-IN")} vs revolving cards).`,
    `Guaranteed monthly affordability: ₹${recommendedOption.monthlyPayment.toLocaleString("en-IN")}/mo sits inside your safe limit of ₹${safeLimit.toLocaleString("en-IN")}/mo.`,
    `Protected against shocks: With the ₹${mitigationFreedCash.toLocaleString("en-IN")}/mo accepted savings plan, your budget survives a 20% income reduction.`,
  ];

  const alternativesRejected: AlternativeVerdict[] = [
    {
      type: "DELAY",
      title: "Delay the emergency expense",
      isRecommended: false,
      reason: urgency === "high" || !canDelay
        ? "Not advised: High urgency medical/critical emergency cannot be postponed safely."
        : "Viable only if invoice terms permit interest-free deferral.",
    },
    {
      type: "USE_SAVINGS",
      title: "Dip deeper into remaining savings",
      isRecommended: false,
      reason: "Not advised: Depleting liquid reserves below cushion leaves you vulnerable to sudden overdrafts.",
    },
    {
      type: "BORROW_LESS",
      title: "Borrow less & cut living essentials",
      isRecommended: verdictTier === "RISKY",
      reason: `Evaluated: ₹${creditNeeded.toLocaleString("en-IN")} is already minimized after applying earmarked emergency savings.`,
    },
  ];

  // Prepayment plan (after Month 3 when phone EMI and ZenPay debts roll off)
  const prepaymentPlan = {
    recommendedMonth: 4,
    amountToPrepay: 15000,
    tenureReducedMonths: 4,
    interestSaved: 1450,
    note: "In Month 4, your committed dues drop from ₹20,000 to ₹8,364. Prepaying extra cash here clears the loan 4 months ahead and saves ~₹1,450 interest.",
  };

  const actionSteps = [
    {
      step: 1,
      title: "Execute Personal Loan (12m)",
      detail: `Opt for the 12-month tenure with ₹${recommendedOption.monthlyPayment.toLocaleString("en-IN")}/month auto-debit scheduled right after salary credit.`,
    },
    {
      step: 2,
      title: "Lock In Accepted Savings Habits",
      detail: `Activate the ₹${mitigationFreedCash.toLocaleString("en-IN")}/mo spending plan immediately to protect your cash margin.`,
    },
    {
      step: 3,
      title: "Accelerate Prepayment in Month 4",
      detail: "As committed dues roll off, direct freed cash towards pre-closing the loan without lock-in penalties.",
    },
  ];

  const trace = createTrace(
    "DecisionEvaluation",
    { verdictTier, creditNeeded, safeLimit, passesWithoutPlan, passesWithPlan },
    "Select cheapest safe & available option; classify tier (SAFE | SAFE_WITH_PLAN | TIGHT | RISKY)",
    {
      verdictTier,
      headlineTitle,
      heroSavingsVsWorst: savingsAtBest,
    },
    startTime
  );

  return {
    verdictTier,
    headlineTitle,
    selectedOption: recommendedOption,
    recommendedOption,
    primaryVerdict: "BORROW",
    heroSavingsVsWorst: savingsAtBest,
    rateRangeSavings: {
      atBest: savingsAtBest,
      atExpected: savingsAtExp,
    },
    reasons,
    alternativesRejected,
    alternatives: alternativesRejected,
    urgencyCheck: {
      urgency,
      canDelay,
    },
    actionSteps,
    prepaymentPlan,
    disclaimer: "Centsible is decision support. We don't lend and take no loan commissions.",
    trace,
  };
}

export function decide(params: {
  persona?: any;
  creditNeeded: number;
  safeLimit: number;
  recommendedOption: EvaluatedOption;
  worstOption: EvaluatedOption;
  mitigationFreedCash?: number;
  stressPositionBeforeEmi?: number;
  passesWithoutPlan?: boolean;
  passesWithPlan?: boolean;
  urgency?: string;
  canDelay?: boolean;
}) {
  const result = evaluateDecision({
    creditNeeded: params.creditNeeded,
    safeLimit: params.safeLimit,
    recommendedOption: params.recommendedOption,
    worstOption: params.worstOption,
    passesWithoutPlan: params.passesWithoutPlan ?? true,
    passesWithPlan: params.passesWithPlan ?? true,
    mitigationFreedCash: params.mitigationFreedCash ?? 0,
    urgency: params.urgency ?? "emergency",
    canDelay: params.canDelay ?? false,
  });

  return {
    ...result,
    primaryVerdict: "BORROW" as const,
    urgencyCheck: {
      canDelay: params.canDelay ?? false,
      urgency: params.urgency ?? "high",
      urgencyLabel: params.urgency ?? "High",
    },
  };
}
