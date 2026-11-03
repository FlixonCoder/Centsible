"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

export interface PipelineStepMeta {
  index: number; // 1 to 7
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  description: string;
  status: StepStatus;
  executionTimeSec: number;
  inputSummary: string;
  outputSummary: string;
  hasRiskWarning?: boolean;
}

const STEP_DEFINITIONS: Array<{
  index: number;
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  description: string;
  defaultTime: number;
}> = [
  {
    index: 1,
    id: "link-data",
    title: "Link Verified Data",
    shortTitle: "Link Data",
    iconName: "Link2",
    description: "Account Aggregator ingestion & expense categorization",
    defaultTime: 0.8,
  },
  {
    index: 2,
    id: "apply-savings",
    title: "Apply Available Savings",
    shortTitle: "Apply Savings",
    iconName: "PiggyBank",
    description: "Minimizing net borrowing gap before credit",
    defaultTime: 0.6,
  },
  {
    index: 3,
    id: "safe-to-borrow",
    title: "Safe-to-Borrow Engine",
    shortTitle: "Safe-to-Borrow",
    iconName: "ShieldAlert",
    description: "True monthly repayment capacity calculation",
    defaultTime: 0.9,
  },
  {
    index: 4,
    id: "compare-costs",
    title: "Compare True Borrowing Costs",
    shortTitle: "Compare Costs",
    iconName: "Scale",
    description: "Amortizing options and exposing hidden traps",
    defaultTime: 0.7,
  },
  {
    index: 5,
    id: "stress-test",
    title: "Cash Flow Stress Test",
    shortTitle: "Stress Test",
    iconName: "Activity",
    description: "Simulating income shocks before commitment",
    defaultTime: 1.1,
  },
  {
    index: 6,
    id: "mitigation-layer",
    title: "Mitigation Layer",
    shortTitle: "Mitigation",
    iconName: "Sparkles",
    description: "Pinpointing gentle expense cuts to safeguard cash flow",
    defaultTime: 0.9,
  },
  {
    index: 7,
    id: "decision-matrix",
    title: "Optimal Decision",
    shortTitle: "Decision",
    iconName: "CheckCircle2",
    description: "Grounded recommendation and non-predatory roadmap",
    defaultTime: 0.5,
  },
];

