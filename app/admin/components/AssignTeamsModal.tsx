"use client";

import { useState, useEffect } from "react";
import type {
  JudgeWithDetails,
  Judge,
  RegistrationRecord,
  JudgeTeamAssignment,
  OfficialDomain,
} from "@/lib/supabase/types";
import { OFFICIAL_DOMAIN_CAPACITIES } from "@/lib/supabase/types";
import {
  X,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  Layers,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface AssignTeamsModalProps {
  judge: JudgeWithDetails | Judge;
  registrations: RegistrationRecord[];
  onClose: () => void;
  onSuccess: (assignedCount: number) => void;
}

export function AssignTeamsModal({
  judge,
  registrations,
  onClose,
  onSuccess,
}: AssignTeamsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [otherAssignments, setOtherAssignments] = useState<
    Map<string, { judgeId: string; judgeName: string }>
  >(new Map());
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Domain capacity limit
  const domainCapacity =
    OFFICIAL_DOMAIN_CAPACITIES[judge.domain as OfficialDomain] || 10;

  // Filter registrations strictly by the judge's domain
  const domainTeams = registrations.filter(
    (r) =>
      (r.domain || "").trim().toLowerCase() ===
      judge.domain.trim().toLowerCase()
  );

  // Fetch current assignments on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchAssignmentsAndJudges() {
      setIsLoadingAssignments(true);
      setError(null);
      try {
        const [assignRes, judgesRes] = await Promise.all([
          fetch(`/api/admin/assignments`),
          fetch(`/api/admin/judges`),
        ]);

        const [assignData, judgesData] = await Promise.all([
          assignRes.json(),
          judgesRes.json(),
        ]);

        if (isMounted) {
          const allJudges = (judgesData.judges || []) as Judge[];
          const judgeMap = new Map(allJudges.map((j) => [j.id, j.name]));

          const myIds = new Set<string>();
          const otherMap = new Map<
            string,
            { judgeId: string; judgeName: string }
          >();

          for (const a of (assignData.assignments ||
            []) as JudgeTeamAssignment[]) {
            if (a.judge_id === judge.id) {
              myIds.add(a.registration_id);
            } else {
              otherMap.set(a.registration_id, {
                judgeId: a.judge_id,
                judgeName: judgeMap.get(a.judge_id) || "Another Judge",
              });
            }
          }

          setSelectedIds(myIds);
          setOtherAssignments(otherMap);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load assignments directory."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAssignments(false);
        }
      }
    }

    fetchAssignmentsAndJudges();
    return () => {
      isMounted = false;
    };
  }, [judge.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSaving]);

  const toggleTeam = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const filteredIds = filteredTeams.map((t) => t.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) {
        next.add(id);
      }
      return next;
    });
  };

  const deselectAll = () => {
    const filteredIds = new Set(filteredTeams.map((t) => t.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId: judge.id,
          registrationIds: Array.from(selectedIds),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update team assignments.");
      }

      onSuccess(data.count ?? selectedIds.size);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save team assignments."
      );
      setIsSaving(false);
    }
  };

  // Filter domain teams by search query
  const filteredTeams = domainTeams.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.team_name.toLowerCase().includes(q) ||
      t.team_leader_name.toLowerCase().includes(q) ||
      t.college.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-teams-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#12100d] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 space-y-2 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
                <Layers className="w-3 h-3" />
                SQUAD ALLOCATION DISPATCH
              </div>
              <h2
                id="assign-teams-modal-title"
                className="text-lg sm:text-xl font-bold text-white uppercase font-sans tracking-wide"
              >
                Assign Teams to Judge
              </h2>
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

          {/* Judge Context Summary & Domain Capacity */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white font-semibold">{judge.name}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">{judge.email}</span>
              <span className="text-neutral-500">•</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                {judge.domain}
              </span>
            </div>

            <div className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]">
              Sector Capacity:{" "}
              <strong className="text-amber-400">{domainTeams.length}</strong> /{" "}
              {domainCapacity} Squads
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 text-xs font-mono flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Bulk Controls */}
        <div className="p-4 sm:px-6 border-b border-neutral-800/80 bg-[#0d0c0a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${domainTeams.length} teams in ${judge.domain}...`}
              className="w-full bg-[#161310] border border-neutral-800 focus:border-amber-500/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
            <span className="text-amber-400 font-bold px-1">
              {selectedIds.size} / {domainTeams.length} Selected
            </span>
          </div>
        </div>

        {/* Teams List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 min-h-[220px]">
          {isLoadingAssignments ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400 font-mono text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Retrieving current judge assignments...</span>
            </div>
          ) : domainTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400 font-mono text-xs space-y-2">
              <Layers className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-neutral-300 font-medium">
                No Squads Registered in This Domain
              </p>
              <p className="text-neutral-500 text-[11px] max-w-sm">
                There are currently no teams registered under the &quot;
                {judge.domain}&quot; domain.
              </p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 font-mono text-xs">
              No teams match your search &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeams.map((team) => {
                const isSelected = selectedIds.has(team.id);
                const other = otherAssignments.get(team.id);

                return (
                  <div
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer font-mono text-xs select-none ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 text-white"
                        : "bg-[#0d0c0a] border-neutral-800/80 text-neutral-300 hover:border-neutral-700 hover:bg-[#151310]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="shrink-0 text-amber-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate text-xs sm:text-sm">
                            {team.team_name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-neutral-400 text-[10px] shrink-0 truncate max-w-[120px]">
                            {team.college}
                          </span>
                        </div>
                        <div className="text-neutral-400 text-[11px] truncate flex items-center gap-1.5 pt-0.5">
                          <span>Leader: {team.team_leader_name}</span>
                          <span className="text-neutral-600">•</span>
                          <span>{team.participant_count} members</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {other && !isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 border border-neutral-700 text-neutral-400">
                          Assigned to: {other.judgeName}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                          team.payment_status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {team.payment_status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-neutral-800 bg-[#0d0c0a] flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Domain boundary safety active: only {judge.domain} teams displayed.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || isLoadingAssignments}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Save Assignments ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
