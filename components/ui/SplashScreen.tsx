"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 4.5 seconds absolute maximum duration, regardless of loading state
    // This prevents the user from ever getting stuck.
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for the exit animation (0.8s) to finish before officially unmounting and letting the main site render
      setTimeout(onComplete, 800);
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cinematic-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden select-none"
        >
          {/* 1. Cinematic Background Video */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
            >
              <source src="/splash.mp4" type="video/mp4" />
            </video>
            
            {/* 2. Premium Subtle Overlay */}
            {/* Soft gradient from bottom to anchor the text */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/30 to-transparent" />
            {/* Very subtle vignette to draw focus to the center */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,2,2,0.6)_100%)]" />
          </div>

          {/* 3. Minimal Branding & Typography */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 md:px-12 h-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 uppercase drop-shadow-xl">
                SPARK-A-THON
              </h1>
              <div className="mt-3 md:mt-5 flex items-center justify-center gap-4">
                <div className="h-[1px] w-8 md:w-16 bg-white/20" />
                <p className="font-mono text-xs sm:text-sm md:text-base tracking-[0.4em] text-neutral-300 uppercase font-light">
                  2026 EDITION
                </p>
                <div className="h-[1px] w-8 md:w-16 bg-white/20" />
              </div>
            </motion.div>

            {/* 4. Minimal Cinematic Loading Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
              className="absolute bottom-16 md:bottom-24 flex flex-col items-center gap-4 w-full max-w-[200px]"
            >
              <p className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-neutral-400 uppercase">
                LOADING EXPERIENCE
              </p>
              {/* Subtle animated loading line */}
              <div className="h-[1px] w-full bg-white/10 relative overflow-hidden rounded-full">
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 bg-white/60 w-1/4 rounded-full"
                  animate={{
                    left: ["-25%", "100%"]
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
