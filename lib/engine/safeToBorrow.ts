export interface SafeToBorrowInput {
  income: number;
  committedDues: number;
  essentials: number;
  safetyBuffer: number;
}

export interface SafeToBorrowResult {
  income: number;
  committedDues: number;
  essentials: number;
  safetyBuffer: number;
  safeCapacity: number;
  dtiPercent: number; // Debt to Income ratio
  lenderLimitMock: number; // Approval limit vs true safe capacity
  disposableSurplus: number; // Income - committed - essentials
  breakdown: Array<{
    label: string;
    amount: number;
    type: "positive" | "negative" | "result";
    description: string;
  }>;
}

/**
 * Calculates the monthly Safe-to-Borrow capacity.
 * Priya: 45,000 − 24,500 − 14,000 − 2,000 = ₹4,500
 */
export function calculateSafeToBorrow(input: SafeToBorrowInput): SafeToBorrowResult {
  const { income, committedDues, essentials, safetyBuffer } = input;
  const safeCapacity = income - committedDues - essentials - safetyBuffer;
  const disposableSurplus = income - committedDues - essentials;
  const dtiPercent = income > 0 ? (committedDues / income) * 100 : 0;
  
  // Lenders typically approve up to 50% FOIR of income minus current EMI
  // which produces artificially high approvals (e.g. ₹1,50,000)
  const lenderLimitMock = Math.round((income * 3.33) / 5000) * 5000;

  return {
    income,
    committedDues,
    essentials,
    safetyBuffer,
    safeCapacity: Math.max(0, safeCapacity),
    dtiPercent: Math.round(dtiPercent),
    lenderLimitMock,
    disposableSurplus,
    breakdown: [
      {
        label: "Monthly Take-Home Income",
        amount: income,
        type: "positive",
        description: "Verified salary credits into primary account",
      },
      {
        label: "Committed Dues",
        amount: -committedDues,
        type: "negative",
        description: "Active BNPLs, credit card minimums, and existing EMIs",
      },
      {
        label: "Essential Living Costs",
        amount: -essentials,
        type: "negative",
        description: "Food, utilities, rent, and non-negotiable transit",
      },
      {
        label: "Safety Cushion Buffer",
        amount: -safetyBuffer,
        type: "negative",
        description: "Emergency cash retained to prevent sudden overdraft",
      },
      {
        label: "Safe Monthly EMI Limit",
        amount: Math.max(0, safeCapacity),
        type: "result",
        description: "Maximum EMI you can comfortably afford every month",
      },
    ],
  };
}

