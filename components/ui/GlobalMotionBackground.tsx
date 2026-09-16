"use client";

import React from "react";
import { motion } from "framer-motion";

export function GlobalMotionBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black">
      {/* Deep Ember Core - Larger on mobile to fill the screen */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.35, 0.15],
          x: ["-10%", "10%", "-10%"],
          y: ["-10%", "10%", "-10%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_60%)] blur-[80px]"
      />

      {/* Roving Plasma Orb 1 - Much larger & faster on mobile */}
      <motion.div
        animate={{
          x: ["0vw", "100vw", "0vw"],
          y: ["0vh", "80vh", "0vh"],
          scale: [1, 1.5, 1],
          opacity: [0.15, 0.4, 0.15],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 left-0 w-[120vw] h-[120vw] md:w-[40vw] md:h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.18)_0%,transparent_70%)] blur-[70px] md:blur-[80px] mix-blend-screen"
      />

      {/* Roving Plasma Orb 2 - Fast cross-screen motion */}
      <motion.div
        animate={{
          x: ["100vw", "-20vw", "100vw"],
          y: ["100vh", "-20vh", "100vh"],
          scale: [1, 1.8, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-[140vw] h-[140vw] md:w-[50vw] md:h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_70%)] blur-[90px] md:blur-[120px] mix-blend-screen"
      />

      {/* Roving Plasma Orb 3 - Aggressive Mobile Orb (Hidden on Desktop) */}
      <motion.div
        animate={{
          x: ["-50vw", "150vw", "-50vw"],
          y: ["30vh", "70vh", "30vh"],
          scale: [0.8, 1.2, 0.8],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 left-0 w-[100vw] h-[100vw] md:hidden rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.15)_0%,transparent_60%)] blur-[60px] mix-blend-screen"
      />

      {/* Subtle Grid overlay for structural tech feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] md:opacity-[0.02]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #f59e0b 1px, transparent 1px),
            linear-gradient(to bottom, #f59e0b 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px" // Tighter grid on mobile
        }}
      />
    </div>
  );
}
