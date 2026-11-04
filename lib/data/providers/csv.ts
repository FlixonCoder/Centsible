import { db } from "@/lib/db";
import { DataProvider } from "./index";

export function categorizeNarration(narration: string): { category: string; subcategory?: string } {
  const lower = narration.toLowerCase();

  if (lower.includes("salary") || lower.includes("payroll") || lower.includes("credit interest")) {
    return { category: "income", subcategory: "salary" };
  }
  if (lower.includes("swiggy") || lower.includes("zomato") || lower.includes("eats") || lower.includes("restaurant") || lower.includes("cafe")) {
    return { category: "food", subcategory: "food_delivery" };
  }
  if (lower.includes("grocery") || lower.includes("blinkit") || lower.includes("instamart") || lower.includes("zepto") || lower.includes("supermarket")) {
    return { category: "food", subcategory: "groceries" };
  }
  if (lower.includes("uber") || lower.includes("ola") || lower.includes("rapido") || lower.includes("cab")) {
    return { category: "transport", subcategory: "cabs" };
  }
  if (lower.includes("metro") || lower.includes("bmrc") || lower.includes("bus") || lower.includes("irctc") || lower.includes("transit")) {
    return { category: "transport", subcategory: "metro_transit" };
  }
  if (lower.includes("netflix") || lower.includes("spotify") || lower.includes("prime") || lower.includes("hotstar") || lower.includes("gym") || lower.includes("youtube")) {
    return { category: "subscriptions", subcategory: "streaming" };
  }
  if (lower.includes("amazon") || lower.includes("flipkart") || lower.includes("myntra") || lower.includes("zara") || lower.includes("shopping")) {
    return { category: "shopping", subcategory: "online_shopping" };
  }
  if (lower.includes("atm") || lower.includes("cash wdl")) {
    return { category: "cash", subcategory: "atm_withdrawal" };
  }
  if (lower.includes("emi") || lower.includes("loan") || lower.includes("card payment") || lower.includes("nach")) {
    return { category: "debt_repayment", subcategory: "loan_emi" };
  }
  if (lower.includes("bescom") || lower.includes("electricity") || lower.includes("airtel") || lower.includes("jio") || lower.includes("wifi")) {
    return { category: "utilities", subcategory: "bills" };
  }
  if (lower.includes("rent") || lower.includes("society") || lower.includes("maintenance")) {
    return { category: "rent", subcategory: "housing" };
  }

  return { category: "personal_misc", subcategory: "general" };
}

export const CsvProvider: DataProvider = {
  id: "csv",
  name: "CSV Bank Statement Import",
  async syncAccountData(userId: string, inputData: { accountId: string; csvText: string }) {
    const { accountId, csvText } = inputData;
    if (!csvText || !accountId) {
      return { success: false, accountsCount: 0, transactionsCount: 0 };
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, accountsCount: 0, transactionsCount: 0 };
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const narrIdx = headers.findIndex((h) => h.includes("narration") || h.includes("description") || h.includes("particular"));
    const debitIdx = headers.findIndex((h) => h.includes("debit") || h.includes("withdrawal"));
    const creditIdx = headers.findIndex((h) => h.includes("credit") || h.includes("deposit"));
    const amountIdx = headers.findIndex((h) => h === "amount");
    const balIdx = headers.findIndex((h) => h.includes("balance"));

    const transactionsToInsert: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV line parser
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rawDate = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().split("T")[0];
      const narration = narrIdx >= 0 ? cols[narrIdx] : "Bank Transaction";

      let amount = 0;
      if (debitIdx >= 0 && cols[debitIdx] && parseFloat(cols[debitIdx])) {
        amount = -Math.abs(parseFloat(cols[debitIdx]));
      } else if (creditIdx >= 0 && cols[creditIdx] && parseFloat(cols[creditIdx])) {
        amount = Math.abs(parseFloat(cols[creditIdx]));
      } else if (amountIdx >= 0 && cols[amountIdx]) {
        amount = parseFloat(cols[amountIdx]);
      }

      if (isNaN(amount) || amount === 0) continue;

      const balance = balIdx >= 0 && cols[balIdx] ? parseFloat(cols[balIdx]) : null;
      const { category, subcategory } = categorizeNarration(narration);

      transactionsToInsert.push({
        accountId,
        date: rawDate,
        amount,
        channel: "Import",
        narration,
        merchant: narration.split("/")[0].slice(0, 30),
        category,
        subcategory,
        isRecurring: false,
        isFlexible: category !== "debt_repayment" && category !== "utilities" && category !== "rent",
        categorySource: "import",
        balanceAfter: balance,
      });
    }

    if (transactionsToInsert.length > 0) {
      await db.transaction.createMany({
        data: transactionsToInsert,
      });
    }

    return {
      success: true,
      accountsCount: 1,
      transactionsCount: transactionsToInsert.length,
    };
  },
};

