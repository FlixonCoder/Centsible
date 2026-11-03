export interface MitigationAction {
  id: string;
  category: "food" | "transport" | "subscriptions" | "shopping" | "debt_strategy" | "autosave";
  title: string;
  description: string;
  monthlySaving: number;
  effort: "Easy" | "Medium";
  enabledByDefault: boolean;
  isActionableCut: boolean; // true if it adds to freed cash; false if strategic advice
  iconName: string;
}

export const DEFAULT_MITIGATION_ACTIONS: MitigationAction[] = [
  {
    id: "cut_food_delivery",
    category: "food",
    title: "Batch meal-prep & cook 3 weekdays",
    description: "Cook at home on Tue/Wed/Thu instead of ordering food delivery (currently ₹2,200/mo).",
    monthlySaving: 1200,
    effort: "Easy",
    enabledByDefault: true,
    isActionableCut: true,
    iconName: "Utensils",
  },
  {
    id: "cut_cab_rides",
    category: "transport",
    title: "Switch regular commute to Metro / Bus",
    description: "Replace daily on-demand cab surges (₹1,500/mo) with rapid transit metro pass.",
    monthlySaving: 700,
    effort: "Easy",
    enabledByDefault: true,
    isActionableCut: true,
    iconName: "Train",
  },
  {
    id: "pause_subscriptions",
    category: "subscriptions",
    title: "Pause 2 dormant streaming & gym subscriptions",
    description: "Temporarily pause Hotstar and the unused gym workout app during the loan payoff.",
    monthlySaving: 700,
    effort: "Easy",
    enabledByDefault: true,
    isActionableCut: true,
    iconName: "Tv",
  },
  {
    id: "cap_impulse_shopping",
    category: "shopping",
    title: "Set a ₹2,000 monthly impulse spend lock",
    description: "Introduce a 48-hour cooling-off rule on non-essential online retail carts (saving ₹800/mo).",
    monthlySaving: 800,
    effort: "Medium",
    enabledByDefault: true,
    isActionableCut: true,
    iconName: "ShoppingBag",
  },
  {
    id: "debt_avalanche_tip",
    category: "debt_strategy",
    title: "Debt Avalanche: Prioritize 42% APR ICICI Card",
    description: "Allocate any bonus cash to clear the 42% APR credit card balance first before paying extra on lower-interest loans.",
    monthlySaving: 0,
    effort: "Easy",
    enabledByDefault: true,
    isActionableCut: false,
    iconName: "Zap",
  },
  {
    id: "roundup_emergency_fund",
    category: "autosave",
    title: "Round-up & Auto-Save: Emergency Reserve Builder",
    description: "Automatically park 50% of the freed savings into an instant-access liquid fund to rebuild your ₹20,000 cushion.",
    monthlySaving: 0,
    effort: "Easy",
    enabledByDefault: true,
    isActionableCut: false,
    iconName: "ShieldCheck",
  },
];

export interface MitigationImpactInput {
  baseSafeCapacity: number; // 4,500
  baseStressPositionBeforeEmi: number; // -2,500
  loanPrincipal: number; // 40,000
  loanEmi: number; // 3,630
  loanTenureMonths: number; // 12
  loanAnnualRate: number; // 16
  activeActionIds: string[];
}

export interface MitigationImpactResult {
  totalFreedMonthly: number; // 3,400 with all default actionable cuts
  newSafeCapacity: number; // 4,500 + 3,400 = 7,900
  newStressPositionBeforeEmi: number; // -2,500 + 3,400 = +900
  newStressPositionWithEmi: number; // +900 - 3,630 = -2,730 (or with full buffer)
  isStressDeficitEliminated: boolean; // Stress before EMI is positive!
  prepaymentMonthly: number; // 50% of freed cash
  prepaymentTenureMonths: number; // Reduced tenure
  monthsSaved: number;
  interestSaved: number;
  categorySpendingBefore: Array<{ name: string; amount: number; freed: number }>;
}

export function calculateMitigationImpact(input: MitigationImpactInput): MitigationImpactResult {
  const {
    baseSafeCapacity,
    baseStressPositionBeforeEmi,
    loanPrincipal,
    loanEmi,
    loanTenureMonths,
    loanAnnualRate,
    activeActionIds,
  } = input;

  const activeSet = new Set(activeActionIds);
  let totalFreed = 0;

  for (const action of DEFAULT_MITIGATION_ACTIONS) {
    if (action.isActionableCut && activeSet.has(action.id)) {
      totalFreed += action.monthlySaving;
    }
  }

  const newSafeCapacity = baseSafeCapacity + totalFreed;
  const newStressPositionBeforeEmi = baseStressPositionBeforeEmi + totalFreed;
  const newStressPositionWithEmi = newStressPositionBeforeEmi - loanEmi;

  // Prepayment simulation: Allocate 50% of freed cash towards accelerating the loan
  const prepaymentMonthly = Math.round(totalFreed * 0.5);
  const acceleratedMonthlyPayment = loanEmi + prepaymentMonthly;

  // Simulate accelerated payoff
  let balance = loanPrincipal;
  const monthlyRate = loanAnnualRate / 12 / 100;
  let normalTotalInterest = loanEmi * loanTenureMonths - loanPrincipal;
  let acceleratedMonths = 0;
  let acceleratedTotalInterest = 0;

  if (acceleratedMonthlyPayment > balance * monthlyRate) {
    while (balance > 1 && acceleratedMonths < 60) {
      acceleratedMonths++;
      const interest = balance * monthlyRate;
      acceleratedTotalInterest += interest;
      const payment = Math.min(balance + interest, acceleratedMonthlyPayment);
      balance = Math.max(0, balance + interest - payment);
    }
  } else {
    acceleratedMonths = loanTenureMonths;
    acceleratedTotalInterest = normalTotalInterest;
  }

  const monthsSaved = Math.max(0, loanTenureMonths - acceleratedMonths);
  const interestSaved = Math.max(0, Math.round(normalTotalInterest - acceleratedTotalInterest));

  const categorySpendingBefore = [
    {
      name: "Food & Delivery",
      amount: 6000,
      freed: activeSet.has("cut_food_delivery") ? 1200 : 0,
    },
    {
      name: "Travel & Cabs",
      amount: 4000,
      freed: activeSet.has("cut_cab_rides") ? 700 : 0,
    },
    {
      name: "Subscriptions",
      amount: 1200,
      freed: activeSet.has("pause_subscriptions") ? 700 : 0,
    },
    {
      name: "Shopping & Misc",
      amount: 2800,
      freed: activeSet.has("cap_impulse_shopping") ? 800 : 0,
    },
  ];

  return {
    totalFreedMonthly: totalFreed,
    newSafeCapacity,
    newStressPositionBeforeEmi,
    newStressPositionWithEmi,
    isStressDeficitEliminated: newStressPositionBeforeEmi >= 0,
    prepaymentMonthly,
    prepaymentTenureMonths: acceleratedMonths,
    monthsSaved,
    interestSaved,
    categorySpendingBefore,
  };
}

