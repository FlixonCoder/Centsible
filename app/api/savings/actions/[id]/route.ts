import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId();
    const { id } = params; // action type/id e.g. "cut_food_delivery"
    const body = await request.json();
    const { status, title, monthlyImpact, decisionId } = body;

    const actionId = `${userId}_${id}`;

    const planAction = await db.planAction.upsert({
      where: { id: actionId },
      update: {
        status: status || "accepted",
        acceptedAt: status === "accepted" ? new Date() : null,
      },
      create: {
        id: actionId,
        userId,
        decisionId: decisionId || null,
        actionId: id,
        type: id,
        title: title || id,
        monthlyImpact: monthlyImpact || 0,
        status: status || "accepted",
        acceptedAt: status === "accepted" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, planAction });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

