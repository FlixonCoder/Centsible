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
          include: { transactions: true },
        },
        obligations: true,
        expenseEvents: true,
        planActions: true,
        consentRecords: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const decisions = await db.decision.findMany({
      where: { event: { userId } },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      format: "Centsible-DPDP-DataExport-v1",
      user,
      decisions,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="centsible-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

