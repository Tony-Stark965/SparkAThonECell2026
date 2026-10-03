"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Timer, Loader2, AlertTriangle, X, Check, Lock } from "lucide-react";
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isSubmitted = teamStatus === "submitted";

  const timer = useTeamTimer(teamId, {
    isSubmitted,
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

  const {
    formattedTime,
    isRunning,
    isWarning,
    isCritical,
    isTimeUp,
    progressPercent,
  } = timer;

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    timer.reset();
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        isTimeUp
          ? "border-red-500/60 bg-red-950/25 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          : isCritical
          ? "border-red-500/50 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.12)]"
          : isWarning
          ? "border-orange-500/50 bg-orange-950/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
          : isRunning
          ? "border-amber-500/40 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
          : "border-neutral-800/80 bg-neutral-950/60"
      } ${compact ? "p-3" : "p-4 sm:p-5"}`}
    >
      {/* Header with Label & Time Display */}
      <div className="flex items-center justify-between gap-2 mb-2 font-mono">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Timer
            className={`w-3.5 h-3.5 ${
              isRunning
                ? "text-amber-400 animate-spin"
                : isTimeUp || isCritical
                ? "text-red-400"
                : isWarning
                ? "text-orange-400"
                : "text-neutral-500"
            }`}
            style={{ animationDuration: isRunning ? "3s" : undefined }}
          />
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
            PITCH TIMER (10:00)
          </span>
          {isRunning && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>

        {/* Phase Badge & Time Readout */}
        <div className="flex items-center gap-2">
          {isTimeUp ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/50 text-red-400 border border-red-500/40 animate-pulse">
              TIME UP
            </span>
          ) : isCritical ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/50 text-red-400 border border-red-500/40 animate-pulse">
              FINAL MINUTE
            </span>
          ) : isWarning ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-950/50 text-orange-400 border border-orange-500/40">
              WARNING
            </span>
          ) : isRunning ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/50 text-amber-400 border border-amber-500/40">
              ACTIVE
            </span>
          ) : null}

          <div
            className={`font-mono text-sm sm:text-base font-black tracking-widest ${
              isTimeUp
                ? "text-red-400 animate-pulse"
                : isCritical
                ? "text-red-400 font-black"
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
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-900/90 rounded-full h-1.5 overflow-hidden mb-3 border border-neutral-800/60">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isTimeUp
              ? "bg-red-500"
              : isCritical
              ? "bg-gradient-to-r from-red-600 to-red-400"
              : isWarning
              ? "bg-gradient-to-r from-amber-500 to-orange-400"
              : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Control Buttons: START, STOP, RESET or SESSION LOCKED */}
      {isSubmitted ? (
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 font-mono text-[11px] font-bold">
          <Lock className="w-3 h-3" />
          <span>SESSION LOCKED</span>
        </div>
      ) : (
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

          {/* STOP / PAUSE Button */}
          <button
            type="button"
            onClick={() => timer.stop()}
            disabled={!isRunning || isProcessing}
            aria-label="Pause presentation timer"
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
              !isRunning
                ? "bg-neutral-900/50 border-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed"
                : "bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40 hover:border-amber-500/70 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)] active:scale-95"
            }`}
          >
            <Pause className="w-3 h-3 fill-current" />
            <span>PAUSE</span>
          </button>

          {/* RESET Button (Opens Confirmation Modal) */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isProcessing}
            aria-label="Reset presentation timer"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && !isSubmitted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowResetConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-timer-dialog-title"
        >
          <div
            className="w-full max-w-sm bg-[#12100d] border border-amber-500/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(245,158,11,0.15)] space-y-4 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="reset-timer-dialog-title" className="font-bold text-white text-sm uppercase">
                  RESET JUDGING TIMER?
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  This will reset the 10-minute presentation countdown back to 10:00 for this squad session.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>CANCEL</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>RESET TIMER</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
