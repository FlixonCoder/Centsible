"use client";

import { motion } from "framer-motion";

/** Vertical connector with glowing "data packets" that travel down while a step is running. */
export function DataPacket({ active, warning }: { active: boolean; warning?: boolean }) {
  return (
    <div className="relative mx-auto h-5 w-px overflow-visible" aria-hidden>
      <div
        className={`absolute inset-0 transition-colors duration-300 ${
          active ? (warning ? "bg-amber-400/50" : "bg-cyan-300/50") : "bg-white/15"
        }`}
      />
      {active &&
        [0, 0.35].map((delay) => (
          <motion.span
            key={delay}
            className={`absolute -left-[3px] h-[7px] w-[7px] rounded-full ${
              warning
                ? "bg-amber-300 shadow-[0_0_10px_3px_rgba(251,191,36,0.8)]"
                : "bg-cyan-300 shadow-[0_0_10px_3px_rgba(103,232,249,0.8)]"
            }`}
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: [-4, 18], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeIn" }}
          />
        ))}
    </div>
  );
}
