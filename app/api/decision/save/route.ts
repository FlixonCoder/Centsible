import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();

    const {
      eventId,
      inputsJson,
      resultJson,
      traceJson,
      selectedOptionId,
      verdict,
      engineVersion = "2.0.0",
    } = body;

    let targetEventId = eventId;
    if (!targetEventId) {
      const activeEvent = await db.expenseEvent.findFirst({
        where: { userId, status: "pending" },
      });
      targetEventId = activeEvent?.id;
    }

    if (!targetEventId) {
      return NextResponse.json(
        { error: "No expense event specified or found" },
        { status: 400 }
      );
    }

    const decision = await db.decision.create({
      data: {
        userId,
        eventId: targetEventId,
        inputsJson: typeof inputsJson === "string" ? inputsJson : JSON.stringify(inputsJson),
        resultJson: typeof resultJson === "string" ? resultJson : JSON.stringify(resultJson),
        traceJson: typeof traceJson === "string" ? traceJson : JSON.stringify(traceJson),
        selectedOptionId,
        verdict,
        engineVersion,
      },
    });

    return NextResponse.json({ success: true, decision });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

