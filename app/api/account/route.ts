import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    const userId = await getSessionUserId();

    // Remove user created plan actions, decisions, custom category rules
    await db.planAction.deleteMany({ where: { userId } });
    await db.categoryRule.deleteMany({ where: { userId } });
    await db.decision.deleteMany({ where: { event: { userId } } });
    await db.auditLog.create({
      data: {
        userId,
        action: "DELETE_USER_DATA",
        entity: "user",
      },
    });

    return NextResponse.json({
      success: true,
      message: "User plan actions, custom rules, and decision records have been deleted in compliance with DPDP.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

