import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId();
    const { id } = params;

    const decision = await db.decision.findFirst({
      where: {
        id,
        event: { userId },
      },
      include: {
        event: true,
      },
    });

    if (!decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    return NextResponse.json({
      decision: {
        ...decision,
        inputs: JSON.parse(decision.inputsJson),
        result: JSON.parse(decision.resultJson),
        trace: JSON.parse(decision.traceJson),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

