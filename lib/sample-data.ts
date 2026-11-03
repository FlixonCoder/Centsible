export interface LinkedSource {
  id: string;
  name: string;
  type: "salary" | "credit_card" | "bnpl" | "loan";
  institution: string;
  accountMask: string;
  monthlyCommitment: number;
  balance?: number;
  limit?: number;
  apr?: number;
}

export interface EssentialBreakdown {
  category: string;
  amount: number;
  subCategory?: string;
  subAmount?: number;
  notes?: string;
}

export interface Persona {
  id: string;
  name: string;
  age: number;
  tagline: string;
  pronoun: "she" | "he";
  role: string;
  monthlyIncome: number;
  incomeType: "salaried" | "gig" | "freelance";
  incomeVariance?: number;
  emergencyTitle: string;
  emergencyCategory: "medical" | "repair" | "education" | "family" | "other";
  emergencyDue: string;
  emergencyUrgency: "high" | "medium" | "low";
  emergencyAmount: number;
  savingsAvailable: number;
  savingsDefaultApplied: number;
  committedDues: number;
  essentialsAmount: number;
  safetyBuffer: number;
  essentialsBreakdown: EssentialBreakdown[];
  sources: LinkedSource[];
}

export const PERSONAS: Record<string, Persona> = {
  priya: {
    id: "priya",
    name: "Priya Sharma",
    age: 26,
    tagline: "Graphic Designer, salaried",
    pronoun: "she",
    role: "Salaried",
    monthlyIncome: 45000,
    incomeType: "salaried",
    emergencyTitle: "Medical bill",
    emergencyCategory: "medical",
    emergencyDue: "Due this Friday",
    emergencyUrgency: "high",
    emergencyAmount: 60000,
    savingsAvailable: 20000,
    savingsDefaultApplied: 20000,
    committedDues: 24500,
    essentialsAmount: 14000,
    safetyBuffer: 2000,
    essentialsBreakdown: [
      {
        category: "Food & Groceries",
        amount: 6000,
        subCategory: "Food delivery apps",
        subAmount: 2200,
        notes: "Cook & meal prep can easily substitute 3 days/week",
      },
      {
        category: "Travel & Commute",
        amount: 4000,
        subCategory: "On-demand cabs",
        subAmount: 1500,
        notes: "Metro/bus pass can save commute spending",
      },
      {
        category: "Subscriptions",
        amount: 1200,
        subCategory: "Streaming & gym app",
        subAmount: 700,
        notes: "Netflix, Prime, Spotify, Hotstar, gym-app; 2 barely used",
      },
      {
        category: "Shopping & Misc",
        amount: 2800,
        subCategory: "Impulse shopping",
        subAmount: 800,
        notes: "Setting a strict monthly cap",
      },
    ],
    sources: [
      {
        id: "src_salary",
        name: "Salary Account",
        type: "salary",
        institution: "HDFC Bank",
        accountMask: "•••• 4892",
        monthlyCommitment: 0,
        balance: 24350,
      },
      {
        id: "src_cc",
        name: "Coral Credit Card",
        type: "credit_card",
        institution: "ICICI Bank",
        accountMask: "•••• 9104",
        monthlyCommitment: 11500,
        balance: 38200,
        limit: 150000,
        apr: 42,
      },
      {
        id: "src_bnpl",
        name: "PayLater BNPL",
        type: "bnpl",
        institution: "ZenPay Later",
        accountMask: "•••• 2281",
        monthlyCommitment: 9000,
        limit: 25000,
      },
      {
        id: "src_phone_emi",
        name: "Smartphone Consumer EMI",
        type: "loan",
        institution: "Bajaj Fin",
        accountMask: "•••• 7310",
        monthlyCommitment: 4000,
        balance: 12000,
      },
    ],
  },

  arjun: {
    id: "arjun",
    name: "Arjun Verma",
    age: 29,
    tagline: "UI/UX Freelancer, variable income",
    pronoun: "he",
    role: "Gig worker",
    monthlyIncome: 30000,
    incomeType: "gig",
    incomeVariance: 0.25,
    emergencyTitle: "Work Laptop Screen & Logic Board Repair",
    emergencyCategory: "repair",
    emergencyDue: "Due in 2 days",
    emergencyUrgency: "high",
    emergencyAmount: 25000,
    savingsAvailable: 5000,
    savingsDefaultApplied: 5000,
    committedDues: 12000,
    essentialsAmount: 11000,
    safetyBuffer: 1500,
    essentialsBreakdown: [
      { category: "Food & Groceries", amount: 5500, subCategory: "Eating out", subAmount: 1400 },
      { category: "Transport", amount: 2500, subCategory: "Fuel/Auto", subAmount: 800 },
      { category: "Tools & Subscriptions", amount: 1500, subCategory: "Design software", subAmount: 600 },
      { category: "Personal/Misc", amount: 1500, subCategory: "Misc", subAmount: 400 },
    ],
    sources: [
      {
        id: "src_freelance",
        name: "Savings Account",
        type: "salary",
        institution: "Axis Bank",
        accountMask: "•••• 3192",
        monthlyCommitment: 0,
        balance: 6200,
      },
      {
        id: "src_cc_arjun",
        name: "Platinum Card",
        type: "credit_card",
        institution: "SBI Card",
        accountMask: "•••• 5521",
        monthlyCommitment: 7000,
        limit: 80000,
        apr: 42,
      },
      {
        id: "src_bnpl_arjun",
        name: "FlexiPay",
        type: "bnpl",
        institution: "LazyPay",
        accountMask: "•••• 1890",
        monthlyCommitment: 5000,
        limit: 15000,
      },
    ],
  },

  meera: {
    id: "meera",
    name: "Meera Nair",
    age: 32,
    tagline: "Senior QA Engineer, salaried",
    pronoun: "she",
    role: "Salaried",
    monthlyIncome: 80000,
    incomeType: "salaried",
    emergencyTitle: "Executive Upskilling Certification Fee",
    emergencyCategory: "education",
    emergencyDue: "Due in 3 weeks",
    emergencyUrgency: "medium",
    emergencyAmount: 150000,
    savingsAvailable: 40000,
    savingsDefaultApplied: 40000,
    committedDues: 32000,
    essentialsAmount: 22000,
    safetyBuffer: 5000,
    essentialsBreakdown: [
      { category: "Groceries & Household", amount: 10000, subCategory: "Organic/specialty", subAmount: 2500 },
      { category: "Car Fuel & Maintenance", amount: 6000, subCategory: "Weekend trips", subAmount: 2000 },
      { category: "Subscriptions & Leisure", amount: 3000, subCategory: "Streaming & clubs", subAmount: 1200 },
      { category: "Shopping", amount: 3000, subCategory: "Apparel", subAmount: 1000 },
    ],
    sources: [
      {
        id: "src_meera_sal",
        name: "Corporate Salary A/C",
        type: "salary",
        institution: "Kotak Mahindra",
        accountMask: "•••• 8820",
        monthlyCommitment: 0,
        balance: 45000,
      },
      {
        id: "src_meera_cc",
        name: "Regalia Gold Card",
        type: "credit_card",
        institution: "HDFC Bank",
        accountMask: "•••• 4319",
        monthlyCommitment: 18000,
        limit: 300000,
        apr: 40,
      },
      {
        id: "src_meera_car",
        name: "Auto Loan EMI",
        type: "loan",
        institution: "SBI",
        accountMask: "•••• 6012",
        monthlyCommitment: 14000,
        balance: 240000,
      },
    ],
  },
};

export const DEFAULT_PERSONA_ID = "priya";

