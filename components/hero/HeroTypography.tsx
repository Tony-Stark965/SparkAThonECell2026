"use client";

import React from "react";
import { motion } from "framer-motion";

interface HeroTypographyProps {
  phase: number;
  onEnter?: () => void;
}

export function HeroTypography({ phase, onEnter }: HeroTypographyProps) {
  const isVisible = phase >= 4;

  return (
    <div className="relative z-30 w-full max-w-5xl px-4 sm:px-6 my-auto flex flex-col items-center text-center select-none">
      {/* 1. Ornamental Frontier Sub-Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : 12,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-3 sm:mb-4 inline-flex items-center gap-3"
      >
        <span className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-amber-400" />
        <span className="text-amber-400 text-xs sm:text-sm">◆</span>
        <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-300/90 font-semibold uppercase">
          NATIONAL INNOVATION HACKATHON
        </span>
        <span className="text-amber-400 text-xs sm:text-sm">◆</span>
        <span className="h-[1px] w-8 sm:w-16 bg-gradient-to-l from-transparent via-amber-500/60 to-amber-400" />
      </motion.div>

      {/* 2. Main Title: SPARK-A-THON (Monumental Chiseled Basalt with Refined Amber Gold Face) */}
      <div className="w-full flex justify-center overflow-visible my-1 sm:my-1.5">
        <motion.h1
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{
            opacity: phase >= 4 ? 1 : 0,
            scale: phase >= 4 ? 1 : 0.94,
            y: phase >= 4 ? 0 : 14,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative whitespace-nowrap select-none font-black leading-none text-[clamp(1.5rem,10vw,7.4rem)] uppercase tracking-[0.02em] sm:tracking-[0.05em]"
        >
          {/* Layer 1: Ambient Occlusion & Deep Grounding Silhouette */}
          <span
            className="absolute inset-0 select-none text-black/95 pointer-events-none"
            style={{
              transform: "translateY(8px)",
              filter: "blur(6px)",
            }}
            aria-hidden="true"
          >
            SPARK-A-THON
          </span>

          {/* Layer 2: Subtle Physical Bevel Hairline */}
          <span
            className="absolute inset-0 select-none pointer-events-none text-transparent"
            style={{
              WebkitTextStroke: "1.5px rgba(255, 230, 170, 0.55)",
            }}
            aria-hidden="true"
          >
            SPARK-A-THON
          </span>

          {/* Layer 3: Dimensional Burnished Gold & Basalt Face */}
          <span
            className="relative block bg-gradient-to-b from-[#ffffff] via-[#ecd19a] via-40% to-[#7a3507] bg-clip-text text-transparent"
            style={{
              filter:
                "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.95)) drop-shadow(0 16px 36px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 25px rgba(255, 150, 20, 0.2))",
            }}
          >
            SPARK-A-THON
          </span>
        </motion.h1>
      </div>

      {/* 3. Year Sub-Anchor: 2026 (Intentionally Designed Monumental Year) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: phase >= 5 ? 1 : 0,
          y: phase >= 5 ? 0 : 8,
        }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-1.5 sm:mt-2.5 relative inline-block select-none"
      >
        {/* Deep Silhouette backing for crystal clarity over 3D background */}
        <span
          className="absolute inset-0 font-black tracking-[0.30em] sm:tracking-[0.52em] text-[clamp(1.25rem,6vw,3rem)] text-black/95 select-none pointer-events-none"
          style={{
            transform: "translateY(3px)",
            filter: "blur(3px)",
          }}
          aria-hidden="true"
        >
          2026
        </span>

        {/* Chiseled Metallic Display Year */}
        <span
          className="relative block font-black tracking-[0.30em] sm:tracking-[0.52em] text-[clamp(1.25rem,6vw,3rem)] bg-gradient-to-b from-[#ffffff] via-[#f5cf7b] via-45% to-[#964005] bg-clip-text text-transparent uppercase"
          style={{
            WebkitTextStroke: "1px rgba(255, 235, 180, 0.55)",
            filter:
              "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 20px rgba(255, 160, 20, 0.25))",
          }}
        >
          2026
        </span>
      </motion.div>

      {/* 4. The Frontier Creed: Official Event Doctrine */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: phase >= 5 ? 1 : 0,
          y: phase >= 5 ? 0 : 12,
        }}
        transition={{ duration: 0.9, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="mt-5 sm:mt-7 max-w-2xl mx-auto px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-black/65 backdrop-blur-md border border-neutral-800/90 shadow-[0_12px_36px_rgba(0,0,0,0.92)]"
      >
        <p className="text-xs sm:text-sm md:text-[15px] font-bold tracking-[0.20em] sm:tracking-[0.26em] text-neutral-200 leading-relaxed uppercase">
          THE FRONTIER IS NOT FOUND.
          <span className="block sm:inline sm:ml-2.5 text-amber-400 font-extrabold tracking-[0.24em] sm:tracking-[0.28em] drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
            IT IS BUILT.
          </span>
        </p>
      </motion.div>

      {/* 5. Primary Physical CTA: Ancient/Sci-Fi Gateway Control */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{
          opacity: phase >= 6 ? 1 : 0,
          y: phase >= 6 ? 0 : 16,
          scale: phase >= 6 ? 1 : 0.96,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 sm:mt-8 flex flex-col items-center gap-2.5"
      >
        <button
          type="button"
          onClick={onEnter}
          className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-md border border-amber-500/70 bg-gradient-to-b from-[#1c120a]/95 via-[#0d0703]/98 to-black px-8 py-3.5 sm:px-11 sm:py-4 text-xs sm:text-sm font-bold tracking-[0.26em] text-amber-200 uppercase transition-all duration-300 hover:border-amber-300 hover:text-white hover:shadow-[0_0_35px_rgba(255,140,0,0.5)] active:scale-[0.98] cursor-pointer"
          style={{
            minHeight: "52px",
            minWidth: "250px",
            clipPath:
              "polygon(9px 0%, calc(100% - 9px) 0%, 100% 9px, 100% calc(100% - 9px), calc(100% - 9px) 100%, 9px 100%, 0% calc(100% - 9px), 0% 9px)",
          }}
        >
          {/* Subtle diamond emblem */}
          <span className="text-amber-400 text-xs group-hover:scale-125 transition-transform">
            ❖
          </span>

          <span className="relative z-10 font-mono tracking-[0.25em]">
            ENTER THE FRONTIER
          </span>

          {/* Downward Arrow */}
          <span className="text-amber-400 font-bold text-base group-hover:translate-y-1.5 transition-transform">
            ↓
          </span>
        </button>

        {/* Tactile hint */}
        <span className="font-mono text-xs sm:text-sm tracking-[0.3em] text-neutral-300 uppercase">
          SCROLL OR TAP TO DESCEND ↓
        </span>
      </motion.div>
    </div>
  );
}
