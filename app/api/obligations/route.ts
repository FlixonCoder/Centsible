import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { calculateObligationRollOff } from "@/lib/engine/obligations";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        obligations: {
          include: {
            account: {
              select: { institution: true, name: true, mask: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const obligations = user.obligations.map((ob) => ({
      id: ob.id,
      accountId: ob.accountId,
      kind: ob.kind,
      name: ob.name,
      monthlyAmount: ob.monthlyAmount,
      outstanding: ob.outstanding,
      apr: ob.apr,
      dueDay: ob.dueDay,
      remainingMonths: ob.remainingMonths,
      matchedToBank: ob.matchedToBank,
      institution: ob.account?.institution || "External",
    }));

    // 12-month roll-off
    const rollOff = calculateObligationRollOff(
      obligations.map((ob) => ({
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

    // Total monthly committed
    const totalMonthlyDues = obligations.reduce((s, ob) => s + ob.monthlyAmount, 0);
    const totalOutstanding = obligations.reduce((s, ob) => s + ob.outstanding, 0);

    // Debt Avalanche Priority Order (Highest APR first)
    const avalancheOrder = [...obligations]
      .sort((a, b) => b.apr - a.apr)
      .map((ob, idx) => ({
        priority: idx + 1,
        id: ob.id,
        name: ob.name,
        apr: ob.apr,
        monthlyAmount: ob.monthlyAmount,
        outstanding: ob.outstanding,
        strategyTip:
          idx === 0
            ? `Top Priority (${ob.apr}% APR): Pay minimums on other debts and direct any spare cash here first.`
            : `Maintain scheduled minimum payments of ₹${ob.monthlyAmount.toLocaleString("en-IN")}.`,
      }));

    return NextResponse.json({
      obligations,
      totalMonthlyDues,
      totalOutstanding,
      rollOff,
      avalancheOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

