"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  JudgingProgressStats,
  DomainJudgingProgress,
  JudgeProgressItem,
} from "@/lib/supabase/types";
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
} from "lucide-react";

export function JudgingOverview() {
  const [stats, setStats] = useState<JudgingProgressStats | null>(null);
  const [domains, setDomains] = useState<DomainJudgingProgress[]>([]);
  const [judges, setJudges] = useState<JudgeProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/judging");
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

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/admin/judging")
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.success) {
          const progress = data.progress as JudgingProgressStats;
          setStats(progress);
          setDomains(progress.domainProgress || []);
          setJudges(progress.judgeProgress || []);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to load progress telemetry.");
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
            <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3">
              <Compass className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                Domain Evaluation Progress
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
              {domains.map((dom) => (
                <div
                  key={dom.domain}
                  className="bg-[#0e0c0a] border border-neutral-800/80 rounded-lg p-3.5 space-y-2 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="font-bold text-neutral-200 text-xs leading-snug line-clamp-2"
                      title={dom.domain}
                    >
                      {dom.domain}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[10px] shrink-0">
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
                </div>
              ))}
            </div>
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
