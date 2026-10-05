"use client";

import { useState, useEffect, useCallback } from "react";
import type { TeamResultRank } from "@/lib/supabase/types";
import { OFFICIAL_DOMAINS } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy,
  Medal,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Crown,
} from "lucide-react";

export function JudgingResults() {
  const [selectedDomain, setSelectedDomain] = useState<string>(OFFICIAL_DOMAINS[0]);
  const [results, setResults] = useState<TeamResultRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async (domain: string) => {
    try {
      const res = await fetch(`/api/admin/results?domain=${encodeURIComponent(domain)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load domain results.");
      }
      setResults(data.results || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchResults(selectedDomain);
  };

  // Fetch when selectedDomain changes
  useEffect(() => {
    let ignore = false;
    fetch(`/api/admin/results?domain=${encodeURIComponent(selectedDomain)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success) {
          setResults(data.results || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load results.");
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
  }, [selectedDomain]);

  // Real-time synchronization when any evaluation is submitted or updated
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin_judging_results_${selectedDomain}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "judging_evaluations",
        },
        () => {
          fetchResults(selectedDomain);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDomain, fetchResults]);

  // Safe results array guard
  const safeResults = Array.isArray(results) ? results : [];
  const evaluatedTeams = safeResults.filter((r) => r && r.evaluation_count > 0);
  const topTeam = evaluatedTeams.length > 0 ? evaluatedTeams[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12100d] border border-amber-500/25 rounded-xl p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <Trophy className="w-3 h-3" />
            STANDINGS &amp; DOMAIN LEADERBOARDS
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            Domain Results &amp; Rankings
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            Real-time standings computed strictly from official judge evaluations.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
          title="Refresh rankings"
          aria-label="Refresh rankings"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
          />
        </button>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3 overflow-x-auto">
        {OFFICIAL_DOMAINS.map((domain) => {
          const isSelected = selectedDomain === domain;
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3.5 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-[#12100d] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800"
              }`}
            >
              {domain}
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200 uppercase tracking-wider block">
              RESULTS NOTICE
            </span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400 font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span>Computing domain standings...</span>
        </div>
      ) : safeResults.length === 0 ? (
        <div className="bg-[#12100d] border border-amber-500/25 rounded-2xl p-12 text-center space-y-3 font-mono text-xs shadow-lg">
          <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider font-sans">
            EVALUATIONS PENDING
          </h3>
          <p className="text-neutral-400 max-w-md mx-auto text-xs">
            Scorecards for &quot;{selectedDomain}&quot; will appear here once submitted by judges.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Winner Spotlight */}
          {topTeam && (
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-[#16120b] to-[#12100d] border-2 border-amber-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.15)] font-mono text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <Crown className="w-6 h-6 animate-pulse text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/40">
                      RANK #1 // CURRENT DOMAIN LEADER
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white uppercase font-sans">
                      {topTeam.team_name}
                    </h3>
                    <p className="text-neutral-400 text-xs">
                      Institution: <span className="text-white font-medium">{topTeam.college}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:self-center border-t sm:border-t-0 sm:border-l border-neutral-800 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="space-y-0.5 text-center">
                    <span className="text-[10px] uppercase text-neutral-500">AVERAGE SCORE</span>
                    <span className="text-2xl font-bold text-amber-400 block">
                      {topTeam.average_score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      / {topTeam.max_possible_score} pts
                    </span>
                  </div>

                  <div className="space-y-0.5 text-center">
                    <span className="text-[10px] uppercase text-neutral-500">TOTAL SCORE</span>
                    <span className="text-2xl font-bold text-white block">
                      {topTeam.evaluations.reduce((s, e) => s + e.total_score, 0)}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {topTeam.evaluation_count} review{topTeam.evaluation_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table (Strictly Submitted Evaluations) */}
          <div className="bg-[#12100d] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-800 bg-[#0a0907] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Official Domain Leaderboard ({safeResults.length} Evaluated)
                </h3>
              </div>
              <span className="font-mono text-xs text-neutral-400">
                {safeResults.length} Submitted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#0a0907]/50 text-neutral-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold text-center w-16">Rank</th>
                    <th className="py-3 px-4 font-semibold">Squad</th>
                    <th className="py-3 px-4 font-semibold">Institution</th>
                    <th className="py-3 px-4 font-semibold text-center">Evaluations</th>
                    <th className="py-3 px-4 font-semibold text-right">Avg Score</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Score</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {safeResults.map((team, idx) => {
                    const totalScore = team.evaluations.reduce((s, e) => s + e.total_score, 0);

                    return (
                      <tr
                        key={team.team_id}
                        className={`hover:bg-neutral-900/40 transition-colors ${
                          idx === 0 ? "bg-amber-500/5 font-medium" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          {team.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs">
                              1
                            </span>
                          ) : team.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-300/10 border border-neutral-300/30 text-neutral-200 font-bold text-xs">
                              2
                            </span>
                          ) : team.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700/30 text-amber-500 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-bold text-xs">#{team.rank}</span>
                          )}
                        </td>

                        {/* Squad Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block text-sm">
                            {team.team_name}
                          </span>
                        </td>

                        {/* College / Institution */}
                        <td className="py-3.5 px-4 text-neutral-300">
                          {team.college}
                        </td>

                        {/* Evaluations Count */}
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span className="text-amber-400">{team.evaluation_count}</span>
                        </td>

                        {/* Avg Score */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-amber-300">
                            {team.average_score.toFixed(1)}
                          </span>
                        </td>

                        {/* Total Score */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-white text-sm">
                            {totalScore}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            SUBMITTED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
