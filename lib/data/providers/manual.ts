import { db } from "@/lib/db";
import { DataProvider } from "./index";

export interface ManualAccountInput {
  type: string; // "savings" | "credit_card" | "bnpl" | "loan"
  institution: string;
  name: string;
  mask?: string;
  balance?: number;
  limit?: number;
  outstanding?: number;
  apr?: number;
  dueDay?: number;
  monthlyPayment?: number;
}

export const ManualProvider: DataProvider = {
  id: "manual",
  name: "Manual User Entry Provider",
  async syncAccountData(userId: string, inputData?: ManualAccountInput) {
    if (!inputData) {
      return { success: false, accountsCount: 0, transactionsCount: 0 };
    }

    const accId = `acc_man_${Date.now()}`;
    await db.account.create({
      data: {
        id: accId,
        userId,
        type: inputData.type,
        institution: inputData.institution,
        name: inputData.name,
        mask: inputData.mask || "9999",
        balance: inputData.balance || 0,
        limit: inputData.limit || 0,
        outstanding: inputData.outstanding || 0,
        apr: inputData.apr || 0,
        dueDay: inputData.dueDay || null,
        monthlyPayment: inputData.monthlyPayment || 0,
        provider: "manual",
      },
    });

    // If it's a debt/loan/card, create obligation
    if (inputData.monthlyPayment && inputData.monthlyPayment > 0) {
      await db.obligation.create({
        data: {
          userId,
          accountId: accId,
          kind: inputData.type === "credit_card" ? "credit_card_revolving" : "loan",
          name: `${inputData.institution} ${inputData.name}`,
          monthlyAmount: inputData.monthlyPayment,
          outstanding: inputData.outstanding || 0,
          apr: inputData.apr || 0,
          dueDay: inputData.dueDay || null,
          matchedToBank: true,
        },
      });
    }

    return {
      success: true,
      accountsCount: 1,
      transactionsCount: 0,
    };
  },
};

