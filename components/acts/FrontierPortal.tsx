"use client";

import React from "react";
import { motion } from "framer-motion";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

interface FrontierPortalProps {
  onReturnToHero?: () => void;
  onProceedToRegister?: () => void;
  onNextAct?: () => void;
}

export function FrontierPortal({
  onReturnToHero,
  onProceedToRegister,
  onNextAct,
}: FrontierPortalProps) {
  const regConfig = SPARKATHON_CONFIG.registration;

  const handleRegisterClick = () => {
    if (onProceedToRegister) {
      onProceedToRegister();
    } else if (onNextAct) {
      onNextAct();
    } else {
      window.location.hash = "register";
    }
  };

  return (
    <div className="relative z-30 w-full max-w-5xl mx-auto px-4 sm:px-8 py-2 sm:py-4 flex flex-col justify-between items-center text-center">
      {/* 1. Act Header */}
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT VIII // THE PORTAL
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
          ENTER THE FRONTIER
        </h2>

        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 font-medium uppercase max-w-md">
          The event horizon is reached. Assemble your squad to construct the next paradigm.
        </p>
      </div>

      {/* 2. Monumental Stone/Metal Gateway Arch */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-auto w-full max-w-2xl mt-3 sm:mt-4"
      >
        {/* Exterior Atmospheric Core Radiance */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[85%] rounded-full blur-[35px] md:blur-[100px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 140, 0, 0.6) 0%, rgba(255, 60, 0, 0.2) 50%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* Portal Basalt Outer Chassis */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#070709] p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden">
          {/* Top Arch Telemetry Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/90 font-mono text-xs sm:text-sm text-neutral-300 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
              <span className="text-neutral-300 font-semibold uppercase">
                GATEWAY // HORIZON-PORTAL-08
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-300">SECTOR:</span>
              <span className="text-amber-400/90 font-semibold">TERMINAL APERTURE</span>
            </div>
          </div>

          {/* Inner Portal Chamber */}
          <div className="relative w-full rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#050403]/98 to-black p-3.5 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
            {/* Corner Industrial Locking Pins */}
            <div className="pointer-events-none absolute top-3 left-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/80" />
            </div>
            <div className="pointer-events-none absolute top-3 right-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/80" />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/80" />
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-amber-500/80" />
            </div>

            {/* Glowing Amber Energy Horizon Seams */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 shadow-[0_0_12px_rgba(255,160,0,1)]" />
            <div className="pointer-events-none absolute inset-x-8 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 shadow-[0_0_12px_rgba(255,160,0,1)]" />

            {/* Event Horizon Radial Glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255, 140, 0, 0.22) 0%, rgba(255, 60, 0, 0.08) 50%, transparent 75%)",
              }}
              aria-hidden="true"
            />

            {/* Portal Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold shadow-[0_0_15px_rgba(255,160,0,0.15)]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>OFFICIAL DISPATCH GATEWAY</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              </div>

              {/* 3 Verified Expedition Specifications */}
              <div className="my-3 sm:my-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
                {/* 1. Team Size */}
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-2.5 sm:p-3.5 flex flex-col items-center text-center">
                  <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase">
                    TEAM STRUCTURE
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-white mt-0.5 sm:mt-1">
                    {regConfig.teamSize}
                  </span>
                  <span className="font-mono text-xs text-amber-400/80 uppercase mt-0.5">
                    CROSS-DISCIPLINARY
                  </span>
                </div>

                {/* 2. Entry Fee */}
                <div className="rounded-xl border border-amber-500/30 bg-[#140e08]/80 p-2.5 sm:p-3.5 flex flex-col items-center text-center shadow-[0_0_15px_rgba(255,140,0,0.08)]">
                  <span className="font-mono text-xs tracking-widest text-amber-400 uppercase font-semibold">
                    ENTRY PROTOCOL
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-amber-200 mt-0.5 sm:mt-1">
                    ₹400
                    <span className="text-xs font-normal text-amber-300/80"> / 2-4 members</span>
                  </span>
                  <span className="font-mono text-xs text-neutral-300 uppercase mt-0.5">
                    ₹450 / 5 MEMBERS
                  </span>
                </div>

                {/* 3. Prize Pool */}
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-2.5 sm:p-3.5 flex flex-col items-center text-center">
                  <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase">
                    BOUNTY TREASURY
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-white mt-0.5 sm:mt-1">
                    {regConfig.totalPool}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 uppercase mt-0.5">
                    CONFIRMED POOL
                  </span>
                </div>
              </div>

              {/* Final CTA Execution: Transitions to Registration Chamber (#register) */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 w-full rounded-full border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-2 sm:px-8 py-3.5 sm:py-4 font-mono text-xs xs:text-xs sm:text-base font-black tracking-widest sm:tracking-[0.25em] text-neutral-950 uppercase transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <span className="whitespace-nowrap">REGISTER YOUR TEAM</span>
                  <span className="transition-transform duration-300 group-hover:translate-y-0.5 text-neutral-950 whitespace-nowrap">
                    ↓
                  </span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Return to Hearth Navigation Button */}
      {onReturnToHero && (
        <button
          onClick={onReturnToHero}
          className="mt-3.5 sm:mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-neutral-300 hover:text-amber-300 uppercase py-2 px-5 rounded-full border border-neutral-800 hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <span>↑ RETURN TO THE HEARTH</span>
        </button>
      )}
    </div>
  );
}

