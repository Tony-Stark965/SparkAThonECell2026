"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

interface TheBountyProps {
  onNextAct?: () => void;
}

/**
 * Performant, dark, subtle background atmosphere canvas:
 * Renders 20 slow-drifting microscopic embers and basalt dust motes behind the vault.
 * Automatically halts when prefers-reduced-motion is detected.
 */
function VaultAtmosphereCanvas() {
  return null;
}

/**
 * Architectural Subterranean Chamber Backdrop:
 * Wall structures, grand vaulted ceiling arches, and monumental left/right pylon colonnades.
 */
function TreasuryChamberBackdrop() {
  return null;
}

/** Stable 2-decimal rounding helper ensuring deterministic SVG geometry across SSR and client */
const roundCoord = (n: number): number => Math.round(n * 100) / 100;

/**
 * 2–3 Enormous Mechanical Rings Behind The Vault:
 * Centered directly behind the prize vault, these rings extend visibly around the vault's
 * left, right, and top edges with slow counter-rotations and glowing amber conduit tracks.
 */
function TreasuryMechanicalRings() {
  return null;
}

/**
 * Floating Basalt Fragments:
 * 8 faceted polygonal obsidian shards drifting gently around the outer perimeter of the chamber
 * with distinct amber rim-lighting highlights.
 */
function FloatingBasaltFragments() {
  return null;
}

