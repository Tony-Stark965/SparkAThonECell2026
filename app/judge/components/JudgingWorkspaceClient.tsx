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
} from "lucide-react";

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
    // Only count active rubrics
    if (rubrics.some((r) => r.id === rId)) {
      return sum + (Number(val) || 0);
    }
    return sum;
  }, 0);

  // 10-Minute Timer Logic
  // Total duration: 10 minutes (600 seconds)
  const TOTAL_DURATION_SECONDS = 600;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (isSubmitted) return 0;
    if (!evaluation.started_at) return TOTAL_DURATION_SECONDS;

    const startTime = new Date(evaluation.started_at).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    return Math.max(0, TOTAL_DURATION_SECONDS - elapsedSeconds);
  });

  // Automatically start evaluation session on first mount if not started
  useEffect(() => {
    if (!isSubmitted && !evaluation.started_at) {
      fetch(`/api/judge/teams/${team.id}/start`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.evaluation) {
            setEvaluation(data.evaluation);
          }
        })
        .catch((err) => console.error("Error starting judging session:", err));
    }
  }, [team.id, isSubmitted, evaluation.started_at]);

  // Reliable 10-Minute Countdown Timer
  useEffect(() => {
    if (isSubmitted || !evaluation.started_at) return;

    const startTime = new Date(evaluation.started_at).getTime();

    const updateTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const remaining = Math.max(0, TOTAL_DURATION_SECONDS - elapsed);
      setSecondsRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [evaluation.started_at, isSubmitted]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

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

  // Check if all active rubrics have scores
  const allRubricsScored = rubrics.every(
    (r) => scores[r.id] !== undefined && scores[r.id] !== null && !isNaN(scores[r.id])
  );

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* NAVIGATION / TOP HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4 font-mono text-xs">
        <Link
          href="/judge"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO COMMAND CENTER</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-neutral-500">JUDGE:</span>
          <span className="text-white font-medium">{judge.name}</span>
          <span className="text-neutral-700">•</span>
          <span className="text-amber-400 font-semibold">{judge.domain}</span>
        </div>
      </div>

      {/* TEAM OVERVIEW & TIMER HEADER */}
      <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#14120e] to-[#0d0c09] p-5 sm:p-7 shadow-[0_0_40px_rgba(245,158,11,0.07)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
                <Layers className="w-3 h-3" />
                {team.domain}
              </span>

              {isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  EVALUATION LOCKED // SUBMITTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider animate-pulse">
                  <Clock className="w-3 h-3" />
                  EVALUATION IN PROGRESS
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
              {team.team_name}
            </h1>
            <p className="text-xs text-neutral-400 font-mono">{team.college}</p>
          </div>

          {/* 10-MINUTE COUNTDOWN TIMER HUD */}
          <div className="flex flex-col items-start md:items-end justify-center font-mono">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
              PRESENTATION TIMER (10:00)
            </span>
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                isSubmitted
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                  : secondsRemaining === 0
                  ? "border-red-500/60 bg-red-950/40 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : secondsRemaining <= 120
                  ? "border-orange-500/50 bg-orange-950/30 text-orange-400"
                  : "border-amber-500/40 bg-neutral-950/80 text-amber-400"
              }`}
            >
              <Clock className="w-5 h-5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black tracking-wider leading-none">
                  {isSubmitted ? "COMPLETED" : formatTime(secondsRemaining)}
                </span>
                {secondsRemaining === 0 && !isSubmitted && (
                  <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold mt-1">
                    TIME COMPLETE // FINISH EVALUATION
                  </span>
                )}
              </div>
            </div>
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
              <span>{isDossierOpen ? "COLLAPSE" : "EXPAND DOSSIER"}</span>
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
              <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-amber-500 font-bold">
                  TEAM LEADER SPECIFICATIONS
                </div>
                <div className="space-y-1 text-neutral-300">
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
              <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-amber-500 font-bold">
                  PARTICIPANT ROSTER
                </div>
                <div className="space-y-1.5">
                  {team.participants && team.participants.length > 0 ? (
                    team.participants.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-neutral-300 text-[11px] border-b border-neutral-900/60 pb-1 last:border-none"
                      >
                        <span className="font-medium text-white">
                          {idx + 1}. {m.name} {m.isLeader && "(Leader)"}
                        </span>
                        <div className="flex items-center gap-3 text-neutral-400">
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

      {/* SUBMISSION LOCKED NOTIFICATION */}
      {isSubmitted && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider text-emerald-200">
                OFFICIAL EVALUATION RECORDED &amp; LOCKED
              </p>
              <p className="text-[11px] text-emerald-400/80">
                Submitted on {evaluation.submitted_at ? new Date(evaluation.submitted_at).toLocaleString() : "Record Complete"} • Final Score: {evaluation.total_score} / 50
              </p>
            </div>
          </div>
          <Link
            href="/judge"
            className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold uppercase transition-colors shrink-0"
          >
            NEXT TEAM
          </Link>
        </div>
      )}

      {/* RUBRIC SCORING SUITE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white uppercase font-sans tracking-wide">
              Official Rubric Scoring
            </h2>
            <p className="font-mono text-xs text-neutral-400">
              Score each criterion from 0 to 10 points. Maximum total = {maxPossibleScore}.
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

            return (
              <div
                key={rubric.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-all font-mono ${
                  scores[rubric.id] !== undefined
                    ? "border-amber-500/30 bg-[#110f0c]"
                    : "border-neutral-800 bg-[#0d0c09]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white font-sans uppercase tracking-tight">
                        {rubric.name}
                      </h3>
                    </div>
                    {rubric.description && (
                      <p className="text-xs text-neutral-400 pl-7">{rubric.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto pl-7 sm:pl-0">
                    <span className="text-xs text-neutral-500">Score:</span>
                    <span className="text-lg font-black text-amber-400 px-2.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/30">
                      {currentScore}
                    </span>
                    <span className="text-xs text-neutral-500">/ {max}</span>
                  </div>
                </div>

                {/* Score Controls: Touch friendly quick score buttons (0 to 10) */}
                <div className="pl-0 sm:pl-7 space-y-3">
                  <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
                    {Array.from({ length: max + 1 }, (_, i) => i).map((scoreVal) => {
                      const isSelected = scores[rubric.id] === scoreVal;

                      return (
                        <button
                          key={scoreVal}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleScoreChange(rubric.id, scoreVal)}
                          className={`h-11 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed select-none ${
                            isSelected
                              ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105 border border-amber-300"
                              : "border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-amber-500/50 hover:text-white"
                          }`}
                        >
                          {scoreVal}
                        </button>
                      );
                    })}
                  </div>

                  {/* Slider control for alternative precision / visual feedback */}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[10px] text-neutral-500">0</span>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      step={1}
                      value={currentScore}
                      disabled={isSubmitted}
                      onChange={(e) => handleScoreChange(rubric.id, Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
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
                (Please evaluate all criteria)
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
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
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
                {rubrics.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-neutral-300 py-1 border-b border-neutral-900 last:border-none"
                  >
                    <span className="truncate pr-2">{r.name}</span>
                    <span className="font-bold text-amber-400 shrink-0">
                      {scores[r.id] ?? 0} / {r.max_score}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between text-white font-bold text-sm">
                  <span>FINAL AUTHORITATIVE TOTAL:</span>
                  <span className="text-amber-400">
                    {clientLiveTotal} / {maxPossibleScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback preview */}
            {feedback.trim() && (
              <div className="space-y-1 font-mono text-xs">
                <span className="text-[11px] text-neutral-500 uppercase">FEEDBACK PREVIEW</span>
                <p className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 italic text-[11px] max-h-24 overflow-y-auto">
                  &ldquo;{feedback.trim()}&rdquo;
                </p>
              </div>
            )}

            {/* Permanent lock warning */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Submitting will lock this evaluation permanently. You will not be able to modify scores or feedback after submission.
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
    </div>
  );
}
