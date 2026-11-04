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
    if (targetEventId) {
      const exists = await db.expenseEvent.findUnique({ where: { id: targetEventId } });
      if (!exists) targetEventId = null;
    }

    if (!targetEventId) {
      const activeEvent = await db.expenseEvent.findFirst({
        where: { userId, status: { in: ["active", "pending"] } },
        orderBy: { due: "asc" },
      });
      targetEventId = activeEvent?.id;
    }

    if (!targetEventId) {
      // Create a default event for this user if none exists
      const newEvent = await db.expenseEvent.create({
        data: {
          userId,
          title: "Emergency Medical Bill",
          category: "medical",
          amount: 60000,
          due: "2026-11-06",
          urgency: "high",
          canDelay: false,
          providerOffersInstalments: "unknown",
          status: "active",
        },
      });
      targetEventId = newEvent.id;
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

