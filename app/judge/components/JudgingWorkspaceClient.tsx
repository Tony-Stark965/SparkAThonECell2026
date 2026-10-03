"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JudgeTeamDossier } from "@/lib/supabase/judge";
import {
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Play,
  Square,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useTeamTimer } from "@/lib/hooks/useTeamTimer";

interface JudgingWorkspaceClientProps {
  initialDossier: JudgeTeamDossier;
}

export function JudgingWorkspaceClient({
  initialDossier,
}: JudgingWorkspaceClientProps) {
  const router = useRouter();
  const { team, judge, rubrics } = initialDossier;

  // Evaluation state
  const [evaluation, setEvaluation] = useState(initialDossier.evaluation);
  const isSubmitted = evaluation.status === "submitted";

  // Score state: rubric_id -> number
  const [scores, setScores] = useState<Record<string, number>>(
    initialDossier.scores || {}
  );
  // Feedback state
  const [feedback, setFeedback] = useState(evaluation.feedback || "");

  // Autosave and UI states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Unsaved changes tracker for debouncing
  const hasUnsavedChanges = useRef(false);
  const latestScoresRef = useRef(scores);
  const latestFeedbackRef = useRef(feedback);

  useEffect(() => {
    latestScoresRef.current = scores;
    latestFeedbackRef.current = feedback;
  }, [scores, feedback]);

  // Max possible score (5 criteria * 10 = 50)
  const maxPossibleScore =
    rubrics.reduce((sum, r) => sum + (Number(r.max_score) || 10), 0) || 50;

  // Live total calculation on client (authoritatively recomputed on server)
  const clientLiveTotal = Object.entries(scores).reduce((sum, [rId, val]) => {
    if (rubrics.some((r) => r.id === rId)) {
      return sum + (Number(val) || 0);
    }
    return sum;
  }, 0);

  // Unified 10-Minute Presentation Timer with Start / Stop / Reset controls
  // Phase 1: Pitch (8 min, 08:00 -> 00:00, Amber theme)
  // Phase 2: Q&A (2 min, 02:00 -> 00:00, Electric Cyan theme)
  // End of Session: 00:00 TIME ENDED + single device vibration (no vibration at 8m)
  const timer = useTeamTimer(team.id, {
    initialStartedAt: evaluation.started_at,
    isSubmitted,
    onStart: async () => {
      if (!isSubmitted && !evaluation.started_at) {
        try {
          const res = await fetch(`/api/judge/teams/${team.id}/start`, { method: "POST" });
          const data = await res.json();
          if (data.success && data.evaluation) {
            setEvaluation(data.evaluation);
          }
        } catch (err) {
          console.error("Error starting judging session:", err);
        }
      }
    },
    onReset: async () => {
      if (!isSubmitted && evaluation.status === "in_progress") {
        try {
          const res = await fetch(`/api/judge/teams/${team.id}/reset`, { method: "POST" });
          const data = await res.json();
          if (data.success) {
            setEvaluation((prev) => ({
              ...prev,
              status: "draft",
              started_at: null,
            }));
          }
        } catch (err) {
          console.error("Error resetting judging session:", err);
        }
      }
    },
  });

  const {
    phaseFormattedTime,
    isRunning,
    isWarning,
    isCritical,
    isPitch,
    isQa,
    isTimeEnded,
  } = timer;

  // Two-Phase Visual States
  const isPitchActive = isPitch && !isTimeEnded;
  const isQaActive = isQa && !isTimeEnded;
  const isPitchCompleted = isQa || isTimeEnded;

  let pitchDisplay = "08:00";
  let qaDisplay = "02:00";

  if (isTimeEnded) {
    pitchDisplay = "00:00";
    qaDisplay = "00:00";
  } else if (isQa) {
    pitchDisplay = "00:00";
    qaDisplay = phaseFormattedTime;
  } else {
    // Pitch active or initial
    pitchDisplay = phaseFormattedTime;
    qaDisplay = "02:00";
  }

  const isPitchWarning = isPitchActive && isWarning;
  const isPitchCritical = isPitchActive && isCritical;
  const isQaWarning = isQaActive && isWarning;
  const isQaCritical = isQaActive && isCritical;

  // Draft Save Handler
  const handleSaveDraft = useCallback(
    async (silent = false) => {
      if (isSubmitted) return;

      if (!silent) setIsSavingDraft(true);
      setDraftSaveStatus("saving");
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/judge/teams/${team.id}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scores: latestScoresRef.current,
            feedback: latestFeedbackRef.current,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save draft.");
        }

        hasUnsavedChanges.current = false;
        setDraftSaveStatus("saved");
        if (data.evaluation) {
          setEvaluation(data.evaluation);
        }
      } catch (err) {
        console.error("Draft save error:", err);
        setDraftSaveStatus("error");
        if (!silent) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to save draft.");
        }
      } finally {
        if (!silent) setIsSavingDraft(false);
      }
    },
    [team.id, isSubmitted]
  );

  // Debounced Autosave (saves 2.5s after user stops editing)
  useEffect(() => {
    if (isSubmitted) return;

    const timeout = setTimeout(() => {
      if (hasUnsavedChanges.current) {
        handleSaveDraft(true);
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [scores, feedback, handleSaveDraft, isSubmitted]);

  // Handle Score Change for a rubric criterion
  const handleScoreChange = (rubricId: string, val: number) => {
    if (isSubmitted) return;
    setScores((prev) => ({
      ...prev,
      [rubricId]: val,
    }));
    hasUnsavedChanges.current = true;
    setDraftSaveStatus("idle");
  };

  // Final Evaluation Submission Handler
  const handleFinalSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/judge/teams/${team.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores,
          feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit evaluation.");
      }

      setShowConfirmModal(false);
      if (data.evaluation) {
        setEvaluation(data.evaluation);
      }
      router.refresh();
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation & accessibility (1-5 to jump to criteria, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirmModal) setShowConfirmModal(false);
        if (showResetModal) setShowResetModal(false);
        return;
      }

      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") {
        return;
      }

      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const targetCard = document.getElementById(`rubric-criterion-${index}`);
        if (targetCard) {
          e.preventDefault();
          targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
          targetCard.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal, showResetModal]);

  // Check if all active rubrics have scores
  const allRubricsScored = rubrics.every(
    (r) => scores[r.id] !== undefined && scores[r.id] !== null && !isNaN(scores[r.id])
  );

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-40">
      {/*
        ============================================================
        PREMIUM HACKATHON JUDGE CONTROL DECK (FLOATING HUD)
        Docks at sticky top-12 (below 48px header).
        Features:
        - 3-Level Command Deck Hierarchy
        - TWO-PHASE Side-by-Side Presentation Deck:
            * PITCH (8 Min): Amber/Gold glow when active
            * Q&A (2 Min): Electric Cyan glow when active
            * 10-Minute End: Prominent TIME ENDED alert
        - Restrained obsidian/gold styling with clean glass shadows
        - No rubric score clutter in HUD (handled in scoring suite)
        ============================================================
      */}
      {/*
        ============================================================
        LEVEL 1 + 2 + 3: FLOATING JUDGE CONTROL DECK
        - Sticky floating HUD (top-12 z-30)
        - Lightweight cinematic glass styling with reduced visual mass
        - Real-time Micro-Animations:
            * Gentle breathing "● LIVE" status indicator
            * Active phase breathing glow (Amber for Pitch, Cyan for Q&A)
            * Dominant active phase vs. quieter queued phase hierarchy
            * 500ms smooth CSS transition at 8:00 without timer delay
            * TIME ENDED single visual settle pulse (no endless flashing)
        - Secondary, compact timer controls & Team Dossier toggle
        - Mobile responsive (tested 320px–430px)
        ============================================================
      */}
      <div className="sticky top-12 z-30 rounded-xl bg-[#0a0908]/92 border border-amber-500/20 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.7)] p-3 sm:p-4 font-mono transition-all">
        {/* LEVEL 1: Status, Domain, Roster link, and Autosave */}
        <div className="flex items-center justify-between gap-3 text-xs mb-2 pb-2 border-b border-neutral-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/judge"
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-amber-400 transition-colors font-semibold shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ROSTER</span>
            </Link>
            <span className="text-neutral-700 hidden sm:inline">•</span>
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                <Lock className="w-3 h-3" />
                EVALUATION LOCKED
              </span>
            ) : isTimeEnded ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500/40 bg-red-950/40 text-red-300 text-[10px] font-bold uppercase tracking-wider shrink-0 time-ended-pulse">
                <AlertCircle className="w-3 h-3 text-red-400" />
                SESSION COMPLETE // TIME ENDED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/25 bg-amber-950/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                <span>EVALUATION IN PROGRESS</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold pl-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 live-dot shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  <span>LIVE</span>
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-950/30 text-amber-400 text-[10px] uppercase font-bold tracking-wider">
              {team.domain}
            </span>
            {!isSubmitted && (
              <div className="text-[11px] hidden sm:flex items-center">
                {draftSaveStatus === "saving" && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...
                  </span>
                )}
                {draftSaveStatus === "saved" && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Saved ✓
                  </span>
                )}
                {draftSaveStatus === "error" && (
                  <span className="text-red-400">Offline</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* LEVEL 2: Team Identity & Secondary Dossier Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-white font-sans tracking-tight uppercase truncate">
              {team.team_name}
            </h1>
            <p className="text-xs text-neutral-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-neutral-300">{team.college}</span>
              <span className="text-neutral-700">•</span>
              <span className="text-neutral-500">Judge: {judge.name}</span>
            </p>
          </div>

          {/* Dossier Toggle (Desktop/Tablet) — Compact & visually secondary */}
          <button
            type="button"
            onClick={() => setIsDossierOpen((prev) => !prev)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-800/70 bg-neutral-900/50 hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 text-[11px] font-medium transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Users className="w-3.5 h-3.5 text-amber-500/80" />
            <span>TEAM DOSSIER ({team.participant_count})</span>
            {isDossierOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* LEVEL 3: TWO-PHASE TIMER DECK & CONTROLS */}
        <div className="space-y-2.5 pt-2.5 border-t border-neutral-800/40">
          {/* TWO PHASES SIDE-BY-SIDE */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* PHASE 1: PITCH (8 MINUTES) */}
            <div
              className={`relative rounded-xl p-2.5 sm:p-3 border transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                isSubmitted
                  ? "border-neutral-800/60 bg-black/30 opacity-40"
                  : isTimeEnded
                  ? "border-neutral-800/60 bg-black/30 opacity-40"
                  : isPitchActive
                  ? isPitchWarning
                    ? "border-orange-500/60 bg-orange-950/20 shadow-[0_0_20px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/30"
                    : isPitchCritical
                    ? "border-red-500/60 bg-red-950/25 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/40"
                    : isRunning
                    ? "breathe-amber bg-amber-950/20 ring-1 ring-amber-500/20 opacity-100"
                    : "border-amber-500/40 bg-amber-950/15 opacity-100"
                  : "border-neutral-800/60 bg-black/30 opacity-45"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPitchActive
                        ? "bg-amber-400 live-dot shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                        : "bg-neutral-600"
                    }`}
                  />
                  PITCH <span className="hidden sm:inline text-neutral-500 text-[10px] font-normal">(8 MIN)</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border ${
                    isPitchActive
                      ? isRunning
                        ? "bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                        : "bg-amber-950/40 text-amber-400 border-amber-500/30"
                      : isPitchCompleted
                      ? "bg-neutral-900/60 text-neutral-400 border-neutral-800/60"
                      : "bg-neutral-900/40 text-neutral-500 border-neutral-800/40"
                  }`}
                >
                  {isPitchActive
                    ? isRunning
                      ? "● ACTIVE"
                      : "READY"
                    : isPitchCompleted
                    ? "COMPLETED ✓"
                    : "○ QUEUED"}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl sm:text-3xl font-black font-mono tracking-wider tabular-nums leading-none transition-colors duration-200 ${
                    isPitchActive
                      ? isPitchCritical
                        ? "text-red-400"
                        : isPitchWarning
                        ? "text-orange-400"
                        : "text-amber-200"
                      : "text-neutral-500"
                  }`}
                >
                  {pitchDisplay}
                </span>
                <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-mono">
                  {isPitchCompleted ? "00:00" : "/ 08:00"}
                </span>
              </div>
            </div>

            {/* PHASE 2: Q&A (2 MINUTES) */}
            <div
              className={`relative rounded-xl p-2.5 sm:p-3 border transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                isSubmitted
                  ? "border-neutral-800/60 bg-black/30 opacity-40"
                  : isTimeEnded
                  ? "border-neutral-800/60 bg-black/30 opacity-40"
                  : isQaActive
                  ? isQaCritical
                    ? "border-red-500/60 bg-red-950/25 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/40"
                    : isQaWarning
                    ? "border-orange-500/60 bg-orange-950/20 shadow-[0_0_20px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/30"
                    : isRunning
                    ? "breathe-cyan bg-cyan-950/20 ring-1 ring-cyan-500/20 opacity-100"
                    : "border-cyan-500/40 bg-cyan-950/15 opacity-100"
                  : "border-neutral-800/60 bg-black/30 opacity-45"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isQaActive
                        ? "bg-cyan-400 live-dot shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                        : "bg-neutral-600"
                    }`}
                  />
                  Q&A <span className="hidden sm:inline text-neutral-500 text-[10px] font-normal">(2 MIN)</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border ${
                    isQaActive
                      ? isRunning
                        ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                        : "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                      : isTimeEnded
                      ? "bg-neutral-900/60 text-neutral-400 border-neutral-800/60"
                      : "bg-neutral-900/40 text-neutral-500 border-neutral-800/40"
                  }`}
                >
                  {isQaActive
                    ? isRunning
                      ? "● ACTIVE"
                      : "READY"
                    : isTimeEnded
                    ? "COMPLETED ✓"
                    : "○ QUEUED"}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl sm:text-3xl font-black font-mono tracking-wider tabular-nums leading-none transition-colors duration-200 ${
                    isQaActive
                      ? isQaCritical
                        ? "text-red-400"
                        : isQaWarning
                        ? "text-orange-400"
                        : "text-cyan-200"
                      : "text-neutral-500"
                  }`}
                >
                  {qaDisplay}
                </span>
                <span className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-mono">
                  {isTimeEnded ? "00:00" : "/ 02:00"}
                </span>
              </div>
            </div>
          </div>

          {/* TIME ENDED NOTIFICATION BANNER (IF 10-MIN FINISHED) — SETTLES STABLY AFTER SHORT PULSE */}
          {isTimeEnded && !isSubmitted && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-950/30 text-red-300 text-xs font-semibold time-ended-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>FULL 10-MINUTE SESSION COMPLETED // TIME ENDED</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-red-400 font-bold">FINISH SCORING</span>
            </div>
          )}

          {/* CONTROLS ROW — Visually secondary, compact, refined */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/40">
            {!isSubmitted ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => timer.start()}
                  disabled={isRunning}
                  aria-label="Start presentation timer"
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isRunning
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold cursor-default"
                      : "bg-neutral-900/60 hover:bg-emerald-950/40 text-emerald-400 border-neutral-800 hover:border-emerald-500/40 active:scale-95"
                  }`}
                >
                  <Play className={`w-3 h-3 ${isRunning ? "fill-current" : ""}`} />
                  <span>{isRunning ? "RUNNING" : "START"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => timer.stop()}
                  disabled={!isRunning}
                  aria-label="Stop presentation timer"
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    !isRunning
                      ? "bg-neutral-900/30 border-neutral-850 text-neutral-600 opacity-40 cursor-not-allowed"
                      : "bg-neutral-900/60 hover:bg-amber-950/40 text-neutral-300 hover:text-amber-300 border-neutral-800 hover:border-amber-500/40 active:scale-95"
                  }`}
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>STOP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  aria-label="Reset presentation timer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                SESSION LOCKED
              </span>
            )}

            {/* Dossier Toggle on mobile (< sm) */}
            <button
              type="button"
              onClick={() => setIsDossierOpen((prev) => !prev)}
              className="inline-flex sm:hidden items-center gap-1 py-1.5 px-2.5 rounded-lg border border-neutral-800/70 bg-neutral-900/60 text-neutral-300 text-xs font-medium shrink-0"
            >
              <Users className="w-3.5 h-3.5 text-amber-500/80" />
              <span>DOSSIER</span>
              {isDossierOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/*
        ============================================================
        TEAM DOSSIER (EXPANDABLE BELOW FLOATING BLOCK)
        ============================================================
      */}
      {isDossierOpen && (
        <div className="rounded-2xl border border-neutral-800 bg-[#110f0c] p-4 sm:p-6 space-y-4 font-mono text-xs animate-in fade-in duration-150 shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="font-bold text-white uppercase text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Official Team Dossier: {team.team_name}
            </span>
            <span className="text-neutral-500 text-xs">
              {team.participant_count} Registered Members
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leader Details */}
            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/80 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                TEAM LEADER SPECIFICATIONS
              </div>
              <div className="space-y-1.5 text-neutral-300">
                <p>
                  <span className="text-neutral-500">Name:</span> {team.team_leader_name}
                </p>
                {team.team_leader_roll_no && (
                  <p>
                    <span className="text-neutral-500">Roll No:</span> {team.team_leader_roll_no}
                  </p>
                )}
                {team.team_leader_mobile && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-neutral-500" />
                    <span>+91 {team.team_leader_mobile}</span>
                  </p>
                )}
                {team.team_leader_email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-neutral-500" />
                    <span>{team.team_leader_email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Participants Roster */}
            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/80 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                PARTICIPANT ROSTER
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {team.participants && team.participants.length > 0 ? (
                  team.participants.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-neutral-300 text-[11px] border-b border-neutral-900/60 pb-1 last:border-none"
                    >
                      <span className="font-medium text-white truncate max-w-[160px]">
                        {idx + 1}. {m.name} {m.isLeader && "(Leader)"}
                      </span>
                      <div className="flex items-center gap-3 text-neutral-400 text-[10px]">
                        {m.roll_no && <span>Roll: {m.roll_no}</span>}
                        {m.mobile && <span>Ph: +91 {m.mobile}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 italic">No participants listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-300 font-mono text-xs"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SUBMISSION LOCKED BANNER */}
      {isSubmitted && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider text-emerald-200">
                OFFICIAL EVALUATION RECORDED &amp; LOCKED
              </p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Submitted on{" "}
                {evaluation.submitted_at
                  ? new Date(evaluation.submitted_at).toLocaleString()
                  : "Record Complete"}{" "}
                • Authoritative Score: {evaluation.total_score} / 50
              </p>
            </div>
          </div>

          <Link
            href="/judge"
            className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold uppercase transition-colors shrink-0 text-center"
          >
            NEXT TEAM
          </Link>
        </div>
      )}

      {/*
        ============================================================
        OFFICIAL RUBRIC SCORING SUITE (5 CRITERIA, 0-10 BUTTONS ONLY)
        Scores and CURRENT TOTAL are clearly displayed here.
        ============================================================
      */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white uppercase font-sans tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Official Rubric Scoring Suite
            </h2>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              Score each criterion from 0 to 10 points. Use keys 1–5 to jump to criteria.
            </p>
          </div>

          {/* CURRENT TOTAL HUD */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-amber-500/40 bg-[#110f0c] font-mono">
            <span className="text-[11px] text-neutral-400 uppercase font-semibold">CURRENT TOTAL:</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              {isSubmitted ? evaluation.total_score : clientLiveTotal}
            </span>
            <span className="text-xs text-neutral-500">/ {maxPossibleScore}</span>
          </div>
        </div>

        {/* Rubrics List */}
        <div className="space-y-4">
          {rubrics.map((rubric, idx) => {
            const currentScore = scores[rubric.id] ?? 0;
            const max = Number(rubric.max_score) || 10;
            const isScored = scores[rubric.id] !== undefined;

            return (
              <div
                key={rubric.id}
                id={`rubric-criterion-${idx}`}
                tabIndex={-1}
                className={`scroll-mt-64 rounded-2xl border p-5 sm:p-6 transition-all font-mono outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isScored
                    ? "border-amber-500/40 bg-[#110f0c] shadow-[0_0_20px_rgba(245,158,11,0.03)]"
                    : "border-neutral-800 bg-[#0d0c09]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center border border-amber-500/30">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white font-sans uppercase tracking-tight">
                        {rubric.name}
                      </h3>
                    </div>
                    {rubric.description && (
                      <p className="text-xs text-neutral-400 pl-8.5">{rubric.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto pl-8.5 sm:pl-0">
                    <span className="text-xs text-neutral-500 uppercase font-semibold">Score:</span>
                    <span className="text-lg font-black text-amber-400 px-3 py-1 rounded-lg border border-amber-500/30 bg-amber-950/30">
                      {currentScore}
                    </span>
                    <span className="text-xs text-neutral-500">/ {max}</span>
                  </div>
                </div>

                {/* Score Controls: Clickable numeric buttons 0 to 10 ONLY (NO SLIDERS, NO TRACKS) */}
                <div className="pl-0 sm:pl-8.5">
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
                    {Array.from({ length: max + 1 }, (_, i) => i).map((scoreVal) => {
                      const isSelected = scores[rubric.id] === scoreVal;

                      return (
                        <button
                          key={scoreVal}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleScoreChange(rubric.id, scoreVal)}
                          className={`min-h-[44px] sm:h-11 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed select-none ${
                            isSelected
                              ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105 border border-amber-300 font-black"
                              : "border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-amber-500/50 hover:text-white active:scale-95"
                          }`}
                        >
                          {scoreVal}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* JUDGE FEEDBACK SECTION */}
      <div className="rounded-2xl border border-neutral-800 bg-[#110f0c] p-5 sm:p-6 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <label
            htmlFor="judge-feedback"
            className="text-xs uppercase tracking-wider text-neutral-300 font-bold flex items-center gap-2"
          >
            <span>JUDGE FEEDBACK &amp; OBSERVATIONS</span>
            <span className="text-[10px] text-neutral-500 font-normal">
              (Constructive technical critique)
            </span>
          </label>

          {/* Draft Autosave indicator */}
          {!isSubmitted && (
            <div className="text-[11px] flex items-center gap-1.5">
              {draftSaveStatus === "saving" && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving draft...
                </span>
              )}
              {draftSaveStatus === "saved" && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Draft saved
                </span>
              )}
              {draftSaveStatus === "error" && (
                <span className="text-red-400">Save failed</span>
              )}
            </div>
          )}
        </div>

        <textarea
          id="judge-feedback"
          rows={4}
          disabled={isSubmitted}
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            hasUnsavedChanges.current = true;
            setDraftSaveStatus("idle");
          }}
          placeholder="Enter notes on technical feasibility, innovation, prototype demo execution, and recommendations for the team..."
          className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl p-3.5 text-white placeholder-neutral-600 outline-none text-xs transition-colors disabled:opacity-50 resize-y"
        />
      </div>

      {/*
        ============================================================
        BOTTOM SUBMISSION ACTION BAR (WHEN NOT SUBMITTED)
        Styled as part of the command deck, strictly non-overlapping
        ============================================================
      */}
      {!isSubmitted && (
        <div className="sticky bottom-4 z-30 p-4 rounded-2xl border border-amber-500/35 bg-[#0c0a08]/98 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 uppercase font-semibold">CURRENT TOTAL:</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              {clientLiveTotal} / {maxPossibleScore}
            </span>
            <span className="text-xs text-neutral-500">POINTS</span>
            {!allRubricsScored && (
              <span className="text-[11px] text-amber-500/90 italic hidden md:inline">
                (Please evaluate all {rubrics.length} criteria)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSavingDraft || isSubmitting}
              onClick={() => handleSaveDraft(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE DRAFT</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting || !allRubricsScored}
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-black" />
              <span>SUBMIT EVALUATION</span>
            </button>
          </div>
        </div>
      )}

      {/*
        ============================================================
        FINAL SUBMISSION CONFIRMATION MODAL
        ============================================================
      */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isSubmitting && setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-submission-title"
        >
          <div
            className="relative w-full max-w-lg bg-[#110f0c] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.15)] space-y-6 max-h-[90vh] overflow-y-auto font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5 border-b border-neutral-800 pb-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 text-[11px] uppercase tracking-wider font-semibold">
                <Shield className="w-3 h-3" />
                FINAL SUBMISSION
              </div>
              <h2
                id="confirm-submission-title"
                className="text-xl font-bold text-white uppercase font-sans tracking-wide"
              >
                Are you absolutely sure?
              </h2>
              <p className="text-xs text-neutral-400">
                Team: <span className="text-white font-bold">{team.team_name}</span> ({team.domain})
              </p>
            </div>

            {/* Rubrics breakdown table */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                SCORE BREAKDOWN
              </div>
              <div className="space-y-1.5 bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
                {rubrics.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-neutral-300 py-1 border-b border-neutral-900 last:border-none"
                  >
                    <span className="truncate pr-2">
                      {i + 1}. {r.name}
                    </span>
                    <span className="font-bold text-amber-400 shrink-0">
                      {scores[r.id] ?? 0} / {r.max_score}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between text-white font-bold text-sm">
                  <span>FINAL AUTHORITATIVE TOTAL:</span>
                  <span className="text-amber-400 text-base">
                    {clientLiveTotal} / {maxPossibleScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback preview */}
            {feedback.trim() ? (
              <div className="space-y-1 text-xs">
                <span className="text-[11px] text-neutral-500 uppercase font-semibold">
                  FEEDBACK PREVIEW
                </span>
                <p className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 italic text-[11px] max-h-24 overflow-y-auto">
                  &ldquo;{feedback.trim()}&rdquo;
                </p>
              </div>
            ) : (
              <div className="text-neutral-500 text-[11px] italic">
                (No feedback provided)
              </div>
            )}

            {/* Permanent lock warning */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Once submitted, this evaluation is permanently locked.</p>
                <p className="text-neutral-300">Scores cannot be changed by the judge or administrator after final submission.</p>
                <p className="text-neutral-400 text-[11px]">Make sure all five criteria have been reviewed before continuing.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800 text-xs">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-black uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>FINALIZING...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>CONFIRM FINAL SUBMISSION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMER RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowResetModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-md bg-[#110f0c] border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.12)] space-y-4 font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-400 text-xs uppercase font-bold tracking-wider">
              <RotateCcw className="w-4 h-4" />
              <span>CONFIRM TIMER RESET</span>
            </div>
            <h3 className="text-lg font-bold text-white font-sans">
              Reset Presentation Pitch Clock?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This will reset the countdown timer back to the full 10:00 duration for{" "}
              <strong className="text-white">{team.team_name}</strong>. If an in-progress session exists, it will return to standby.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  timer.reset();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors cursor-pointer"
              >
                CONFIRM RESET (10:00)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
