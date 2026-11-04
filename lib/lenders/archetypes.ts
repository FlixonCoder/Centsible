import { GST_RATE } from "../engine/constants";

export interface RateRange {
  best: number;
  expected: number;
  pessimistic: number;
}

export interface LoanArchetype {
  id: "card_min" | "bnpl_3m" | "card_emi_12m" | "personal_loan_12m";
  title: string;
  providerType: string;
  tenureMonths: number;
  rateRange: RateRange;
  upfrontFeeFlat: number;
  upfrontFeePercent: number;
  foreclosureLockMonths: number;
  foreclosureFeePercent: number;
  assumptions: string[];
}

export const ARCHETYPES: Record<string, LoanArchetype> = {
  card_min: {
    id: "card_min",
    title: "Credit Card Minimum Due",
    providerType: "Revolving Credit Line",
    tenureMonths: 35, // Dynamic
    rateRange: {
      best: 42,
      expected: 42,
      pessimistic: 45,
    },
    upfrontFeeFlat: 0,
    upfrontFeePercent: 0,
    foreclosureLockMonths: 0,
    foreclosureFeePercent: 0,
    assumptions: [
      "Paying fixed ₹2,000/mo or 5% minimum payment",
      "Compounding 3.5%/month (42% APR) revolving interest",
      "No additional card spends during repayment",
    ],
  },
  bnpl_3m: {
    id: "bnpl_3m",
    title: "BNPL 'No-Cost' (3 Months)",
    providerType: "PayLater Network",
    tenureMonths: 3,
    rateRange: {
      best: 0,
      expected: 0,
      pessimistic: 0,
    },
    upfrontFeeFlat: 600,
    upfrontFeePercent: 0,
    foreclosureLockMonths: 0,
    foreclosureFeePercent: 0,
    assumptions: [
      "3 equal monthly installments of 1/3 principal",
      "One-time flat platform/convenience fee of ₹600",
      "Late penalty charges up to ₹750/instance if auto-debit bounces",
    ],
  },
  card_emi_12m: {
    id: "card_emi_12m",
    title: "Credit Card EMI (12m)",
    providerType: "Bank Card Conversion",
    tenureMonths: 12,
    rateRange: {
      best: 15,
      expected: 16,
      pessimistic: 18,
    },
    upfrontFeeFlat: 999 * (1 + GST_RATE), // ₹1,178.82 ≈ ₹1,179
    upfrontFeePercent: 0,
    foreclosureLockMonths: 0,
    foreclosureFeePercent: 0.03,
    assumptions: [
      "Reducing balance interest (best 15%, expected 16%, pessimistic 18%)",
      "₹999 bank processing fee + 18% GST (₹1,179 total fee)",
      "Requires unblocked credit limit equal to full loan amount",
    ],
  },
  personal_loan_12m: {
    id: "personal_loan_12m",
    title: "Instant Personal Loan (12m)",
    providerType: "Pre-approved NBFC/Bank",
    tenureMonths: 12,
    rateRange: {
      best: 16,
      expected: 24, // Realistic near-prime rate for 54% FOIR / 704 score
      pessimistic: 30,
    },
    upfrontFeeFlat: 0,
    upfrontFeePercent: 0.015 * (1 + GST_RATE), // 1.5% fee + 18% GST = 1.77%
    foreclosureLockMonths: 3,
    foreclosureFeePercent: 0, // Zero foreclosure after lock-in
    assumptions: [
      "Rate tiered by credit score & FOIR: 16% prime, 24% expected near-prime, 30% upper band",
      "1.5% processing fee + 18% GST",
      "Zero foreclosure penalties after 3 months lock-in",
    ],
  },
};

