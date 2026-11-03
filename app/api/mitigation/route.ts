import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateMitigationImpact,
  DEFAULT_MITIGATION_ACTIONS,
} from "@/lib/engine/mitigation";

const schema = z.object({
  baseSafeCapacity: z.number().default(4500),
  baseStressPositionBeforeEmi: z.number().default(-2500),
  loanPrincipal: z.number().default(40000),
  loanEmi: z.number().default(3630),
  loanTenureMonths: z.number().default(12),
  loanAnnualRate: z.number().default(16),
  activeActionIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const impact = calculateMitigationImpact(validated);

    return NextResponse.json({
      success: true,
      data: {
        actions: DEFAULT_MITIGATION_ACTIONS,
        impact,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid input parameters" },
      { status: 400 }
    );
  }
}

