"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";

/* ───────────────────────── Card ───────────────────────── */
export function Card({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-cardborder bg-white shadow-card", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Step header ───────────────────────── */
export function StepHeader({
  step,
  kicker,
  title,
  subtitle,
}: {
  step: number;
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-navy-800 to-primary-accent text-[13px] font-bold text-white shadow-sm">
          {step}
        </span>
        <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary-accent">
          {kicker}
        </span>
      </div>
      <h1 className="text-[34px] font-extrabold leading-[1.15] tracking-tight text-navy-900">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-[17px] leading-relaxed text-slate-500">{subtitle}</p>
    </div>
  );
}

/* ───────────────────────── Count-up number ───────────────────────── */
export function CountUp({
  value,
  format = formatINR,
  duration = 0.9,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const latest = useRef(reduce ? value : 0);
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      latest.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(latest.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        latest.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span className={cn("tabular-nums", className)}>{format(display)}</span>;
}

/* ───────────────────────── Progress ring ───────────────────────── */
export function Ring({
  pct,
  size = 240,
  stroke = 18,
  children,
  from = "#4F46E5",
  to = "#7C3AED",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  from?: string;
  to?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const id = `ring-${from.replace("#", "")}-${to.replace("#", "")}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EAF3" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ───────────────────────── Badge ───────────────────────── */
type Tone = "safe" | "risk" | "caution" | "indigo" | "neutral";
const TONES: Record<Tone, string> = {
  safe: "bg-safe-bg text-safe-text border-safe-border",
  risk: "bg-risk-bg text-risk-text border-risk-border",
  caution: "bg-caution-bg text-caution-text border-caution-border",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        TONES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ───────────────────────── Slider ───────────────────────── */
export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  color = "#4F46E5",
  label,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  label: string;
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      className="cs-slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ "--pct": `${pct}%`, "--c": color } as CSSProperties}
    />
  );
}

/* ───────────────────────── Switch ───────────────────────── */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-safe" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}

/* ───────────────────────── Reveal (staggered entrance) ───────────────────────── */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── Skeleton shown while a node is "running" ───────────────────────── */
export function StepSkeleton() {
  return (
    <div aria-busy="true" aria-label="Processing">
      <div className="mb-7 space-y-3">
        <div className="shimmer h-5 w-48 rounded-md" />
        <div className="shimmer h-9 w-[28rem] max-w-full rounded-lg" />
        <div className="shimmer h-5 w-[34rem] max-w-full rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="shimmer h-56 rounded-2xl" />
        <div className="shimmer h-56 rounded-2xl" />
        <div className="shimmer h-56 rounded-2xl" />
      </div>
      <div className="shimmer mt-5 h-40 rounded-2xl" />
    </div>
  );
}

