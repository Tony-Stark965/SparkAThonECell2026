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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth || 800);
    let height = (canvas.height = canvas.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 800;
      height = canvas.height = canvas.offsetHeight || 600;
    };
    window.addEventListener("resize", handleResize);

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const dustCount = isMobile ? 8 : 20;
    const emberCount = isMobile ? 4 : 14;
    const goldCount = isMobile ? 2 : 6;

    // 3 Volumetric Particle Layers: Distant micro-dust, Midground amber embers, Foreground gold drift
    const particles = [
      // Layer 1: Distant micro-dust (20 slow, tiny motes)
      ...Array.from({ length: dustCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -0.06 - Math.random() * 0.12,
        radius: 0.5 + Math.random() * 0.4,
        alpha: 0.05 + Math.random() * 0.10,
        baseAlpha: 0.05 + Math.random() * 0.10,
        pulseSpeed: 0.006 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
        type: "dust" as const,
      })),
      // Layer 2: Midground floating embers (14 warm amber motes)
      ...Array.from({ length: emberCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -0.14 - Math.random() * 0.18,
        radius: 1.0 + Math.random() * 0.6,
        alpha: 0.12 + Math.random() * 0.20,
        baseAlpha: 0.12 + Math.random() * 0.20,
        pulseSpeed: 0.010 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
        type: "ember" as const,
      })),
      // Layer 3: Foreground incandescent sparks (6 golden drift motes)
      ...Array.from({ length: goldCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.20,
        vy: -0.22 - Math.random() * 0.22,
        radius: 1.6 + Math.random() * 0.7,
        alpha: 0.25 + Math.random() * 0.35,
        baseAlpha: 0.25 + Math.random() * 0.35,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        type: "gold" as const,
      })),
    ];

    let frame = 0;
    let isIntersecting = false;
    let lastTime = 0;
    const frameInterval = isMobile ? 33 : 16;

    const render = (time: number) => {
      if (!isIntersecting) return;

      if (isMobile && time - lastTime < frameInterval - 2) {
        if (!prefersReducedMotion) {
          animId = requestAnimationFrame(render);
        }
        return;
      }
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      frame++;

      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.y += p.vy;
          p.x += Math.sin(frame * 0.012 + p.phase) * 0.2 + p.vx;

          if (p.y < -12) {
            p.y = height + 12;
            p.x = Math.random() * width;
          }
          if (p.x < -12) p.x = width + 12;
          if (p.x > width + 12) p.x = -12;

          p.alpha =
            p.baseAlpha + Math.sin(frame * p.pulseSpeed + p.phase) * 0.06;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.type === "gold") {
          ctx.fillStyle = `rgba(255, 215, 120, ${Math.max(0.06, Math.min(0.85, p.alpha * 1.3))})`;
        } else if (p.type === "ember") {
          ctx.fillStyle = `rgba(245, 158, 11, ${Math.max(0.04, Math.min(0.65, p.alpha))})`;
        } else {
          ctx.fillStyle = `rgba(170, 155, 140, ${Math.max(0.02, Math.min(0.35, p.alpha * 0.5))})`;
        }
        ctx.fill();
      }

      if (!prefersReducedMotion && isIntersecting) {
        animId = requestAnimationFrame(render);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasIntersecting = isIntersecting;
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && !wasIntersecting && !prefersReducedMotion) {
          animId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60 motion-reduce:hidden"
      aria-hidden="true"
    />
  );
}

/**
 * Architectural Subterranean Chamber Backdrop:
 * Wall structures, grand vaulted ceiling arches, and monumental left/right pylon colonnades.
 */
function TreasuryChamberBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-30 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Subterranean Ambient Depth & Volumetric Lighting */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(217, 119, 6, 0.12) 0%, rgba(146, 64, 14, 0.04) 45%, transparent 75%)",
        }}
      />

      {/* 2. Vertical Treasury Light Shaft behind Vault */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[420px] sm:w-[600px] opacity-40 blur-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.02) 60%, transparent 100%)",
        }}
      />

      {/* 3. Grand Vaulted Ceiling Archway (SVG Architectural Ribs) */}
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] sm:h-[520px] opacity-85 overflow-visible"
        viewBox="0 -80 1200 560"
        fill="none"
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <linearGradient id="tb-arch-stroke" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#b45309" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1c1917" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="tb-arch-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0a0806" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#1c140e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a0806" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="tb-rib-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Heavy Basalt Arch Keystones */}
        <path
          d="M 100 480 Q 600 -60 1100 480 L 1050 480 Q 600 -15 150 480 Z"
          fill="url(#tb-arch-fill)"
          stroke="url(#tb-arch-stroke)"
          strokeWidth="2.5"
        />

        {/* Outer Concentric Structural Rib */}
        <path
          d="M 170 480 Q 600 15 1030 480"
          stroke="url(#tb-arch-stroke)"
          strokeWidth="2"
          strokeDasharray="14 8"
        />

        {/* Inner Luminous Energy Conduit Arc */}
        <path
          d="M 250 480 Q 600 75 950 480"
          stroke="url(#tb-rib-glow)"
          strokeWidth="2"
          strokeDasharray="24 12"
        />

        {/* Keystone Crown Monument Accent at Apex */}
        <polygon
          points="575,-45 625,-45 635,5 565,5"
          fill="#1c140e"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <circle cx="600" cy="-5" r="4" fill="#fbbf24" filter="drop-shadow(0 0 8px #f59e0b)" />

        {/* Radial Basalt Struts linking inner and outer arches */}
        <line x1="360" y1="280" x2="310" y2="245" stroke="#b45309" strokeWidth="2" opacity="0.6" />
        <line x1="470" y1="175" x2="430" y2="135" stroke="#b45309" strokeWidth="2" opacity="0.6" />
        <line x1="730" y1="175" x2="770" y2="135" stroke="#b45309" strokeWidth="2" opacity="0.6" />
        <line x1="840" y1="280" x2="890" y2="245" stroke="#b45309" strokeWidth="2" opacity="0.6" />
      </svg>

      {/* 4. Left Monumental Pylon / Basalt Colonnade Structure */}
      <div className="absolute left-0 sm:left-4 md:left-8 lg:left-12 top-0 bottom-0 w-24 sm:w-36 md:w-44 flex flex-col justify-between py-8 opacity-70 sm:opacity-85 pointer-events-none">
        {/* Top Pylon Capital */}
        <div className="w-full border-r-2 border-amber-500/30 bg-gradient-to-r from-black via-[#120d09] to-[#1c140e] p-3 rounded-r-lg shadow-[4px_0_20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-1.5 text-amber-500/70 font-mono text-[8px] uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="hidden sm:inline">COLONNADE // L-01</span>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mt-2" />
        </div>

        {/* Mid Pylon Shaft with Glowing Amber Seam */}
        <div className="relative my-auto h-[48%] w-full border-r border-amber-500/25 bg-gradient-to-r from-black/90 to-[#0e0a07] flex flex-col items-end justify-around pr-2">
          {/* Vertical Glowing Energy Seam */}
          <motion.div
            animate={{ opacity: [0.35, 0.75, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(251,191,36,0.8)]"
          />
          {/* Stepped Basalt Chamfers */}
          <div className="h-8 w-3/4 border-r-2 border-amber-500/20 bg-neutral-900/60 rounded-sm" />
          <div className="h-8 w-1/2 border-r-2 border-amber-500/20 bg-neutral-900/60 rounded-sm" />
          <div className="h-8 w-3/4 border-r-2 border-amber-500/20 bg-neutral-900/60 rounded-sm" />
        </div>

        {/* Bottom Pylon Foundation */}
        <div className="w-full border-r-2 border-amber-500/30 bg-gradient-to-r from-black via-[#140f0a] to-[#1a130d] p-3 rounded-r-lg">
          <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest">
            SUB-BEDROCK
          </span>
        </div>
      </div>

      {/* 5. Right Monumental Pylon / Basalt Colonnade Structure */}
      <div className="absolute right-0 sm:right-4 md:right-8 lg:right-12 top-0 bottom-0 w-24 sm:w-36 md:w-44 flex flex-col justify-between py-8 opacity-70 sm:opacity-85 pointer-events-none">
        {/* Top Pylon Capital */}
        <div className="w-full border-l-2 border-amber-500/30 bg-gradient-to-l from-black via-[#120d09] to-[#1c140e] p-3 rounded-l-lg shadow-[-4px_0_20px_rgba(0,0,0,0.8)] flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-amber-500/70 font-mono text-[8px] uppercase tracking-widest">
            <span className="hidden sm:inline">COLONNADE // R-02</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="h-[1px] w-full bg-gradient-to-l from-transparent via-amber-500/40 to-transparent mt-2" />
        </div>

        {/* Mid Pylon Shaft with Glowing Amber Seam */}
        <div className="relative my-auto h-[48%] w-full border-l border-amber-500/25 bg-gradient-to-l from-black/90 to-[#0e0a07] flex flex-col items-start justify-around pl-2">
          {/* Vertical Glowing Energy Seam */}
          <motion.div
            animate={{ opacity: [0.35, 0.75, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-amber-400 to-transparent shadow-[0_0_10px_rgba(251,191,36,0.8)]"
          />
          {/* Stepped Basalt Chamfers */}
          <div className="h-8 w-3/4 border-l-2 border-amber-500/20 bg-neutral-900/60 rounded-sm" />
          <div className="h-8 w-1/2 border-l-2 border-amber-500/20 bg-neutral-900/60 rounded-sm" />
          <div className="h-8 w-3/4 border-l-2 border-amber-500/20 bg-neutral-900/60 rounded-sm" />
        </div>

        {/* Bottom Pylon Foundation */}
        <div className="w-full border-l-2 border-amber-500/30 bg-gradient-to-l from-black via-[#140f0a] to-[#1a130d] p-3 rounded-l-lg flex justify-end">
          <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest">
            PRESSURE: OK
          </span>
        </div>
      </div>
    </div>
  );
}

/** Stable 2-decimal rounding helper ensuring deterministic SVG geometry across SSR and client */
const roundCoord = (n: number): number => Math.round(n * 100) / 100;

/**
 * 2–3 Enormous Mechanical Rings Behind The Vault:
 * Centered directly behind the prize vault, these rings extend visibly around the vault's
 * left, right, and top edges with slow counter-rotations and glowing amber conduit tracks.
 */
function TreasuryMechanicalRings() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -z-20 flex items-center justify-center select-none"
      style={{ transform: "translate(-50%, calc(-50% + 28px))", perspective: 1200 }}
      aria-hidden="true"
    >
      {/* Central Volumetric Core Glow Behind Rings */}
      <div
        className="absolute w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] md:w-[620px] md:h-[620px] lg:w-[750px] lg:h-[750px] rounded-full blur-[25px] md:blur-[70px] opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(180, 83, 9, 0.12) 45%, transparent 70%)",
        }}
      />

      {/* RING 1: Enormous Outer Heavy Industrial Gear Ring (~880px diameter on desktop) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
        className="relative w-[320px] h-[320px] sm:w-[520px] sm:h-[520px] md:w-[720px] md:h-[720px] lg:w-[880px] lg:h-[880px] flex items-center justify-center"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 880 880"
          fill="none"
        >
          <defs>
            <linearGradient id="tb-ring1-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#291e14" />
              <stop offset="50%" stopColor="#140f0a" />
              <stop offset="100%" stopColor="#3b2b1d" />
            </linearGradient>
            <linearGradient id="tb-amber-glow-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Heavy Outer Basalt Ring Body */}
          <circle
            cx="440"
            cy="440"
            r="420"
            stroke="url(#tb-ring1-grad)"
            strokeWidth="20"
            opacity="0.85"
          />

          {/* Glowing Amber Seam & Notch Arcs */}
          <circle
            cx="440"
            cy="440"
            r="430"
            stroke="url(#tb-amber-glow-stroke)"
            strokeWidth="2"
            strokeDasharray="24 16 8 16"
            opacity="0.65"
          />
          <circle
            cx="440"
            cy="440"
            r="410"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeDasharray="60 40"
            opacity="0.5"
          />

          {/* 16 Industrial Outer Gear Teeth / Anchors */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad = (angle * Math.PI) / 180;
            const x = roundCoord(440 + Math.cos(rad) * 420);
            const y = roundCoord(440 + Math.sin(rad) * 420);
            return (
              <g key={i} transform={`translate(${x}, ${y}) rotate(${angle})`}>
                <rect
                  x="-8"
                  y="-16"
                  width="16"
                  height="12"
                  fill="#1c140d"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />
                <circle cx="0" cy="-10" r="2" fill="#fbbf24" opacity="0.8" />
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* RING 2: Middle Precision Astronomical / Calibrator Ring (~680px diameter, Counter-Rotating) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
        className="absolute w-[240px] h-[240px] sm:w-[400px] sm:h-[400px] md:w-[560px] md:h-[560px] lg:w-[680px] lg:h-[680px] flex items-center justify-center"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 680 680"
          fill="none"
        >
          {/* Dual Precision Tracks */}
          <circle
            cx="340"
            cy="340"
            r="325"
            stroke="#451a03"
            strokeWidth="2"
            opacity="0.7"
          />
          <circle
            cx="340"
            cy="340"
            r="310"
            stroke="#d97706"
            strokeWidth="2"
            strokeDasharray="6 18"
            opacity="0.75"
          />
          <circle
            cx="340"
            cy="340"
            r="295"
            stroke="#291e14"
            strokeWidth="12"
            opacity="0.85"
          />
          <circle
            cx="340"
            cy="340"
            r="288"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="4 24"
            opacity="0.6"
          />

          {/* 36 Fine Degree Markings */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 360) / 36;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 9 === 0;
            const len = isMajor ? 18 : 8;
            const cosVal = Math.cos(rad);
            const sinVal = Math.sin(rad);
            const x1 = roundCoord(340 + cosVal * (295 - len / 2));
            const y1 = roundCoord(340 + sinVal * (295 - len / 2));
            const x2 = roundCoord(340 + cosVal * (295 + len / 2));
            const y2 = roundCoord(340 + sinVal * (295 + len / 2));
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? "#fbbf24" : "#78350f"}
                strokeWidth={isMajor ? 2 : 1}
                opacity={isMajor ? 0.9 : 0.5}
              />
            );
          })}

          {/* 4 Cardinal Focusing Apertures */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = roundCoord(340 + Math.cos(rad) * 325);
            const cy = roundCoord(340 + Math.sin(rad) * 325);
            return (
              <g key={deg}>
                <circle cx={cx} cy={cy} r="7" fill="#0c0a09" stroke="#d97706" strokeWidth="1.5" />
                <circle cx={cx} cy={cy} r="3" fill="#fbbf24" />
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* RING 3: Inner Gimbal Focus Core (~500px diameter, Rotating Smoothly) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] md:w-[420px] md:h-[420px] lg:w-[500px] lg:h-[500px] flex items-center justify-center"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 500 500"
          fill="none"
        >
          {/* Octagonal Structural Gimbal */}
          <polygon
            points="210,25 290,25 475,210 475,290 290,475 210,475 25,290 25,210"
            stroke="#78350f"
            strokeWidth="2"
            fill="#0f0c08"
            fillOpacity="0.4"
          />

          <circle
            cx="250"
            cy="250"
            r="215"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="40 10 20 10"
            opacity="0.65"
          />

          {/* 8 Amber Energy Node Nodes */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            const rad = (angle * Math.PI) / 180;
            const nx = roundCoord(250 + Math.cos(rad) * 215);
            const ny = roundCoord(250 + Math.sin(rad) * 215);
            return (
              <g key={i}>
                <circle cx={nx} cy={ny} r="4" fill="#fbbf24" />
                <circle cx={nx} cy={ny} r="8" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
              </g>
            );
          })}
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * Floating Basalt Fragments:
 * 8 faceted polygonal obsidian shards drifting gently around the outer perimeter of the chamber
 * with distinct amber rim-lighting highlights.
 */
