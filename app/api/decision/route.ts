import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decide } from "@/lib/engine/decide";
import { PERSONAS, DEFAULT_PERSONA_ID } from "@/lib/sample-data";
import { compareBorrowOptions } from "@/lib/engine/options";

const schema = z.object({
  personaId: z.string().default(DEFAULT_PERSONA_ID),
  creditNeeded: z.number().positive().default(40000),
  safeLimit: z.number().positive().default(4500),
  mitigationFreedCash: z.number().nonnegative().default(3400),
  stressPositionBeforeEmi: z.number().default(-2500),
});

export async function POST(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 450));

  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const persona = PERSONAS[validated.personaId] || PERSONAS[DEFAULT_PERSONA_ID];
    const optionsResult = compareBorrowOptions(
      validated.creditNeeded,
      validated.safeLimit,
      persona.emergencyAmount,
      persona.savingsDefaultApplied
    );

    const decisionResult = decide({
      persona,
      creditNeeded: validated.creditNeeded,
      safeLimit: validated.safeLimit,
      recommendedOption: optionsResult.recommendedOption,
      worstOption: optionsResult.worstOption,
      mitigationFreedCash: validated.mitigationFreedCash,
      stressPositionBeforeEmi: validated.stressPositionBeforeEmi,
    });

    return NextResponse.json({
      success: true,
      data: decisionResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid input parameters" },
      { status: 400 }
    );
  }
}

