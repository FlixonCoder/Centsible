import { NextRequest, NextResponse } from "next/server";
import { PERSONAS, DEFAULT_PERSONA_ID } from "@/lib/sample-data";

export async function GET(request: NextRequest) {
  // Artificial delay to feel like a real banking/engine check
  await new Promise((resolve) => setTimeout(resolve, 350));

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || DEFAULT_PERSONA_ID;

  const persona = PERSONAS[id] || PERSONAS[DEFAULT_PERSONA_ID];

  return NextResponse.json({
    success: true,
    data: persona,
  });
}

