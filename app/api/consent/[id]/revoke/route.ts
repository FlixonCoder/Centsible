import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId();
    const { id } = params;

    const consent = await db.consentRecord.findFirst({
      where: { id, userId },
    });

    if (!consent) {
      return NextResponse.json({ error: "Consent record not found" }, { status: 404 });
    }

    const updated = await db.consentRecord.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "REVOKE_CONSENT",
        entity: `consentRecord:${id}`,
      },
    });

    return NextResponse.json({ success: true, consentRecord: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

