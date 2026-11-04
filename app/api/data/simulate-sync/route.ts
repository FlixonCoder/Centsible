import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const userId = await getSessionUserId();

    const now = new Date();
    await db.account.updateMany({
      where: { userId },
      data: {
        lastSyncedAt: now,
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "SIMULATE_AA_SYNC",
        entity: "accounts",
      },
    });

    return NextResponse.json({
      success: true,
      syncedAt: now,
      message: "Simulated Account Aggregator sync completed. All accounts up-to-date.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

