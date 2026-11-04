import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { deriveProfile } from "@/lib/engine/profile";
import { calculateObligationRollOff } from "@/lib/engine/obligations";
import { compareBorrowOptions, calculateBreakEvenApr } from "@/lib/engine/options";
import { calculateStressTest } from "@/lib/engine/stress";
import { detectMitigationSuggestions } from "@/lib/engine/mitigation";
import { evaluateDecision } from "@/lib/engine/decide";
import { generateCashFlowForecast } from "@/lib/engine/forecast";

describe("Centsible Engine v2 - Acceptance Criteria (§10)", () => {
  const priyaData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "priya.json"), "utf-8")
  );
  const arjunData = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "arjun.json"), "utf-8")
  );

  it("derives Priya profile correctly: safe-to-borrow = 4,500, income = 45,000, dues = 24,500, living = 14,000", () => {
    const profile = deriveProfile({
      user: {
        id: priyaData.user.id,
        incomeType: priyaData.user.incomeType,
        bufferAmount: 2000,
        bufferMode: "fixed",
      },
      obligations: priyaData.obligations,
      transactions: priyaData.transactions,
    });

    expect(profile.income).toBe(45000);
    expect(profile.committedDues).toBe(24500);
    expect(profile.livingExpenses).toBe(14000);
    expect(profile.safetyBuffer).toBe(2000);
    expect(profile.safeToBorrow).toBe(4500);
  });

  it("calculates duesByMonth roll-off for Priya = [24500, 24500, 20000, 8364, 0...]", () => {
    const rollOff = calculateObligationRollOff(priyaData.obligations);

    expect(rollOff.duesByMonth[0]).toBe(24500); // Month 1
    expect(rollOff.duesByMonth[1]).toBe(24500); // Month 2
    expect(rollOff.duesByMonth[2]).toBe(20000); // Month 3 (ZenPay 1 finished)
    expect(rollOff.duesByMonth[3]).toBe(8364);  // Month 4 (Card amortised payoff + ZenPay 3)
    expect(rollOff.duesByMonth[4]).toBe(0);     // Month 5 (Debt free!)
    expect(rollOff.debtFreeMonthIndex).toBe(5);
  });

  it("calculates option pricing, eligibility, break-even APR, and deck parity for Priya", () => {
    const creditNeeded = 40000;
    const safeLimit = 4500;
    const comparison = compareBorrowOptions(
      creditNeeded,
      safeLimit,
      60000,
      20000,
      priyaData.accounts
    );

    const cardMin = comparison.options.find((o) => o.id === "card_min")!;
    const bnpl = comparison.options.find((o) => o.id === "bnpl_3m")!;
    const cardEmi = comparison.options.find((o) => o.id === "card_emi_12m")!;
    const pl = comparison.options.find((o) => o.id === "personal_loan_12m")!;

    // Card min ≈ ₹70,000 / 35 months
    expect(cardMin.totalRepaid).toBeGreaterThanOrEqual(69000);
    expect(cardMin.totalRepaid).toBeLessThanOrEqual(71000);
    expect(cardMin.tenureMonths).toBeGreaterThanOrEqual(34);
    expect(cardMin.tenureMonths).toBeLessThanOrEqual(36);

    // BNPL option flagged unavailable (limit left ₹6,000 < ₹40,000 needed)
    expect(bnpl.eligibility).toBe("limited");
    expect(bnpl.eligibilityReason).toContain("limit left");
    expect(bnpl.totalRepaid).toBe(40600);

    // Card EMI is available (₹1,11,800 free limit)
    expect(cardEmi.eligibility).toBe("available");
    expect(cardEmi.monthlyPayment).toBe(3610);
    expect(cardEmi.totalRepaid).toBeGreaterThanOrEqual(44400);
    expect(cardEmi.totalRepaid).toBeLessThanOrEqual(44600);

    // 16% Personal loan EMI ≈ 3,630, break-even APR ≈ 59%
    expect(pl.monthlyPayment).toBe(3630);
    expect(pl.totalRepaid).toBeGreaterThanOrEqual(44200);
    expect(pl.totalRepaid).toBeLessThanOrEqual(44400);
    expect(pl.breakEvenApr).toBeGreaterThanOrEqual(58);
    expect(pl.breakEvenApr).toBeLessThanOrEqual(61);
  });

  it("calculates month-1 shock at −20% before EMI = −2,500 and passes with plan but fails without", () => {
    const rollOff = calculateObligationRollOff(priyaData.obligations);
    const stress = calculateStressTest({
      baseIncome: 45000,
      duesByMonth: rollOff.duesByMonth,
      essentials: 14000,
      safetyBuffer: 2000,
      liquidCushion: 6350, // Buffer 2k + 4.35k remaining liquid savings
      newMonthlyEmi: 3630,
      incomeDropPercent: 20,
      activeMitigationMonthly: 3283,
    });

    expect(stress.month1BeforeEmi).toBe(-2500);
    expect(stress.month1WithEmi).toBe(-6130);
    expect(stress.passesWithoutPlan).toBe(false);
    expect(stress.passesWithPlan).toBe(true);
  });

  it("detects mitigation total ≈ 3,283 (±50) with the four named actions", () => {
    const mitigation = detectMitigationSuggestions({
      userId: "priya",
      transactions: priyaData.transactions,
      rarelyUsedSubs: priyaData.userFlags.rarelyUsedSubscriptions,
    });

    const foodAction = mitigation.suggestions.find((s) => s.id === "cut_food_delivery")!;
    const cabAction = mitigation.suggestions.find((s) => s.id === "cut_cab_rides")!;
    const subAction = mitigation.suggestions.find((s) => s.id === "pause_subscriptions")!;
    const shopAction = mitigation.suggestions.find((s) => s.id === "cap_impulse_shopping")!;

    expect(foodAction.monthlySaving).toBe(1200);
    expect(cabAction.monthlySaving).toBe(700);
    expect(subAction.monthlySaving).toBe(583);
    expect(shopAction.monthlySaving).toBe(800);

    expect(mitigation.totalFreedMonthly).toBeGreaterThanOrEqual(3233);
    expect(mitigation.totalFreedMonthly).toBeLessThanOrEqual(3333);
    expect(mitigation.totalFreedMonthly).toBe(3283);
  });

  it("Priya verdict with accepted plan = SAFE_WITH_PLAN, without plan ≠ SAFE", () => {
    const comparison = compareBorrowOptions(40000, 4500, 60000, 20000, priyaData.accounts);
    const decisionWithPlan = evaluateDecision({
      creditNeeded: 40000,
      safeLimit: 4500,
      recommendedOption: comparison.recommendedOption,
      worstOption: comparison.worstOption,
      passesWithoutPlan: false,
      passesWithPlan: true,
      mitigationFreedCash: 3283,
      urgency: "high",
      canDelay: false,
    });

    expect(decisionWithPlan.verdictTier).toBe("SAFE_WITH_PLAN");

    const decisionWithoutPlan = evaluateDecision({
      creditNeeded: 40000,
      safeLimit: 4500,
      recommendedOption: comparison.recommendedOption,
      worstOption: comparison.worstOption,
      passesWithoutPlan: false,
      passesWithPlan: false,
      mitigationFreedCash: 0,
      urgency: "high",
      canDelay: false,
    });

    expect(decisionWithoutPlan.verdictTier).not.toBe("SAFE");
    expect(decisionWithoutPlan.verdictTier).toBe("TIGHT");
  });

  it("derives Arjun gig profile: typical capacity ≈ 5,500 vs weak-month capacity ≈ 2,750", () => {
    const arjunProfileTypical = deriveProfile({
      user: {
        id: arjunData.user.id,
        incomeType: "gig",
        incomeBasis: "average",
        bufferAmount: 1500,
      },
      obligations: arjunData.obligations,
      transactions: arjunData.transactions,
    });

    const arjunProfileWeak = deriveProfile({
      user: {
        id: arjunData.user.id,
        incomeType: "gig",
        incomeBasis: "weak_month",
        bufferAmount: 1500,
      },
      obligations: arjunData.obligations,
      transactions: arjunData.transactions,
    });

    expect(arjunProfileTypical.typicalIncome).toBe(30000);
    expect(arjunProfileTypical.committedDues).toBe(12000);
    expect(arjunProfileTypical.livingExpenses).toBe(11000);
    expect(arjunProfileTypical.safetyBuffer).toBe(1500);

    // Typical: 30,000 - 12,000 - 11,000 - 1,500 = 5,500
    expect(arjunProfileTypical.safeToBorrow).toBe(5500);

    // Weak month (25th percentile income ≈ 27,250): 27,250 - 12,000 - 11,000 - 1,500 = 2,750
    expect(arjunProfileWeak.weakMonthIncome).toBe(27250);
    expect(arjunProfileWeak.safeToBorrow).toBe(2750);
  });
});

