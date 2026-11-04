import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    const decisions = await db.decision.findMany({
      where: {
        userId,
      },
      include: {
        event: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ decisions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

