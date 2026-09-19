"use client";

import { useState, useMemo } from "react";
import type {
  RegistrationRecord,
  AttendanceStatus,
} from "@/lib/supabase/types";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  UserCheck,
  Building2,
  Sparkles,
} from "lucide-react";

interface AttendanceRegisterProps {
  registrations: RegistrationRecord[];
  attendanceMap: Record<string, AttendanceStatus>;
  onAttendanceUpdated: (key: string, status: AttendanceStatus) => void;
}

type StatusFilter = "ALL" | "PRESENT" | "ABSENT" | "NOT_MARKED";
type TeamFilter = "ALL_TEAMS" | "UNMARKED_ONLY";

export function AttendanceRegister({
  registrations,
  attendanceMap,
  onAttendanceUpdated,
}: AttendanceRegisterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL_TEAMS");
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle individual team roster expansion
  const toggleTeamCollapse = (teamId: string) => {
    setCollapsedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  // Expand all / collapse all
  const expandAll = () => setCollapsedTeams({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    registrations.forEach((r) => {
      allCollapsed[r.id] = true;
    });
    setCollapsedTeams(allCollapsed);
  };

  // Handle participant status toggle
  const handleStatusClick = async (
    reg: RegistrationRecord,
    index: number,
    targetStatus: "present" | "absent"
  ) => {
    const key = `${reg.id}_${index}`;
    const currentStatus = attendanceMap[key] || "not_marked";
    const nextStatus: AttendanceStatus =
      currentStatus === targetStatus ? "not_marked" : targetStatus;

    // Optimistic update
    onAttendanceUpdated(key, nextStatus);
    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    setErrorMessage(null);

    const participant = reg.participants?.[index];
    const name = participant?.name || (index === 0 ? reg.team_leader_name : `Member ${index + 1}`);
    const rollNo = participant?.roll_no || (index === 0 ? reg.team_leader_roll_no : null);

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: reg.id,
          participantIndex: index,
          participantName: name,
          participantRollNo: rollNo,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save attendance.");
      }
    } catch (err) {
      // Revert optimistic update on failure
      onAttendanceUpdated(key, currentStatus);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to save attendance. Please check connection and try again."
      );
    } finally {
      setSavingKeys((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Compute Live Metrics
  const metrics = useMemo(() => {
    let totalParticipants = 0;
    let presentCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;
    let completedTeamsCount = 0;

    for (const reg of registrations) {
      const pCount = reg.participants?.length || Number(reg.participant_count) || 0;
      totalParticipants += pCount;

      let allMarked = pCount > 0;

      for (let i = 0; i < pCount; i++) {
        const key = `${reg.id}_${i}`;
        const status = attendanceMap[key] || "not_marked";
        if (status === "present") presentCount++;
        else if (status === "absent") absentCount++;
        else {
          unmarkedCount++;
          allMarked = false;
        }
      }

      if (allMarked && pCount > 0) completedTeamsCount++;
    }

    return {
      totalParticipants,
      presentCount,
      absentCount,
      unmarkedCount,
      completedTeamsCount,
    };
  }, [registrations, attendanceMap]);

  // Filtered registrations
  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return registrations.filter((reg) => {
      const pCount = reg.participants?.length || Number(reg.participant_count) || 0;

      // Calculate team-level attendance status for filtering
      let hasUnmarked = false;
      let hasPresent = false;
      let hasAbsent = false;

      for (let i = 0; i < pCount; i++) {
        const key = `${reg.id}_${i}`;
        const s = attendanceMap[key] || "not_marked";
        if (s === "present") hasPresent = true;
        else if (s === "absent") hasAbsent = true;
        else hasUnmarked = true;
      }

      // Team filter (unmarked only)
      if (teamFilter === "UNMARKED_ONLY" && !hasUnmarked) {
        return false;
      }

      // Status filter
      if (statusFilter === "PRESENT" && !hasPresent) return false;
      if (statusFilter === "ABSENT" && !hasAbsent) return false;
      if (statusFilter === "NOT_MARKED" && !hasUnmarked) return false;

      // Search query
      if (!q) return true;

      const teamMatch = (reg.team_name || "").toLowerCase().includes(q);
      const collegeMatch = (reg.college || "").toLowerCase().includes(q);
      const domainMatch = (reg.domain || "").toLowerCase().includes(q);
      const leaderMatch =
        (reg.team_leader_name || "").toLowerCase().includes(q) ||
        (reg.team_leader_roll_no || "").toLowerCase().includes(q);

      const participantMatch = (reg.participants || []).some(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.roll_no || "").toLowerCase().includes(q)
      );

      return teamMatch || collegeMatch || domainMatch || leaderMatch || participantMatch;
    });
  }, [registrations, attendanceMap, searchQuery, statusFilter, teamFilter]);

  return (
    <div className="space-y-6">
      {/* Attendance Header & Title */}
      <div className="bg-[#12100d] border border-amber-500/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.05)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            EVENT DAY // LIVE CHECK-IN
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white uppercase">
            ATTENDANCE REGISTER
          </h2>
          <p className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
            SPARK-A-THON 2026 • PARTICIPANT VERIFICATION &amp; SEATING
          </p>
        </div>

        {/* Global Expand/Collapse buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Top Attendance Telemetry: 5 Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#12100d] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase font-semibold">
              TOTAL PARTICIPANTS
            </span>
            <div className="p-1.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-800">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {metrics.totalParticipants}
          </div>
          <p className="font-mono text-xs text-neutral-400 mt-1">Expected attendees</p>
        </div>

        <div className="bg-[#12100d] border border-emerald-950/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs tracking-widest text-emerald-400 uppercase font-semibold">
              PRESENT
            </span>
            <div className="p-1.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {metrics.presentCount}
          </div>
          <p className="font-mono text-xs text-emerald-400/70 mt-1">Checked in at venue</p>
        </div>

        <div className="bg-[#12100d] border border-red-950/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs tracking-widest text-red-400 uppercase font-semibold">
              ABSENT
            </span>
            <div className="p-1.5 rounded-md bg-red-950/40 text-red-400 border border-red-500/30">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-red-400">
            {metrics.absentCount}
          </div>
          <p className="font-mono text-xs text-red-400/70 mt-1">Confirmed absent</p>
        </div>

        <div className="bg-[#12100d] border border-amber-950/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs tracking-widest text-amber-400 uppercase font-semibold">
              NOT MARKED
            </span>
            <div className="p-1.5 rounded-md bg-amber-950/40 text-amber-400 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
            {metrics.unmarkedCount}
          </div>
          <p className="font-mono text-xs text-amber-400/70 mt-1">Awaiting check-in</p>
        </div>

        <div className="bg-[#12100d] border border-amber-500/30 rounded-xl p-4 sm:p-5 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-[0_0_20px_rgba(245,158,11,0.06)]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs tracking-widest text-amber-300 uppercase font-semibold">
              TEAMS COMPLETED
            </span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/40">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
            {metrics.completedTeamsCount} / {registrations.length}
          </div>
          <p className="font-mono text-xs text-amber-400/80 mt-1">Full squad status marked</p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-red-300 text-xs font-mono"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#12100d] border border-neutral-800/90 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Tabs */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#0a0907] border border-neutral-800">
            {(
              [
                { label: "ALL", val: "ALL" },
                { label: "PRESENT", val: "PRESENT" },
                { label: "ABSENT", val: "ABSENT" },
                { label: "NOT MARKED", val: "NOT_MARKED" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.val}
                onClick={() => setStatusFilter(tab.val)}
                className={`px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === tab.val
                    ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Team Completion Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#0a0907] border border-neutral-800">
            {(
              [
                { label: "ALL TEAMS", val: "ALL_TEAMS" },
                { label: "UNMARKED ONLY", val: "UNMARKED_ONLY" },
              ] as const
            ).map((t) => (
              <button
                key={t.val}
                onClick={() => setTeamFilter(t.val)}
                className={`px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                  teamFilter === t.val
                    ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, participant, roll, college..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0a0907] border border-neutral-800 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <div className="bg-[#12100d]/70 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="font-mono text-sm text-neutral-300 font-medium uppercase tracking-wider">
            {searchQuery || statusFilter !== "ALL" || teamFilter !== "ALL_TEAMS"
              ? "No matching teams or participants found"
              : "No registered participants yet."}
          </p>
          <p className="font-mono text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL" || teamFilter !== "ALL_TEAMS"
              ? "Try adjusting your search criteria or switching the filter tabs."
              : "Registered squads will appear here for check-in on event day."}
          </p>
        </div>
      )}

      {/* Team Check-In List */}
      <div className="space-y-4">
        {filteredTeams.map((reg) => {
          const pCount = reg.participants?.length || Number(reg.participant_count) || 0;
          const isCollapsed = Boolean(collapsedTeams[reg.id]);

          // Team-level attendance metrics
          let teamPresent = 0;
          let teamAbsent = 0;
          let teamUnmarked = 0;

          for (let i = 0; i < pCount; i++) {
            const key = `${reg.id}_${i}`;
            const s = attendanceMap[key] || "not_marked";
            if (s === "present") teamPresent++;
            else if (s === "absent") teamAbsent++;
            else teamUnmarked++;
          }

          const isTeamComplete = teamUnmarked === 0 && pCount > 0;

          return (
            <div
              key={reg.id}
              className="bg-[#12100d] border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden transition-colors shadow-sm"
            >
              {/* Team Card Header */}
              <div
                onClick={() => toggleTeamCollapse(reg.id)}
                className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-[#0e0c0a] hover:bg-[#14110e] transition-colors select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-sans font-bold text-base sm:text-lg text-white">
                      {reg.team_name}
                    </h3>
                    {reg.domain && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300">
                        {reg.domain}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border border-neutral-800 bg-[#161310] text-neutral-300">
                      {pCount} Members
                    </span>
                  </div>

                  <p className="font-mono text-xs text-neutral-400 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span>{reg.college}</span>
                    <span className="text-neutral-600">•</span>
                    <span>Leader: {reg.team_leader_name}</span>
                  </p>
                </div>

                {/* Team Attendance Badge & Collapse Arrow */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div
                    className={`px-3 py-1 rounded-lg border font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      isTeamComplete
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : teamPresent > 0
                        ? "bg-amber-950/50 border-amber-500/40 text-amber-300"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isTeamComplete && <Sparkles className="w-3 h-3 text-emerald-400" />}
                    <span>
                      {teamPresent} / {pCount} PRESENT
                    </span>
                    {teamAbsent > 0 && (
                      <span className="text-red-400">({teamAbsent} ABSENT)</span>
                    )}
                  </div>

                  <div className="p-1 rounded bg-[#161310] border border-neutral-800 text-neutral-400">
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Participant Roster Table / List */}
              {!isCollapsed && (
                <div className="border-t border-neutral-900 divide-y divide-neutral-900/80 bg-[#12100d]">
                  {(reg.participants || []).map((participant, index) => {
                    const key = `${reg.id}_${index}`;
                    const status = attendanceMap[key] || "not_marked";
                    const isSaving = Boolean(savingKeys[key]);
                    const isLeader = participant.isLeader || index === 0;

                    return (
                      <div
                        key={index}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs hover:bg-neutral-900/30 transition-colors"
                      >
                        {/* Participant Details */}
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="text-neutral-500 font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                            #{String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-sans font-semibold text-white text-sm">
                                {participant.name}
                              </span>
                              {isLeader && (
                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono tracking-wider uppercase border border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold">
                                  LEADER
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-neutral-400 text-xs">
                              {participant.roll_no ? (
                                <span>Roll: {participant.roll_no}</span>
                              ) : (
                                <span className="text-neutral-500">Roll: —</span>
                              )}
                              {participant.mobile && (
                                <span>Mob: {participant.mobile}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attendance Segmented Controls */}
                        <div className="flex items-center gap-2 pl-6 sm:pl-0">
                          {isSaving && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 mr-1 shrink-0" />
                          )}

                          <div className="inline-flex rounded-lg bg-[#0a0907] border border-neutral-800 p-0.5 gap-1">
                            {/* PRESENT Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusClick(reg, index, "present")
                              }
                              disabled={isSaving}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
                                status === "present"
                                  ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                                  : "text-neutral-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                              }`}
                              title={
                                status === "present"
                                  ? "Click to unmark"
                                  : "Mark as PRESENT"
                              }
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PRESENT</span>
                            </button>

                            {/* ABSENT Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusClick(reg, index, "absent")
                              }
                              disabled={isSaving}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
                                status === "absent"
                                  ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.35)]"
                                  : "text-neutral-400 hover:text-red-300 hover:bg-red-950/30"
                              }`}
                              title={
                                status === "absent"
                                  ? "Click to unmark"
                                  : "Mark as ABSENT"
                              }
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ABSENT</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
