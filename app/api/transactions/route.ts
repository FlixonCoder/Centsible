import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const month = searchParams.get("month") || ""; // e.g. "2026-10"

    const where: any = {
      account: { userId },
    };

    if (search) {
      where.OR = [
        { merchant: { contains: search } },
        { narration: { contains: search } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (month && month !== "all") {
      where.date = { startsWith: month };
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        account: {
          select: { name: true, mask: true, institution: true, type: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // Available categories and months for filter drop downs
    const allUserTxns = await db.transaction.findMany({
      where: { account: { userId } },
      select: { category: true, date: true },
    });

    const categories = Array.from(new Set(allUserTxns.map((t) => t.category))).filter(Boolean);
    const months = Array.from(new Set(allUserTxns.map((t) => t.date.slice(0, 7)))).sort().reverse();

    return NextResponse.json({
      transactions,
      categories,
      months,
      totalCount: transactions.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

