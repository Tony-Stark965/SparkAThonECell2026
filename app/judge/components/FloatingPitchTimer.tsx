"use client";

import { useState } from "react";
import { Clock, Play, Square, RotateCcw, ChevronRight, ChevronLeft, Minimize2, Maximize2 } from "lucide-react";
import type { useTeamTimer } from "@/lib/hooks/useTeamTimer";

interface FloatingPitchTimerProps {
  timer: ReturnType<typeof useTeamTimer>;
  isSubmitted?: boolean;
}

export function FloatingPitchTimer({ timer, isSubmitted = false }: FloatingPitchTimerProps) {
  // Mobile / compact collapse state so it never blocks rubric cards or score buttons
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    phaseFormattedTime,
    phaseRemaining,
    isPitch,
    isQa,
    isTimeEnded,
    isRunning,
    start,
    stop,
    reset,
    skipToQa,
    backToPitch,
  } = timer;

  // Visual feedback:
  // In Pitch: last 60s -> amber, < 10s -> red + pulse
  // In Q&A: last 30s -> amber, < 10s -> red + pulse
  // Ended: red
  let digitColorClass = "text-white";
  if (isTimeEnded) {
    digitColorClass = "text-red-500 font-black animate-pulse";
  } else if (isPitch) {
    if (phaseRemaining <= 10) {
      digitColorClass = "text-red-500 animate-pulse font-black";
    } else if (phaseRemaining <= 60) {
      digitColorClass = "text-amber-400 font-bold";
    } else {
      digitColorClass = "text-white font-bold";
    }
  } else if (isQa) {
    if (phaseRemaining <= 10) {
      digitColorClass = "text-red-500 animate-pulse font-black";
    } else if (phaseRemaining <= 30) {
      digitColorClass = "text-amber-400 font-bold";
    } else {
      digitColorClass = "text-amber-300 font-bold";
    }
  }

  // Active phase title label
  const phaseTitle = isTimeEnded
    ? "SESSION FINISHED"
    : isQa
    ? "Q&A CLOCK (2:00)"
    : "PITCH CLOCK (8:00)";

  return (
    <aside
      aria-label="Floating Pitch and Q&A Timer"
      className="fixed top-20 right-3 sm:right-6 z-50 pointer-events-auto select-none font-mono"
    >
      {/* COLLAPSED COMPACT PILL (Ideal for narrow screens & mobile) */}
      {isCollapsed ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-amber-500/40 bg-[#110f0c]/95 shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.12)] backdrop-blur-md">
          <Clock
            className={`w-4 h-4 shrink-0 ${isRunning ? "text-amber-400 animate-spin" : "text-neutral-400"}`}
            style={{ animationDuration: isRunning ? "3s" : undefined }}
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            {isTimeEnded ? "ENDED" : isQa ? "Q&A" : "PITCH"}
          </span>
          <span className={`text-base font-black tracking-widest ${digitColorClass}`}>
            {phaseFormattedTime}
          </span>

          {!isSubmitted && (
            <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
              {isRunning ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Pause timer"
                  className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  aria-label="Start timer"
                  className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand timer"
            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors ml-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* EXPANDED FULL TWO-PHASE FLOATING TIMER CARD */
        <div className="w-[280px] sm:w-[300px] rounded-2xl border border-amber-500/35 bg-[#110f0c]/95 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.1)] backdrop-blur-md p-4 transition-all">
          {/* Header Row: Phase Label + Minimize Toggle */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80 text-xs">
            <div className="flex items-center gap-2">
              <Clock
                className={`w-4 h-4 shrink-0 ${isRunning ? "text-amber-400 animate-spin" : "text-amber-400"}`}
                style={{ animationDuration: isRunning ? "3s" : undefined }}
              />
              <span className="font-bold tracking-wider text-amber-400 uppercase text-[11px]">
                {phaseTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse timer"
              className="text-neutral-500 hover:text-amber-400 transition-colors p-1 rounded-md hover:bg-neutral-900 cursor-pointer"
              title="Collapse to compact pill"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phase Sequence Indicator (PITCH & Q&A) */}
          <div className="grid grid-cols-2 gap-1.5 my-2.5 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[10px] font-bold uppercase text-center">
            <div
              className={`py-1 rounded-lg transition-all ${
                isPitch
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-black"
                  : isQa || isTimeEnded
                  ? "text-neutral-500 line-through"
                  : "text-neutral-500"
              }`}
            >
              1. PITCH (8:00)
            </div>
            <div
              className={`py-1 rounded-lg transition-all ${
                isQa
                  ? "bg-orange-500/25 text-orange-300 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)] font-black"
                  : isTimeEnded
                  ? "text-neutral-500 line-through"
                  : "text-neutral-500"
              }`}
            >
              2. Q&amp;A (2:00)
            </div>
          </div>

          {/* Large MM:SS Digits Display */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className={`text-4xl sm:text-5xl font-black tracking-widest ${digitColorClass}`}>
              {isSubmitted ? "SUBMITTED" : phaseFormattedTime}
            </div>

            {/* Sub-label alert indicator */}
            <div className="text-[10px] uppercase font-bold tracking-wider mt-1 text-center">
              {isTimeEnded ? (
                <span className="text-red-400 animate-pulse">EVALUATION TIME ENDED</span>
              ) : isQa ? (
                <span className="text-orange-400">JUDGES Q&amp;A IN PROGRESS</span>
              ) : isRunning ? (
                <span className="text-emerald-400">TEAM PITCH IN PROGRESS</span>
              ) : (
                <span className="text-neutral-500">TIMER STANDBY</span>
              )}
            </div>
          </div>

          {/* Controls: START (Green), STOP (Grey), RESET */}
          {!isSubmitted && (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {/* START Button: Green */}
                <button
                  type="button"
                  onClick={start}
                  disabled={isRunning}
                  aria-label="Start pitch timer"
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all font-black uppercase text-[11px] ${
                    isRunning
                      ? "bg-emerald-950/40 text-emerald-600 border border-emerald-900/30 opacity-40 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                  }`}
                >
                  <Play className={`w-3 h-3 ${isRunning ? "" : "fill-current"}`} />
                  <span>START</span>
                </button>

                {/* STOP Button: Grey */}
                <button
                  type="button"
                  onClick={stop}
                  disabled={!isRunning}
                  aria-label="Stop pitch timer"
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all font-black uppercase text-[11px] ${
                    !isRunning
                      ? "bg-neutral-900/40 text-neutral-600 border border-neutral-800/40 opacity-40 cursor-not-allowed"
                      : "bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 border border-neutral-700 cursor-pointer"
                  }`}
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>STOP</span>
                </button>

                {/* RESET Button */}
                <button
                  type="button"
                  onClick={() => reset()}
                  aria-label="Reset pitch timer"
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 hover:border-neutral-700 active:scale-95 text-neutral-300 transition-all font-bold uppercase text-[11px] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              </div>

              {/* Manual Phase Skip / Back Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px]">
                {isPitch && !isTimeEnded && (
                  <button
                    type="button"
                    onClick={skipToQa}
                    className="ml-auto inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                  >
                    <span>Skip to Q&amp;A</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}

                {(isQa || isTimeEnded) && (
                  <button
                    type="button"
                    onClick={backToPitch}
                    className="inline-flex items-center gap-1 text-neutral-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Back to Pitch</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
