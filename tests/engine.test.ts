import { describe, it, expect } from "vitest";
import { PERSONAS } from "../lib/sample-data";
import { calculateSafeToBorrow } from "../lib/engine/safeToBorrow";
import { compareBorrowOptions } from "../lib/engine/options";
import { calculateStressTest } from "../lib/engine/stress";
import { calculateMitigationImpact, DEFAULT_MITIGATION_ACTIONS } from "../lib/engine/mitigation";
import { decide } from "../lib/engine/decide";

describe("Centsible Calculation Engine - Priya Baseline Specs", () => {
  const priya = PERSONAS.priya;

  it("calculates Safe-to-Borrow capacity = ₹4,500 exactly", () => {
    const result = calculateSafeToBorrow({
      income: priya.monthlyIncome,
      committedDues: priya.committedDues,
      essentials: priya.essentialsAmount,
      safetyBuffer: priya.safetyBuffer,
    });

    // 45,000 - 24,500 - 14,000 - 2,000 = 4,500
    expect(result.safeCapacity).toBe(4500);
    expect(result.income).toBe(45000);
    expect(result.committedDues).toBe(24500);
    expect(result.essentials).toBe(14000);
    expect(result.safetyBuffer).toBe(2000);
  });

  it("calculates credit gap = ₹40,000 after ₹20,000 savings applied", () => {
    const creditGap = priya.emergencyAmount - priya.savingsDefaultApplied;
    expect(creditGap).toBe(40000);
  });

  it("calculates 4 borrow options matching deck numbers", () => {
    const creditNeeded = 40000;
    const safeLimit = 4500;
    const comparison = compareBorrowOptions(creditNeeded, safeLimit, 60000, 20000);

    const cardMin = comparison.options.find((o) => o.id === "card_min")!;
    const bnpl = comparison.options.find((o) => o.id === "bnpl_3m")!;
    const cardEmi = comparison.options.find((o) => o.id === "card_emi_12m")!;
    const pl = comparison.options.find((o) => o.id === "personal_loan_12m")!;

    // 1. Card minimum: total ≈ 70,000 over ≈ 35 months
    expect(cardMin.tenureMonths).toBeGreaterThanOrEqual(34);
    expect(cardMin.tenureMonths).toBeLessThanOrEqual(36);
    expect(cardMin.totalRepaid).toBeGreaterThanOrEqual(69000);
    expect(cardMin.totalRepaid).toBeLessThanOrEqual(71000);
    expect(cardMin.verdict).toBe("RISKY");

    // 2. BNPL 3 months: ≈ 40,600 total (13,333/mo * 3 + 600 fee)
    expect(bnpl.totalRepaid).toBe(40600); // 40,000 principal + 600 fee
    expect(bnpl.monthlyPayment).toBe(13333);
    expect(bnpl.verdict).toBe("RISKY");

    // 3. Card EMI 12m: monthly ≈ 3,610, total ≈ 44,500
    expect(cardEmi.monthlyPayment).toBe(3610);
    expect(cardEmi.totalRepaid).toBeGreaterThanOrEqual(44400);
    expect(cardEmi.totalRepaid).toBeLessThanOrEqual(44600);
    expect(cardEmi.verdict).toBe("SAFE");

    // 4. Personal loan 12m: monthly ≈ 3,630, total ≈ 44,300 (recommended)
    expect(pl.monthlyPayment).toBe(3630);
    expect(pl.totalRepaid).toBeGreaterThanOrEqual(44200);
    expect(pl.totalRepaid).toBeLessThanOrEqual(44400);
    expect(pl.verdict).toBe("SAFE");
    expect(pl.isRecommended).toBe(true);

    // Hero savings vs worst option ≈ ₹25,700 - ₹26,000
    expect(comparison.savingsVsWorst).toBeGreaterThanOrEqual(25500);
    expect(comparison.savingsVsWorst).toBeLessThanOrEqual(26500);
  });

  it("calculates Stress Test at 20% income drop = -₹2,500 before new EMI", () => {
    const stress = calculateStressTest({
      baseIncome: priya.monthlyIncome,
      committedDues: priya.committedDues,
      essentials: priya.essentialsAmount,
      safetyBuffer: priya.safetyBuffer,
      newMonthlyEmi: 3630,
      incomeDropPercent: 20,
    });

    // 36,000 - 24,500 - 14,000 = -2,500
    expect(stress.monthlyPositionBeforeEmi).toBe(-2500);
    // With EMI: -2,500 - 3,630 = -6,130
    expect(stress.monthlyPositionWithEmi).toBe(-6130);
    expect(stress.status).toBe("CRITICAL_RISK");
  });

  it("calculates Mitigation Layer total freed cash = ₹3,400 and flips stress positive", () => {
    const activeCutIds = DEFAULT_MITIGATION_ACTIONS.filter((a) => a.isActionableCut).map(
      (a) => a.id
    );

    const impact = calculateMitigationImpact({
      baseSafeCapacity: 4500,
      baseStressPositionBeforeEmi: -2500,
      loanPrincipal: 40000,
      loanEmi: 3630,
      loanTenureMonths: 12,
      loanAnnualRate: 16,
      activeActionIds: activeCutIds,
    });

    // 1200 + 700 + 700 + 800 = 3400
    expect(impact.totalFreedMonthly).toBe(3400);
    // Safe capacity increases from 4,500 to 7,900
    expect(impact.newSafeCapacity).toBe(7900);
    // Stress position flips from -2,500 to +900!
    expect(impact.newStressPositionBeforeEmi).toBe(900);
    expect(impact.isStressDeficitEliminated).toBe(true);
    // Prepayment with 50% (₹1,700) reduces tenure
    expect(impact.monthsSaved).toBeGreaterThanOrEqual(3);
  });

  it("generates hero decision for Priya", () => {
    const optionsResult = compareBorrowOptions(40000, 4500, 60000, 20000);
    const decisionResult = decide({
      persona: priya,
      creditNeeded: 40000,
      safeLimit: 4500,
      recommendedOption: optionsResult.recommendedOption,
      worstOption: optionsResult.worstOption,
      mitigationFreedCash: 3400,
      stressPositionBeforeEmi: -2500,
    });

    expect(decisionResult.primaryVerdict).toBe("BORROW");
    expect(decisionResult.heroSavingsVsWorst).toBeGreaterThanOrEqual(25500);
    expect(decisionResult.reasons.length).toBe(3);
    expect(decisionResult.urgencyCheck.canDelay).toBe(false);
  });
});

