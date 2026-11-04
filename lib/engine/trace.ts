export interface TraceEntry {
  stage: string;
  inputs: Record<string, any>;
  formula: string;
  output: Record<string, any>;
  ms: number;
}

export function createTrace(
  stage: string,
  inputs: Record<string, any>,
  formula: string,
  output: Record<string, any>,
  startTime: number
): TraceEntry {
  const ms = Math.max(0.1, Number((performance.now() - startTime).toFixed(1)));
  return {
    stage,
    inputs,
    formula,
    output,
    ms,
  };
}

