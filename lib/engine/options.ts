import { calculateEMI, simulateCreditCardMinimum } from "./emi";

export interface BorrowOption {
  id: "card_min" | "bnpl_3m" | "card_emi_12m" | "personal_loan_12m";
  title: string;
  providerType: string;
  monthlyPayment: number;
  tenureMonths: number;
  interestRateAnnual: number;
  upfrontFees: number;
  totalRepaid: number;
  extraCost: number; // totalRepaid - creditNeeded
  verdict: "SAFE" | "RISKY";
  badgeText: string;
  isRecommended: boolean;
  riskReason: string;
  keyStats: {
    monthlyRateStr: string;
    totalInterest: number;
    feesWithGst: number;
  };
  assumptions: string[];
}

export interface OptionsComparisonResult {
  emergencyAmount: number;
  savingsApplied: number;
  creditNeeded: number;
  safeLimit: number;
  options: BorrowOption[];
  recommendedOption: BorrowOption;
  worstOption: BorrowOption;
  savingsVsWorst: number; // Worst totalRepaid - Best totalRepaid (~₹25,700 - ₹26,000)
}

export function compareBorrowOptions(
  creditNeeded: number,
  safeMonthlyLimit: number,
  emergencyAmount: number = 60000,
  savingsApplied: number = 20000
): OptionsComparisonResult {
  // Option 1: Card Minimum Payment
  // Fixed payment: default ₹2,000 or 5% of balance, 42% APR
  const cardMinFixed = Math.max(2000, Math.round(creditNeeded * 0.05));
  const cardMinSim = simulateCreditCardMinimum(creditNeeded, 42, cardMinFixed);
  const cardMinOption: BorrowOption = {
    id: "card_min",
    title: "Credit Card Minimum Due",
    providerType: "Revolving Credit Line",
    monthlyPayment: cardMinFixed,
    tenureMonths: cardMinSim.months,
    interestRateAnnual: 42,
    upfrontFees: 0,
    totalRepaid: cardMinSim.totalRepaid,
    extraCost: cardMinSim.totalRepaid - creditNeeded,
    verdict: "RISKY",
    badgeText: "HIGH RISK · DEBT TRAP",
    isRecommended: false,
    riskReason: `Extremely long tenure (${cardMinSim.months} months). Compounding 42% APR eats ₹${(cardMinSim.totalInterest).toLocaleString("en-IN")} in interest alone.`,
    keyStats: {
      monthlyRateStr: "3.5% / month (42% APR)",
      totalInterest: cardMinSim.totalInterest,
      feesWithGst: 0,
    },
    assumptions: [
      "Assumes paying fixed ₹2,000/mo without additional card swipes",
      "Revolving interest charged at 3.5% per month compounded",
      "GST on monthly interest applicable per RBI rules",
    ],
  };

  // Option 2: BNPL "No-Cost" 3 Months
  const bnplTenure = 3;
  const bnplMonthly = Math.round(creditNeeded / bnplTenure);
  const bnplFee = 600; // Flat platform / convenience fee
  const bnplTotal = creditNeeded + bnplFee; // 3 equal instalments + flat fee
  const bnplIsSafe = bnplMonthly <= safeMonthlyLimit;
  const bnplOption: BorrowOption = {
    id: "bnpl_3m",
    title: "BNPL 'No-Cost' 3 Months",
    providerType: "Pay Later Platform",
    monthlyPayment: bnplMonthly,
    tenureMonths: bnplTenure,
    interestRateAnnual: 0,
    upfrontFees: bnplFee,
    totalRepaid: bnplTotal,
    extraCost: bnplFee,
    verdict: bnplIsSafe ? "SAFE" : "RISKY",
    badgeText: bnplIsSafe ? "SAFE" : "RISKY · HIGH MONTHLY EMI",
    isRecommended: false,
    riskReason: bnplIsSafe
      ? "Low extra fees, short commitment"
      : `Monthly payment (₹${bnplMonthly.toLocaleString("en-IN")}) is ~${(bnplMonthly / safeMonthlyLimit).toFixed(1)}× your safe limit (₹${safeMonthlyLimit.toLocaleString("en-IN")}). High default risk.`,
    keyStats: {
      monthlyRateStr: "0% interest, ₹600 platform fee",
      totalInterest: 0,
      feesWithGst: bnplFee,
    },
    assumptions: [
      "3 equal monthly installments of ₹13,333",
      "₹600 convenience/processing charge upfront",
      "Heavy late-fee penalties (up to ₹750/instance) if unpaid",
    ],
  };

  // Option 3: Card EMI (12 Months)
  // 15% p.a., ₹999 fee + 18% GST (= 1,178.82)
  const cardEmiRate = 15;
  const cardEmiRaw = calculateEMI(creditNeeded, cardEmiRate, 12);
  const cardEmiMonthly = Math.round(cardEmiRaw / 10) * 10; // lenders quote EMIs rounded to ₹10
  const cardFeeBase = 999;
  const cardFeeGst = Math.round(cardFeeBase * 1.18);
  const cardEmiTotal = cardEmiMonthly * 12 + cardFeeGst;
  const cardEmiIsSafe = cardEmiMonthly <= safeMonthlyLimit;
  const cardEmiOption: BorrowOption = {
    id: "card_emi_12m",
    title: "Credit Card EMI (12m)",
    providerType: "Bank Card Conversion",
    monthlyPayment: cardEmiMonthly,
    tenureMonths: 12,
    interestRateAnnual: cardEmiRate,
    upfrontFees: cardFeeGst,
    totalRepaid: cardEmiTotal,
    extraCost: cardEmiTotal - creditNeeded,
    verdict: cardEmiIsSafe ? "SAFE" : "RISKY",
    badgeText: "SAFE · MANAGEABLE",
    isRecommended: false,
    riskReason: cardEmiIsSafe
      ? "Comfortably within safe monthly EMI limit, manageable tenure"
      : `Monthly payment exceeds your safe capacity of ₹${safeMonthlyLimit.toLocaleString("en-IN")}`,
    keyStats: {
      monthlyRateStr: "1.25% / month (15% p.a.)",
      totalInterest: cardEmiMonthly * 12 - creditNeeded,
      feesWithGst: cardFeeGst,
    },
    assumptions: [
      "15% reducing balance interest rate over 12 months",
      "One-time ₹999 processing fee + 18% GST (₹1,179)",
      "Standard monthly auto-debit from card limit",
    ],
  };

  // Option 4: Personal Loan (12 Months)
  // 16% p.a., 1.5% processing fee + 18% GST (on 40,000 = 600 + 108 = 708)
  const plRate = 16;
  const plRaw = calculateEMI(creditNeeded, plRate, 12);
  const plMonthly = Math.round(plRaw / 10) * 10; // lenders quote EMIs rounded to ₹10
  const plFeeBase = Math.round(creditNeeded * 0.015);
  const plFeeGst = Math.round(plFeeBase * 1.18);
  const plTotal = plMonthly * 12 + plFeeGst;
  const plIsSafe = plMonthly <= safeMonthlyLimit;
  const plOption: BorrowOption = {
    id: "personal_loan_12m",
    title: "Instant Personal Loan",
    providerType: "Pre-approved NBFC/Bank",
    monthlyPayment: plMonthly,
    tenureMonths: 12,
    interestRateAnnual: plRate,
    upfrontFees: plFeeGst,
    totalRepaid: plTotal,
    extraCost: plTotal - creditNeeded,
    verdict: plIsSafe ? "SAFE" : "RISKY",
    badgeText: "SAFE · LOWEST TOTAL COST",
    isRecommended: true,
    riskReason: "Lowest total repayment cost among safe options, fits well inside monthly budget.",
    keyStats: {
      monthlyRateStr: "1.33% / month (16% p.a.)",
      totalInterest: plMonthly * 12 - creditNeeded,
      feesWithGst: plFeeGst,
    },
    assumptions: [
      "16% reducing interest rate fixed for 12 months",
      "1.5% processing fee + 18% GST (₹708)",
      "No foreclosure lock-in after 6 months; prepayment friendly",
    ],
  };

  const options = [cardMinOption, bnplOption, cardEmiOption, plOption];

  // Best recommended: Lowest total repaid among SAFE options
  const safeOptions = options.filter((o) => o.verdict === "SAFE");
  let recommended = plOption;
  if (safeOptions.length > 0) {
    recommended = safeOptions.reduce((prev, curr) =>
      curr.totalRepaid < prev.totalRepaid ? curr : prev
    );
  }
  // Mark isRecommended flag
  options.forEach((o) => {
    o.isRecommended = o.id === recommended.id;
  });

  const worstOption = cardMinOption;
  const savingsVsWorst = worstOption.totalRepaid - recommended.totalRepaid;

  return {
    emergencyAmount,
    savingsApplied,
    creditNeeded,
    safeLimit: safeMonthlyLimit,
    options,
    recommendedOption: recommended,
    worstOption,
    savingsVsWorst,
  };
}

