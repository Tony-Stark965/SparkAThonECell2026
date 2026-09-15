"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SPARKATHON_CONFIG, EventFlowItem } from "@/config/sparkathon.config";

interface EventFlowProps {
  onNextAct?: () => void;
}

export function EventFlow({ onNextAct }: EventFlowProps) {
  const steps = SPARKATHON_CONFIG.eventFlow;
  const [activeStage, setActiveStage] = useState<number | null>(null);

  return (
    <div className="relative z-30 w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col justify-between min-h-[88vh]">
      {/* 1. Act Header */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-[10px] sm:text-xs tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT VII // THE FLOW
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
          EXPEDITION TIMELINE
        </h2>

        <p className="mt-2 font-mono text-[11px] sm:text-xs tracking-wider text-neutral-400 uppercase max-w-md">
          Official chronological sequence charting the Spark-A-Thon frontier itinerary.
        </p>
      </div>

      {/* 2. Cinematic Amber Conduit Timeline */}
      <div className="my-8 sm:my-12 relative w-full max-w-3xl mx-auto">
        {/* Continuous Glowing Energy Conduit Spine */}
        <div
          className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-[2px] sm:-translate-x-1/2"
          style={{
            background:
              "linear-gradient(180deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.85) 20%, rgba(245,158,11,0.85) 80%, rgba(245,158,11,0.2) 100%)",
            boxShadow: "0 0 12px rgba(251,191,36,0.45)",
          }}
          aria-hidden="true"
        />

        {/* Milestone Waypoints */}
        <div className="space-y-6 sm:space-y-10">
          {steps.map((s: EventFlowItem, idx: number) => {
            const isEven = idx % 2 === 0;
            const isHovered = activeStage === idx;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                onMouseEnter={() => setActiveStage(idx)}
                onMouseLeave={() => setActiveStage(null)}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center ${
                  isEven ? "sm:flex-row-reverse" : ""
                }`}
              >
                {/* Central / Left Energy Node */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 top-5 sm:top-auto z-10 flex items-center justify-center">
                  <div
                    className={`h-6 w-6 rounded-full border transition-all duration-300 flex items-center justify-center bg-neutral-950 ${
                      isHovered
                        ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.9)] scale-110"
                        : "border-amber-500/60 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        isHovered ? "bg-amber-300" : "bg-amber-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Content Basalt Slab */}
                <div
                  className={`w-full sm:w-[calc(50%-2rem)] pl-12 sm:pl-0 ${
                    isEven ? "sm:text-right sm:pr-8" : "sm:text-left sm:pl-8"
                  }`}
                >
                  <div
                    className={`group relative rounded-xl border p-4 sm:p-5 transition-all duration-300 backdrop-blur-md overflow-hidden ${
                      isHovered
                        ? "border-amber-500/80 bg-gradient-to-b from-[#161009]/95 via-[#0b0804]/98 to-black shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,140,0,0.18)] translate-y-[-2px]"
                        : "border-neutral-800/80 bg-gradient-to-b from-neutral-900/80 via-neutral-950/90 to-black/95 hover:border-neutral-700/90"
                    }`}
                  >
                    {/* Subtle corner highlight */}
                    <div
                      className={`pointer-events-none absolute top-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-transparent transition-opacity duration-300 ${
                        isEven ? "right-0" : "left-0"
                      } ${isHovered ? "opacity-100" : "opacity-30"}`}
                    />

                    {/* Stage Number & Waypoint Tag */}
                    <div
                      className={`flex items-center gap-2 mb-2 ${
                        isEven ? "sm:justify-end" : "sm:justify-start"
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-amber-400/90 tracking-widest uppercase">
                        /{s.number}
                      </span>
                      <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">
                        • WAYPOINT {s.number}
                      </span>
                    </div>

                    {/* Official Stage Title */}
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase leading-snug">
                      {s.title}
                    </h3>

                    {/* Official Time Badge */}
                    <div
                      className={`mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 font-mono text-[11px] sm:text-xs text-amber-200 tracking-wider font-semibold ${
                        isEven ? "sm:ml-auto" : ""
                      }`}
                    >
                      <svg
                        className="h-3 w-3 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{s.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Advance to Official Portal CTA */}
      {onNextAct && (
        <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
          <button
            onClick={onNextAct}
            className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-neutral-800 hover:border-amber-400 bg-neutral-950/80 hover:bg-amber-500/10 font-mono text-xs tracking-[0.25em] text-neutral-300 hover:text-amber-300 uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
          >
            <span>ENTER THE PORTAL</span>
            <span className="transition-transform duration-300 group-hover:translate-y-0.5 text-amber-400">
              ↓
            </span>
          </button>
          <span className="font-mono text-[10px] tracking-wider text-neutral-500 uppercase">
            ACT VIII // THE PORTAL • FINAL FRONTIER DESTINATION
          </span>
        </div>
      )}
    </div>
  );
}

