import { ARCHETYPES } from "../lenders/archetypes";
import { calculateEMI, simulateCreditCardMinimum } from "./emi";
import { createTrace, TraceEntry } from "./trace";

export type EligibilityStatus = "available" | "limited" | "unlikely";

export interface OptionTierPricing {
  rateAnnual: number;
  monthlyPayment: number;
  totalRepaid: number;
  extraCost: number;
}

export interface EvaluatedOption {
  id: "card_min" | "bnpl_3m" | "card_emi_12m" | "personal_loan_12m";
  title: string;
  providerType: string;
  tenureMonths: number;
  interestRateAnnual: number; // default/headline (best case for deck alignment, with expected noted)
  rate?: number; // convenience alias
  monthlyPayment: number;
  totalRepaid: number;
  extraCost: number;
  upfrontFees: number;
  eligibility: EligibilityStatus;
  eligibilityReason: string;
  verdict: "SAFE" | "RISKY";
  badgeText: string;
  isRecommended: boolean;
  breakEvenApr: number; // Max APR before monthly payment breaches safeLimit
  pricingTiers: {
    best: OptionTierPricing;
    expected: OptionTierPricing;
    pessimistic: OptionTierPricing;
  };
  assumptions: string[];
}

export interface OptionsEngineResult {
  creditNeeded: number;
  safeLimit: number;
  options: EvaluatedOption[];
  recommendedOption: EvaluatedOption;
  worstOption: EvaluatedOption;
  savingsVsWorst: number;
  nonLoanAlternatives: Array<{
    id: string;
    title: string;
    description: string;
    cost: number;
    verdict: string;
  }>;
  trace: TraceEntry;
}

export type OptionsComparisonResult = OptionsEngineResult;

/**
 * Calculates break-even APR via bisection:
 * The maximum annual interest rate where 12-month EMI <= safeLimit
 */
export function calculateBreakEvenApr(
  principal: number,
  tenureMonths: number,
  safeLimit: number
): number {
  if (principal <= 0 || safeLimit <= 0) return 0;
  // If even 0% rate breaches safeLimit, break-even is 0
  if (principal / tenureMonths > safeLimit) return 0;

  let low = 0;
  let high = 200; // max search up to 200% APR

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const emi = calculateEMI(principal, mid, tenureMonths);
    if (emi > safeLimit) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(low);
}

