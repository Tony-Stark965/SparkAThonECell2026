"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JudgeTeamDossier } from "@/lib/supabase/judge";
import {
  Shield,
  Layers,
  Users,
  Clock,
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
  FileEdit,
} from "lucide-react";
import { useTeamTimer } from "@/lib/hooks/useTeamTimer";
import { FloatingPitchTimer } from "./FloatingPitchTimer";

interface JudgingWorkspaceClientProps {
  initialDossier: JudgeTeamDossier;
}

interface CorrectionState {
  requested: boolean;
  requestId?: string;
  reason?: string;
  requestedAt?: string;
}

const CORRECTION_REASONS = [
  "Scoring error / typo in rubric entry",
  "Misunderstood demo functionality during pitch",
  "Technical presentation clarification provided by team",
  "Other legitimate judging discrepancy",
] as const;

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
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionReason, setCorrectionReason] = useState<string>(CORRECTION_REASONS[0]);
  const [correctionExplanation, setCorrectionExplanation] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [correctionStatus, setCorrectionStatus] = useState<CorrectionState | null>(() => {
    if (
      initialDossier.evaluation?.feedback &&
      initialDossier.evaluation.feedback.includes("[CORRECTION REQUEST:")
    ) {
      const match = initialDossier.evaluation.feedback.match(/\[CORRECTION REQUEST:\s*([^\]]+)\]/);
      const reasonMatch = initialDossier.evaluation.feedback.match(/Reason:\s*([^\n]+)/);
      return {
        requested: true,
        requestId: match ? match[1].trim() : undefined,
        reason: reasonMatch ? reasonMatch[1].trim() : "Correction Registered",
      };
    }

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`spark_corr_${team.id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // ignore parse error
      }
    }
    return null;
  });

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

  // Max possible score
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
    formattedTime,
    isRunning,
    isWarning,
    isCritical,
    isTimeUp,
    progressPercent,
  } = timer;

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

  // Handle Correction Request Submission
  const handleCorrectionSubmit = async () => {
    if (!correctionReason || !correctionExplanation.trim()) return;
    setIsSubmittingCorrection(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/judge/teams/${team.id}/correction-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: correctionReason,
          explanation: correctionExplanation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register correction request.");
      }

      const newCorrState: CorrectionState = {
        requested: true,
        requestId: data.requestId,
        reason: correctionReason,
        requestedAt: data.requestedAt,
      };

      setCorrectionStatus(newCorrState);
      if (typeof window !== "undefined") {
        localStorage.setItem(`spark_corr_${team.id}`, JSON.stringify(newCorrState));
      }
      setShowCorrectionModal(false);
      router.refresh();
    } catch (err) {
      console.error("Correction request error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to file correction request.");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Keyboard navigation & accessibility (1-5 to jump to criteria, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirmModal) setShowConfirmModal(false);
        if (showResetModal) setShowResetModal(false);
        if (showCorrectionModal) setShowCorrectionModal(false);
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
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          targetCard.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal, showResetModal, showCorrectionModal]);

  // Check if all active rubrics have scores
  const allRubricsScored = rubrics.every(
    (r) => scores[r.id] !== undefined && scores[r.id] !== null && !isNaN(scores[r.id])
  );

  // SVG Ring Calculation for circular progress
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <>
      <FloatingPitchTimer timer={timer} isSubmitted={isSubmitted} />
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      {/* STICKY TOP COMMAND CONSOLE HUD */}
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[#0c0a08]/95 backdrop-blur-md border-b border-amber-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.7)] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/judge"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-amber-400 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">ROSTER</span>
          </Link>
          <span className="text-neutral-700 hidden sm:inline">•</span>
          <span className="font-bold text-white uppercase tracking-tight truncate max-w-[160px] sm:max-w-[240px]">
            {team.team_name}
          </span>
          <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 text-[10px] uppercase font-bold tracking-wider hidden md:inline">
            {team.domain}
          </span>
        </div>

        {/* HUD Rubric Completion Dots & Timer */}
        <div className="flex items-center gap-3 sm:gap-5 ml-auto">
          {/* Rubric dots 1-5 */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[10px] uppercase tracking-wider hidden lg:inline mr-1">
              RUBRICS:
            </span>
            {rubrics.map((r, i) => {
              const isScored = scores[r.id] !== undefined && scores[r.id] !== null;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`rubric-criterion-${i}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                    isScored
                      ? "bg-amber-500 text-black border border-amber-300 font-black shadow-[0_0_8px_rgba(245,158,11,0.35)]"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                  }`}
                  title={`${r.name}: ${isScored ? `${scores[r.id]}/${r.max_score}` : "Pending"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Live Score Readout */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-950/20">
            <span className="text-[10px] text-neutral-400 uppercase hidden sm:inline">SCORE:</span>
            <span className="font-black text-amber-400 text-sm">
              {isSubmitted ? evaluation.total_score : clientLiveTotal}
            </span>
            <span className="text-[10px] text-neutral-500">/ 50</span>
          </div>

          {/* Compact Timer in HUD */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono ${
              isTimeUp
                ? "border-red-500/60 bg-red-950/40 text-red-400 animate-pulse"
                : isCritical
                ? "border-red-500/50 bg-red-950/30 text-red-400"
                : isWarning
                ? "border-orange-500/50 bg-orange-950/30 text-orange-400"
                : isRunning
                ? "border-amber-500/50 bg-amber-950/30 text-amber-400"
                : "border-neutral-800 bg-neutral-900 text-neutral-400"
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            <span className="font-bold text-xs tracking-wider">
              {isSubmitted ? "LOCKED" : formattedTime}
            </span>
          </div>

          {/* Autosave Status Indicator */}
          {!isSubmitted && (
            <div className="text-[11px] hidden sm:flex items-center">
              {draftSaveStatus === "saving" && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                </span>
              )}
              {draftSaveStatus === "saved" && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Saved ✓
                </span>
              )}
              {draftSaveStatus === "error" && (
                <span className="text-red-400">Offline / Retry</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TEAM OVERVIEW & CINEMATIC 10-MINUTE TIMER CONSOLE */}
      <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#14120e] to-[#0d0c09] p-5 sm:p-7 shadow-[0_0_40px_rgba(245,158,11,0.07)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <Layers className="w-3.5 h-3.5" />
                {team.domain}
              </span>

              {isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  EVALUATION LOCKED // SUBMITTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  EVALUATION IN PROGRESS
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-sans tracking-tight">
              {team.team_name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-mono flex items-center gap-2">
              <span>{team.college}</span>
              <span className="text-neutral-700">•</span>
              <span className="text-neutral-500">Judge: {judge.name}</span>
            </p>
          </div>

          {/* CINEMATIC 10-MINUTE TIMER HUD WITH SVG CIRCULAR RING */}
          <div className="flex flex-col items-start md:items-end justify-center font-mono">
            <div className="flex items-center gap-4">
              {/* Circular Ring Gauge */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                  {/* Track */}
                  <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-neutral-800/80 fill-none"
                  />
                  {/* Indicator */}
                  <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`fill-none transition-all duration-300 ${
                      isTimeUp
                        ? "text-red-500"
                        : isCritical
                        ? "text-red-500 animate-pulse"
                        : isWarning
                        ? "text-orange-400"
                        : "text-amber-400"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Clock
                    className={`w-5 h-5 ${
                      isRunning
                        ? "text-amber-400 animate-spin"
                        : isTimeUp
                        ? "text-red-400"
                        : "text-neutral-400"
                    }`}
                    style={{ animationDuration: isRunning ? "3s" : undefined }}
                  />
                </div>
              </div>

              {/* Digital Time & Phase Display */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                    {timer.isTimeEnded ? "SESSION COMPLETE" : timer.isQa ? "Q&A CLOCK (2:00)" : "PITCH CLOCK (8:00)"}
                  </span>
                  {isTimeUp ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-950/60 text-red-400 border border-red-500/50 animate-pulse">
                      TIME UP
                    </span>
                  ) : isCritical ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-950/60 text-red-400 border border-red-500/50 animate-pulse">
                      FINAL MINUTE
                    </span>
                  ) : isWarning ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-950/60 text-orange-400 border border-orange-500/40">
                      WARNING
                    </span>
                  ) : isRunning ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/60 text-amber-400 border border-amber-500/40">
                      RUNNING
                    </span>
                  ) : null}
                </div>

                <div
                  className={`text-3xl sm:text-4xl font-black tracking-widest leading-none mt-1 ${
                    isTimeUp
                      ? "text-red-400 animate-pulse"
                      : isCritical
                      ? "text-red-400"
                      : isWarning
                      ? "text-orange-400"
                      : isRunning
                      ? "text-amber-400"
                      : "text-neutral-200"
                  }`}
                >
                  {isSubmitted ? "COMPLETED" : formattedTime}
                </div>

                {isTimeUp && !isSubmitted && (
                  <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold mt-1">
                    TIME EXPIRED // FINISH EVALUATION
                  </span>
                )}
              </div>
            </div>

            {/* Timer Controls: Start / Stop / Reset */}
            {!isSubmitted && (
              <div className="flex items-center gap-2 mt-3 font-mono text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => timer.start()}
                  disabled={isRunning}
                  aria-label="Start presentation timer"
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border transition-all cursor-pointer ${
                    isRunning
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-extrabold cursor-default"
                      : "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 active:scale-95"
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? "fill-current" : ""}`} />
                  <span>{isRunning ? "RUNNING" : "START"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => timer.stop()}
                  disabled={!isRunning}
                  aria-label="Stop presentation timer"
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border transition-all cursor-pointer ${
                    !isRunning
                      ? "bg-neutral-900/50 border-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed"
                      : "bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/40 hover:border-amber-500/70 active:scale-95"
                  }`}
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>STOP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  aria-label="Reset presentation timer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Team Dossier Toggle */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={() => setIsDossierOpen((prev) => !prev)}
            className="flex items-center justify-between w-full text-xs font-mono text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer select-none"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              TEAM DOSSIER ({team.participant_count} PARTICIPANTS)
            </span>
            <div className="flex items-center gap-1 text-[11px] text-neutral-500">
              <span>{isDossierOpen ? "COLLAPSE DOSSIER" : "EXPAND DOSSIER"}</span>
              {isDossierOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {isDossierOpen && (
            <div className="mt-4 pt-4 border-t border-neutral-900 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs animate-in fade-in duration-150">
              {/* Leader Details */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-2.5">
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
                      <span className="text-neutral-500">Roll No:</span>{" "}
                      {team.team_leader_roll_no}
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
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-2.5">
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
          )}
        </div>
      </div>

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

      {/* SUBMISSION LOCKED / CORRECTION BANNER */}
      {isSubmitted && (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300">
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

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(true)}
                className="px-3.5 py-2 rounded-lg border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                <span>REQUEST CORRECTION</span>
              </button>

              <Link
                href="/judge"
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold uppercase transition-colors shrink-0"
              >
                NEXT TEAM
              </Link>
            </div>
          </div>

          {/* Pending Correction Banner */}
          {correctionStatus?.requested && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-amber-200">
                    CORRECTION REQUEST REGISTERED // PENDING ADMIN APPROVAL
                  </span>
                  {correctionStatus.requestId && (
                    <span className="px-2 py-0.5 rounded bg-black/60 border border-amber-500/30 text-[10px] text-amber-400">
                      ID: {correctionStatus.requestId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-300">
                  Reason: <span className="text-white">{correctionStatus.reason}</span>
                </p>
                <p className="text-[10px] text-neutral-400 italic">
                  Note: The evaluation remains locked to maintain competition integrity. An organizer will review and authorize any score modification during Phase 4 Admin Command Center processing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RUBRIC SCORING SUITE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white uppercase font-sans tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Official Rubric Scoring Suite
            </h2>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              Score each criterion from 0 to 10 points. Use keys 1–5 to quick-jump to criteria.
            </p>
          </div>

          {/* Current Live Total HUD */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-amber-500/40 bg-[#110f0c] font-mono">
            <span className="text-[11px] text-neutral-400 uppercase">CURRENT TOTAL:</span>
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
                className={`rounded-2xl border p-5 sm:p-6 transition-all font-mono outline-none focus:ring-2 focus:ring-amber-500/50 ${
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
                    <span className="text-xs text-neutral-500 uppercase">Score:</span>
                    <span className="text-lg font-black text-amber-400 px-3 py-1 rounded-lg border border-amber-500/30 bg-amber-950/30">
                      {currentScore}
                    </span>
                    <span className="text-xs text-neutral-500">/ {max}</span>
                  </div>
                </div>

                {/* Score Controls: Touch friendly quick score buttons (0 to 10) */}
                <div className="pl-0 sm:pl-8.5 space-y-3.5">
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

                  {/* Range Slider for granular control */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-neutral-500">0</span>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      step={1}
                      value={currentScore}
                      disabled={isSubmitted}
                      onChange={(e) => handleScoreChange(rubric.id, Number(e.target.value))}
                      className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                      aria-label={`${rubric.name} slider`}
                    />
                    <span className="text-[10px] text-neutral-500">{max}</span>
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
          placeholder="Enter notes on technical feasibility, innovation, demo execution, and recommendations for the team..."
          className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl p-3.5 text-white placeholder-neutral-600 outline-none text-xs transition-colors disabled:opacity-50 resize-y"
        />
      </div>

      {/* ACTION BAR */}
      {!isSubmitted && (
        <div className="sticky bottom-4 z-30 p-4 rounded-2xl border border-amber-500/30 bg-[#0c0a08]/95 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 uppercase">SUMMARY:</span>
            <span className="text-lg font-black text-amber-400">
              {clientLiveTotal} / {maxPossibleScore} POINTS
            </span>
            {!allRubricsScored && (
              <span className="text-[11px] text-amber-500/90 italic">
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

      {/* FINAL SUBMISSION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isSubmitting && setShowConfirmModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-submission-title"
        >
          <div
            className="relative w-full max-w-lg bg-[#110f0c] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.15)] space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5 border-b border-neutral-800 pb-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                <Shield className="w-3 h-3" />
                OFFICIAL SUBMISSION CONFIRMATION
              </div>
              <h2
                id="confirm-submission-title"
                className="text-xl font-bold text-white uppercase font-sans tracking-wide"
              >
                Submit &amp; Lock Evaluation
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Verify scores before permanent submission for team:{" "}
                <span className="text-white font-bold">{team.team_name}</span>
              </p>
            </div>

            {/* Rubrics breakdown table */}
            <div className="space-y-2 font-mono text-xs">
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
              <div className="space-y-1 font-mono text-xs">
                <span className="text-[11px] text-neutral-500 uppercase font-semibold">
                  FEEDBACK PREVIEW
                </span>
                <p className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 italic text-[11px] max-h-24 overflow-y-auto">
                  &ldquo;{feedback.trim()}&rdquo;
                </p>
              </div>
            ) : (
              <div className="text-neutral-500 text-[11px] italic font-mono">
                (No feedback provided)
              </div>
            )}

            {/* Permanent lock warning */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Submitting will lock this evaluation permanently. You will not be able to modify scores or feedback without organizer approval.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800 font-mono text-xs">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold transition-colors cursor-pointer"
              >
                BACK TO EDIT
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
                    <span>CONFIRM &amp; LOCK</span>
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
            className="relative w-full max-w-md bg-[#110f0c] border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.12)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
              <RotateCcw className="w-4 h-4" />
              <span>CONFIRM TIMER RESET</span>
            </div>
            <h3 className="text-lg font-bold text-white font-sans">
              Reset Presentation Pitch Clock?
            </h3>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">
              This will reset the countdown timer back to the full 10:00 duration for{" "}
              <strong className="text-white">{team.team_name}</strong>. If an in-progress session exists, it will return to standby.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800 font-mono text-xs">
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

      {/* CORRECTION REQUEST MODAL */}
      {showCorrectionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isSubmittingCorrection && setShowCorrectionModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg bg-[#110f0c] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.15)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5 border-b border-neutral-800 pb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
                <FileEdit className="w-3 h-3" />
                OFFICIAL CORRECTION REQUEST
              </div>
              <h2 className="text-xl font-bold text-white uppercase font-sans tracking-wide">
                Request Evaluation Correction
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Team: <span className="text-white font-bold">{team.team_name}</span> • Current Score:{" "}
                <span className="text-amber-400 font-bold">{evaluation.total_score} / 50</span>
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-neutral-400 font-semibold block">
                  Correction Reason:
                </label>
                <select
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl p-3 text-white text-xs outline-none"
                >
                  {CORRECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-neutral-400 font-semibold block">
                  Detailed Explanation (min 10 characters):
                </label>
                <textarea
                  rows={4}
                  value={correctionExplanation}
                  onChange={(e) => setCorrectionExplanation(e.target.value)}
                  placeholder="Specify the exact rubric criterion, requested score adjustment, and rationale..."
                  className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl p-3 text-white placeholder-neutral-600 text-xs outline-none resize-y"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-300">Phase 4 Admin Processing Note:</p>
                <p>
                  To preserve competition integrity, this evaluation remains permanently locked until an organizer reviews and authorizes the adjustment in the Admin Command Center.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800 font-mono text-xs">
              <button
                type="button"
                disabled={isSubmittingCorrection}
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isSubmittingCorrection || correctionExplanation.trim().length < 10}
                onClick={handleCorrectionSubmit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingCorrection ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>FILING REQUEST...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-black" />
                    <span>SUBMIT REQUEST</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
