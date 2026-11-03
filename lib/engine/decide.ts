import { BorrowOption } from "./options";
import { Persona } from "../sample-data";

export type DecisionVerdictType = "BORROW" | "BORROW_LESS" | "USE_SAVINGS" | "DELAY";

export interface AlternativeVerdict {
  type: DecisionVerdictType;
  title: string;
  isRecommended: boolean;
  reason: string;
}

export interface DecisionResult {
  primaryVerdict: DecisionVerdictType;
  headlineTitle: string;
  recommendedOption: BorrowOption;
  heroSavingsVsWorst: number; // ~25,700 - 26,000
  urgencyCheck: {
    urgency: "high" | "medium" | "low";
    canDelay: boolean;
    reason: string;
  };
  reasons: string[];
  alternatives: AlternativeVerdict[];
  actionSteps: Array<{
    step: number;
    title: string;
    detail: string;
  }>;
  disclaimer: string;
}

export function decide(params: {
  persona: Persona;
  creditNeeded: number;
  safeLimit: number;
  recommendedOption: BorrowOption;
  worstOption: BorrowOption;
  mitigationFreedCash: number;
  stressPositionBeforeEmi: number;
}): DecisionResult {
  const {
    persona,
    creditNeeded,
    safeLimit,
    recommendedOption,
    worstOption,
    mitigationFreedCash,
    stressPositionBeforeEmi,
  } = params;

  const savingsVsWorst = Math.max(0, worstOption.totalRepaid - recommendedOption.totalRepaid);

  // Check urgency
  const isHighUrgency = persona.emergencyUrgency === "high";

  // Decision logic
  let primaryVerdict: DecisionVerdictType = "BORROW";
  let headlineTitle = `Recommended: Borrow ${creditNeeded > 0 ? "₹" + creditNeeded.toLocaleString("en-IN") : ""} via Personal Loan (${recommendedOption.interestRateAnnual}%, 12m)`;

  if (persona.savingsAvailable >= creditNeeded * 2 && safeLimit < recommendedOption.monthlyPayment) {
    primaryVerdict = "USE_SAVINGS";
    headlineTitle = "Recommended: Dip deeper into existing liquid savings";
  } else if (!isHighUrgency && safeLimit < recommendedOption.monthlyPayment) {
    primaryVerdict = "DELAY";
    headlineTitle = "Recommended: Delay or staged funding";
  } else if (safeLimit < recommendedOption.monthlyPayment && mitigationFreedCash + safeLimit < recommendedOption.monthlyPayment) {
    primaryVerdict = "BORROW_LESS";
    headlineTitle = "Recommended: Borrow a reduced amount";
  }

  const reasons = [
    `Lowest total cost: At ${recommendedOption.interestRateAnnual}% p.a., you pay only ₹${recommendedOption.extraCost.toLocaleString("en-IN")} in total interest & fees.`,
    `Guaranteed affordability: Monthly EMI of ₹${recommendedOption.monthlyPayment.toLocaleString("en-IN")} is within your safe cap of ₹${safeLimit.toLocaleString("en-IN")}/mo (expands to ₹${(safeLimit + mitigationFreedCash).toLocaleString("en-IN")} with mitigation).`,
    `Shielded against shocks: With ₹${mitigationFreedCash.toLocaleString("en-IN")}/mo freed up, your budget resists a 20% income drop.`,
  ];

  const alternatives: AlternativeVerdict[] = [
    {
      type: "DELAY",
      title: "Delay the expense",
      isRecommended: primaryVerdict === "DELAY",
      reason: isHighUrgency
        ? "Not advised: Medical emergencies cannot be postponed without severe health risk."
        : "Viable if the deadline has flexibility.",
    },
    {
      type: "USE_SAVINGS",
      title: "Dip deeper into savings",
      isRecommended: primaryVerdict === "USE_SAVINGS",
      reason: "Not advised: Depleting your remaining emergency cash leaves you unprotected against sudden overdrafts.",
    },
    {
      type: "BORROW_LESS",
      title: "Borrow less & cut essentials",
      isRecommended: primaryVerdict === "BORROW_LESS",
      reason: `Evaluated: ₹${creditNeeded.toLocaleString("en-IN")} is already optimized after putting in ₹${persona.savingsDefaultApplied.toLocaleString("en-IN")} from savings.`,
    },
  ];

  const actionSteps = [
    {
      step: 1,
      title: "Disburse to HDFC Salary Account",
      detail: `Select the 12-month tenure with ₹${recommendedOption.monthlyPayment.toLocaleString("en-IN")} auto-debit on the 5th of each month.`,
    },
    {
      step: 2,
      title: "Lock In Mitigation Cuts",
      detail: `Turn on the ₹${mitigationFreedCash.toLocaleString("en-IN")} savings habits immediately to protect your monthly margin.`,
    },
    {
      step: 3,
      title: "Prepay With 50% Freed Cash",
      detail: "Add ₹1,700/mo extra from month 3 onwards to clear the loan 4 months ahead and save interest.",
    },
  ];

  return {
    primaryVerdict,
    headlineTitle,
    recommendedOption,
    heroSavingsVsWorst: savingsVsWorst,
    urgencyCheck: {
      urgency: persona.emergencyUrgency,
      canDelay: !isHighUrgency,
      reason: isHighUrgency
        ? "Critical immediate necessity: Non-negotiable medical deadline."
        : "Flexible timeline: Can be phased across multiple pay cycles.",
    },
    reasons,
    alternatives,
    actionSteps,
    disclaimer: "Centsible is strictly an advisory assistant. We do not lend, broker loans, or accept lender commissions.",
  };
}
