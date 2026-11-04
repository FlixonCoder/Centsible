import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    const events = await db.expenseEvent.findMany({
      where: { userId },
      orderBy: { due: "asc" },
    });
    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();

    const {
      id,
      title,
      provider,
      category = "medical",
      amount,
      due,
      urgency = "high",
      canDelay = false,
      providerOffersInstalments = false,
      status = "pending",
    } = body;

    let event;
    if (id) {
      event = await db.expenseEvent.upsert({
        where: { id },
        update: {
          title,
          provider,
          category,
          amount: parseFloat(amount),
          due,
          urgency,
          canDelay: Boolean(canDelay),
          providerOffersInstalments: String(providerOffersInstalments ?? "unknown"),
          status,
        },
        create: {
          id,
          userId,
          title,
          provider: provider || "Direct",
          category,
          amount: parseFloat(amount),
          due,
          urgency,
          canDelay: Boolean(canDelay),
          providerOffersInstalments: String(providerOffersInstalments ?? "unknown"),
          status,
        },
      });
    } else {
      event = await db.expenseEvent.create({
        data: {
          userId,
          title,
          provider: provider || "Direct",
          category,
          amount: parseFloat(amount),
          due,
          urgency,
          canDelay: Boolean(canDelay),
          providerOffersInstalments: String(providerOffersInstalments ?? "unknown"),
          status,
        },
      });
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

