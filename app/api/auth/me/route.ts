import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      obligations: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

