"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface HeroCTAProps {
  isVisible: boolean;
  onEnter?: () => void;
}

export function HeroCTA({ isVisible, onEnter }: HeroCTAProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnter) {
      onEnter();
    } else {
      const el = document.getElementById("frontier-domains");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 22,
      }}
      transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8 sm:mt-11 flex flex-col items-center gap-3 z-30"
    >
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileTap={{ scale: 0.96 }}
        className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border border-amber-500/50 bg-neutral-950/90 px-8 py-4 sm:px-10 sm:py-4.5 text-xs sm:text-sm font-semibold tracking-[0.22em] text-amber-200 uppercase transition-colors duration-300 hover:border-amber-400 hover:text-white"
        style={{
          minHeight: "54px",
          minWidth: "250px",
          boxShadow: isHovered
            ? "0 0 32px rgba(255, 95, 0, 0.35), inset 0 0 16px rgba(255, 120, 0, 0.15)"
            : "0 0 16px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Dynamic inner light spotlight following cursor on hover */}
        {isHovered && (
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md opacity-60"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              width: "120px",
              height: "120px",
              background:
                "radial-gradient(circle, rgba(255, 140, 20, 0.4) 0%, transparent 70%)",
            }}
          />
        )}

        {/* Ambient flame pulse badge */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />
        </span>

        {/* Label */}
        <span className="relative z-10 font-mono tracking-[0.22em]">
          ENTER THE FRONTIER
        </span>

        {/* Downward portal arrow */}
        <svg
          className="relative z-10 h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:translate-y-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </motion.button>

      {/* Tactile hint for mobile */}
      <span className="font-mono text-xs tracking-[0.2em] text-neutral-300 uppercase">
        Touch or tap to descend
      </span>
    </motion.div>
  );
}
