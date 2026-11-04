export interface DataProvider {
  id: string;
  name: string;
  syncAccountData(userId: string, inputData?: any): Promise<{ success: boolean; accountsCount: number; transactionsCount: number }>;
}

export * from "./seed";
export * from "./manual";
export * from "./csv";
export * from "./aa.stub";

