import { NextRequest, NextResponse } from "next/server";
import { formatINR } from "@/lib/format";

interface ChatContext {
  personaName?: string;
  monthlyIncome?: number;
  safeLimit?: number;
  creditNeeded?: number;
  recommendedEmi?: number;
  recommendedOptionTitle?: string;
  recommendedRate?: number;
  stressPositionBeforeEmi?: number;
  stressPositionWithEmi?: number;
  mitigationFreedCash?: number;
  worstRepaid?: number;
  bestRepaid?: number;
  savingsVsWorst?: number;
}

interface ChatResponsePayload {
  reply: string;
  groundedSources: string[];
  suggestedFollowUps: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, context = {} } = (await request.json()) as {
      message: string;
      context: ChatContext;
    };

    const income = context.monthlyIncome || 45000;
    const safeLimit = context.safeLimit || 4500;
    const credit = context.creditNeeded || 40000;
    const emi = context.recommendedEmi || 3630;
    const freed = context.mitigationFreedCash || 3400;
    const bestRepaid = context.bestRepaid || 44259;
    const worstRepaid = context.worstRepaid || 70000;
    const savings = context.savingsVsWorst || 25741;
    const stressBefore = context.stressPositionBeforeEmi || -2500;

    const lower = (message || "").toLowerCase();

    let reply = "";
    let sources: string[] = [];
    let followUps: string[] = [
      "Can I afford this?",
      "Which option is cheapest?",
      "What if my income drops?",
      "How can I save more?",
      "Why is BNPL risky?",
      "Explain Safe-to-Borrow",
    ];

    // Intent recognition logic
    if (lower.includes("afford") || lower.includes("can i")) {
      reply = `Yes, you can afford borrowing ${formatINR(credit)} via the recommended Personal Loan (12m). Your monthly Safe-to-Borrow limit is ${formatINR(safeLimit)}/month, and the estimated EMI is ${formatINR(emi)}/month—leaving you with a comfortable ${formatINR(safeLimit - emi)} safety margin every month. Furthermore, with the Mitigation Layer active, your capacity expands to ${formatINR(safeLimit + freed)}/month.`;
      sources = [
        `Safe-to-Borrow capacity: ${formatINR(safeLimit)}/mo`,
        `Recommended EMI: ${formatINR(emi)}/mo`,
        `Comfort margin: +${formatINR(safeLimit - emi)}/mo`,
      ];
    } else if (
      lower.includes("cheap") ||
      lower.includes("best") ||
      lower.includes("which option") ||
      lower.includes("lowest cost")
    ) {
      reply = `The Instant Personal Loan (16% p.a., 12 months) is the cheapest safe option. You will repay a total of ${formatINR(bestRepaid)} (interest + fees: ${formatINR(bestRepaid - credit)}). In comparison, paying the Credit Card Minimum Due would cost ~${formatINR(worstRepaid)} over 35 months. Choosing the Personal Loan saves you ~${formatINR(savings)}!`;
      sources = [
        `Personal Loan total: ${formatINR(bestRepaid)}`,
        `Credit card min total: ~${formatINR(worstRepaid)}`,
        `Direct savings: ~${formatINR(savings)}`,
      ];
    } else if (
      lower.includes("drop") ||
      lower.includes("stress") ||
      lower.includes("income drops") ||
      lower.includes("lose job")
    ) {
      reply = `Under a 20% income reduction, your cash flow faces an initial deficit of ${formatINR(stressBefore)}/month before any new loan. Adding the ${formatINR(emi)} EMI would widen the deficit to ${formatINR(stressBefore - emi)}/month. However, activating Centsible's 4 mitigation habits frees up ${formatINR(freed)}/month, turning your cash flow back to positive (+${formatINR(stressBefore + freed)}/month) and protecting your repayment.`;
      sources = [
        `20% drop cash position: ${formatINR(stressBefore)}/mo`,
        `Mitigation recovery: +${formatINR(freed)}/mo`,
        `Net post-mitigation cashflow: +${formatINR(stressBefore + freed)}/mo`,
      ];
    } else if (
      lower.includes("save") ||
      lower.includes("cut") ||
      lower.includes("mitigation") ||
      lower.includes("free up")
    ) {
      reply = `We identified 4 gentle spending adjustments totaling ${formatINR(freed)}/month:
1. Batch cook 3 weekdays instead of food delivery: save ₹1,200/mo
2. Switch commute to Metro/Bus: save ₹700/mo
3. Pause 2 inactive streaming/gym subscriptions: save ₹700/mo
4. Set a ₹2,000 monthly impulse spend lock: save ₹800/mo.
If you apply 50% of this freed cash (₹1,700/mo) to prepay your loan, you will clear it in just 8 months instead of 12!`;
      sources = [
        `Actionable cuts found: 4 categories`,
        `Total monthly freed cash: ${formatINR(freed)}/mo`,
        `Prepayment acceleration: 4 months saved`,
      ];
    } else if (lower.includes("bnpl") || lower.includes("pay later") || lower.includes("no cost")) {
      reply = `While the 3-month BNPL advertises 'No-Cost' with only a ₹600 fee, the required monthly payment is ₹13,333/month. That is almost 3× higher than your Safe-to-Borrow limit (${formatINR(safeLimit)}/month). Attempting to pay ₹13,333/mo would force you to default on essentials or swipe high-interest cards, turning a small emergency into a debt spiral.`;
      sources = [
        `BNPL monthly demand: ₹13,333/mo`,
        `Safe monthly limit: ${formatINR(safeLimit)}/mo`,
        `Risk ratio: 2.96x over safe threshold`,
      ];
    } else if (
      lower.includes("explain") ||
      lower.includes("safe-to-borrow") ||
      lower.includes("what is") ||
      lower.includes("how is it calculated")
    ) {
      reply = `Safe-to-Borrow is your true monthly EMI affordability, calculated as:
Income (${formatINR(income)}) − Committed Dues (₹24,500) − Essentials (₹14,000) − Safety Buffer (₹2,000) = ${formatINR(safeLimit)}/month.
Lenders may approve you for ₹1,50,000 based on your gross salary, but Centsible protects you by showing what your actual monthly cash flow can sustain without falling into distress.`;
      sources = [
        `Net Salary: ${formatINR(income)}`,
        `Committed Dues: -₹24,500`,
        `Living Essentials: -₹14,000`,
        `Safety Buffer: -₹2,000`,
        `Safe Limit: ${formatINR(safeLimit)}/mo`,
      ];
    } else {
      reply = `I am Centsible's AI Financial Assistant. Based on your verified financial profile, you need ${formatINR(credit)} for the medical emergency. Your Safe-to-Borrow limit is ${formatINR(safeLimit)}/mo. The recommended 12-month Personal Loan costs ${formatINR(emi)}/mo and saves you ~${formatINR(savings)} compared to minimum credit card payments. How can I assist you further?`;
      sources = [
        `Verified emergency need: ${formatINR(credit)}`,
        `Safe capacity: ${formatINR(safeLimit)}/mo`,
        `Recommended EMI: ${formatINR(emi)}/mo`,
      ];
    }

    // Optional LLM fallback check if GEMINI_API_KEY or ANTHROPIC_API_KEY is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const promptText = `You are Centsible AI Accountant, a calm, precise fintech financial assistant for India.
