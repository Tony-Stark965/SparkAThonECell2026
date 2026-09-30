"use client";

import { useState } from "react";
import { Play, Square, RotateCcw, Timer, Loader2 } from "lucide-react";
import { useTeamTimer } from "@/lib/hooks/useTeamTimer";

interface TeamTimerWidgetProps {
  teamId: string;
  teamStatus?: "standby" | "in_progress" | "submitted";
  onStatusChange?: (newStatus: "standby" | "in_progress" | "submitted") => void;
  compact?: boolean;
}

export function TeamTimerWidget({
  teamId,
  teamStatus,
  onStatusChange,
  compact = false,
}: TeamTimerWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const timer = useTeamTimer(teamId, {
    onStart: async () => {
      // If team is in standby, initiate judging session on server
      if (teamStatus === "standby") {
        try {
          setIsProcessing(true);
          const res = await fetch(`/api/judge/teams/${teamId}/start`, { method: "POST" });
          if (res.ok) {
            onStatusChange?.("in_progress");
          }
        } catch (err) {
          console.error("Failed to start session:", err);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    onReset: async () => {
      // If session was in progress, reset session back to standby on server
      if (teamStatus === "in_progress") {
        try {
          setIsProcessing(true);
          const res = await fetch(`/api/judge/teams/${teamId}/reset`, { method: "POST" });
          if (res.ok) {
            onStatusChange?.("standby");
          }
        } catch (err) {
          console.error("Failed to reset session:", err);
        } finally {
          setIsProcessing(false);
        }
      }
    },
  });

  const { secondsRemaining, formattedTime, isRunning, isComplete, isWarning } = timer;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isRunning
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
          : isComplete
          ? "border-red-500/40 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          : "border-neutral-800/80 bg-neutral-950/60"
      } ${compact ? "p-2.5" : "p-3 sm:p-4"}`}
    >
      {/* Header with Label & Time Display */}
      <div className="flex items-center justify-between gap-2 mb-2 font-mono">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Timer
            className={`w-3.5 h-3.5 ${
              isRunning
                ? "text-amber-400 animate-spin"
                : isComplete
                ? "text-red-400"
                : "text-neutral-500"
            }`}
            style={{ animationDuration: "3s" }}
          />
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
            PITCH TIMER
          </span>
          {isRunning && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>

        <div
          className={`font-mono text-sm sm:text-base font-black tracking-widest ${
            isComplete
              ? "text-red-400 animate-pulse"
              : isWarning
              ? "text-orange-400"
              : isRunning
              ? "text-amber-400"
              : "text-neutral-200"
          }`}
        >
          {formattedTime}
        </div>
      </div>

      {/* Control Buttons: START, STOP, RESET */}
      <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] font-bold">
        {/* START Button */}
        <button
          type="button"
          onClick={() => timer.start()}
          disabled={isRunning || isProcessing}
          aria-label="Start presentation timer"
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
            isRunning
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-default"
              : "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.15)] active:scale-95"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className={`w-3 h-3 ${isRunning ? "fill-current" : ""}`} />
          )}
          <span>{isRunning ? "RUNNING" : "START"}</span>
        </button>

        {/* STOP Button */}
        <button
          type="button"
          onClick={() => timer.stop()}
          disabled={!isRunning || isProcessing}
          aria-label="Stop presentation timer"
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
            !isRunning
              ? "bg-neutral-900/50 border-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed"
              : "bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40 hover:border-amber-500/70 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)] active:scale-95"
          }`}
        >
          <Square className="w-2.5 h-2.5 fill-current" />
          <span>STOP</span>
        </button>

        {/* RESET Button */}
        <button
          type="button"
          onClick={() => timer.reset()}
          disabled={isProcessing}
          aria-label="Reset presentation timer"
          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3 h-3" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
}
