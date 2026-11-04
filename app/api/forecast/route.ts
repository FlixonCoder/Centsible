import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { deriveProfile } from "@/lib/engine/profile";
import { calculateObligationRollOff } from "@/lib/engine/obligations";
import { generateCashFlowForecast } from "@/lib/engine/forecast";

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    const { searchParams } = new URL(request.url);

    const newMonthlyEmi = parseFloat(searchParams.get("newMonthlyEmi") || "0");
    const monthlyMitigationFreed = parseFloat(searchParams.get("monthlyMitigationFreed") || "0");

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        obligations: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: { account: { userId } },
    });

    const profile = deriveProfile({
      user: {
        id: user.id,
        incomeType: user.incomeType as any,
        incomeBasis: user.incomeBasis as any,
        bufferAmount: user.bufferAmount,
        bufferMode: user.bufferMode as any,
      },
      obligations: user.obligations.map((ob) => ({
        id: ob.id,
        accountId: ob.accountId,
        kind: ob.kind as any,
        name: ob.name,
        monthlyAmount: ob.monthlyAmount,
        outstanding: ob.outstanding,
        apr: ob.apr,
        dueDay: ob.dueDay,
        remainingMonths: ob.remainingMonths,
        matchedToBank: ob.matchedToBank,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        merchant: t.merchant,
        category: t.category,
        subcategory: t.subcategory,
        userFlag: t.userFlag,
      })),
    });

    const rollOff = calculateObligationRollOff(
      user.obligations.map((ob) => ({
        id: ob.id,
        accountId: ob.accountId,
        kind: ob.kind as any,
        name: ob.name,
        monthlyAmount: ob.monthlyAmount,
        outstanding: ob.outstanding,
        apr: ob.apr,
        dueDay: ob.dueDay,
        remainingMonths: ob.remainingMonths,
      }))
    );

    // Starting liquid savings balance
    const savingsAccounts = user.accounts.filter((a) => a.type === "savings");
    const startingBalance = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);

    const forecast = generateCashFlowForecast({
      startingBalance,
      baseMonthlyIncome: profile.typicalIncome,
      weakMonthlyIncome: profile.weakMonthIncome,
      duesByMonth: rollOff.duesByMonth,
      monthlyLivingExpenses: profile.livingExpenses,
      newMonthlyEmi,
      monthlyMitigationFreed,
    });

    return NextResponse.json(forecast);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

