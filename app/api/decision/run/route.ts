import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { deriveProfile } from "@/lib/engine/profile";
import { calculateObligationRollOff } from "@/lib/engine/obligations";
import { compareBorrowOptions } from "@/lib/engine/options";
import { calculateStressTest } from "@/lib/engine/stress";
import { detectMitigationSuggestions } from "@/lib/engine/mitigation";
import { evaluateDecision } from "@/lib/engine/decide";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();

    const {
      eventId,
      emergencyAmount: reqEmergencyAmount,
      savingsApplied: reqSavingsApplied,
      incomeDropPercent = 20,
      activeMitigationIds = ["cut_food_delivery", "cut_cab_rides", "pause_subscriptions", "cap_impulse_shopping"],
      scenario = "income_drop",
    } = body;

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

    let event = null;
    if (eventId) {
      event = await db.expenseEvent.findUnique({ where: { id: eventId } });
    }
    if (!event) {
      event = await db.expenseEvent.findFirst({
        where: { userId, status: "pending" },
        orderBy: { due: "asc" },
      });
    }

    const emergencyAmount = reqEmergencyAmount !== undefined ? reqEmergencyAmount : (event ? event.amount : 60000);
    const savingsApplied = reqSavingsApplied !== undefined ? reqSavingsApplied : 20000;
    const creditNeeded = Math.max(0, emergencyAmount - savingsApplied);

    // 1. Profile
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

    // 2. Roll-off
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

    // 3. Options
    const optionsComparison = compareBorrowOptions(
      creditNeeded,
      profile.safeToBorrow,
      emergencyAmount,
      savingsApplied,
      user.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        institution: a.institution,
        balance: a.balance,
        limit: a.limit,
        outstanding: a.outstanding,
      }))
    );

    // 4. Mitigation Suggestions
    const flaggedSubs = transactions
      .filter((t) => t.category === "subscriptions" && t.userFlag === "rarely_used")
      .map((t) => t.merchant);

    const mitigation = detectMitigationSuggestions({
      userId,
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        merchant: t.merchant,
        category: t.category,
        subcategory: t.subcategory,
        userFlag: t.userFlag,
      })),
      rarelyUsedSubs: Array.from(new Set(flaggedSubs)),
      obligations: user.obligations.map((o) => ({
        id: o.id,
        name: o.name,
        apr: o.apr,
        monthlyAmount: o.monthlyAmount,
      })),
    });

    const activeSet = new Set(activeMitigationIds);
    const activeMitigationMonthly = mitigation.suggestions
      .filter((s) => s.isActionableCut && activeSet.has(s.id))
      .reduce((sum, s) => sum + s.monthlySaving, 0);

    // 5. Stress Test
    const savingsAccounts = user.accounts.filter((a) => a.type === "savings");
    const totalLiquidSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
    const remainingLiquidCash = Math.max(0, totalLiquidSavings - savingsApplied);
    const liquidCushion = profile.safetyBuffer + remainingLiquidCash;

    const stressResult = calculateStressTest({
      baseIncome: profile.headlineIncome,
      duesByMonth: rollOff.duesByMonth,
      essentials: profile.livingExpenses,
      safetyBuffer: profile.safetyBuffer,
      liquidCushion,
      newMonthlyEmi: optionsComparison.recommendedOption.monthlyPayment,
      incomeDropPercent,
      activeMitigationMonthly,
      scenario: scenario as any,
    });

    // 6. Final Decision Verdict
    const decision = evaluateDecision({
      creditNeeded,
      safeLimit: profile.safeToBorrow,
      recommendedOption: optionsComparison.recommendedOption,
      worstOption: optionsComparison.worstOption,
      passesWithoutPlan: stressResult.passesWithoutPlan,
      passesWithPlan: stressResult.passesWithPlan,
      mitigationFreedCash: activeMitigationMonthly,
      urgency: event?.urgency || "high",
      canDelay: event?.canDelay || false,
    });

    const traces = [
      profile.trace,
      optionsComparison.trace,
      stressResult.trace,
      mitigation.trace,
      decision.trace,
    ];

    return NextResponse.json({
      eventId: event?.id,
      emergencyAmount,
      savingsApplied,
      creditNeeded,
      profile,
      optionsComparison,
      stressResult,
      mitigation: {
        ...mitigation,
        activeMitigationIds,
        activeMitigationMonthly,
      },
      decision,
      traces,
    });
  } catch (err: any) {
    console.error("Decision Run API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

