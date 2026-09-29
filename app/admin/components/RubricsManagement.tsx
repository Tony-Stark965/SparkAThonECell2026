"use client";

import { useState, useEffect, useCallback } from "react";
import type { JudgingRubric } from "@/lib/supabase/types";
import { AddRubricModal } from "./AddRubricModal";
import { EditRubricModal } from "./EditRubricModal";
import {
  Award,
  PlusCircle,
  RefreshCw,
  Edit,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react";

export function RubricsManagement() {
  const [rubrics, setRubrics] = useState<JudgingRubric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<JudgingRubric[] | JudgingRubric | null>(null);

  const fetchRubrics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rubrics");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load judging rubrics.");
      }
      setRubrics(data.rubrics || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rubrics.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRubrics();
  };

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/admin/rubrics")
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.success) {
          setRubrics(data.rubrics || []);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to load rubrics.");
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleRubricAdded = (newRubric: JudgingRubric) => {
    setRubrics((prev) => [...prev, newRubric].sort((a, b) => a.sort_order - b.sort_order));
    fetchRubrics();
  };

  const handleRubricUpdated = (updatedRubric: JudgingRubric) => {
    setRubrics((prev) =>
      prev
        .map((r) => (r.id === updatedRubric.id ? updatedRubric : r))
        .sort((a, b) => a.sort_order - b.sort_order)
    );
    fetchRubrics();
  };

  const toggleRubricActive = async (rubric: JudgingRubric) => {
    const nextActive = !rubric.is_active;
    setRubrics((prev) =>
      prev.map((r) => (r.id === rubric.id ? { ...r, is_active: nextActive } : r))
    );

    try {
      const res = await fetch("/api/admin/rubrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rubric.id,
          is_active: nextActive,
        }),
      });

      if (!res.ok) {
        fetchRubrics();
      }
    } catch {
      fetchRubrics();
    }
  };

  const moveOrder = async (index: number, direction: "UP" | "DOWN") => {
    if (
      (direction === "UP" && index === 0) ||
      (direction === "DOWN" && index === rubrics.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const newRubrics = [...rubrics];
    const current = newRubrics[index];
    const target = newRubrics[targetIndex];

    // Swap sort orders
    const tempOrder = current.sort_order;
    current.sort_order = target.sort_order;
    target.sort_order = tempOrder;

    // Swap positions in array
    newRubrics[index] = target;
    newRubrics[targetIndex] = current;

    setRubrics(newRubrics);

    try {
      await fetch("/api/admin/rubrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reorder: [
            { id: current.id, sort_order: current.sort_order },
            { id: target.id, sort_order: target.sort_order },
          ],
        }),
      });
    } catch {
      fetchRubrics();
    }
  };

  // Metrics
  const activeRubrics = rubrics.filter((r) => r.is_active);
  const totalMaxScore = activeRubrics.reduce((sum, r) => sum + r.max_score, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12100d] border border-amber-500/25 rounded-xl p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <Award className="w-3 h-3" />
            STANDARDIZED EVALUATION BENCHMARKS
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            Judging Rubrics &amp; Criteria
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            Define standardized scorecards and evaluation guidelines across all hackathon domains.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh rubrics list"
            aria-label="Refresh rubrics list"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD CRITERION</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
        <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
            TOTAL CRITERIA
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{rubrics.length}</span>
            <BookOpen className="w-4 h-4 text-neutral-600" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
            ACTIVE IN SCORECARD
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{activeRubrics.length}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-amber-500/20 bg-amber-950/10 rounded-xl p-4 space-y-1">
          <span className="text-amber-500/80 uppercase tracking-wider text-[11px] block">
            TOTAL SCORE CAPACITY
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{totalMaxScore} pts</span>
            <Sparkles className="w-4 h-4 text-amber-500/60" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200 uppercase tracking-wider block">
              RUBRICS NOTICE
            </span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Rubrics List */}
      <div className="bg-[#12100d] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400 font-mono text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span>Loading evaluation criteria...</span>
          </div>
        ) : rubrics.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3 font-mono text-xs">
            <Award className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-neutral-300 font-semibold text-sm">No Rubric Criteria Configured</p>
            <p className="text-neutral-500 max-w-sm mx-auto text-[11px]">
              Add criteria like Innovation, Technical Feasibility, UI/UX, and Presentation to standardize evaluation.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Criterion</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {rubrics.map((rubric, index) => (
              <div
                key={rubric.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-900/30 transition-colors group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Order badge & reorder controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-bold text-xs text-amber-400">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveOrder(index, "UP")}
                        disabled={index === 0}
                        className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrder(index, "DOWN")}
                        disabled={index === rubrics.length - 1}
                        className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {rubric.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                        MAX {rubric.max_score} PTS
                      </span>
                    </div>
                    {rubric.description && (
                      <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                        {rubric.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 shrink-0 sm:self-center font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => toggleRubricActive(rubric)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                      rubric.is_active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                    }`}
                    title="Toggle active status"
                  >
                    {rubric.is_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-neutral-500" />
                        <span>INACTIVE</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRubric(rubric)}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Edit Criterion"
                    aria-label={`Edit ${rubric.name}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddOpen && (
        <AddRubricModal
          currentCount={rubrics.length}
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleRubricAdded}
        />
      )}

      {editingRubric && !Array.isArray(editingRubric) && (
        <EditRubricModal
          rubric={editingRubric}
          onClose={() => setEditingRubric(null)}
          onSuccess={handleRubricUpdated}
        />
      )}
    </div>
  );
}
