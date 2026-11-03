import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateSafeToBorrow } from "@/lib/engine/safeToBorrow";

const schema = z.object({
  income: z.number().positive(),
  committedDues: z.number().nonnegative(),
  essentials: z.number().nonnegative(),
  safetyBuffer: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 450));

  try {
    const body = await request.json();
    const validated = schema.parse(body);
    const result = calculateSafeToBorrow(validated);

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

