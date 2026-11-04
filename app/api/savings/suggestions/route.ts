import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { detectMitigationSuggestions } from "@/lib/engine/mitigation";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        obligations: true,
        planActions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: { account: { userId } },
    });

    const flaggedSubs = transactions
      .filter((t) => t.category === "subscriptions" && t.userFlag === "rarely_used")
      .map((t) => t.merchant);

    const detected = detectMitigationSuggestions({
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

    // Merge status with DB planActions
    const planActionsMap = new Map(user.planActions.map((p) => [p.actionId || p.type, p]));

    const mergedSuggestions = detected.suggestions.map((s) => {
      const dbAction = planActionsMap.get(s.id);
      if (dbAction) {
        return {
          ...s,
          status: dbAction.status,
          acceptedAt: dbAction.acceptedAt,
        };
      }
      return s;
    });

    const totalFreedMonthly = mergedSuggestions
      .filter((s) => s.isActionableCut && s.status === "accepted")
      .reduce((sum, s) => sum + s.monthlySaving, 0);

    const potentialTotalFreed = mergedSuggestions
      .filter((s) => s.isActionableCut)
      .reduce((sum, s) => sum + s.monthlySaving, 0);

    return NextResponse.json({
      suggestions: mergedSuggestions,
      totalFreedMonthly,
      potentialTotalFreed,
      acceptedCount: mergedSuggestions.filter((s) => s.status === "accepted").length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

