import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          include: {
            _count: { select: { transactions: true } },
          },
        },
        consentRecords: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      accounts: user.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        institution: a.institution,
        name: a.name,
        mask: a.mask,
        balance: a.balance,
        limit: a.limit,
        outstanding: a.outstanding,
        apr: a.apr,
        provider: a.provider,
        lastSyncedAt: a.lastSyncedAt,
        transactionCount: a._count.transactions,
      })),
      consentRecords: user.consentRecords,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

