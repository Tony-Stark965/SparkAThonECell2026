"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CaveScene } from "@/components/scene/CaveScene";
import { HeroTypography } from "./HeroTypography";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

interface CinematicHeroProps {
  onEnter?: () => void;
  hasOwnScene?: boolean;
  onProgressChange?: (progress: number) => void;
}

export function CinematicHero({
  onEnter,
  hasOwnScene = true,
  onProgressChange,
}: CinematicHeroProps) {
  // Cinematic Initial Reveal Sequence (Total duration ~3.4s, zero lag, non-blocking):
  // Phase 1 (0–500ms): Dark entry — almost completely dark, ambient gloom only, no text
  // Phase 2 (500–1000ms): First spark — a SINGLE small ember/spark appears and drifts slowly
  // Phase 3 (1000–1800ms): World reveal — cavern silhouettes, side braziers, wet path, distant portal, beam emerge
  // Phase 4 (1600–2200ms): Title reveal — SPARK-A-THON emerges from darkness with slow fade + depth
  // Phase 5 (2200–2700ms): Year + Creed — 2026 display year, then "THE FRONTIER IS NOT FOUND. IT IS BUILT."
  // Phase 6 (2700–3400ms): CTA reveal — ENTER THE FRONTIER → with subtle amber edge glow
  // Phase 7 (3400ms+): Complete — full interactive control
  const [phase, setPhase] = useState<number>(() => {
    if (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#hearth") {
      return 7;
    }
    return 1;
  });
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  useEffect(() => {
    const isDeepLink =
      typeof window !== "undefined" &&
      Boolean(window.location.hash && window.location.hash !== "#hearth");
    if (isDeepLink) {
      if (onProgressChange) onProgressChange(1);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Phase 2: 500ms (Single Spark)
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 2)), 500));

    // Phase 3: 1000ms (World Reveal begins ramping from 0 to 1)
    timers.push(
      setTimeout(() => {
        setPhase((p) => Math.max(p, 3));
        const startTime = performance.now();
        const duration = 800; // 1000ms to 1800ms
        const rampProgress = (now: number) => {
          const elapsed = now - startTime;
          const t = Math.min(1, elapsed / duration);
          // Smooth easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          if (onProgressChange) onProgressChange(eased);
          if (t < 1) {
            requestAnimationFrame(rampProgress);
          } else {
            if (onProgressChange) onProgressChange(1);
          }
        };
        requestAnimationFrame(rampProgress);
      }, 1000)
    );

    // Phase 4: 1600ms (Title Reveal: SPARK-A-THON)
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 4)), 1600));

    // Phase 5: 2200ms (Year + Creed)
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 5)), 2200));

    // Phase 6: 2700ms (CTA)
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 6)), 2700));

    // Phase 7: 3400ms (Complete)
    timers.push(setTimeout(() => setPhase(7), 3400));

    return () => timers.forEach(clearTimeout);
  }, [onProgressChange]);

  const handleSkip = () => {
    if (phase < 7) {
      setIsSkipped(true);
      setPhase(7);
      if (onProgressChange) onProgressChange(1);
    }
  };

  const sceneProgress = phase < 3 ? 0 : phase === 3 ? 0.6 : 1.0;

  return (
    <section
      className="relative min-h-[100svh] w-full flex flex-col justify-between items-center overflow-hidden bg-transparent text-white select-none"
      onClick={handleSkip}
    >
      {/* 1. 3D WebGL World (Living Fire + Massive Cavern Architecture + Celestial Spire) */}
      {hasOwnScene && (
        <CaveScene progress={sceneProgress} currentAct="HERO" className="z-0" />
      )}

      {/* 2. Phase 2: The Genesis Ember (500–1000ms: A SINGLE subtle incandescent spark drifting slowly) */}
      <AnimatePresence>
        {phase === 2 && !isSkipped && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 15 }}
              animate={{
                scale: [0, 1.25, 1],
                opacity: [0, 0.95, 0.75],
                y: [15, 0, -18],
                x: [0, 4, -3],
              }}
              exit={{ scale: 0.2, opacity: 0, y: -28 }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
              }}
              className="relative flex items-center justify-center"
            >
              <div className="h-2 w-2 rounded-full bg-amber-400 blur-[0.8px] shadow-[0_0_12px_rgba(255,170,30,0.95)]" />
              <div className="absolute h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Top Header & Institutional Council Branding */}
      <header className="relative z-30 w-full px-3 sm:px-6 pt-4 sm:pt-6 hidden md:flex items-center justify-between">
        {/* Left: E-CELL Logo & Monogram */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : -6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-2.5 rounded-full border border-neutral-800/90 bg-neutral-950/85 px-4 py-2 backdrop-blur-lg shadow-lg pointer-events-auto"
        >
          <div className="bg-white/90 rounded-md p-0.5 flex items-center justify-center gap-1.5">
            <Image 
              src="/images/iic-logo.png" 
              alt="IIC Logo" 
              width={28} 
              height={28} 
              className="h-6 sm:h-8 w-auto"
            />
            <div className="w-[1px] h-5 bg-neutral-300 mx-0.5" />
            <Image 
              src="/images/ecell-logo-new.png" 
              alt="E-Cell Official Logo" 
              width={28} 
              height={28} 
              className="h-6 sm:h-8 w-auto"
            />
          </div>
          <span className="text-amber-500 font-black text-[10px] sm:text-xs tracking-widest font-mono">
            ECELL FCRIT
          </span>
        </motion.div>

        {/* Right: Date Pill & Minimalist Menu Icon */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : -6 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <div className="hidden xs:inline-flex items-center rounded-full border border-neutral-800/80 bg-neutral-950/70 px-3 py-1 backdrop-blur-md">
            <span className="font-mono text-[10px] sm:text-[11px] tracking-wider text-amber-300/85 uppercase">
              {SPARKATHON_CONFIG.dates.display}
            </span>
          </div>

          {/* Minimalist Expedition Menu Lines */}
          <div className="flex flex-col justify-center gap-1.5 p-1 text-neutral-400" aria-hidden="true">
            <span className="h-[1.5px] w-6 bg-neutral-300 rounded-full" />
            <span className="h-[1.5px] w-4 bg-neutral-400 rounded-full ml-auto" />
          </div>
        </motion.div>
      </header>

      {/* 5. Flanking Expedition Telemetry Columns (Desktop/Tablet) */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex justify-between px-8 lg:px-12 w-full">
        {/* Left Telemetry */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: phase >= 5 ? 0.7 : 0, x: phase >= 5 ? 0 : -16 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="flex flex-col gap-2 font-mono text-[9px] tracking-[0.28em] text-neutral-400 uppercase text-left"
        >
          <span>IDEAS</span>
          <span>TECHNOLOGY</span>
          <span>PEOPLE</span>
          <span>IMPACT</span>
          <span className="text-amber-500/80 font-bold">A BRIGHTER TOMORROW</span>
        </motion.div>

        {/* Right Telemetry */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: phase >= 5 ? 0.7 : 0, x: phase >= 5 ? 0 : 16 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="flex flex-col gap-2 font-mono text-[9px] tracking-[0.28em] text-neutral-400 uppercase text-right"
        >
          <span>STUDENTS</span>
          <span>INNOVATE</span>
          <span>SOLVE</span>
          <span>BUILD</span>
          <span className="text-amber-500/80 font-bold">LEAD</span>
        </motion.div>
      </div>

      {/* 6. Center Hero Presentation: Molten Typography & Beveled CTA */}
      <div className="relative z-30 w-full flex flex-col items-center justify-center my-auto py-6">
        <HeroTypography phase={phase} onEnter={onEnter} />
      </div>

      {/* 7. Bottom Expedition Telemetry & Status Bar */}
      <footer className="relative z-30 w-full max-w-7xl px-5 pb-5 sm:px-10 sm:pb-7 flex items-end justify-between font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-neutral-500">
        {/* Left Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 5 ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-0.5 text-left"
        >
          <span>SECTOR: 01 // DARK CAVERN</span>
          <span className="text-neutral-400">STATUS: AWAITS EXPLORERS</span>
        </motion.div>

        {/* Center Prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 6 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="hidden sm:inline-flex items-center gap-1.5 text-amber-400/90 font-semibold"
        >
          <span>SCROLL TO IGNITE</span>
          <span>↓</span>
        </motion.div>

        {/* Right Manifesto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 5 ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="flex flex-col gap-0.5 text-right text-neutral-400"
        >
          <span>MORE THAN A HACKATHON.</span>
          <span className="text-amber-500/80">A NEW FRONTIER.</span>
        </motion.div>
      </footer>
    </section>
  );
}
