import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateStressTest } from "@/lib/engine/stress";

const schema = z.object({
  baseIncome: z.number().positive(),
  committedDues: z.number().nonnegative(),
  essentials: z.number().nonnegative(),
  safetyBuffer: z.number().nonnegative(),
  newMonthlyEmi: z.number().nonnegative(),
  incomeDropPercent: z.number().min(0).max(100).default(20),
  tenureMonths: z.number().positive().default(12),
});

export async function POST(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const result = calculateStressTest(validated);

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