export function TheBounty({ onNextAct }: TheBountyProps) {
  // Vault door state: unsealed by default to prominently display the ₹20,000 cash prize pool focal point
  const [isUnsealed, setIsUnsealed] = useState(true);

  return (
    <div className="relative z-30 w-full overflow-hidden px-4 sm:px-8 py-2 sm:py-4 flex flex-col justify-between items-center text-center">
      {/* 1. Subterranean Treasury Chamber Backdrop (Arches, Wall Shapes, Monumental Pylons) */}
      <TreasuryChamberBackdrop />

      {/* 2. Floating Basalt Fragments with Amber Rim Highlights */}
      <FloatingBasaltFragments />

      {/* 3. Background Subtle Atmosphere Canvas (Micro-embers & basalt dust) */}
      <VaultAtmosphereCanvas />

      {/* 4. Act Header */}
      <div className="relative z-30 flex flex-col items-center px-6 py-3 rounded-2xl bg-black/95 md:bg-black/45 md:backdrop-blur-[3px] border border-amber-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
        <div className="inline-flex items-center gap-2.5 mb-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT VI // THE BOUNTY
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,1)]">
          OFFICIAL PRIZE VAULT
        </h2>

        <p className="mt-1.5 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 uppercase max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Subterranean treasury unsealed for the builders of the next frontier.
        </p>
      </div>

      {/* 5. Subterranean Vault Bulkhead Frame */}
      <div className="relative z-20 my-auto w-full max-w-2xl mt-3 sm:mt-4">
        <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#070709] p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden transition-transform duration-300 ease-out">


          {/* Static Ambient Light Accent (replaces infinite motion sweep for performance) */}
          <div
            className="hidden md:block pointer-events-none absolute inset-0 z-10 opacity-[0.06]"
            style={{
              background:
                "linear-gradient(115deg, transparent 30%, rgba(255, 180, 50, 0.15) 50%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          {/* Top Chassis Telemetry Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/90 font-mono text-xs sm:text-sm text-neutral-300 tracking-wider">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                  isUnsealed ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" : "bg-neutral-600"
                }`}
              />
              <span className="text-neutral-300 font-semibold uppercase whitespace-nowrap">
                VAULT-ID // VT-2026-ALPHA
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <span className="text-neutral-300">LOCK: TUNGSTEN HYDRAULIC</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-800/80 bg-black/60">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-300 font-bold tracking-wider uppercase">
                  ENERGY SEALED
                </span>
              </div>
              <span className="text-amber-500/90 font-semibold">
                {isUnsealed ? "STATUS: UNSEALED" : "STATUS: LOCKED"}
              </span>
            </div>

            <button
              onClick={() => setIsUnsealed(!isUnsealed)}
              className="px-2 py-0.5 rounded border border-neutral-800 hover:border-amber-500/60 bg-neutral-900/90 hover:bg-amber-500/10 text-neutral-300 hover:text-amber-300 transition-colors uppercase text-xs tracking-widest font-mono cursor-pointer"
            >
              {isUnsealed ? "SEAL VAULT" : "UNSEAL"}
            </button>
          </div>

          {/* Core Vault Chamber */}
          <div className="relative w-full min-h-[auto] sm:min-h-[310px] rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#060503]/98 to-black p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.95)]">
            {/* Corner Industrial Locking Bolts */}
            <div className="pointer-events-none absolute top-3 left-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800/80 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/60" />
            </div>
            <div className="pointer-events-none absolute top-3 right-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800/80 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/60" />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800/80 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/60" />
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800/80 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/60" />
            </div>

            {/* Glowing Amber Hydraulic Energy Seams with breathing pulse */}
            <div
              className={`hidden md:block pointer-events-none absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(255,160,0,0.8)] transition-opacity duration-1000 ${isUnsealed ? 'opacity-90' : 'opacity-40'}`}
            />
            <div
              className={`hidden md:block pointer-events-none absolute inset-x-8 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(255,160,0,0.8)] transition-opacity duration-1000 ${isUnsealed ? 'opacity-90' : 'opacity-40'}`}
            />

            {/* Micro Hydraulic Seam Sparks */}
            <span
              className="hidden md:block pointer-events-none absolute left-1/4 top-0 h-1 w-1 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
              aria-hidden="true"
            />
            <span
              className="hidden md:block pointer-events-none absolute right-1/3 bottom-0 h-1 w-1 translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
              aria-hidden="true"
            />

            {/* Inner Vault Core Glow */}
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
                isUnsealed ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(255, 140, 0, 0.22) 0%, rgba(255, 60, 0, 0.08) 50%, transparent 75%)",
                }}
              />
              {/* Subtle ambient circuit grid pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255, 180, 50, 0.4) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            {/* Vault Content: The Bounty Treasure */}
            <div className="relative z-10 flex flex-col items-center max-w-lg">
              {/* Top Category Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold shadow-[0_0_15px_rgba(255,160,0,0.15)]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{SPARKATHON_CONFIG.bounty.label}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              </div>

              {/* Dominant ₹20,000 Currency Display */}
              <div className="my-3 sm:my-5 relative select-none">
                <span
                  className="font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 leading-none inline-block drop-shadow-[0_4px_35px_rgba(255,160,0,0.45)]"
                  style={{
                    fontSize: "clamp(3.6rem, 11vw, 7.5rem)",
                  }}
                >
                  {SPARKATHON_CONFIG.bounty.totalPool}
                </span>

                {/* Sub-text reflection shimmer */}
                <div
                  className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-full blur-md opacity-70"
                  style={{
                    background: "radial-gradient(circle, rgba(255,180,50,0.8) 0%, transparent 80%)",
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Verified Attribution Note */}
              <p className="font-mono text-xs sm:text-sm tracking-wider text-neutral-300 uppercase max-w-md px-2">
                {SPARKATHON_CONFIG.bounty.note}
              </p>

              {/* Decorative Sci-Fi Telemetry Badges */}
              <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-neutral-950/80 text-neutral-200 font-mono text-xs sm:text-sm tracking-wider uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                  <span>CONFIRMED POOL ALLOCATION</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 text-neutral-300 font-mono text-xs sm:text-sm tracking-wider uppercase">
                  <span>TREASURY PROTOCOL // UNIFIED POOL</span>
                </div>
              </div>
            </div>

            {/* 3. Mechanical Blast Doors (Slide left & right on unseal) */}
            <AnimatePresence>
              {/* Left Blast Door - Unique key provided */}
              <motion.div
                key="blast-door-left"
                initial={false}
                animate={{
                  x: isUnsealed ? "-100%" : "0%",
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="pointer-events-none absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-neutral-900 via-neutral-950 to-[#120d08] border-r-2 border-amber-500/80 shadow-[10px_0_30px_rgba(0,0,0,0.9)] z-20 flex flex-col justify-between p-4"
              >
                {/* Door Industrial Detailing */}
                <div className="flex items-center justify-between text-neutral-300 font-mono text-xs uppercase tracking-widest">
                  <span>BLAST-PLATE // L-01</span>
                  <span>HEAVY OBSIDIAN</span>
                </div>

                {/* Industrial Hazard Cross-Hatch */}
                <div className="flex flex-col gap-1 opacity-20 my-auto">
                  <div className="h-[2px] w-full bg-amber-500" />
                  <div className="h-[1px] w-3/4 bg-amber-500" />
                  <div className="h-[1px] w-1/2 bg-amber-500" />
                </div>

                <div className="flex items-center gap-1.5 text-amber-500/70 font-mono text-xs uppercase tracking-wider">
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  <span>SEAL INTERLOCK</span>
                </div>
              </motion.div>

              {/* Right Blast Door - Unique key provided */}
              <motion.div
                key="blast-door-right"
                initial={false}
                animate={{
                  x: isUnsealed ? "100%" : "0%",
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="pointer-events-none absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-neutral-900 via-neutral-950 to-[#120d08] border-l-2 border-amber-500/80 shadow-[-10px_0_30px_rgba(0,0,0,0.9)] z-20 flex flex-col justify-between p-4"
              >
                {/* Door Industrial Detailing */}
                <div className="flex items-center justify-between text-neutral-300 font-mono text-xs uppercase tracking-widest">
                  <span>TUNGSTEN CORE</span>
                  <span>BLAST-PLATE // R-02</span>
                </div>

                {/* Industrial Hazard Cross-Hatch */}
                <div className="flex flex-col items-end gap-1 opacity-20 my-auto">
                  <div className="h-[2px] w-full bg-amber-500" />
                  <div className="h-[1px] w-3/4 bg-amber-500" />
                  <div className="h-[1px] w-1/2 bg-amber-500" />
                </div>

                <div className="flex items-center justify-end gap-1.5 text-amber-500/70 font-mono text-xs uppercase tracking-wider">
                  <span>HYDRAULIC RELEASE</span>
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Chassis Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/90 font-mono text-xs sm:text-sm text-neutral-300 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-neutral-300">CHAMBER ATMOSPHERE:</span>
              <span className="text-amber-400/90">INERT // PRESSURIZED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-300">DISBURSEMENT:</span>
              <span className="text-neutral-200">VALEDICTORY CEREMONY</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Advance to Event Flow Navigation CTA */}
      {onNextAct && (
        <div className="relative z-20 mt-3 sm:mt-4 flex flex-col items-center gap-2">
          <button
            onClick={onNextAct}
            className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-neutral-800 hover:border-amber-400 bg-neutral-950/80 hover:bg-amber-500/10 font-mono text-xs tracking-[0.25em] text-neutral-300 hover:text-amber-300 uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
          >
            <span>VIEW THE TIMELINE</span>
            <span className="transition-transform duration-300 group-hover:translate-y-0.5 text-amber-400">
              ↓
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

