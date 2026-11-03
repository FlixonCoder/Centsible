"use client";

import { motion } from "framer-motion";

interface DataPacketProps {
  isRunning: boolean;
  isWarning?: boolean;
}

export function DataPacket({ isRunning, isWarning }: DataPacketProps) {
  if (!isRunning) {
    return (
      <div className="w-0.5 h-6 bg-slate-700/60 mx-auto my-0.5 transition-colors" />
    );
  }

  return (
    <div className="relative w-0.5 h-6 bg-indigo-950/80 mx-auto my-0.5 overflow-hidden">
      {/* Background connector line */}
      <div className="absolute inset-0 bg-indigo-500/30" />

      {/* Animated glowing packet dot travelling down */}
      <motion.div
        className={`absolute w-2 h-2 -left-[3px] rounded-full shadow-lg ${
          isWarning
            ? "bg-amber-400 shadow-amber-400/80"
            : "bg-cyan-300 shadow-cyan-300/90"
        }`}
        animate={{ y: [0, 22] }}
        transition={{
          repeat: Infinity,
          duration: 0.9,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

