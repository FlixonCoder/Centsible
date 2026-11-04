"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PERSONAS, DEFAULT_PERSONA_ID, Persona } from "@/lib/sample-data";
import { calculateSafeToBorrow, SafeToBorrowResult } from "@/lib/engine/safeToBorrow";
import { compareBorrowOptions, OptionsComparisonResult } from "@/lib/engine/options";
import { calculateStressTest, StressTestResult } from "@/lib/engine/stress";
import {
  calculateMitigationImpact,
  DEFAULT_MITIGATION_ACTIONS,
  MitigationImpactResult,
} from "@/lib/engine/mitigation";
import { decide, DecisionResult } from "@/lib/engine/decide";
import { formatINR } from "@/lib/format";

export type StepStatus = "idle" | "running" | "done" | "warning";
export type Timeframe = "today" | "week" | "month";
export type Category = Persona["emergencyCategory"];

export interface PipelineStepMeta {
  index: number;
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  description: string;
  status: StepStatus;
  executionTimeSec: number;
  inputSummary: string;
  outputSummary: string;
  hasRiskWarning: boolean;
}

export const STEP_DEFINITIONS = [
  { index: 1, id: "link-data", title: "Link Data", shortTitle: "Link Data", iconName: "Link2", description: "Read-only account sync", defaultTime: 0.8 },
  { index: 2, id: "apply-savings", title: "Apply Savings", shortTitle: "Apply Savings", iconName: "PiggyBank", description: "Shrink the borrowing gap", defaultTime: 0.6 },
  { index: 3, id: "safe-to-borrow", title: "Safe-to-Borrow", shortTitle: "Safe-to-Borrow", iconName: "ShieldAlert", description: "True monthly capacity", defaultTime: 0.9 },
  { index: 4, id: "compare-costs", title: "Compare True Costs", shortTitle: "Compare True Costs", iconName: "Scale", description: "Amortise every option", defaultTime: 0.7 },
  { index: 5, id: "stress-test", title: "Stress Test", shortTitle: "Stress Test", iconName: "Activity", description: "Simulate an income drop", defaultTime: 1.1 },
  { index: 6, id: "mitigation", title: "Mitigation Layer", shortTitle: "Mitigation Layer", iconName: "Sparkles", description: "Find cash to free up", defaultTime: 0.9 },
  { index: 7, id: "decision", title: "Decision", shortTitle: "Decision", iconName: "CheckCircle2", description: "Grounded recommendation", defaultTime: 0.5 },
] as const;

const URGENCY_FOR: Record<Timeframe, Persona["emergencyUrgency"]> = {
  today: "high",
  week: "high",
  month: "medium",
};

const CATEGORY_TITLE: Record<Category, string> = {
  medical: "Medical bill",
  repair: "Repair bill",
  education: "Education fee",
  family: "Family expense",
  other: "Emergency expense",
};

const DUE_LABEL: Record<Timeframe, string> = {
  today: "Due today",
  week: "Due this week",
  month: "Due this month",
};

const defaultTimeframe = (p: Persona): Timeframe => (p.emergencyUrgency === "high" ? "week" : "month");

const ALL_MITIGATION_IDS = DEFAULT_MITIGATION_ACTIONS.map((a) => a.id);

