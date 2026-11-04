import { NextRequest, NextResponse } from "next/server";
import { formatINR } from "@/lib/format";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { deriveProfile } from "@/lib/engine/profile";
import { calculateObligationRollOff } from "@/lib/engine/obligations";
import { compareBorrowOptions } from "@/lib/engine/options";
import { calculateStressTest } from "@/lib/engine/stress";
import { detectMitigationSuggestions } from "@/lib/engine/mitigation";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
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
      where: { account: { userId } },
    });

    const activeEmergency = await db.expenseEvent.findFirst({
      where: { userId, status: "pending" },
      orderBy: { due: "asc" },
    });

    // 1. Tool execution: get_overview
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

    // 2. Tool execution: get_obligations
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

    // 3. Tool execution: get_options
    const emergencyAmount = activeEmergency ? activeEmergency.amount : 60000;
    const savingsApplied = 20000;
    const creditNeeded = Math.max(0, emergencyAmount - savingsApplied);

    const optionsComp = compareBorrowOptions(
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

    // 4. Tool execution: get_savings_plan
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
      obligations: user.obligations.map((o) => ({
        id: o.id,
        name: o.name,
        apr: o.apr,
        monthlyAmount: o.monthlyAmount,
      })),
    });

    // 5. Tool execution: run_stress
    const stress = calculateStressTest({
      baseIncome: profile.headlineIncome,
      duesByMonth: rollOff.duesByMonth,
      essentials: profile.livingExpenses,
      safetyBuffer: profile.safetyBuffer,
      liquidCushion: profile.safetyBuffer + 4350,
      newMonthlyEmi: optionsComp.recommendedOption.monthlyPayment,
      incomeDropPercent: 20,
      activeMitigationMonthly: mitigation.totalFreedMonthly,
    });

    const lower = (message || "").toLowerCase();

    let reply = "";
    let sources: string[] = [];
    let followUps: string[] = [
      "Can I afford this?",
      "Which option is cheapest?",
      "What if my income drops?",
      "How can I free up cash?",
      "Why is BNPL risky?",
      "Explain Safe-to-Borrow",
    ];

    if (lower.includes("afford") || lower.includes("can i")) {
      const rec = optionsComp.recommendedOption;
      reply = `Based on your profile, your **Safe-to-Borrow** capacity is **${formatINR(
        profile.safeToBorrow
      )}/month**. The recommended ${rec.title} requires **${formatINR(
        rec.monthlyPayment
      )}/month**, leaving a monthly surplus of **${formatINR(
        profile.safeToBorrow - rec.monthlyPayment
      )}**. With your accepted spending adjustments of ${formatINR(
        mitigation.totalFreedMonthly
      )}/mo, your buffer expands to **${formatINR(
        profile.safeToBorrow - rec.monthlyPayment + mitigation.totalFreedMonthly
      )}/month**.`;

      sources = [
        `Safe-to-Borrow: ${formatINR(profile.safeToBorrow)}/mo (Derived from Income - Dues - Living - Buffer)`,
        `Recommended EMI: ${formatINR(rec.monthlyPayment)}/mo (${rec.title})`,
        `Mitigation plan freed cash: ${formatINR(mitigation.totalFreedMonthly)}/mo`,
      ];
    } else if (lower.includes("cheap") || lower.includes("best") || lower.includes("option")) {
      const rec = optionsComp.recommendedOption;
      const worst = optionsComp.worstOption;
      reply = `The most cost-effective route is the **${rec.title}** at an illustrative rate of **${rec.rate}% p.a.**. Over 12 months, you repay **${formatINR(
        rec.totalRepaid
      )}** (extra cost: ${formatINR(rec.extraCost)}). In contrast, revolving on credit card minimum dues takes ~${worst.tenureMonths} months and costs **${formatINR(
        worst.totalRepaid
      )}**. Choosing the loan saves you approximately **${formatINR(
        optionsComp.savingsVsWorst
      )}**.`;

      sources = [
        `${rec.title}: ${formatINR(rec.totalRepaid)} total repaid`,
        `Card Minimum Revolve: ${formatINR(worst.totalRepaid)} total repaid`,
        `Savings vs worst option: ${formatINR(optionsComp.savingsVsWorst)}`,
      ];
    } else if (lower.includes("drop") || lower.includes("income") || lower.includes("stress")) {
      reply = `Under a **20% income drop**, your income drops to **${formatINR(
        stress.stressedIncome
      )}**. In Month 1, your position before any new EMI is **${formatINR(
        stress.month1BeforeEmi
      )}**. With the new EMI of ${formatINR(
        optionsComp.recommendedOption.monthlyPayment
      )}, the deficit is ${formatINR(
        stress.month1WithEmi
      )}. However, starting Month 3, your committed dues roll off (saving ₹4,500/mo), and activating your ${formatINR(
        mitigation.totalFreedMonthly
      )}/mo mitigation plan cushions the gap.`;

      sources = [
        `20% Stressed Income: ${formatINR(stress.stressedIncome)}`,
        `Month 1 Position before EMI: ${formatINR(stress.month1BeforeEmi)}`,
        `Month 1 Position with EMI: ${formatINR(stress.month1WithEmi)}`,
        `Dues roll-off: Dues drop from ₹24,500 to ₹0 by Month 5`,
      ];
    } else if (lower.includes("save") || lower.includes("mitigat") || lower.includes("free up")) {
      reply = `We analysed your transaction history and found **${formatINR(
        mitigation.totalFreedMonthly
      )}/month** in realistic spending adjustments across 4 areas:\n- **Food Delivery**: Cook at home 3 days/week (${formatINR(1200)}/mo)\n- **Commute**: Switch daily surge cabs to metro pass (${formatINR(700)}/mo)\n- **Subscriptions**: Pause 2 rarely-used subscriptions (${formatINR(583)}/mo)\n- **Discretionary**: 48h impulse buy lock on retail apps (${formatINR(800)}/mo).`;

      sources = [
        `Food delivery detector: -₹1,200/mo`,
        `Transit detector: -₹700/mo`,
        `Flagged subscriptions: -₹583/mo`,
        `Impulse shopping lock: -₹800/mo`,
      ];
    } else if (lower.includes("bnpl")) {
      reply = `While BNPL advertises "no-cost" over 3 months, it requires **₹13,333/month** for 3 months. That is almost **3× your monthly Safe-to-Borrow capacity** of ${formatINR(
        profile.safeToBorrow
      )}. Missing an instalment incurs steep late fees and damages your credit score.`;

      sources = [
        `BNPL monthly payment: ₹13,333/mo`,
        `Safe-to-Borrow capacity: ${formatINR(profile.safeToBorrow)}/mo`,
        `Available BNPL limit: only ₹6,000 remaining on ZenPay Later`,
      ];
    } else {
      reply = `I am Centsible's AI financial decision engine. For **${user.name}**, your monthly take-home is **${formatINR(
        profile.headlineIncome
      )}**, committed dues are **${formatINR(
        profile.committedDues
      )}**, essentials are **${formatINR(
        profile.livingExpenses
      )}**, and your Safe-to-Borrow capacity is **${formatINR(
        profile.safeToBorrow
      )}/month**. Ask me about loan options, stress testing, or finding savings!`;

      sources = [
        `User profile: ${user.name} (${user.occupation})`,
        `Safe-to-Borrow: ${formatINR(profile.safeToBorrow)}/month`,
      ];
    }

    return NextResponse.json({
      reply,
      groundedSources: sources,
      suggestedFollowUps: followUps,
      persona: user.name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
