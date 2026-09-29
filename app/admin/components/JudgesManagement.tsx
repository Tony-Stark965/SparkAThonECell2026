"use client";

import { useState, useEffect, useCallback } from "react";
import type { JudgeWithDetails, RegistrationRecord, Judge } from "@/lib/supabase/types";
import { OFFICIAL_DOMAINS } from "@/lib/supabase/types";
import { AddJudgeModal } from "./AddJudgeModal";
import { EditJudgeModal } from "./EditJudgeModal";
import { AssignTeamsModal } from "./AssignTeamsModal";
import {
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  Users,
} from "lucide-react";

interface JudgesManagementProps {
  registrations: RegistrationRecord[];
}

export function JudgesManagement({ registrations }: JudgesManagementProps) {
  const [judges, setJudges] = useState<JudgeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<JudgeWithDetails | null>(null);
  const [assigningJudge, setAssigningJudge] = useState<JudgeWithDetails | null>(null);

  const fetchJudges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/judges");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load judges.");
      }
      setJudges(data.judges || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load judges.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJudges();
  };

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/admin/judges")
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.success) {
          setJudges(data.judges || []);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to load judges.");
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

  const handleJudgeAdded = (newJudge: Judge) => {
    setJudges((prev) => [
      {
        ...newJudge,
        assigned_teams_count: 0,
        judged_count: 0,
        remaining_count: 0,
        assigned_registration_ids: [],
      },
      ...prev,
    ]);
    fetchJudges();
  };

  const handleJudgeUpdated = (updatedJudge: Judge) => {
    setJudges((prev) =>
      prev.map((j) => (j.id === updatedJudge.id ? { ...j, ...updatedJudge } : j))
    );
    fetchJudges();
  };

  const handleAssignmentCompleted = () => {
    fetchJudges();
  };

  const toggleJudgeActive = async (judge: JudgeWithDetails) => {
    try {
      const nextActive = !judge.is_active;
      // Optimistic update
      setJudges((prev) =>
        prev.map((j) => (j.id === judge.id ? { ...j, is_active: nextActive } : j))
      );

      const res = await fetch("/api/admin/judges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: judge.id,
          is_active: nextActive,
        }),
      });

      if (!res.ok) {
        // Rollback
        fetchJudges();
      }
    } catch {
      fetchJudges();
    }
  };

  // Telemetry Metrics
  const totalJudges = judges.length;
  const activeJudges = judges.filter((j) => j.is_active).length;
  const totalAssignedTeams = judges.reduce((sum, j) => sum + (j.assigned_teams_count || 0), 0);
  const coveredDomains = new Set(judges.map((j) => j.domain)).size;

  // Filtered List
  const filteredJudges = judges.filter((j) => {
    if (domainFilter !== "ALL" && j.domain !== domainFilter) {
      return false;
    }
    if (statusFilter === "ACTIVE" && !j.is_active) {
      return false;
    }
    if (statusFilter === "INACTIVE" && j.is_active) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = j.name.toLowerCase().includes(q);
      const matchEmail = j.email.toLowerCase().includes(q);
      const matchDomain = j.domain.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDomain) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12100d] border border-amber-500/25 rounded-xl p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <Shield className="w-3 h-3" />
            JUDGES ROSTER &amp; DOMAIN ASSIGNMENT
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            Official Evaluators Directory
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            Manage official domain evaluators, assign squads, and govern evaluation credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh judges list"
            aria-label="Refresh judges list"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
            />
          </button>

          <a
            href="/judge/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            title="Open Judge Portal in new tab"
          >
            <span>JUDGE PORTAL ↗</span>
          </a>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>ADD NEW JUDGE</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
        <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
            TOTAL JUDGES
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{totalJudges}</span>
            <Users className="w-4 h-4 text-neutral-600" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
            ACTIVE EVALUATORS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{activeJudges}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
            SQUADS ALLOCATED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{totalAssignedTeams}</span>
            <Layers className="w-4 h-4 text-amber-500/60" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
            DOMAINS COVERED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400">
              {coveredDomains} / {OFFICIAL_DOMAINS.length}
            </span>
            <Filter className="w-4 h-4 text-cyan-500/60" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200 uppercase tracking-wider block">
              JUDGES OPERATIONAL NOTICE
            </span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by judge name, email, or domain..."
              className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl pl-9 pr-4 py-2 text-white placeholder-neutral-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0a0907] border border-neutral-800 rounded-xl px-2.5 py-1">
              <span className="text-neutral-500 text-[11px]">Domain:</span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-neutral-900 text-white">
                  All Domains ({judges.length})
                </option>
                {OFFICIAL_DOMAINS.map((dom) => (
                  <option key={dom} value={dom} className="bg-neutral-900 text-white">
                    {dom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0a0907] border border-neutral-800 rounded-xl px-2.5 py-1">
              <span className="text-neutral-500 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                className="bg-transparent text-white outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-neutral-900 text-white">
                  All Status
                </option>
                <option value="ACTIVE" className="bg-neutral-900 text-white">
                  Active
                </option>
                <option value="INACTIVE" className="bg-neutral-900 text-white">
                  Inactive
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Judges Table / Grid */}
      <div className="bg-[#12100d] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400 font-mono text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span>Accessing official evaluator directory...</span>
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3 font-mono text-xs">
            <Users className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-neutral-300 font-semibold text-sm">No Judges Found</p>
            <p className="text-neutral-500 max-w-sm mx-auto text-[11px]">
              {judges.length === 0
                ? "No official judges have been onboarded yet. Click 'Add New Judge' to register the first evaluator."
                : "No evaluators match the active search or domain filter criteria."}
            </p>
            {judges.length === 0 && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Onboard First Judge</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-[#0a0907] text-neutral-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Judge Evaluator</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Domain</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Squads Assigned</th>
                  <th className="py-3.5 px-4 font-semibold">Progress</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredJudges.map((judge) => {
                  const assignedCount = judge.assigned_teams_count || 0;
                  const completedCount = judge.judged_count || 0;
                  const progressPct =
                    assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

                  return (
                    <tr
                      key={judge.id}
                      className="hover:bg-neutral-900/40 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block text-sm">
                            {judge.name}
                          </span>
                          <span className="text-neutral-400 text-[11px]">
                            {judge.email}
                          </span>
                        </div>
                      </td>

                      {/* Domain */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium text-[11px]">
                          {judge.domain}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => toggleJudgeActive(judge)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                            judge.is_active
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          }`}
                          title="Click to toggle active status"
                        >
                          {judge.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>ACTIVE</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>INACTIVE</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Squads Assigned */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setAssigningJudge(judge)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold text-amber-400">{assignedCount}</span>
                          <span className="text-neutral-400">squads</span>
                        </button>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-400">
                              {completedCount}/{assignedCount} judged
                            </span>
                            <span className="font-bold text-neutral-300">
                              {progressPct}%
                            </span>
                          </div>
                          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setAssigningJudge(judge)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Assign Squads"
                            aria-label={`Assign Squads to ${judge.name}`}
                          >
                            <Layers className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingJudge(judge)}
                            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Edit Judge Details"
                            aria-label={`Edit ${judge.name}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddOpen && (
        <AddJudgeModal
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleJudgeAdded}
        />
      )}

      {editingJudge && (
        <EditJudgeModal
          judge={editingJudge}
          onClose={() => setEditingJudge(null)}
          onSuccess={handleJudgeUpdated}
        />
      )}

      {assigningJudge && (
        <AssignTeamsModal
          judge={assigningJudge}
          registrations={registrations}
          onClose={() => setAssigningJudge(null)}
          onSuccess={handleAssignmentCompleted}
        />
      )}
    </div>
  );
}