export function usePipeline() {
  const [personaId, setPersonaIdState] = useState<string>(DEFAULT_PERSONA_ID);
  const basePersona = PERSONAS[personaId] || PERSONAS[DEFAULT_PERSONA_ID];

  // Step-1 answers (they genuinely feed the engine)
  const [category, setCategory] = useState<Category>(basePersona.emergencyCategory);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe(basePersona));
  const [emergencyAmount, setEmergencyAmount] = useState<number>(basePersona.emergencyAmount);

  const persona = useMemo<Persona>(() => {
    const sameCategory = category === basePersona.emergencyCategory;
    const sameTimeframe = timeframe === defaultTimeframe(basePersona);
    return {
      ...basePersona,
      emergencyCategory: category,
      emergencyUrgency: URGENCY_FOR[timeframe],
      emergencyAmount,
      emergencyTitle: sameCategory ? basePersona.emergencyTitle : CATEGORY_TITLE[category],
      emergencyDue: sameTimeframe ? basePersona.emergencyDue : DUE_LABEL[timeframe],
    };
  }, [basePersona, category, timeframe, emergencyAmount]);

  // Navigation / processing state machine
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [processingStep, setProcessingStep] = useState<number | null>(1);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const stepRef = useRef(1);
  const maxRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interactive parameters
  const [savingsApplied, setSavingsApplied] = useState<number>(basePersona.savingsDefaultApplied);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("personal_loan_12m");
  const [incomeDropPercent, setIncomeDropPercent] = useState<number>(20);
  const [activeMitigationIds, setActiveMitigationIds] = useState<string[]>(ALL_MITIGATION_IDS);

  /** Enter a step: node goes `running` for 600–900ms (skeleton in main stage), then resolves. */
  const runStep = useCallback((target: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stepRef.current = target;
    maxRef.current = Math.max(maxRef.current, target);
    setCurrentStep(target);
    setMaxReached(maxRef.current);
    setProcessingStep(target);
    timerRef.current = setTimeout(() => setProcessingStep(null), 600 + ((target * 53) % 300));
  }, []);

  const goToStep = useCallback(
    (target: number) => {
      if (target < 1 || target > 7) return;
      if (target === stepRef.current) return;
      if (target > maxRef.current + 1) return; // can only move one step beyond what's been computed
      runStep(target);
    },
    [runStep]
  );

  // Kick off step 1 on mount
  useEffect(() => {
    runStep(1);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runStep]);

  const resetAll = useCallback(
    (p: Persona) => {
      setCategory(p.emergencyCategory);
      setTimeframe(defaultTimeframe(p));
      setEmergencyAmount(p.emergencyAmount);
      setSavingsApplied(p.savingsDefaultApplied);
      setIncomeDropPercent(20);
      setActiveMitigationIds(ALL_MITIGATION_IDS);
      setIsPlayingDemo(false);
      maxRef.current = 1;
      stepRef.current = 0; // force re-run of step 1
      runStep(1);
    },
    [runStep]
  );

  const setPersonaId = useCallback(
    (id: string) => {
      const p = PERSONAS[id] || PERSONAS[DEFAULT_PERSONA_ID];
      setPersonaIdState(id);
      resetAll(p);
    },
    [resetAll]
  );

  const resetPipeline = useCallback(() => resetAll(basePersona), [resetAll, basePersona]);

  /** Restore the persona's sample answers (used by "Use sample data"). */
  const useSampleAnswers = useCallback(() => {
    setCategory(basePersona.emergencyCategory);
    setTimeframe(defaultTimeframe(basePersona));
    setEmergencyAmount(basePersona.emergencyAmount);
  }, [basePersona]);

  const togglePlayDemo = useCallback(() => {
    if (isPlayingDemo) {
      setIsPlayingDemo(false);
      return;
    }
    if (stepRef.current >= 7) resetAll(basePersona);
    setIsPlayingDemo(true);
  }, [isPlayingDemo, resetAll, basePersona]);

  // Autoplay: ~4s per step
  useEffect(() => {
    if (!isPlayingDemo) return;
    const id = setInterval(() => {
      if (stepRef.current >= 7) {
        setIsPlayingDemo(false);
        return;
      }
      runStep(stepRef.current + 1);
    }, 4200);
    return () => clearInterval(id);
  }, [isPlayingDemo, runStep]);

  // ---- Engine results (pure, deterministic) ----
  const effectiveSavings = Math.min(savingsApplied, emergencyAmount);
  const creditNeeded = Math.max(0, persona.emergencyAmount - effectiveSavings);

  const safeToBorrowResult: SafeToBorrowResult = calculateSafeToBorrow({
    income: persona.monthlyIncome,
    committedDues: persona.committedDues,
    essentials: persona.essentialsAmount,
    safetyBuffer: persona.safetyBuffer,
  });

  const optionsResult: OptionsComparisonResult = compareBorrowOptions(
    creditNeeded,
    safeToBorrowResult.safeCapacity,
    persona.emergencyAmount,
    effectiveSavings
  );

  const selectedOption =
    optionsResult.options.find((o: any) => o.id === selectedOptionId) || optionsResult.recommendedOption;

  const stressTestResult: StressTestResult = calculateStressTest({
    baseIncome: persona.monthlyIncome,
    committedDues: persona.committedDues,
    essentials: persona.essentialsAmount,
    safetyBuffer: persona.safetyBuffer,
    newMonthlyEmi: selectedOption.monthlyPayment,
    incomeDropPercent,
  });

  const mitigationImpact: MitigationImpactResult = calculateMitigationImpact({
    baseSafeCapacity: safeToBorrowResult.safeCapacity,
    baseStressPositionBeforeEmi: stressTestResult.monthlyPositionBeforeEmi,
    loanPrincipal: creditNeeded,
    loanEmi: selectedOption.monthlyPayment,
    loanTenureMonths: selectedOption.tenureMonths,
    loanAnnualRate: selectedOption.interestRateAnnual,
    activeActionIds: activeMitigationIds,
  });

  const decisionResult: DecisionResult = decide({
    persona,
    creditNeeded,
    safeLimit: safeToBorrowResult.safeCapacity,
    recommendedOption: optionsResult.recommendedOption,
    worstOption: optionsResult.worstOption,
    mitigationFreedCash: mitigationImpact.totalFreedMonthly,
    stressPositionBeforeEmi: stressTestResult.monthlyPositionBeforeEmi,
  });

  // ---- Node view-models (status + real Input → Output values) ----
  const stressRisk = stressTestResult.status !== "RESILIENT";

  const summaries: Record<number, { input: string; output: string }> = {
    1: {
      input: `${persona.sources.length} sources · Account Aggregator (simulated)`,
      output: `Income ${formatINR(persona.monthlyIncome)} · Dues ${formatINR(persona.committedDues)} · Essentials ${formatINR(persona.essentialsAmount)}`,
    },
    2: {
      input: `Bill ${formatINR(persona.emergencyAmount)} − Savings ${formatINR(effectiveSavings)}`,
      output: `Credit needed ${formatINR(creditNeeded)}`,
    },
    3: {
      input: `Income ${formatINR(persona.monthlyIncome)} − Dues ${formatINR(persona.committedDues)} − Essentials ${formatINR(persona.essentialsAmount)} − Buffer ${formatINR(persona.safetyBuffer)}`,
      output: `${formatINR(safeToBorrowResult.safeCapacity)}/mo safe EMI`,
    },
    4: {
      input: `${formatINR(creditNeeded)} across 4 options`,
      output: `${optionsResult.recommendedOption.title} · ${formatINR(optionsResult.recommendedOption.monthlyPayment)}/mo`,
    },
    5: {
      input: `Income −${incomeDropPercent}% · EMI ${formatINR(selectedOption.monthlyPayment)}`,
      output: `${formatINR(stressTestResult.monthlyPositionBeforeEmi)}/mo before EMI`,
    },
    6: {
      input: `${activeMitigationIds.length} of ${ALL_MITIGATION_IDS.length} ideas switched on`,
      output: `${formatINR(mitigationImpact.totalFreedMonthly)}/mo freed · limit ${formatINR(mitigationImpact.newSafeCapacity)}`,
    },
    7: {
      input: `Safe limit, stress result, cheapest safe option`,
      output: `Smarter choice saves ≈ ${formatINR(decisionResult.heroSavingsVsWorst)}`,
    },
  };

  const stepStates: PipelineStepMeta[] = STEP_DEFINITIONS.map((def) => {
    let status: StepStatus = "idle";
    if (processingStep === def.index) status = "running";
    else if (def.index <= maxReached) status = def.index === 5 && stressRisk ? "warning" : "done";
    return {
      index: def.index,
      id: def.id,
      title: def.title,
      shortTitle: def.shortTitle,
      iconName: def.iconName,
      description: def.description,
      status,
      executionTimeSec: def.defaultTime,
      inputSummary: summaries[def.index].input,
      outputSummary: summaries[def.index].output,
      hasRiskWarning: def.index === 5 && stressRisk,
    };
  });

  // ---- Keyboard shortcuts: ← → Space C Esc ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToStep(stepRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToStep(stepRef.current - 1);
      } else if (e.code === "Space" && tag !== "BUTTON") {
        e.preventDefault();
        togglePlayDemo();
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsChatOpen((v) => !v);
      } else if (e.key === "Escape") {
        setIsChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToStep, togglePlayDemo]);

  return {
    persona,
    basePersona,
    personaId,
    setPersonaId,
    currentStep,
    maxReached,
    processingStep,
    goToStep,
    stepStates,
    isPlayingDemo,
    togglePlayDemo,
    resetPipeline,
    calmMode,
    setCalmMode,
    isChatOpen,
    setIsChatOpen,
    // step-1 answers
    category,
    setCategory,
    timeframe,
    setTimeframe,
    emergencyAmount,
    setEmergencyAmount,
    useSampleAnswers,
    // interactive parameters
    savingsApplied: effectiveSavings,
    setSavingsApplied,
    selectedOptionId,
    setSelectedOptionId,
    selectedOption,
    incomeDropPercent,
    setIncomeDropPercent,
    activeMitigationIds,
    toggleMitigationAction: (actionId: string) =>
      setActiveMitigationIds((prev) =>
        prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
      ),
    // computed outputs
    creditNeeded,
    safeToBorrowResult,
    optionsResult,
    stressTestResult,
    mitigationImpact,
    decisionResult,
  };
}

export type Pipeline = ReturnType<typeof usePipeline>;
