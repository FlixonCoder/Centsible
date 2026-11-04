import { db } from "@/lib/db";
import { DataProvider } from "./index";

export const SeedProvider: DataProvider = {
  id: "seed",
  name: "Seed Sample Data Provider",
  async syncAccountData(userId: string) {
    const accountsCount = await db.account.count({ where: { userId } });
    const transactionsCount = await db.transaction.count({
      where: { account: { userId } },
    });
    return {
      success: true,
      accountsCount,
      transactionsCount,
    };
  },
};