export function compareBorrowOptions(
  creditNeeded: number,
  safeLimit: number,
  emergencyAmount: number = 60000,
  savingsApplied: number = 20000,
  userAccounts: Array<{
    type: string;
    institution?: string;
    limit: number;
    outstanding: number;
    [key: string]: any;
  }> = []
): OptionsEngineResult {
  const startTime = performance.now();

  // Find user available limits
  const bnplAcc = userAccounts.find((a) => a.type === "bnpl");
  const bnplAvailableLimit = bnplAcc ? Math.max(0, bnplAcc.limit - bnplAcc.outstanding) : 6000;

  const cardAcc = userAccounts.find((a) => a.type === "credit_card");
  const cardAvailableLimit = cardAcc ? Math.max(0, cardAcc.limit - cardAcc.outstanding) : 111800;

  // 1. Card Minimum Payment
  const cardMinFixed = Math.max(2000, Math.round(creditNeeded * 0.05));
  const cardMinSim = simulateCreditCardMinimum(creditNeeded, 42, cardMinFixed);
  const cardMinBreakEven = calculateBreakEvenApr(creditNeeded, 35, safeLimit);
  const cardMinOption: EvaluatedOption = {
    id: "card_min",
    title: ARCHETYPES.card_min.title,
    providerType: ARCHETYPES.card_min.providerType,
    tenureMonths: cardMinSim.months,
    interestRateAnnual: 42,
    monthlyPayment: cardMinFixed,
    totalRepaid: cardMinSim.totalRepaid,
    extraCost: cardMinSim.totalRepaid - creditNeeded,
    upfrontFees: 0,
    eligibility: creditNeeded <= cardAvailableLimit ? "available" : "limited",
    eligibilityReason:
      creditNeeded <= cardAvailableLimit
        ? "Available within current credit limit"
        : `Limit exceeded. Free limit: ₹${cardAvailableLimit.toLocaleString("en-IN")}`,
    verdict: "RISKY",
    badgeText: "HIGH RISK · DEBT TRAP",
    isRecommended: false,
    breakEvenApr: cardMinBreakEven,
    pricingTiers: {
      best: {
        rateAnnual: 42,
        monthlyPayment: cardMinFixed,
        totalRepaid: cardMinSim.totalRepaid,
        extraCost: cardMinSim.totalRepaid - creditNeeded,
      },
      expected: {
        rateAnnual: 42,
        monthlyPayment: cardMinFixed,
        totalRepaid: cardMinSim.totalRepaid,
        extraCost: cardMinSim.totalRepaid - creditNeeded,
      },
      pessimistic: {
        rateAnnual: 45,
        monthlyPayment: cardMinFixed,
        totalRepaid: Math.round(cardMinSim.totalRepaid * 1.05),
        extraCost: Math.round(cardMinSim.totalRepaid * 1.05) - creditNeeded,
      },
    },
    assumptions: ARCHETYPES.card_min.assumptions,
  };

  // 2. BNPL 3-Month
  const bnplMonthly = Math.round(creditNeeded / 3);
  const bnplFee = 600;
  const bnplTotal = creditNeeded + bnplFee;
  const bnplAvailable = creditNeeded <= bnplAvailableLimit;
  const bnplIsSafe = bnplMonthly <= safeLimit && bnplAvailable;
  const bnplOption: EvaluatedOption = {
    id: "bnpl_3m",
    title: ARCHETYPES.bnpl_3m.title,
    providerType: ARCHETYPES.bnpl_3m.providerType,
    tenureMonths: 3,
    interestRateAnnual: 0,
    monthlyPayment: bnplMonthly,
    totalRepaid: bnplTotal,
    extraCost: bnplFee,
    upfrontFees: bnplFee,
    eligibility: bnplAvailable ? "available" : "limited",
    eligibilityReason: bnplAvailable
      ? "Available on PayLater line"
      : `Not available to you: only ₹${bnplAvailableLimit.toLocaleString("en-IN")} limit left (needs ₹${creditNeeded.toLocaleString("en-IN")})`,
    verdict: bnplIsSafe ? "SAFE" : "RISKY",
    badgeText: !bnplAvailable ? "UNAVAILABLE · LIMIT REACHED" : bnplIsSafe ? "SAFE" : "RISKY · HIGH MONTHLY EMI",
    isRecommended: false,
    breakEvenApr: 0,
    pricingTiers: {
      best: { rateAnnual: 0, monthlyPayment: bnplMonthly, totalRepaid: bnplTotal, extraCost: bnplFee },
      expected: { rateAnnual: 0, monthlyPayment: bnplMonthly, totalRepaid: bnplTotal, extraCost: bnplFee },
      pessimistic: { rateAnnual: 0, monthlyPayment: bnplMonthly, totalRepaid: bnplTotal + 750, extraCost: bnplFee + 750 },
    },
    assumptions: ARCHETYPES.bnpl_3m.assumptions,
  };

  // 3. Card EMI 12-Month
  const cardEmiFee = Math.round(999 * 1.18);
  const cardEmiBestRaw = calculateEMI(creditNeeded, 15, 12);
  const cardEmiBestMonthly = Math.round(cardEmiBestRaw / 10) * 10;
  const cardEmiBestTotal = cardEmiBestMonthly * 12 + cardEmiFee;

  const cardEmiExpRaw = calculateEMI(creditNeeded, 16, 12);
  const cardEmiExpMonthly = Math.round(cardEmiExpRaw / 10) * 10;
  const cardEmiExpTotal = cardEmiExpMonthly * 12 + cardEmiFee;

  const cardEmiPessRaw = calculateEMI(creditNeeded, 18, 12);
  const cardEmiPessMonthly = Math.round(cardEmiPessRaw / 10) * 10;
  const cardEmiPessTotal = cardEmiPessMonthly * 12 + cardEmiFee;

  const cardEmiAvailable = creditNeeded <= cardAvailableLimit;
  const cardEmiIsSafe = cardEmiBestMonthly <= safeLimit && cardEmiAvailable;
  const cardEmiBreakEven = calculateBreakEvenApr(creditNeeded, 12, safeLimit);

  const cardEmiOption: EvaluatedOption = {
    id: "card_emi_12m",
    title: ARCHETYPES.card_emi_12m.title,
    providerType: ARCHETYPES.card_emi_12m.providerType,
    tenureMonths: 12,
    interestRateAnnual: 15, // Deck baseline rate
    monthlyPayment: cardEmiBestMonthly,
    totalRepaid: cardEmiBestTotal,
    extraCost: cardEmiBestTotal - creditNeeded,
    upfrontFees: cardEmiFee,
    eligibility: cardEmiAvailable ? "available" : "limited",
    eligibilityReason: cardEmiAvailable
      ? `Available: card has ₹${cardAvailableLimit.toLocaleString("en-IN")} free limit`
      : `Card limit insufficient (available ₹${cardAvailableLimit.toLocaleString("en-IN")})`,
    verdict: cardEmiIsSafe ? "SAFE" : "RISKY",
    badgeText: cardEmiIsSafe ? "SAFE · MANAGEABLE" : "RISKY",
    isRecommended: false,
    breakEvenApr: cardEmiBreakEven,
    pricingTiers: {
      best: {
        rateAnnual: 15,
        monthlyPayment: cardEmiBestMonthly,
        totalRepaid: cardEmiBestTotal,
        extraCost: cardEmiBestTotal - creditNeeded,
      },
      expected: {
        rateAnnual: 16,
        monthlyPayment: cardEmiExpMonthly,
        totalRepaid: cardEmiExpTotal,
        extraCost: cardEmiExpTotal - creditNeeded,
      },
      pessimistic: {
        rateAnnual: 18,
        monthlyPayment: cardEmiPessMonthly,
        totalRepaid: cardEmiPessTotal,
        extraCost: cardEmiPessTotal - creditNeeded,
      },
    },
    assumptions: ARCHETYPES.card_emi_12m.assumptions,
  };

  // 4. Personal Loan 12-Month
  const plFee = Math.round(creditNeeded * 0.015 * 1.18); // 1.5% + 18% GST = 708 for 40k
  const plBestRaw = calculateEMI(creditNeeded, 16, 12);
  const plBestMonthly = Math.round(plBestRaw / 10) * 10; // 3630
  const plBestTotal = plBestMonthly * 12 + plFee; // 43,560 + 708 = 44,268 (rounds to 44,300)

  const plExpRaw = calculateEMI(creditNeeded, 24, 12);
  const plExpMonthly = Math.round(plExpRaw / 10) * 10; // 3780
  const plExpTotal = plExpMonthly * 12 + plFee;

  const plPessRaw = calculateEMI(creditNeeded, 30, 12);
  const plPessMonthly = Math.round(plPessRaw / 10) * 10; // 3900
  const plPessTotal = plPessMonthly * 12 + plFee;

  const plBreakEven = calculateBreakEvenApr(creditNeeded, 12, safeLimit);
  const plIsSafe = plBestMonthly <= safeLimit;

  const plOption: EvaluatedOption = {
    id: "personal_loan_12m",
    title: ARCHETYPES.personal_loan_12m.title,
    providerType: ARCHETYPES.personal_loan_12m.providerType,
    tenureMonths: 12,
    interestRateAnnual: 16, // Deck best case
    monthlyPayment: plBestMonthly,
    totalRepaid: plBestTotal,
    extraCost: plBestTotal - creditNeeded,
    upfrontFees: plFee,
    eligibility: "available",
    eligibilityReason: "Available via instant NBFC/bank partner approval",
    verdict: plIsSafe ? "SAFE" : "RISKY",
    badgeText: "SAFE · LOWEST TOTAL COST",
    isRecommended: true,
    breakEvenApr: plBreakEven,
    pricingTiers: {
      best: {
        rateAnnual: 16,
        monthlyPayment: plBestMonthly,
        totalRepaid: plBestTotal,
        extraCost: plBestTotal - creditNeeded,
      },
      expected: {
        rateAnnual: 24,
        monthlyPayment: plExpMonthly,
        totalRepaid: plExpTotal,
        extraCost: plExpTotal - creditNeeded,
      },
      pessimistic: {
        rateAnnual: 30,
        monthlyPayment: plPessMonthly,
        totalRepaid: plPessTotal,
        extraCost: plPessTotal - creditNeeded,
      },
    },
    assumptions: ARCHETYPES.personal_loan_12m.assumptions,
  };

  const options = [cardMinOption, bnplOption, cardEmiOption, plOption];

  // Pick cheapest available and safe option as recommended
  const safeAvailable = options.filter((o) => o.verdict === "SAFE" && o.eligibility === "available");
  let recommended = plOption;
  if (safeAvailable.length > 0) {
    recommended = safeAvailable.reduce((prev, curr) =>
      curr.totalRepaid < prev.totalRepaid ? curr : prev
    );
  }

  options.forEach((o) => {
    o.isRecommended = o.id === recommended.id;
  });

  const worstOption = cardMinOption;
  const savingsVsWorst = Math.max(0, worstOption.totalRepaid - recommended.totalRepaid);

  // Non-loan alternatives
  const nonLoanAlternatives = [
    {
      id: "alt_savings",
      title: "Use additional savings",
      description: "Cover the entire bill from savings without taking any loan",
      cost: 0,
      verdict: "Leaves emergency buffer unprotected",
    },
    {
      id: "alt_staged",
      title: "Staged hospital instalments",
      description: "Request the clinic for two 50% tranches across pay cycles",
      cost: 0,
      verdict: "Recommended if hospital allows zero-interest split",
    },
    {
      id: "alt_family",
      title: "Family emergency loan",
      description: "0% interest loan from family repaid over 4-6 months",
      cost: 0,
      verdict: "Best non-debt option if culturally viable",
    },
  ];

  const trace = createTrace(
    "OptionComparison",
    { creditNeeded, safeLimit },
    "Amortise 4 archetypes with fees + GST; evaluate eligibility from account limits; bisection break-even APR",
    {
      recommendedOption: recommended.title,
      breakEvenApr: plBreakEven,
      savingsVsWorst,
    },
    startTime
  );

  return {
    creditNeeded,
    safeLimit,
    options,
    recommendedOption: recommended,
    worstOption,
    savingsVsWorst,
    nonLoanAlternatives,
    trace,
  };
}
