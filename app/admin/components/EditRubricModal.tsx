"use client";

import { useState, useEffect } from "react";
import type { JudgingRubric } from "@/lib/supabase/types";
import { X, Loader2, AlertCircle, Edit, Award, AlignLeft, Hash } from "lucide-react";

interface EditRubricModalProps {
  rubric: JudgingRubric;
  onClose: () => void;
  onSuccess: (rubric: JudgingRubric) => void;
}

export function EditRubricModal({
  rubric,
  onClose,
  onSuccess,
}: EditRubricModalProps) {
  const [criteriaName, setCriteriaName] = useState(rubric.name);
  const [description, setDescription] = useState(rubric.description || "");
  const [maxScore, setMaxScore] = useState<number>(rubric.max_score);
  const [sortOrder, setSortOrder] = useState<number>(rubric.sort_order);
  const [isActive, setIsActive] = useState(rubric.is_active);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSaving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!criteriaName.trim() || criteriaName.trim().length < 2) {
      setError("Criterion name must be at least 2 characters.");
      return;
    }
    if (isNaN(maxScore) || maxScore <= 0 || maxScore > 100) {
      setError("Maximum score must be a positive integer between 1 and 100.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/rubrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rubric.id,
          name: criteriaName.trim(),
          description: description.trim(),
          max_score: maxScore,
          sort_order: sortOrder,
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update rubric criterion.");
      }

      onSuccess(data.rubric);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update criterion.");
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-rubric-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#12100d] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.12)] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
              <Edit className="w-3 h-3" />
              CRITERION REFINEMENT
            </div>
            <h2
              id="edit-rubric-modal-title"
              className="text-lg sm:text-xl font-bold text-white uppercase font-sans tracking-wide"
            >
              Edit Rubric Criterion
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              Modify rubric title, weighting, or evaluation guidelines.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              CRITERION TITLE <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              value={criteriaName}
              onChange={(e) => setCriteriaName(e.target.value)}
              className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-600 outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-amber-400" />
              DESCRIPTION &amp; EVALUATION GUIDELINES
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-600 outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                MAX SCORE <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                SORT ORDER
              </label>
              <input
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
              />
              <span className="text-neutral-300">Active (Visible in Judge Evaluation Sheets)</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <span>SAVE CHANGES</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
