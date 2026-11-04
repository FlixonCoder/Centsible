export interface DetectedMitigationSuggestion {
  id: string;
  detector: "subscription" | "food" | "transport" | "shopping" | "debt" | "emergency_fund";
  title: string;
  description: string;
  monthlySaving: number;
  effort: "Easy" | "Medium";
  confidence: "High" | "Medium";
  isActionableCut: boolean;
  evidenceTxnIds: string[];
  rationale: string;
  status: "suggested" | "accepted" | "dismissed" | "achieved";
}

