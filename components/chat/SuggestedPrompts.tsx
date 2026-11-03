"use client";

const PROMPTS = [
  "Can I afford this?",
  "Which option is cheapest?",
  "What if my income drops?",
  "How can I save more?",
  "Why is BNPL risky?",
  "Explain Safe-to-Borrow",
];

export function SuggestedPrompts({ onPick, disabled }: { onPick: (p: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROMPTS.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p)}
          className="rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[13px] font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:opacity-50"
        >
          {p}
        </button>
      ))}
    </div>
  );
}

