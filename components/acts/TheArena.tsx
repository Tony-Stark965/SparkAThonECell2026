"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPARKATHON_CONFIG, JudgingCriterion } from "@/config/sparkathon.config";

interface TheArenaProps {
  selectedIndex?: number;
  onSelectIndex?: (idx: number) => void;
  onNextAct?: () => void;
}

export function TheArena({
  selectedIndex: controlledIndex,
  onSelectIndex,
  onNextAct,
}: TheArenaProps) {
  const [internalIndex, setInternalIndex] = useState<number>(0);
  const activeIdx = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const criteria = SPARKATHON_CONFIG.judgingCriteria;

  const handleSelect = (idx: number) => {
    if (onSelectIndex) onSelectIndex(idx);
    setInternalIndex(idx);
  };

  const activeCriterion = criteria[activeIdx] || criteria[0];

  return (
    <div className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-8 py-2 sm:py-4 flex flex-col justify-between">
      {/* 1. Act Header */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT V // THE ARENA
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
          EVALUATION PILLARS
        </h2>

        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 font-medium uppercase max-w-lg">
          Five monumental standards governing jury deliberation in the frontier chamber.
        </p>
      </div>

      {/* 2. Top Monolith Quick-Select Bar (Mobile / Desktop Ergonomics) */}
      <div className="my-2 sm:my-3 w-full flex items-center justify-between gap-1 sm:gap-2 py-1 w-full">
        {criteria.map((item: JudgingCriterion, idx: number) => {
          const isSelected = idx === activeIdx;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(idx)}
              className={`group relative flex-1 px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 border flex justify-center items-center ${
                isSelected
                  ? "border-amber-400/90 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(255,160,0,0.25)]"
                  : "border-neutral-800/80 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700 hover:text-neutral-200"
              }`}
            >
              <span className="text-amber-500/80 font-bold sm:mr-1.5">/{item.number}</span>
              <span className="hidden md:inline"> {item.title.split(" ")[0]}</span>
              <span className="md:hidden ml-1">P0{item.number}</span>
            </button>
          );
        })}
      </div>

      {/* 3A. Mobile Dedicated Composition (< md): Single Focused Stele with Prev/Next Navigation */}
      <div className="md:hidden my-4 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCriterion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl border border-amber-500/80 bg-gradient-to-b from-[#161009]/95 via-[#0b0805]/98 to-black/95 p-6 flex flex-col justify-between shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_25px_rgba(255,130,0,0.18)] overflow-hidden"
            style={{ minHeight: "245px" }}
          >
            {/* Slender Vertical Amber Energy Seam along the left border */}
            <div
              className="absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 via-amber-500 to-transparent shadow-[0_0_10px_rgba(255,160,20,0.9)]"
              aria-hidden="true"
            />

            <div>
              {/* Stele Cap */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <span className="font-mono text-xs tracking-[0.25em] text-amber-400 uppercase font-bold">
                  PILLAR //{activeCriterion.number} • OFFICIAL CRITERION
                </span>
                <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-extrabold tracking-tight text-white mt-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {activeCriterion.title}
              </h3>

              {/* Doctrine Text */}
              <p className="mt-3 text-sm text-neutral-200 leading-relaxed font-sans">
                {activeCriterion.description}
              </p>
            </div>

            {/* Bottom Stele Controls: Prev / Next Thumb Nav */}
            <div className="mt-6 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelect((activeIdx - 1 + criteria.length) % criteria.length)}
                className="font-mono text-xs tracking-wider uppercase text-neutral-300 hover:text-amber-300 flex items-center gap-1.5 py-1.5 px-3 rounded border border-neutral-800 bg-neutral-900/60"
              >
                <span>←</span>
                <span>PREV</span>
              </button>

              <span className="font-mono text-xs font-bold text-amber-400 tracking-widest">
                {activeIdx + 1} / {criteria.length}
              </span>

              <button
                type="button"
                onClick={() => handleSelect((activeIdx + 1) % criteria.length)}
                className="font-mono text-xs tracking-wider uppercase text-amber-400 hover:text-amber-200 flex items-center gap-1.5 py-1.5 px-3 rounded border border-amber-500/40 bg-amber-500/10"
              >
                <span>NEXT</span>
                <span>→</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3B. Desktop 5-Stele Monumental Grid (>= md) */}
      <div className="hidden md:grid md:grid-cols-5 gap-3.5 lg:gap-4 my-6 items-stretch">
        {criteria.map((item: JudgingCriterion, idx: number) => {
          const isSelected = idx === activeIdx;
          return (
            <motion.div
              key={item.id}
              onClick={() => handleSelect(idx)}
              whileHover={{ y: isSelected ? -12 : -6 }}
              animate={{
                y: isSelected ? -10 : 0,
                scale: isSelected ? 1.03 : 0.97,
                opacity: isSelected ? 1 : 0.65,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 overflow-hidden ${
                isSelected
                  ? "border-amber-500/90 bg-gradient-to-b from-[#18110a]/95 via-[#0c0804]/98 to-[#050402]/98 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_30px_rgba(255,130,0,0.22)]"
                  : "border-neutral-800/70 bg-gradient-to-b from-neutral-900/60 via-neutral-950/70 to-black/80 hover:border-neutral-700/90 hover:opacity-85"
              }`}
              style={{
                minHeight: "300px",
              }}
            >
              {/* Slender Vertical Amber Energy Seam along the left border */}
              <div
                className={`absolute top-0 left-0 bottom-0 w-[2px] transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-b from-amber-400 via-amber-500 to-transparent shadow-[0_0_12px_rgba(255,160,20,1)]"
                    : "bg-transparent"
                }`}
                aria-hidden="true"
              />

              {/* Top Stele Cap & Runic Number */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
                  <span className="font-mono text-xs tracking-[0.25em] text-neutral-300 uppercase font-bold">
                    PILLAR //{item.number}
                  </span>
                  <div
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      isSelected
                        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]"
                        : "bg-neutral-800"
                    }`}
                  />
                </div>

                {/* Monumental Stele Title */}
                <h3
                  className={`text-lg sm:text-xl font-extrabold tracking-tight mt-4 transition-colors duration-300 ${
                    isSelected ? "text-amber-100 drop-shadow-[0_2px_12px_rgba(255,160,20,0.3)]" : "text-neutral-300"
                  }`}
                >
                  {item.title}
                </h3>

                {/* Concise Doctrine Text */}
                <p className="mt-3 text-xs sm:text-[13px] text-neutral-300 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              {/* Bottom Plinth / Focus State */}
              <div className="mt-6 pt-3.5 border-t border-neutral-800/60 flex items-center justify-between">
                <span
                  className={`font-mono text-xs tracking-[0.22em] uppercase transition-colors ${
                    isSelected ? "text-amber-400 font-bold" : "text-neutral-300"
                  }`}
                >
                  {isSelected ? "ACTIVE FOCUS" : "BENCHMARK"}
                </span>

                <span
                  className={`font-mono text-xs font-bold transition-all ${
                    isSelected ? "text-amber-300 scale-110" : "text-neutral-300"
                  }`}
                >
                  /{item.number}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Active Stele Detailed Telemetry Strip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCriterion.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="my-2 p-3 sm:p-4 rounded-xl border border-amber-500/30 bg-[#0c0805]/95 md:bg-[#0c0805]/80 md:backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              /{activeCriterion.number}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              {activeCriterion.title}
            </span>
          </div>

          <div className="font-mono text-xs sm:text-sm text-neutral-300 tracking-wider uppercase">
            JURY PROTOCOL LOCKED • PHYSICAL STELE ELEVATED IN WEBGL
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 5. Advance to Act VI: The Bounty */}
      {onNextAct && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onNextAct}
            className="group inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.22em] text-neutral-300 hover:text-amber-300 uppercase transition-all duration-300 py-2.5 px-6 rounded-full border border-neutral-800 hover:border-amber-500/60 bg-neutral-950/70 hover:shadow-[0_0_25px_rgba(255,140,0,0.2)] cursor-pointer"
          >
            <span>CONTINUE TO BOUNTY</span>
            <span className="text-amber-400 group-hover:translate-y-0.5 transition-transform">↓</span>
          </button>
        </div>
      )}
    </div>
  );
}