export function usePipeline() {
  const [personaId, setPersonaId] = useState<string>(DEFAULT_PERSONA_ID);
  const persona = PERSONAS[personaId] || PERSONAS[DEFAULT_PERSONA_ID];

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [calmMode, setCalmMode] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // User interactive state inputs
  const [savingsApplied, setSavingsApplied] = useState<number>(persona.savingsDefaultApplied);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("personal_loan_12m");
  const [incomeDropPercent, setIncomeDropPercent] = useState<number>(20);
  const [activeMitigationIds, setActiveMitigationIds] = useState<string[]>(
    DEFAULT_MITIGATION_ACTIONS.map((a) => a.id)
  );

  // Step statuses and mini-summaries
  const [stepStates, setStepStates] = useState<PipelineStepMeta[]>(() =>
    STEP_DEFINITIONS.map((def) => ({
      ...def,
      status: def.index === 1 ? "done" : "idle",
      executionTimeSec: def.defaultTime,
      inputSummary: "",
      outputSummary: "",
    }))
  );

  // Computed engine values
  const creditNeeded = Math.max(0, persona.emergencyAmount - savingsApplied);

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
    savingsApplied
  );

  const selectedOption =
    optionsResult.options.find((o) => o.id === selectedOptionId) ||
    optionsResult.recommendedOption;

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

  // Keep summaries updated dynamically
  useEffect(() => {
    setStepStates((prev) =>
      prev.map((step) => {
        let input = "";
        let output = "";
        let warning = false;

        switch (step.index) {
          case 1:
            input = `4 accounts (HDFC, ICICI, ZenPay, Bajaj)`;
            output = `Income ${formatINR(persona.monthlyIncome)}, Dues ${formatINR(persona.committedDues)}`;
            break;
          case 2:
            input = `Bill ${formatINR(persona.emergencyAmount)} − Savings ${formatINR(savingsApplied)}`;
            output = `Credit gap needed: ${formatINR(creditNeeded)}`;
            break;
          case 3:
            input = `Income ${formatINR(persona.monthlyIncome)} − Dues ${formatINR(persona.committedDues)} − Essentials ${formatINR(persona.essentialsAmount)} − Buffer ${formatINR(persona.safetyBuffer)}`;
            output = `Safe Limit: ${formatINR(safeToBorrowResult.safeCapacity)}/mo`;
            break;
          case 4:
            input = `Credit ${formatINR(creditNeeded)} vs 4 credit avenues`;
            output = `Best: ${optionsResult.recommendedOption.title} (${formatINR(optionsResult.recommendedOption.monthlyPayment)}/mo)`;
            break;
          case 5:
            input = `Income drop: -${incomeDropPercent}%`;
            output = `Cashflow: ${formatINR(stressTestResult.monthlyPositionBeforeEmi)}/mo (Deficit!)`;
            warning = stressTestResult.status !== "RESILIENT";
            break;
          case 6:
            input = `4 spending adjustments + 2 habits`;
            output = `+${formatINR(mitigationImpact.totalFreedMonthly)}/mo freed cash`;
            break;
          case 7:
            input = `Safe limit ${formatINR(safeToBorrowResult.safeCapacity)} + Mitigation ${formatINR(mitigationImpact.totalFreedMonthly)}`;
            output = `Save ~${formatINR(decisionResult.heroSavingsVsWorst)} vs Card Min`;
            break;
        }

        return {
          ...step,
          inputSummary: input,
          outputSummary: output,
          hasRiskWarning: warning,
        };
      })
    );
  }, [
    persona,
    savingsApplied,
    creditNeeded,
    safeToBorrowResult.safeCapacity,
    optionsResult.recommendedOption,
    incomeDropPercent,
    stressTestResult.monthlyPositionBeforeEmi,
    stressTestResult.status,
    mitigationImpact.totalFreedMonthly,
    decisionResult.heroSavingsVsWorst,
  ]);

  // Handle switching persona
  const handlePersonaChange = (newPersonaId: string) => {
    const newPersona = PERSONAS[newPersonaId] || PERSONAS.priya;
    setPersonaId(newPersonaId);
    setSavingsApplied(newPersona.savingsDefaultApplied);
    setIncomeDropPercent(20);
    setActiveMitigationIds(DEFAULT_MITIGATION_ACTIONS.map((a) => a.id));
    setCurrentStep(1);
    setIsPlayingDemo(false);

    setStepStates((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.index === 1 ? "done" : "idle",
      }))
    );
  };

  // Navigating steps with quick execution simulation
  const goToStep = useCallback(
    (targetStep: number) => {
      if (targetStep < 1 || targetStep > 7) return;

      // Set current target to running temporarily for 400ms if not done
      setStepStates((prev) =>
        prev.map((s) => {
          if (s.index < targetStep) {
            return {
              ...s,
              status: s.index === 5 && s.hasRiskWarning ? "warning" : "done",
            };
          }
          if (s.index === targetStep) {
            return { ...s, status: "running" };
          }
          return s;
        })
      );

      const timer = setTimeout(() => {
        setStepStates((prev) =>
          prev.map((s) => {
            if (s.index <= targetStep) {
              return {
                ...s,
                status: s.index === 5 && s.hasRiskWarning ? "warning" : "done",
              };
            }
            return s;
          })
        );
        setCurrentStep(targetStep);
      }, 350);

      return () => clearTimeout(timer);
    },
    []
  );

  const resetPipeline = () => {
    setIsPlayingDemo(false);
    setCurrentStep(1);
    const defaultP = PERSONAS[personaId];
    setSavingsApplied(defaultP.savingsDefaultApplied);
    setIncomeDropPercent(20);
    setActiveMitigationIds(DEFAULT_MITIGATION_ACTIONS.map((a) => a.id));
    setStepStates((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.index === 1 ? "done" : "idle",
      }))
    );
  };

  // Demo autoplay loop
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlayingDemo) {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      return;
    }

    demoTimerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 7) {
          setIsPlayingDemo(false);
          return 7;
        }
        const next = prev + 1;
        setStepStates((sPrev) =>
          sPrev.map((s) => {
            if (s.index < next) {
              return {
                ...s,
                status: s.index === 5 && s.hasRiskWarning ? "warning" : "done",
              };
            }
            if (s.index === next) {
              return {
                ...s,
                status: next === 5 ? "warning" : "done",
              };
            }
            return s;
          })
        );
        return next;
      });
    }, 4200);

    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, [isPlayingDemo]);

  // Keyboard navigation shortcuts (§7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToStep(Math.min(7, currentStep + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToStep(Math.max(1, currentStep - 1));
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsPlayingDemo((prev) => !prev);
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, goToStep]);

  return {
    persona,
    personaId,
    setPersonaId: handlePersonaChange,
    currentStep,
    goToStep,
    stepStates,
    isPlayingDemo,
    setIsPlayingDemo,
    resetPipeline,
    calmMode,
    setCalmMode,
    isChatOpen,
    setIsChatOpen,
    // Interactive parameters
    savingsApplied,
    setSavingsApplied,
    selectedOptionId,
    setSelectedOptionId,
    selectedOption,
    incomeDropPercent,
    setIncomeDropPercent,
    activeMitigationIds,
    setActiveMitigationIds,
    toggleMitigationAction: (actionId: string) => {
      setActiveMitigationIds((prev) =>
        prev.includes(actionId)
          ? prev.filter((id) => id !== actionId)
          : [...prev, actionId]
      );
    },
    // Computed outputs
    creditNeeded,
    safeToBorrowResult,
    optionsResult,
    stressTestResult,
    mitigationImpact,
    decisionResult,
  };
}

export type PipelineContextType = ReturnType<typeof usePipeline>;

