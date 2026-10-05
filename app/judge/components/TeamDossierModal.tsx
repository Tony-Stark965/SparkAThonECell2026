"use client";

import { useEffect } from "react";
import type { JudgeAssignedTeam } from "@/lib/supabase/judge";
import {
  X,
  Shield,
  Users,
  Layers,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRight,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface TeamDossierModalProps {
  team: JudgeAssignedTeam | null;
  onClose: () => void;
}

export function TeamDossierModal({ team, onClose }: TeamDossierModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-dossier-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#110f0c] border border-amber-500/35 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.12)] space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              OFFICIAL TEAM DOSSIER
            </div>
            <h2
              id="team-dossier-title"
              className="text-xl sm:text-2xl font-bold text-white tracking-wide font-sans"
            >
              {team.team_name}
            </h2>
            <p className="text-xs text-neutral-400 font-mono">{team.college}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domain & Status Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-400 font-mono text-xs">
            <Layers className="w-3.5 h-3.5" />
            {team.domain}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider ${
              team.status === "submitted"
                ? "border border-emerald-500/40 bg-emerald-950/30 text-emerald-400"
                : team.status === "in_progress"
                ? "border border-amber-500/40 bg-amber-950/30 text-amber-400 animate-pulse"
                : team.status === "draft"
                ? "border border-sky-500/40 bg-sky-950/30 text-sky-400"
                : "border border-neutral-700 bg-neutral-900 text-neutral-300"
            }`}
          >
            {team.status === "submitted" && <CheckCircle2 className="w-3.5 h-3.5" />}
            {team.status === "in_progress" && <Clock className="w-3.5 h-3.5" />}
            {team.status === "draft" && <FileText className="w-3.5 h-3.5" />}
            STATUS: {team.status === "submitted" ? "SUBMITTED" : team.status === "draft" ? "DRAFT" : team.status === "in_progress" ? "IN PROGRESS" : "NOT STARTED"}
          </span>
          {team.total_score != null && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 font-mono text-xs font-bold">
              SCORE: {team.total_score} / 50
            </span>
          )}
        </div>

        {/* Team Leader Metadata */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/70 p-4 space-y-3 font-mono text-xs">
          <div className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1.5 border-b border-neutral-800/60 pb-2">
            <Users className="w-3.5 h-3.5" />
            TEAM LEADER SPECIFICATIONS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">LEADER NAME</span>
              <span className="text-white font-medium">{team.team_leader_name}</span>
            </div>
            {team.team_leader_roll_no && (
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase">ROLL NUMBER</span>
                <span className="text-neutral-200">{team.team_leader_roll_no}</span>
              </div>
            )}
            {team.team_leader_mobile && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>+91 {team.team_leader_mobile}</span>
              </div>
            )}
            {team.team_leader_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">{team.team_leader_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* All Participants List */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
            <span>REGISTERED ROSTER ({team.participant_count} MEMBERS)</span>
          </div>
          <div className="space-y-2">
            {team.participants && team.participants.length > 0 ? (
              team.participants.map((member, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-neutral-800/60 bg-neutral-900/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-white font-medium">{member.name}</span>
                      {member.isLeader && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-semibold uppercase">
                          Leader
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-neutral-400 text-[11px] sm:pl-7">
                    {member.roll_no && <span>Roll: {member.roll_no}</span>}
                    {member.mobile && <span>Ph: +91 {member.mobile}</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 italic">No additional participants recorded.</p>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono text-xs transition-colors cursor-pointer"
          >
            CLOSE
          </button>
          <Link
            href={`/judge/team/${team.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-500/20 cursor-pointer"
          >
            <span>
              {team.status === "submitted"
                ? "VIEW EVALUATION"
                : team.status === "draft"
                ? "RESUME DRAFT"
                : team.status === "in_progress"
                ? "RESUME JUDGING"
                : "START JUDGING"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
