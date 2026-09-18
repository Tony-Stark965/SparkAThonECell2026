"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPARKATHON_CONFIG, DomainItem } from "@/config/sparkathon.config";

interface TerritoryOrchestratorProps {
  activeIndex?: number;
  onSelectIndex?: (idx: number) => void;
  onNextAct?: () => void;
}

export function TerritoryOrchestrator({
  activeIndex: controlledIndex,
  onSelectIndex,
  onNextAct,
}: TerritoryOrchestratorProps) {
  const [internalIndex, setInternalIndex] = useState<number>(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const setActiveIndex = (idx: number) => {
    if (onSelectIndex) onSelectIndex(idx);
    setInternalIndex(idx);
  };

  const domains = SPARKATHON_CONFIG.domains;
  const currentDomain: DomainItem = domains[activeIndex] || domains[0];

  const handleNext = () => {
    setActiveIndex((activeIndex + 1) % domains.length);
  };

  const handlePrev = () => {
    setActiveIndex((activeIndex - 1 + domains.length) % domains.length);
  };

  return (
    <div className="relative z-30 w-full max-w-5xl mx-auto px-4 sm:px-8 py-2 sm:py-4 flex flex-col justify-between">
      {/* 1. Act Header */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.3em] text-amber-400 uppercase font-semibold">
            ACT IV // THE FRONTIER WORLDS
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
          FIVE UNCHARTED SECTORS
        </h2>
        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 font-medium uppercase max-w-md">
          Swipe or tap to explore verified engineering domains.
        </p>
      </div>

      {/* 2. Territory Selector Bar (Touch Ergonomic on 390px) */}
      <div className="my-2.5 sm:my-3.5 w-full flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
        {domains.map((d, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={d.id}
              onClick={() => setActiveIndex(idx)}
              className={`font-mono text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-all duration-300 uppercase tracking-wider ${
                isActive
                  ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_14px_rgba(255,140,0,0.3)]"
                  : "border-neutral-800 bg-neutral-950/80 text-neutral-300 hover:text-neutral-300 hover:border-neutral-700"
              }`}
            >
              /{d.number}
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Territory Monolith Card */}
      <div className="relative w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDomain.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/95 via-neutral-950/98 to-black md:from-neutral-900/80 md:via-neutral-950/90 md:to-black p-6 sm:p-9 md:backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            {/* Top Card Telemetry */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm tracking-widest text-amber-400 font-bold">
                  SECTOR {currentDomain.number}
                </span>
                <span className="text-neutral-300 font-mono text-xs">{"//"}</span>
                <span className="font-mono text-xs text-neutral-300 uppercase tracking-widest">
                  VERIFIED TRACK
                </span>
              </div>
              <span className="font-mono text-xs tracking-widest text-neutral-300">
                0{activeIndex + 1} / 0{domains.length}
              </span>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {currentDomain.title}
            </h3>

            <p className="mt-1 font-mono text-xs sm:text-sm tracking-wider text-amber-400/90 uppercase font-semibold">
              {currentDomain.subtitle}
            </p>

            {/* Description */}
            <p className="mt-4 text-xs sm:text-sm text-neutral-200 leading-relaxed">
              {currentDomain.description}
            </p>

            {/* Technology Tags */}
            <div className="mt-6 pt-5 border-t border-neutral-800/60">
              <div className="flex flex-wrap gap-1.5">
                {currentDomain.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-xs tracking-wider text-neutral-300 bg-neutral-900 border border-neutral-700/80 px-2.5 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Previous / Next Tactical Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-5 px-2">
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 font-mono text-xs text-neutral-300 hover:text-white uppercase tracking-wider py-2 px-3 rounded-lg border border-neutral-800 bg-neutral-950/80 active:scale-95 transition-all"
          >
            ← PREV SECTOR
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 font-mono text-xs text-amber-400 hover:text-amber-300 uppercase tracking-wider py-2 px-3 rounded-lg border border-amber-500/40 bg-neutral-950/80 active:scale-95 transition-all"
          >
            NEXT SECTOR →
          </button>
        </div>
      </div>

      {/* 4. Advance to Next Act Button */}
      {onNextAct && (
        <div className="mt-4 sm:mt-5 flex justify-center">
          <button
            onClick={onNextAct}
            className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-neutral-300 hover:text-amber-300 uppercase transition-colors py-2 px-5 rounded-full border border-neutral-800 hover:border-amber-500/50 cursor-pointer"
          >
            <span>CONTINUE TO ARENA</span>
            <span className="text-amber-400">↓</span>
          </button>
        </div>
      )}
    </div>
  );
}
