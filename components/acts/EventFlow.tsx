"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SPARKATHON_CONFIG, EventFlowItem } from "@/config/sparkathon.config";

interface EventFlowProps {
  onNextAct?: () => void;
}

// --- SVG Icons Map ---
const getEventIcon = (id: string, isJudging: boolean) => {
  const baseClass = `w-4 h-4 sm:w-5 sm:h-5 ${isJudging ? 'text-amber-400' : 'text-neutral-400'}`;
  switch (id) {
    case "registration":
      return <svg className={baseClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case "inauguration":
      return <svg className={baseClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/></svg>;
    case "judging-1":
    case "judging-2":
      return <svg className={baseClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "lunch":
      return <svg className={baseClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
    case "valedictory":
      return <svg className={baseClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
    default:
      return <svg className={baseClass} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
  }
};

export function EventFlow({ onNextAct }: EventFlowProps) {
  const steps = SPARKATHON_CONFIG.eventFlow;
  const [activeStage, setActiveStage] = useState<number | null>(null);

  // Zero-lag mobile timeline observer
  useEffect(() => {
    // Only run intersection observer logic for mobile timeline items
    if (typeof window === "undefined") return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('mobile-timeline-visible');
          // Disconnect once revealed for 0 ongoing CPU load
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

    const items = document.querySelectorAll('.mobile-timeline-item, .desktop-timeline-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative z-30 w-full max-w-5xl mx-auto px-4 sm:px-8 py-2 sm:py-4 flex flex-col justify-between">
      {/* 1. Act Header */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT VII // THE FLOW
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
          EVENT TIMELINE
        </h2>

        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 font-medium uppercase max-w-md">
          Official chronological sequence charting the Spark-A-Thon frontier itinerary.
        </p>
      </div>

      {/* ========================================= */}
      {/* 2A. MOBILE-FIRST ZIGZAG TIMELINE (<640px) */}
      {/* ========================================= */}
      <div className="block sm:hidden relative w-full mt-10 mb-4 px-1">
        {/* Subtle background glow for timeline area */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15)_0%,transparent_70%)]" />
        
        {/* Central Spine */}
        <div className="absolute left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />

        <div className="space-y-8 relative z-10 flex flex-col items-center w-full">
          {steps.map((s: EventFlowItem, idx: number) => {
            const isEven = idx % 2 === 0;
            const isJudging = s.id.includes("judging");

            return (
              <div
                key={`mobile-${s.id}`}
                className="mobile-timeline-item group relative flex flex-col items-center w-full transition-all duration-500 ease-out translate-y-8 opacity-0 [&.mobile-timeline-visible]:translate-y-0 [&.mobile-timeline-visible]:opacity-100"
              >
                {/* Scroll Reveal Step 1: Glowing Node */}
                <div 
                  className={`z-20 h-5 w-5 rounded-full border-2 flex items-center justify-center mb-4 transition-all duration-700 delay-100 scale-50 opacity-0 group-[.mobile-timeline-visible]:scale-100 group-[.mobile-timeline-visible]:opacity-100
                    ${isJudging ? 'border-amber-400 bg-black shadow-[0_0_15px_rgba(251,191,36,0.9)] group-[.mobile-timeline-visible]:!scale-110' : 'border-neutral-500 bg-black group-hover:border-amber-500/70'}`}
                >
                  <div className={`h-2 w-2 rounded-full transition-colors duration-500 ${isJudging ? 'bg-amber-400' : 'bg-neutral-500 group-hover:bg-amber-500/70'}`} />
                </div>

                {/* Scroll Reveal Step 2: Event Card (Alternating) */}
                <div 
                  className={`w-full flex transition-all duration-700 delay-200 opacity-0 ${isEven ? '-translate-x-5 justify-start' : 'translate-x-5 justify-end'} group-[.mobile-timeline-visible]:translate-x-0 group-[.mobile-timeline-visible]:opacity-100`}
                >
                  {/* Card wrapper to strictly prevent overflow */}
                  <div className={`w-[88%] relative max-w-[300px] ${isEven ? 'pr-2' : 'pl-2'}`}>
                    
                    {/* Creative Connector Line connecting card to center spine */}
                    <svg className={`absolute -top-4 ${isEven ? 'right-0 translate-x-[40%]' : 'left-0 -translate-x-[40%]'} w-6 h-6 text-amber-500/30`} fill="none" viewBox="0 0 24 24" preserveAspectRatio="none">
                       <path d={isEven ? "M0,24 C12,24 12,0 24,0" : "M24,24 C12,24 12,0 0,0"} stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
                    </svg>

                    <div className={`p-4 rounded-xl border bg-black/95 md:bg-black/80 md:backdrop-blur-sm shadow-xl transition-all duration-500
                      ${isJudging ? 'border-amber-500/60 shadow-[0_5px_20px_rgba(251,191,36,0.15)] bg-gradient-to-b from-[#1a1305] to-black' : 'border-neutral-800/80 hover:border-neutral-600'}
                    `}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${isJudging ? 'bg-amber-500/10' : 'bg-neutral-900'}`}>
                            {getEventIcon(s.id, isJudging)}
                          </div>
                          <span className={`font-mono text-[11px] tracking-widest font-bold uppercase ${isJudging ? 'text-amber-400' : 'text-neutral-400'}`}>
                            {s.time}
                          </span>
                        </div>
                        <h3 className="text-white font-black text-[15px] uppercase leading-snug tracking-wide">
                          {s.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================= */}
      {/* 2B. DESKTOP ORIGINAL TIMELINE (>=640px)   */}
      {/* ========================================= */}
      <div className="hidden sm:block my-4 relative w-full max-w-3xl mx-auto">
        {/* Continuous Glowing Energy Conduit Spine */}
        <div
          className="absolute left-1/2 top-4 bottom-4 w-[2px] -translate-x-1/2"
          style={{
            background:
              "linear-gradient(180deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.85) 20%, rgba(245,158,11,0.85) 80%, rgba(245,158,11,0.2) 100%)",
            boxShadow: "0 0 12px rgba(251,191,36,0.45)",
          }}
          aria-hidden="true"
        />

        {/* Milestone Waypoints */}
        <div className="space-y-3.5">
          {steps.map((s: EventFlowItem, idx: number) => {
            const isEven = idx % 2 === 0;
            const isHovered = activeStage === idx;
            const isJudging = s.id.includes("judging");

            return (
              <div
                key={`desktop-${s.id}`}
                onMouseEnter={() => setActiveStage(idx)}
                onMouseLeave={() => setActiveStage(null)}
                className={`desktop-timeline-item relative flex flex-row items-center opacity-0 translate-y-6 transition-all duration-500 ease-out [&.mobile-timeline-visible]:opacity-100 [&.mobile-timeline-visible]:translate-y-0 ${isEven ? "flex-row-reverse" : ""}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                {/* Central / Left Energy Node */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                  <div
                    className={`h-6 w-6 rounded-full border transition-all duration-300 flex items-center justify-center bg-neutral-950 ${
                      isHovered || isJudging
                        ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.9)] scale-110"
                        : "border-amber-500/60 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        isHovered || isJudging ? "bg-amber-300" : "bg-amber-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Content Basalt Slab */}
                <div className={`w-[calc(50%-2rem)] ${isEven ? "text-right pr-8" : "text-left pl-8"}`}>
                  <div
                    className={`group relative rounded-xl border p-3.5 transition-all duration-300 bg-black/95 md:bg-transparent md:backdrop-blur-md overflow-hidden ${
                      isHovered || isJudging
                        ? "border-amber-500/80 bg-gradient-to-b from-[#161009]/95 via-[#0b0804]/98 to-black shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,140,0,0.18)] translate-y-[-2px]"
                        : "border-neutral-800/80 bg-gradient-to-b from-neutral-900/80 via-neutral-950/90 to-black/95 hover:border-neutral-700/90"
                    }`}
                  >
                    {/* Subtle corner highlight */}
                    <div
                      className={`pointer-events-none absolute top-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-transparent transition-opacity duration-300 ${
                        isEven ? "right-0" : "left-0"
                      } ${isHovered || isJudging ? "opacity-100" : "opacity-30"}`}
                    />

                    {/* Stage Number & Waypoint Tag */}
                    <div className={`flex items-center gap-2 mb-2 ${isEven ? "justify-end" : "justify-start"}`}>
                      <span className="font-mono text-xs font-bold text-amber-400/90 tracking-widest uppercase">
                        /{s.number}
                      </span>
                      <span className="font-mono text-xs text-neutral-300 uppercase tracking-wider">
                        • WAYPOINT {s.number}
                      </span>
                    </div>

                    {/* Official Stage Title */}
                    <div className={`flex items-center gap-3 mb-1 ${isEven ? "flex-row-reverse" : "flex-row"}`}>
                      {getEventIcon(s.id, isJudging || isHovered)}
                      <h3 className="text-lg font-black tracking-tight text-white uppercase leading-snug break-words">
                        {s.title}
                      </h3>
                    </div>

                    {/* Official Time Badge */}
                    <div
                      className={`mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-amber-500/30 font-mono text-sm tracking-wider font-semibold 
                        ${isJudging ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/10 text-amber-200'}
                        ${isEven ? "ml-auto" : ""}`}
                    >
                      <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span>{s.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Advance to FAQ CTA */}
      {onNextAct && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            onClick={onNextAct}
            className="group relative inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-neutral-300 hover:text-amber-300 uppercase py-2.5 px-6 rounded-full border border-neutral-800 hover:border-amber-500/50 bg-neutral-950/80 hover:bg-amber-500/10 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
          >
            <span>↓ HAVE QUESTIONS? VIEW FAQ</span>
          </button>
        </div>
      )}
    </div>
  );
}

