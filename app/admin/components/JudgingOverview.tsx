"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  JudgingProgressStats,
  DomainJudgingProgress,
  JudgeProgressItem,
} from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  RefreshCw,
  Users,
  Layers,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle,
  Compass,
  X,
  FileText,
  Radio,
} from "lucide-react";

export function JudgingOverview() {
  const [stats, setStats] = useState<JudgingProgressStats | null>(null);
  const [domains, setDomains] = useState<DomainJudgingProgress[]>([]);
  const [judges, setJudges] = useState<JudgeProgressItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/judging", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load judging telemetry.");
      }
      const progress = data.progress as JudgingProgressStats;
      setStats(progress);
      setDomains(progress.domainProgress || []);
      setJudges(progress.judgeProgress || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress telemetry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProgress();
  };

  // Initial load
  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/judging", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success) {
          const progress = data.progress as JudgingProgressStats;
          setStats(progress);
          setDomains(progress.domainProgress || []);
          setJudges(progress.judgeProgress || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load progress telemetry.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Real-time synchronization across connected devices
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin_judging_telemetry_live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "judging_evaluations",
        },
        () => {
          fetchProgress();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "judge_team_assignments",
        },
        () => {
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProgress]);

  const totalAssigned = stats?.totalAssignedTeams ?? 0;
  const totalJudged = stats?.totalJudged ?? 0;
  const overallRate = totalAssigned > 0 ? Math.round((totalJudged / totalAssigned) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12100d] border border-amber-500/25 rounded-xl p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <Activity className="w-3 h-3" />
            LIVE EVALUATION TELEMETRY
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            Judging Operations Telemetry
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            Real-time tracking of squad evaluations, judge workloads, and domain completion rates.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
          title="Refresh judging telemetry"
          aria-label="Refresh judging telemetry"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
          />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200 uppercase tracking-wider block">
              TELEMETRY NOTICE
            </span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400 font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span>Polling judging operations stream...</span>
        </div>
      ) : (
        <>
          {/* Top 5 Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
            <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
              <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
                TOTAL JUDGES
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">
                  {stats?.totalJudges ?? 0}
                </span>
                <Users className="w-4 h-4 text-neutral-600" />
              </div>
            </div>

            <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
              <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
                ASSIGNED SQUADS
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-400">
                  {stats?.totalAssignedTeams ?? 0}
                </span>
                <Layers className="w-4 h-4 text-amber-500/60" />
              </div>
            </div>

            <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
              <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
                COMPLETED
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-400">
                  {stats?.totalJudged ?? 0}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
              </div>
            </div>

            <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-1">
              <span className="text-neutral-500 uppercase tracking-wider text-[11px] block">
                PENDING
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-300">
                  {stats?.totalRemaining ?? 0}
                </span>
                <Clock className="w-4 h-4 text-amber-500/60" />
              </div>
            </div>

            <div className="bg-[#12100d] border border-amber-500/20 bg-amber-950/10 rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-amber-500/80 uppercase tracking-wider text-[11px] block">
                OVERALL PROGRESS
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-400">
                  {overallRate}%
                </span>
                <BarChart3 className="w-4 h-4 text-amber-500/60" />
              </div>
            </div>
          </div>

          {/* Domain Breakdown Grid */}
          <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  Domain Evaluation Progress
                </h3>
              </div>
              <span className="font-mono text-[11px] text-neutral-400">
                Click any domain card to inspect live team breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
              {domains.map((dom) => {
                const isSelected = selectedDomain === dom.domain;
                return (
                  <button
                    key={dom.domain}
                    type="button"
                    onClick={() =>
                      setSelectedDomain((prev) => (prev === dom.domain ? null : dom.domain))
                    }
                    className={`text-left rounded-lg p-3.5 space-y-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#181410] border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "bg-[#0e0c0a] border border-neutral-800/80 hover:border-amber-500/50 hover:bg-[#14110d]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`font-bold text-xs leading-snug line-clamp-2 ${
                          isSelected ? "text-amber-400" : "text-neutral-200"
                        }`}
                        title={dom.domain}
                      >
                        {dom.domain}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0 ${
                          isSelected
                            ? "bg-amber-500 text-black"
                            : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                        }`}
                      >
                        {dom.progressPercent}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 text-[11px]">
                      <span className="text-neutral-400">
                        {dom.judged} / {dom.totalTeams} judged
                      </span>
                      <span className="text-neutral-500">{dom.remaining} left</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${dom.progressPercent}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      <span>{isSelected ? "Active breakdown ▲" : "View breakdown ▼"}</span>
                      <span className="text-neutral-400 font-semibold">{dom.totalTeams} squads</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Domain Live Team Breakdown Panel */}
            {selectedDomain && (() => {
              const activeDomain = domains.find((d) => d.domain === selectedDomain);
              if (!activeDomain) return null;

              return (
                <div className="mt-4 rounded-xl border border-amber-500/40 bg-[#0d0b09] p-5 space-y-4 shadow-lg animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                          LIVE BREAKDOWN
                        </span>
                        <h4 className="font-sans text-base font-bold text-white tracking-wide">
                          {activeDomain.domain}
                        </h4>
                      </div>
                      <p className="text-neutral-400 text-xs font-mono">
                        Authoritative live evaluation telemetry for this domain
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDomain(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono cursor-pointer self-start sm:self-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>CLOSE</span>
                    </button>
                  </div>

                  {/* Live Status Counter Pills */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <div className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-200 flex items-center gap-1.5">
                      <span className="text-neutral-400 uppercase text-[10px]">TOTAL:</span>
                      <span className="font-bold">{activeDomain.totalTeams}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-emerald-500 uppercase text-[10px]">SUBMITTED:</span>
                      <span className="font-bold">{activeDomain.submittedCount ?? activeDomain.judged}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/30 text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span className="text-amber-500 uppercase text-[10px]">IN PROGRESS:</span>
                      <span className="font-bold">{activeDomain.inProgressCount ?? 0}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-950/30 text-sky-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-sky-500 uppercase text-[10px]">DRAFT:</span>
                      <span className="font-bold">{activeDomain.draftCount ?? 0}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="text-neutral-500 uppercase text-[10px]">STANDBY:</span>
                      <span className="font-bold">{activeDomain.notStartedCount ?? activeDomain.remaining}</span>
                    </div>
                  </div>

                  {/* Teams Table */}
                  <div className="overflow-x-auto rounded-lg border border-neutral-800">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Team Name</th>
                          <th className="py-2.5 px-3">College</th>
                          <th className="py-2.5 px-3">Assigned Judge</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 bg-[#0e0c0a]">
                        {activeDomain.teams && activeDomain.teams.length > 0 ? (
                          activeDomain.teams.map((t, idx) => (
                            <tr key={t.team_id} className="hover:bg-neutral-900/40 transition-colors">
                              <td className="py-2.5 px-3 text-neutral-500">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{t.team_name}</td>
                              <td className="py-2.5 px-3 text-neutral-400">{t.college}</td>
                              <td className="py-2.5 px-3 text-neutral-300">
                                <span className="inline-flex items-center gap-1">
                                  <Users className="w-3 h-3 text-amber-500" />
                                  {t.judge_name}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {t.status === "SUBMITTED" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                    <CheckCircle2 className="w-3 h-3" />
                                    SUBMITTED
                                  </span>
                                )}
                                {t.status === "IN PROGRESS" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/40 bg-amber-950/40 text-amber-400 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                                    <Clock className="w-3 h-3" />
                                    IN PROGRESS
                                  </span>
                                )}
                                {t.status === "DRAFT" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-sky-500/40 bg-sky-950/40 text-sky-400 font-bold text-[10px] uppercase tracking-wider">
                                    <FileText className="w-3 h-3" />
                                    DRAFT
                                  </span>
                                )}
                                {t.status === "NOT STARTED" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 text-[10px] uppercase tracking-wider">
                                    STANDBY
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold">
                                {t.total_score != null ? (
                                  <span className="text-emerald-400">{t.total_score} / 50</span>
                                ) : (
                                  <span className="text-neutral-600">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-neutral-500 italic">
                              No squads registered under this domain.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Judges Workload & Progress Table */}
          <div className="bg-[#12100d] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-800 bg-[#0a0907] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Evaluator Workload &amp; Status
                </h3>
              </div>
              <span className="font-mono text-xs text-neutral-400">
                {judges.length} Active Evaluators
              </span>
            </div>

            {judges.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 font-mono text-xs">
                No active judge telemetry recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-[#0a0907]/50 text-neutral-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Judge</th>
                      <th className="py-3 px-4 font-semibold">Domain</th>
                      <th className="py-3 px-4 font-semibold text-center">Assigned</th>
                      <th className="py-3 px-4 font-semibold text-center">Judged</th>
                      <th className="py-3 px-4 font-semibold text-center">Pending</th>
                      <th className="py-3 px-4 font-semibold min-w-[150px]">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {judges.map((j) => (
                      <tr
                        key={j.judge.id}
                        className="hover:bg-neutral-900/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">
                            {j.judge.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {j.judge.email}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]">
                            {j.judge.domain}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-400">
                          {j.assignedCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {j.judgedCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-neutral-400">
                          {j.remainingCount}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-neutral-400">
                                {j.progressPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${j.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
