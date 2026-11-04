import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { deriveProfile } from "@/lib/engine/profile";
import { calculateObligationRollOff } from "@/lib/engine/obligations";

export async function GET() {
  try {
    const userId = await getSessionUserId();

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
      where: {
        account: { userId },
      },
      orderBy: { date: "asc" },
    });

    // Derive profile using DB transactions & obligations
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

    // Active Emergency Event
    const activeEmergency = await db.expenseEvent.findFirst({
      where: { userId, status: "pending" },
      orderBy: { due: "asc" },
    });

    // Roll-off schedule
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

    // 6-Month Cash Flow Trend (May to Oct 2026)
    const months = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
    const monthLabels: Record<string, string> = {
      "2026-05": "May",
      "2026-06": "Jun",
      "2026-07": "Jul",
      "2026-08": "Aug",
      "2026-09": "Sep",
      "2026-10": "Oct",
    };

    const cashflowTrend = months.map((ym) => {
      const monthTxns = transactions.filter((t) => t.date.startsWith(ym));
      const income = monthTxns
        .filter((t) => t.category === "income" && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const outflows = monthTxns
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        month: monthLabels[ym] || ym,
        yearMonth: ym,
        income,
        outflows,
        net: income - outflows,
      };
    });

    // Next 30 Days Timeline (assuming anchor November 2026)
    const timeline = [];

    // 1. Expected Salary
    timeline.push({
      id: "salary_credit",
      date: "2026-11-05",
      title: "Salary Expected",
      amount: profile.headlineIncome,
      type: "income",
      icon: "Wallet",
      status: "upcoming",
    });

    // 2. Active Emergency Event
    if (activeEmergency) {
      timeline.push({
        id: activeEmergency.id,
        date: activeEmergency.due,
        title: activeEmergency.title,
        amount: activeEmergency.amount,
        type: "emergency",
        icon: "AlertTriangle",
        status: "critical",
      });
    }

    // 3. Obligations due dates in November
    for (const ob of user.obligations) {
      const dayStr = String(ob.dueDay).padStart(2, "0");
      timeline.push({
        id: ob.id,
        date: `2026-11-${dayStr}`,
        title: ob.name,
        amount: ob.monthlyAmount,
        type: "due",
        icon: "CreditCard",
        status: "scheduled",
      });
    }

    // Sort timeline by date
    timeline.sort((a, b) => a.date.localeCompare(b.date));

    // Insights
    const insights = [];

    // Insight 1: Dues roll off
    if (rollOff.debtFreeMonthIndex !== null) {
      insights.push({
        id: "ins_rolloff",
        severity: "low",
        category: "debt",
        title: "Debt roll-off ahead",
        description: `Your committed dues drop to ₹${rollOff.duesByMonth[2]?.toLocaleString("en-IN") || 0} in Month 3 and you will be debt-free of current dues by Month ${rollOff.debtFreeMonthIndex + 1}.`,
        ctaLabel: "View Debt Schedule",
        ctaHref: "/obligations",
      });
    }

    // Insight 2: Flagged subscriptions
    const subTxns = transactions.filter(
      (t) => t.category === "subscriptions" && t.userFlag === "rarely_used"
    );
    if (subTxns.length > 0) {
      const subTotal = Math.round(
        subTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3
      );
      insights.push({
        id: "ins_subs",
        severity: "medium",
        category: "savings",
        title: "2 rarely-used subscriptions detected",
        description: `You are paying ~₹${subTotal.toLocaleString("en-IN")}/mo on services you flagged rarely used. Pausing them unlocks instant cash.`,
        ctaLabel: "Review Subscriptions",
        ctaHref: "/savings",
      });
    }

    // Insight 3: Irregular spend warning
    if (profile.irregularSpendsAvg > profile.safetyBuffer) {
      insights.push({
        id: "ins_buffer",
        severity: "medium",
        category: "cushion",
        title: "Irregular spends average exceeds buffer",
        description: `Your historical one-off spends average ₹${profile.irregularSpendsAvg.toLocaleString("en-IN")}/mo versus your current ₹${profile.safetyBuffer.toLocaleString("en-IN")} buffer.`,
        ctaLabel: "Switch to Conservative",
        ctaHref: "/settings",
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        age: user.age,
        city: user.city,
        occupation: user.occupation,
        incomeType: user.incomeType,
        incomeBasis: user.incomeBasis,
        bufferAmount: user.bufferAmount,
        bufferMode: user.bufferMode,
        accountsCount: user.accounts.length,
        obligationsCount: user.obligations.length,
      },
      profile,
      stats: {
        monthlyIncome: profile.headlineIncome,
        typicalIncome: profile.typicalIncome,
        weakMonthIncome: profile.weakMonthIncome,
        committedDues: profile.committedDues,
        dtiPercent: profile.dtiPercent,
        livingExpenses: profile.livingExpenses,
        safetyBuffer: profile.safetyBuffer,
        safeToBorrow: profile.safeToBorrow,
        freeCashAfterBuffer: profile.safeToBorrow,
      },
      activeEmergency,
      timeline,
      cashflowTrend,
      insights: insights.slice(0, 3),
      rollOff,
    });
  } catch (err: any) {
    console.error("Overview API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

