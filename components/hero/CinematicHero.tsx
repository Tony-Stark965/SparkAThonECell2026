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

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const timers: NodeJS.Timeout[] = [];

    const tP2 = isMobile ? 150 : 500;
    const tP3 = isMobile ? 350 : 1000;
    const rampDur = isMobile ? 250 : 800;
    const tP4 = isMobile ? 550 : 1600;
    const tP5 = isMobile ? 750 : 2200;
    const tP6 = isMobile ? 950 : 2700;
    const tP7 = isMobile ? 1150 : 3400;

    // Phase 2: Single Spark
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 2)), tP2));

    // Phase 3: World Reveal begins ramping from 0 to 1
    timers.push(
      setTimeout(() => {
        setPhase((p) => Math.max(p, 3));
        const startTime = performance.now();
        const duration = rampDur;
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
      }, tP3)
    );

    // Phase 4: Title Reveal: SPARK-A-THON
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 4)), tP4));

    // Phase 5: Year + Creed
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 5)), tP5));

    // Phase 6: CTA
    timers.push(setTimeout(() => setPhase((p) => Math.max(p, 6)), tP6));

    // Phase 7: Complete
    timers.push(setTimeout(() => setPhase(7), tP7));

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
      <header className="relative z-30 w-full px-3 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between">
        {/* Left: E-CELL Logo & Monogram */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : -6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-3 md:rounded-full md:border md:border-neutral-800/90 md:bg-neutral-950/85 md:px-4 md:py-2 md:backdrop-blur-lg md:shadow-lg pointer-events-auto"
        >
          <div className="flex items-center justify-center gap-2.5 md:gap-2">
            <Image 
              src="/images/iic-logo.png" 
              alt="IIC Logo" 
              width={48} 
              height={48} 
              unoptimized
              className="h-14 md:h-9 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
            <Image 
              src="/images/ecell-logo-v2.png" 
              alt="E-Cell Official Logo" 
              width={48} 
              height={48} 
              unoptimized
              className="h-14 md:h-9 w-auto object-contain"
              style={{ background: 'transparent' }}
            />
          </div>
          <div className="flex flex-col items-start justify-center text-amber-500 font-black text-[14px] sm:text-[13px] tracking-[0.2em] font-mono leading-[1.15]">
            <span>ECELL</span>
            <span>FCRIT</span>
          </div>
        </motion.div>

        {/* Right: Date Pill & Minimalist Menu Icon */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : -6 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <div className="hidden xs:inline-flex items-center rounded-full border border-neutral-800/80 bg-neutral-950/95 md:bg-neutral-950/70 px-3 py-1 md:backdrop-blur-md">
            <span className="font-mono text-xs sm:text-sm tracking-wider text-amber-300/85 uppercase">
              {SPARKATHON_CONFIG.dates.display}
            </span>
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
          className="flex flex-col gap-2 font-mono text-xs tracking-[0.28em] text-neutral-300 uppercase text-left"
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
          className="flex flex-col gap-2 font-mono text-xs tracking-[0.28em] text-neutral-300 uppercase text-right"
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
      <footer className="relative z-30 w-full max-w-7xl px-4 pb-4 sm:px-10 sm:pb-7 flex flex-wrap items-end justify-between gap-4 font-mono text-[10px] sm:text-xs md:text-sm tracking-widest uppercase text-neutral-300">
        {/* Left Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 5 ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-0.5 text-left"
        >
          <span>CHAMBER: 01 // DARK CAVERN</span>
          <span className="text-neutral-300">STATUS: AWAITS EXPLORERS</span>
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
          className="flex flex-col gap-0.5 text-right text-neutral-300"
        >
          <span>MORE THAN A HACKATHON.</span>
          <span className="text-amber-500/80">A NEW FRONTIER.</span>
        </motion.div>
      </footer>
    </section>
  );
}