User Question: "${message}"
Ground truth facts:
- User: ${context.personaName || "Priya"}
- Monthly Income: ${formatINR(income)}
- Committed Dues: ₹24,500
- Essentials: ₹14,000
- Safety Buffer: ₹2,000
- Safe-to-Borrow Monthly Limit: ${formatINR(safeLimit)}
- Credit Gap Needed: ${formatINR(credit)}
- Recommended 12m Personal Loan: EMI ${formatINR(emi)}/mo, total ${formatINR(bestRepaid)}
- Card Minimum Path: ~${formatINR(worstRepaid)} over 35m (42% APR)
- Direct Savings vs Worst: ~${formatINR(savings)}
- 20% Income Drop Stress: ${formatINR(stressBefore)}/mo before EMI
- Mitigation Layer Freed: ${formatINR(freed)}/mo across 4 gentle cuts.
RULE: Never invent any numbers. Rely strictly on the ground truth facts above. Keep your answer concise (2-3 paragraphs max) and encouraging.`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
          }
        );

        if (res.ok) {
          const geminiData = await res.json();
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 10) {
            reply = candidateText.trim();
          }
        }
      } catch (err) {
        // Silently fall back to deterministic reply
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        groundedSources: sources,
        suggestedFollowUps: followUps,
      } as ChatResponsePayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Chat processing failed" },
      { status: 500 }
    );
  }
}

