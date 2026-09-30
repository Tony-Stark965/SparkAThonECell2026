"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Judge, JudgeAssignedTeam, JudgeDashboardStats } from "@/lib/supabase/judge";
import { TeamDossierModal } from "./TeamDossierModal";
import { TeamTimerWidget } from "./TeamTimerWidget";
import {
  Gavel,
  Shield,
  Layers,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  LogOut,
  ArrowRight,
  FileText,
  User,
} from "lucide-react";

interface JudgeDashboardClientProps {
  judge: Judge;
  initialTeams: JudgeAssignedTeam[];
  initialStats: JudgeDashboardStats;
  onLogout: () => Promise<void>;
}

export function JudgeDashboardClient({
  judge,
  initialTeams,
  initialStats,
  onLogout,
}: JudgeDashboardClientProps) {
  const [teams, setTeams] = useState<JudgeAssignedTeam[]>(initialTeams);
  const [stats, setStats] = useState<JudgeDashboardStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "standby" | "in_progress" | "submitted">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDossierTeam, setSelectedDossierTeam] = useState<JudgeAssignedTeam | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/judge/teams", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeams(data.teams || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to refresh judge teams:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTeamStatusChange = (
    teamId: string,
    newStatus: "standby" | "in_progress" | "submitted"
  ) => {
    setTeams((prev) => {
      const updated = prev.map((t) => (t.id === teamId ? { ...t, status: newStatus } : t));
      const completed = updated.filter((t) => t.status === "submitted").length;
      const inProgress = updated.filter((t) => t.status === "in_progress").length;
      setStats((prevStats) => ({
        ...prevStats,
        completed,
        inProgress,
        remaining: Math.max(0, updated.length - completed),
      }));
      return updated;
    });
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      // Status filter
      if (statusFilter !== "ALL" && team.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = team.team_name.toLowerCase().includes(q);
        const matchesCollege = team.college.toLowerCase().includes(q);
        const matchesLeader = team.team_leader_name.toLowerCase().includes(q);
        const matchesMembers = (team.participants || []).some((p) =>
          p.name.toLowerCase().includes(q)
        );
        return matchesName || matchesCollege || matchesLeader || matchesMembers;
      }

      return true;
    });
  }, [teams, statusFilter, searchQuery]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* JUDGE COMMAND CENTER HEADER */}
      <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#14120e] to-[#0d0c09] p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.06)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 font-mono text-xs uppercase tracking-wider">
              <Gavel className="w-3.5 h-3.5" />
              JUDGE COMMAND CENTER
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight font-sans">
              {judge.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <User className="w-3.5 h-3.5 text-amber-500" />
                {judge.email}
              </span>
              <span className="text-neutral-700 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-amber-500/30 bg-amber-950/30 text-amber-400 font-semibold">
                <Layers className="w-3.5 h-3.5" />
                DOMAIN: {judge.domain}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 font-mono text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh assigned roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">REFRESH</span>
            </button>

            <form action={onLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-300 font-mono text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>SIGN OUT</span>
              </button>
            </form>
          </div>
        </div>

        {/* STATISTICS KPI METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-neutral-800/80 font-mono">
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60">
            <div className="text-[11px] uppercase tracking-wider text-neutral-300 flex items-center justify-between">
              <span>ASSIGNED TEAMS</span>
              <Users className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              {stats.assigned}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
            <div className="text-[11px] uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span>COMPLETED</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-400">
              {stats.completed}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
            <div className="text-[11px] uppercase tracking-wider text-amber-300 flex items-center justify-between">
              <span>IN PROGRESS</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-400">
              {stats.inProgress}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60">
            <div className="text-[11px] uppercase tracking-wider text-neutral-300 flex items-center justify-between">
              <span>REMAINING</span>
              <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-300">
              {stats.remaining}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, college, or participant..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#110f0c] border border-neutral-800 focus:border-amber-500/60 text-white placeholder-neutral-600 outline-none transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#110f0c] border border-neutral-800">
          {(
            [
              { key: "ALL", label: `ALL (${teams.length})` },
              { key: "standby", label: `STANDBY (${stats.remaining - stats.inProgress > 0 ? stats.remaining - stats.inProgress : 0})` },
              { key: "in_progress", label: `IN PROGRESS (${stats.inProgress})` },
              { key: "submitted", label: `SUBMITTED (${stats.completed})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === key
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ASSIGNED TEAMS GRID */}
      {filteredTeams.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#110f0c]/60 p-12 text-center space-y-3 font-mono">
          <Shield className="w-10 h-10 text-neutral-600 mx-auto" />
          <p className="text-neutral-300 font-semibold">No assigned teams found.</p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "No teams match your search or status filter. Try clearing filters."
              : `You currently have no teams assigned in domain '${judge.domain}'. The event organizers will allocate teams to your judging squad.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const isSubmitted = team.status === "submitted";
            const isInProgress = team.status === "in_progress";

            return (
              <div
                key={team.id}
                className={`flex flex-col justify-between rounded-2xl border bg-[#110f0c] p-5 sm:p-6 transition-all duration-200 shadow-md ${
                  isSubmitted
                    ? "border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.04)]"
                    : isInProgress
                    ? "border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.08)]"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Team Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold tracking-wider uppercase ${
                        isSubmitted
                          ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-400"
                          : isInProgress
                          ? "bg-amber-950/40 border border-amber-500/40 text-amber-400 animate-pulse"
                          : "bg-neutral-900 border border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {isSubmitted && <CheckCircle2 className="w-3 h-3" />}
                      {isInProgress && <Clock className="w-3 h-3" />}
                      {isSubmitted
                        ? "SUBMITTED"
                        : isInProgress
                        ? "IN PROGRESS"
                        : "STANDBY"}
                    </span>

                    {isSubmitted && team.total_score != null && (
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-300">
                        {team.total_score} / 50
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-sans tracking-tight">
                      {team.team_name}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5 truncate">
                      {team.college}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-neutral-500 text-[11px] uppercase">LEADER</span>
                      <span className="text-neutral-200 font-medium truncate max-w-[180px]">
                        {team.team_leader_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-neutral-500 text-[11px] uppercase">TEAM SIZE</span>
                      <span className="text-neutral-200">{team.participant_count} Members</span>
                    </div>
                  </div>

                  {/* Members Chips */}
                  <div className="pt-2 border-t border-neutral-900/60">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 mb-1.5">
                      MEMBERS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {team.participants && team.participants.length > 0 ? (
                        team.participants.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 truncate max-w-[140px]"
                            title={m.name}
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-600 italic">
                          Roster empty
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Presentation Pitch Timer & Controls (Start / Stop / Reset) */}
                <div className="mt-4 pt-3 border-t border-neutral-900/60">
                  <TeamTimerWidget
                    teamId={team.id}
                    teamStatus={team.status}
                    onStatusChange={(newStatus) => handleTeamStatusChange(team.id, newStatus)}
                    compact
                  />
                </div>

                {/* Team Card Actions */}
                <div className="pt-5 mt-4 border-t border-neutral-900 flex items-center gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedDossierTeam(team)}
                    className="flex-1 py-2 px-3 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-neutral-400" />
                    <span>DOSSIER</span>
                  </button>

                  <Link
                    href={`/judge/team/${team.id}`}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSubmitted
                        ? "border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300"
                        : isInProgress
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black shadow-md hover:shadow-amber-500/20"
                        : "bg-amber-500 hover:bg-amber-400 text-black shadow-sm"
                    }`}
                  >
                    <span>
                      {isSubmitted ? "LOCKED" : isInProgress ? "RESUME" : "START"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Dossier Preview Modal */}
      {selectedDossierTeam && (
        <TeamDossierModal
          team={selectedDossierTeam}
          onClose={() => setSelectedDossierTeam(null)}
        />
      )}
    </div>
  );
}
