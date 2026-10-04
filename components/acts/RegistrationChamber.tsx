"use client";

import React from "react";
import { motion } from "framer-motion";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

interface RegistrationChamberProps {
  onReturnToHero?: () => void;
  onNextAct?: () => void;
}

export function RegistrationChamber({ onReturnToHero }: RegistrationChamberProps) {
  const handleBackToHome = () => {
    if (onReturnToHero) {
      onReturnToHero();
    } else {
      window.location.hash = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="register" className="relative z-30 w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col justify-between items-center text-center min-h-[90vh]">
      {/* Act Header */}
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">ACT IX // REGISTRATION CHAMBER</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
          {SPARKATHON_CONFIG.registration.chamberTitle}
        </h2>
        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 uppercase max-w-md">
          {SPARKATHON_CONFIG.registration.chamberSubtitle}
        </p>
      </div>

      {/* Sealed Registration Chamber Container */}
      <div className="relative my-auto w-full max-w-2xl mt-6 sm:mt-8">
        {/* Ambient Amber Glow Backdrop */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[85%] rounded-full blur-[100px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(255, 140, 0, 0.5) 0%, rgba(255, 60, 0, 0.15) 50%, transparent 75%)" }}
          aria-hidden="true"
        />

        {/* Outer Chamber Frame */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#070709] p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden text-left">
          {/* Inner Chamber Box */}
          <div className="relative w-full rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#050403]/98 to-black p-6 sm:p-10 overflow-hidden min-h-[480px] sm:min-h-[540px] flex flex-col items-center justify-center">
            {/* Subtle Tech Grid / Scanline Backdrop */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: "linear-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.08) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Corner Tech Brackets */}
            <div className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500/40" />
            <div className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500/40" />
            <div className="pointer-events-none absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500/40" />
            <div className="pointer-events-none absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500/40" />

            {/* Step 6: Cybernetic Scanning Beam (sweeping down and fading) */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-amber-400/20 to-transparent blur-sm z-20"
              initial={{ top: "-15%", opacity: 0 }}
              animate={{
                top: ["-15%", "115%"],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{
                duration: 2.2,
                delay: 0.7,
                ease: "easeInOut",
              }}
            >
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
            </motion.div>

            {/* Hero Animation Container (Steps 1 through 10) */}
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              
              {/* Step 9: Outward Traveling Amber Shockwave Pulse on Vault Seal */}
              <motion.div
                className="pointer-events-none absolute rounded-full border border-amber-400/80"
                style={{ width: "90px", height: "90px" }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{
                  scale: [0.4, 1.6, 2.9],
                  opacity: [0, 0.95, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: 1.95,
                  ease: "easeOut",
                }}
              />

              {/* Ambient Secondary Outward Waves (Looping after seal) */}
              <motion.div
                className="pointer-events-none absolute rounded-full border border-amber-500/30"
                style={{ width: "90px", height: "90px" }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: [0.6, 2.2, 3.2],
                  opacity: [0.6, 0.2, 0],
                }}
                transition={{
                  duration: 3.2,
                  delay: 2.6,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />

              {/* Step 3, 4, 8: Concentric Ring 4 (Outermost Reticle Boundary with 4 Cardinal Markers) */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotate: 360,
                }}
                transition={{
                  scale: { duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.4, delay: 0.55 },
                  rotate: { duration: 32, ease: "linear", repeat: Infinity },
                }}
                className="pointer-events-none absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border border-amber-500/20 flex items-center justify-center"
              >
                {/* 4 Cardinal Lock Reticles */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </motion.div>

              {/* Step 3, 4, 8: Concentric Ring 3 (Outer Segmented Ring - Rotates Clockwise) */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{
                  scale: [0.3, 1.05, 1],
                  opacity: 1,
                  rotate: 360,
                }}
                transition={{
                  scale: { duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.45, delay: 0.65 },
                  rotate: { duration: 20, ease: "linear", repeat: Infinity },
                }}
                className="pointer-events-none absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-amber-400/30 border-t-amber-400/80 border-b-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
              />

              {/* Step 3, 4, 8: Concentric Ring 2 (Middle Dashed Ring - Rotates Counter-Clockwise) */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{
                  scale: [0.3, 1.08, 1],
                  opacity: 1,
                  rotate: -360,
                }}
                transition={{
                  scale: { duration: 0.75, delay: 0.75, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.4, delay: 0.75 },
                  rotate: { duration: 14, ease: "linear", repeat: Infinity },
                }}
                className="pointer-events-none absolute w-36 h-36 sm:w-42 sm:h-42 rounded-full border border-dashed border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
              />

              {/* Step 3, 4, 8: Concentric Ring 1 (Inner Mechanical Ring - Converges & Snaps at Lock) */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{
                  scale: [0.2, 1.15, 0.94, 1],
                  opacity: 1,
                  rotate: 360,
                }}
                transition={{
                  scale: { duration: 1.1, delay: 0.85, times: [0, 0.6, 0.85, 1], ease: "easeInOut" },
                  opacity: { duration: 0.35, delay: 0.85 },
                  rotate: { duration: 10, ease: "linear", repeat: Infinity },
                }}
                className="pointer-events-none absolute w-26 h-26 sm:w-30 sm:h-30 rounded-full border border-amber-300/70 border-r-transparent border-l-transparent shadow-[0_0_15px_rgba(251,191,36,0.4)]"
              />

              {/* Step 5: Amber Sparks & Luminous Particles Orbiting the Core */}
              <motion.div
                className="pointer-events-none absolute w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 360,
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.85 },
                  scale: { duration: 0.8, delay: 0.85 },
                  rotate: { duration: 7, ease: "linear", repeat: Infinity },
                }}
              >
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const dist = 52;
                  const x = Math.cos(rad) * dist;
                  const y = Math.sin(rad) * dist;
                  return (
                    <div
                      key={deg}
                      className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,1)]"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    />
                  );
                })}
              </motion.div>

              {/* Step 2, 7, 10: High-Tech Cybernetic Vault Core (Seals and Glows) */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.25, 0.96, 1],
                  opacity: 1,
                  boxShadow: [
                    "0 0 20px rgba(251,191,36,0.3), inset 0 0 15px rgba(251,191,36,0.2)",
                    "0 0 65px rgba(251,191,36,0.85), inset 0 0 30px rgba(251,191,36,0.5)",
                    "0 0 35px rgba(251,191,36,0.45), inset 0 0 18px rgba(251,191,36,0.25)",
                  ],
                }}
                transition={{
                  scale: { duration: 1.1, delay: 0.4, times: [0, 0.5, 0.85, 1], ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.3, delay: 0.4 },
                  boxShadow: { duration: 3.0, delay: 1.8, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-400 bg-gradient-to-b from-[#1f1508] via-[#0d0904] to-black flex items-center justify-center shadow-[0_0_35px_rgba(251,191,36,0.45)]"
              >
                {/* Vault-Seal Hex Reticle Background */}
                <div className="absolute inset-1 rounded-full border border-amber-500/30 opacity-70 pointer-events-none" />

                {/* Cybernetic Vault Lock Glyph (NO checkmark, pure cybernetic seal) */}
                <motion.svg
                  className="w-9 h-9 sm:w-11 sm:h-11 text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.9)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.85, ease: "easeOut" }}
                >
                  {/* Vault Padlock Shackle */}
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  {/* Vault Padlock Body */}
                  <rect x="4" y="11" width="16" height="11" rx="2" ry="2" fill="rgba(245, 158, 11, 0.15)" />
                  {/* Internal Locking Core Reticle */}
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                  <path d="M12 17.5V19" />
                </motion.svg>
              </motion.div>
            </div>

            {/* Step 11: Cinematic Reveal of "REGISTRATION CLOSED" and HUD Subtag */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, filter: "blur(14px)", y: 14 }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.85, delay: 2.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 sm:mt-8 text-center z-10"
            >
              <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-none select-none">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]">
                  REGISTRATION
                </span>
                <span className="block text-white tracking-widest mt-1.5 sm:mt-2.5 drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                  CLOSED
                </span>
              </h2>

              {/* Supporting Monospace HUD Subtag */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.5 }}
                className="mt-4 flex items-center justify-center gap-2"
              >
                <span className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,1)]" />
                <span className="font-mono text-[10px] sm:text-xs text-amber-400/90 tracking-[0.25em] sm:tracking-[0.32em] uppercase font-bold">
                  ALL SQUADS SECURED // PROTOCOL COMPLETE
                </span>
                <span className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,1)]" />
              </motion.div>
            </motion.div>

            {/* Minimal, Non-Dominant "← BACK TO HOME" Navigation Action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2.8 }}
              className="mt-8 sm:mt-10 z-10"
            >
              <button
                type="button"
                onClick={handleBackToHome}
                className="font-mono text-[11px] sm:text-xs text-neutral-400 hover:text-amber-400 tracking-[0.25em] uppercase transition-colors duration-200 cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-800/80 hover:border-amber-500/40 bg-neutral-950/60"
              >
                <span>← BACK TO HOME</span>
              </button>
            </motion.div>

          </div>

          {/* Bottom Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/90 font-mono text-xs sm:text-sm text-neutral-300 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">DATA PROTOCOL:</span>
              <span className="text-amber-400/90">CHAMBER SEALED // 54/54 SQUADS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">STATUS:</span>
              <span className="text-neutral-300">REGISTRATION ACCESS TERMINATED</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