function FloatingBasaltFragments() {
  const fragments = [
    // 1. Upper Left Shard
    {
      className: "left-[5%] sm:left-[8%] top-[12%] sm:top-[16%]",
      w: 68,
      h: 68,
      poly1: "34,4 62,26 48,64 12,52 6,24",
      poly2: "34,4 48,64 12,52",
      rim: "M 34 4 L 62 26 L 48 64",
      yDrift: [-7, 7, -7],
      rotDrift: [12, 18, 12],
      dur: 6.4,
      delay: 0,
    },
    // 2. Mid Left Boulder
    {
      className: "left-[8%] sm:left-[11%] top-[46%] sm:top-[50%]",
      w: 84,
      h: 84,
      poly1: "14,12 68,8 78,66 28,78 6,42",
      poly2: "14,12 78,66 28,78",
      rim: "M 68 8 L 78 66 L 28 78",
      yDrift: [8, -8, 8],
      rotDrift: [-14, -8, -14],
      dur: 7.6,
      delay: 1.2,
    },
    // 3. Lower Left Shard
    {
      className: "left-[6%] sm:left-[10%] bottom-[12%] sm:bottom-[16%]",
      w: 56,
      h: 56,
      poly1: "28,6 52,48 8,50",
      poly2: "28,6 52,48 30,42",
      rim: "M 28 6 L 52 48",
      yDrift: [-6, 6, -6],
      rotDrift: [32, 40, 32],
      dur: 5.8,
      delay: 2.5,
    },
    // 4. Upper Right Shard
    {
      className: "right-[5%] sm:right-[8%] top-[10%] sm:top-[14%]",
      w: 74,
      h: 74,
      poly1: "37,6 68,34 52,68 18,60 8,24",
      poly2: "37,6 52,68 18,60",
      rim: "M 37 6 L 8 24 L 18 60",
      yDrift: [7, -7, 7],
      rotDrift: [-18, -12, -18],
      dur: 7.2,
      delay: 0.8,
    },
    // 5. Mid Right Heavy Fragment
    {
      className: "right-[7%] sm:right-[11%] top-[48%] sm:top-[52%]",
      w: 88,
      h: 88,
      poly1: "18,14 74,10 82,70 34,82 10,48",
      poly2: "18,14 82,70 34,82",
      rim: "M 18 14 L 74 10 L 82 70",
      yDrift: [-9, 9, -9],
      rotDrift: [18, 24, 18],
      dur: 8.2,
      delay: 1.8,
    },
    // 6. Lower Right Shard
    {
      className: "right-[6%] sm:right-[10%] bottom-[10%] sm:bottom-[14%]",
      w: 52,
      h: 52,
      poly1: "26,4 48,46 6,44",
      poly2: "26,4 48,46 28,38",
      rim: "M 26 4 L 48 46",
      yDrift: [5, -5, 5],
      rotDrift: [-24, -18, -24],
      dur: 6.1,
      delay: 3.1,
    },
    // 7. Top Center-Left Hovering Keystone
    {
      className: "left-[24%] sm:left-[28%] top-[6%] sm:top-[8%]",
      w: 48,
      h: 48,
      poly1: "24,4 44,22 36,44 8,36",
      poly2: "24,4 36,44 8,36",
      rim: "M 24 4 L 44 22",
      yDrift: [-5, 5, -5],
      rotDrift: [42, 48, 42],
      dur: 5.5,
      delay: 0.5,
    },
    // 8. Top Center-Right Hovering Keystone
    {
      className: "right-[24%] sm:right-[28%] top-[7%] sm:top-[9%]",
      w: 46,
      h: 46,
      poly1: "23,4 42,20 34,42 8,34",
      poly2: "23,4 34,42 8,34",
      rim: "M 23 4 L 8 34",
      yDrift: [6, -6, 6],
      rotDrift: [-34, -26, -34],
      dur: 6.7,
      delay: 2.1,
    },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {fragments.map((frag, idx) => (
        <motion.div
          key={idx}
          animate={{
            y: frag.yDrift,
            rotate: frag.rotDrift,
          }}
          transition={{
            duration: frag.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: frag.delay,
          }}
          className={`absolute ${frag.className} drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]`}
          style={{ width: frag.w, height: frag.h }}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${frag.w} ${frag.h}`}
            fill="none"
          >
            {/* Primary Dark Basalt Silhouette */}
            <polygon
              points={frag.poly1}
              fill="#140f0a"
              stroke="#2e2115"
              strokeWidth="1.5"
            />
            {/* Shaded Facet */}
            <polygon
              points={frag.poly2}
              fill="#1d1610"
              opacity="0.8"
            />
            {/* Amber Rim Light Highlight */}
            <path
              d={frag.rim}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export function TheBounty({ onNextAct }: TheBountyProps) {
  // Vault door state: unsealed by default to prominently display the ₹15,000 cash prize pool focal point
  const [isUnsealed, setIsUnsealed] = useState(true);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lightPos, setLightPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const vaultRef = useRef<HTMLDivElement | null>(null);

  // Subtle interactive 3D perspective tracking (Restrained ±2.5 deg tilt)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = vaultRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const rotX = -(relY - 0.5) * 4.5;
    const rotY = (relX - 0.5) * 4.5;
    setTilt({ x: rotX, y: rotY });
    setLightPos({ x: relX * 100, y: relY * 100 });
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="relative z-30 w-full overflow-hidden px-4 sm:px-8 py-2 sm:py-4 flex flex-col justify-between items-center text-center">
      {/* 1. Subterranean Treasury Chamber Backdrop (Arches, Wall Shapes, Monumental Pylons) */}
      <TreasuryChamberBackdrop />

      {/* 2. Floating Basalt Fragments with Amber Rim Highlights */}
      <FloatingBasaltFragments />

      {/* 3. Background Subtle Atmosphere Canvas (Micro-embers & basalt dust) */}
      <VaultAtmosphereCanvas />

      {/* 4. Act Header */}
      <div className="relative z-30 flex flex-col items-center px-6 py-3 rounded-2xl bg-black/45 backdrop-blur-[3px] border border-amber-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
        <div className="inline-flex items-center gap-2.5 mb-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-[10px] sm:text-xs tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT VI // THE BOUNTY
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,1)]">
          OFFICIAL PRIZE VAULT
        </h2>

        <p className="mt-1.5 font-mono text-[11px] sm:text-xs tracking-wider text-neutral-300 uppercase max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          Subterranean treasury unsealed for the builders of the next frontier.
        </p>
      </div>

      {/* 5. Subterranean Vault Bulkhead Frame with 3D Depth & Tilt Parallax */}
      <div
        className="relative z-20 my-auto w-full max-w-2xl mt-3 sm:mt-4"
        style={{ perspective: 1100 }}
      >
        {/* Enormous Mechanical Concentric Rings directly behind the Vault */}
        <TreasuryMechanicalRings />
        {/* Exterior Atmospheric Ambient Pulse */}
        <motion.div
          animate={{
            opacity: isUnsealed ? [0.18, 0.28, 0.18] : [0.08, 0.16, 0.08],
            scale: [0.98, 1.015, 0.98],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[82%] rounded-full blur-[30px] md:blur-[90px] motion-reduce:animate-none"
          style={{
            background: isUnsealed
              ? "radial-gradient(circle, rgba(255, 150, 0, 0.45) 0%, rgba(200, 60, 0, 0.12) 50%, transparent 80%)"
              : "radial-gradient(circle, rgba(255, 90, 0, 0.15) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Flanking Mechanical Locking Gears (Desktop 3D Industrial Depth) */}
        <div className="hidden md:block pointer-events-none absolute -left-7 top-1/2 -translate-y-1/2 -z-10 opacity-35">
          <motion.div
            animate={{ rotate: isUnsealed ? 360 : 0 }}
            transition={{
              duration: isUnsealed ? 50 : 0,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-16 h-16 rounded-full border border-dashed border-amber-500/50 flex items-center justify-center bg-black/40"
          >
            <div className="w-9 h-9 rounded-full border border-neutral-700 bg-neutral-950/80 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
          </motion.div>
        </div>

        <div className="hidden md:block pointer-events-none absolute -right-7 top-1/2 -translate-y-1/2 -z-10 opacity-35">
          <motion.div
            animate={{ rotate: isUnsealed ? -360 : 0 }}
            transition={{
              duration: isUnsealed ? 50 : 0,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-16 h-16 rounded-full border border-dashed border-amber-500/50 flex items-center justify-center bg-black/40"
          >
            <div className="w-9 h-9 rounded-full border border-neutral-700 bg-neutral-950/80 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
          </motion.div>
        </div>

        {/* Industrial Vault Monolith Outer Chassis (Responds to Pointer with 3D Depth) */}
        <div
          ref={vaultRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#070709] p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Dynamic Specular Sheen following cursor/touch */}
          <div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 motion-reduce:hidden"
            style={{
              opacity: isHovered ? 0.7 : 0.25,
              background: `radial-gradient(circle 350px at ${lightPos.x}% ${lightPos.y}%, rgba(255, 180, 50, 0.10), transparent 70%)`,
            }}
            aria-hidden="true"
          />

          {/* Slow Ambient Diagonal Light Sweep across Obsidian Frame */}
          <motion.div
            animate={{
              x: ["-120%", "220%"],
            }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              repeatDelay: 4.5,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-0 z-10 opacity-20 motion-reduce:hidden"
            style={{
              background:
                "linear-gradient(115deg, transparent 35%, rgba(255, 180, 50, 0.08) 50%, transparent 65%)",
            }}
            aria-hidden="true"
          />

          {/* Top Chassis Telemetry Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/90 font-mono text-[9px] sm:text-[10px] text-neutral-400 tracking-wider">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full transition-colors duration-500 ${
                  isUnsealed ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" : "bg-neutral-600"
                }`}
              />
              <span className="text-neutral-300 font-semibold uppercase whitespace-nowrap">
                VAULT-ID // VT-2026-ALPHA
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <span className="text-neutral-500">LOCK: TUNGSTEN HYDRAULIC</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-neutral-800/80 bg-black/60">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] text-amber-300 font-bold tracking-wider uppercase">
                  ENERGY SEALED
                </span>
              </div>
              <span className="text-amber-500/90 font-semibold">
                {isUnsealed ? "STATUS: UNSEALED" : "STATUS: LOCKED"}
              </span>
            </div>

            <button
              onClick={() => setIsUnsealed(!isUnsealed)}
              className="px-2 py-0.5 rounded border border-neutral-800 hover:border-amber-500/60 bg-neutral-900/90 hover:bg-amber-500/10 text-neutral-300 hover:text-amber-300 transition-colors uppercase text-[9px] tracking-widest font-mono cursor-pointer"
            >
              {isUnsealed ? "SEAL VAULT" : "UNSEAL"}
            </button>
          </div>

          {/* Core Vault Chamber */}
          <div className="relative w-full min-h-[270px] sm:min-h-[310px] rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#060503]/98 to-black p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.95)]">
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
            <motion.div
              animate={{
                opacity: isUnsealed ? [0.65, 0.95, 0.65] : [0.25, 0.45, 0.25],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(255,160,0,0.8)]"
            />
            <motion.div
              animate={{
                opacity: isUnsealed ? [0.65, 0.95, 0.65] : [0.25, 0.45, 0.25],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.2,
              }}
              className="pointer-events-none absolute inset-x-8 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(255,160,0,0.8)]"
            />

            {/* Micro Hydraulic Seam Sparks */}
            <motion.span
              className="pointer-events-none absolute left-1/4 top-0 h-1 w-1 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)] motion-reduce:hidden"
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0, 1.4, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatDelay: 6.2,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            />
            <motion.span
              className="pointer-events-none absolute right-1/3 bottom-0 h-1 w-1 translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)] motion-reduce:hidden"
              animate={{
                opacity: [0, 0.85, 0],
                scale: [0, 1.3, 0],
              }}
              transition={{
                duration: 1.0,
                repeat: Infinity,
                repeatDelay: 8.5,
                delay: 3.0,
                ease: "easeInOut",
              }}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold shadow-[0_0_15px_rgba(255,160,0,0.15)]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{SPARKATHON_CONFIG.bounty.label}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              </div>

              {/* Dominant ₹15,000 Currency Display */}
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-neutral-950/80 text-neutral-200 font-mono text-[10px] sm:text-[11px] tracking-wider uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  <span>CONFIRMED POOL ALLOCATION</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 text-neutral-400 font-mono text-[10px] sm:text-[11px] tracking-wider uppercase">
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
                <div className="flex items-center justify-between text-neutral-600 font-mono text-[8px] uppercase tracking-widest">
                  <span>BLAST-PLATE // L-01</span>
                  <span>HEAVY OBSIDIAN</span>
                </div>

                {/* Industrial Hazard Cross-Hatch */}
                <div className="flex flex-col gap-1 opacity-20 my-auto">
                  <div className="h-[2px] w-full bg-amber-500" />
                  <div className="h-[1px] w-3/4 bg-amber-500" />
                  <div className="h-[1px] w-1/2 bg-amber-500" />
                </div>

                <div className="flex items-center gap-1.5 text-amber-500/70 font-mono text-[9px] uppercase tracking-wider">
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
                <div className="flex items-center justify-between text-neutral-600 font-mono text-[8px] uppercase tracking-widest">
                  <span>TUNGSTEN CORE</span>
                  <span>BLAST-PLATE // R-02</span>
                </div>

                {/* Industrial Hazard Cross-Hatch */}
                <div className="flex flex-col items-end gap-1 opacity-20 my-auto">
                  <div className="h-[2px] w-full bg-amber-500" />
                  <div className="h-[1px] w-3/4 bg-amber-500" />
                  <div className="h-[1px] w-1/2 bg-amber-500" />
                </div>

                <div className="flex items-center justify-end gap-1.5 text-amber-500/70 font-mono text-[9px] uppercase tracking-wider">
                  <span>HYDRAULIC RELEASE</span>
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Chassis Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/90 font-mono text-[9px] sm:text-[10px] text-neutral-500 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">CHAMBER ATMOSPHERE:</span>
              <span className="text-amber-400/90">INERT // PRESSURIZED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">DISBURSEMENT:</span>
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
          <span className="font-mono text-[10px] tracking-wider text-neutral-500 uppercase">
            STAGE 01 // REGISTRATION → STAGE 05 // VALEDICTORY
          </span>
        </div>
      )}
    </div>
  );
}

