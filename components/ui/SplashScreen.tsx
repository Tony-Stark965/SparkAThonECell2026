"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

// Background Matrix/Hex stream component
function DataStream({ isMobile }: { isMobile: boolean }) {
  const [stream, setStream] = useState<string>("01A9F4E7B28C3D");

  useEffect(() => {
    if (isMobile) return; // Freeze stream on mobile to eliminate continuous re-render loop
    const chars = "0123456789ABCDEF!@#$%^&*<>/?|\\";
    const interval = setInterval(() => {
      let newStream = "";
      for (let i = 0; i < 30; i++) {
        newStream += chars[Math.floor(Math.random() * chars.length)];
      }
      setStream(newStream);
    }, 250);
    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <div className="font-mono text-xs md:text-xs text-amber-500/50 whitespace-pre-wrap break-all leading-tight">
      {stream}
    </div>
  );
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [glitchText, setGlitchText] = useState("INITIALIZING_CORE");
  const [isGlitching, setIsGlitching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const handleQuickEnter = () => {
    setIsVisible(false);
    onComplete();
  };

  // Counter logic with mobile-optimized pacing
  useEffect(() => {
    let currentProgress = 0;
    const mobileMode = typeof window !== "undefined" && window.innerWidth < 768;

    const updateProgress = () => {
      // Mobile completes cleanly in ~1.0-1.2s while preserving the tech reveal
      const burst = mobileMode
        ? Math.floor(Math.random() * 8) + 6
        : Math.random() > 0.8
        ? Math.floor(Math.random() * 8) + 2
        : 1;
      currentProgress += burst;

      if (currentProgress >= 100) {
        setProgress(100);
        setIsGlitching(true);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(onComplete, mobileMode ? 350 : 700);
        }, mobileMode ? 250 : 500);
      } else {
        setProgress(currentProgress);
        const nextTick = mobileMode ? 35 : Math.random() > 0.9 ? 120 : 25;
        setTimeout(updateProgress, nextTick);
      }
    };

    const timer = setTimeout(updateProgress, 60);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Terminal text logic
  useEffect(() => {
    const texts = [
      "INITIALIZING_CORE",
      "SYS_MEMORY_ALLOC",
      "BYPASSING_FIREWALL",
      "DECRYPT_SECTOR_01",
      "OVERRIDE_MAINFRAME",
      "ACCESS_GRANTED",
    ];
    let index = 0;

    const textTimer = setInterval(() => {
      index = (index + 1) % texts.length;
      if (progress < 100) {
        setGlitchText(texts[index]);
      } else {
        setGlitchText("SYSTEM_ONLINE // WELCOME");
        clearInterval(textTimer);
      }
    }, 350);

    return () => clearInterval(textTimer);
  }, [progress]);

  // Random glitch effect trigger (disabled on mobile to avoid compositor churn)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.75) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 120);
      }
    }, 600);
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
          }}
          transition={{ duration: isMobile ? 0.4 : 0.7, ease: "easeOut" }}
          onClick={handleQuickEnter}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden cursor-pointer select-none"
          title="Tap to enter"
        >
          {/* Background Layer: Desktop Video vs Mobile Lightweight CSS Glow */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className={`hidden md:block w-full h-full object-cover opacity-60 mix-blend-screen transition-transform duration-75 ${
                isGlitching ? "scale-105 filter hue-rotate-[180deg] invert" : ""
              }`}
            >
              <source src="/splash.mp4" type="video/mp4" />
            </video>
            
            {/* High-Performance Mobile CSS Volcanic Core — Saves 2.2 MB network payload & 0 decode latency */}
            <div
              className="md:hidden w-full h-full opacity-65"
              style={{
                background:
                  "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.08) 55%, transparent 85%)",
              }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]" />

            {/* Scanlines Heavy (active on desktop, subtle on mobile) */}
            <div
              className="absolute inset-0 opacity-25 md:opacity-40 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)",
                backgroundSize: "100% 4px",
              }}
            />

            {/* Data Streams */}
            <div
              className="absolute left-0 top-0 bottom-0 w-8 sm:w-24 overflow-hidden flex items-end opacity-30 sm:opacity-40 mix-blend-screen"
              style={{ writingMode: "vertical-rl" }}
            >
              <DataStream isMobile={isMobile} />
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-8 sm:w-24 overflow-hidden flex items-start opacity-30 sm:opacity-40 mix-blend-screen"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              <DataStream isMobile={isMobile} />
            </div>
          </div>

          {/* Rotating HUD Background */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[400px] h-[90vw] max-h-[400px] sm:w-[600px] sm:h-[600px] opacity-20 pointer-events-none mix-blend-screen"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2 4" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="10 5" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="1 8" />
              <path d="M 50 2 L 50 15 M 50 85 L 50 98 M 2 50 L 15 50 M 85 50 L 98 50" stroke="#f59e0b" strokeWidth="1" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[300px] h-[80vw] max-h-[300px] sm:w-[450px] sm:h-[450px] opacity-30 pointer-events-none mix-blend-screen"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="1 10 5 10" />
            </svg>
          </motion.div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-4 sm:px-8">
            
            {/* Title Area */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                SPARK-A-THON
              </h1>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-4 mb-2" />
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-amber-400/80 uppercase">
                2026 EDITION
              </p>
            </motion.div>

            {/* Huge Progress Area */}
            <div className="flex flex-col items-center w-full my-6">
              <div className="relative flex items-center justify-center mb-6">
                <motion.span 
                  className="text-8xl sm:text-[120px] md:text-[150px] leading-none font-black font-mono text-white tracking-tighter tabular-nums"
                  style={{
                    textShadow: isGlitching 
                      ? "8px 0 #ef4444, -8px 0 #3b82f6" 
                      : "0 0 40px rgba(251,191,36,0.6)",
                    transform: isGlitching ? "skewX(-15deg)" : "none"
                  }}
                >
                  {progress}
                </motion.span>
                <span className="text-3xl sm:text-5xl font-bold font-mono text-amber-500 ml-2 mt-4 sm:mt-10">
                  %
                </span>
              </div>

              {/* Segmented Energy Cell Progress Bar */}
              <div className="w-full flex gap-1 h-3 sm:h-4">
                {Array.from({ length: 40 }).map((_, i) => {
                  const threshold = (i / 40) * 100;
                  const isActive = progress >= threshold;
                  const isHead = progress >= threshold && progress < ((i + 2) / 40) * 100;
                  
                  return (
                    <div 
                      key={i}
                      className={`flex-1 rounded-sm transition-all duration-75 ${
                        isActive 
                          ? isHead 
                            ? "bg-white shadow-[0_0_15px_#ffffff] scale-y-150" 
                            : "bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                          : "bg-neutral-900 border border-neutral-800"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Terminal Status Text */}
            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                <span className="font-mono text-xs sm:text-sm text-red-400 tracking-[0.3em]">
                  OVERRIDE PROTOCOL
                </span>
              </div>
              <div className="w-full max-w-sm border border-amber-500/30 bg-amber-500/10 p-3 flex justify-start items-center">
                <motion.span 
                  key={glitchText}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-mono text-xs sm:text-sm text-amber-300 tracking-widest font-bold"
                >
                  &gt; {glitchText}_
                </motion.span>
              </div>

              {/* Mobile Quick Enter Prompt */}
              {isMobile && (
                <p className="mt-4 font-mono text-xs text-amber-400/80 uppercase tracking-[0.25em] animate-pulse">
                  [ TAP ANYWHERE TO ENTER IMMEDIATELY ]
                </p>
              )}
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
