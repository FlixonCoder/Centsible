import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compareBorrowOptions } from "@/lib/engine/options";

const schema = z.object({
  creditNeeded: z.number().positive(),
  safeLimit: z.number().positive(),
  emergencyAmount: z.number().positive().optional().default(60000),
  savingsApplied: z.number().nonnegative().optional().default(20000),
});

export async function POST(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const result = compareBorrowOptions(
      validated.creditNeeded,
      validated.safeLimit,
      validated.emergencyAmount,
      validated.savingsApplied
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Invalid input parameters" },
      { status: 400 }
    );
  }
}

