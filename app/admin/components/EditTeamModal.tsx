"use client";

import { useState, useEffect } from "react";
import type { RegistrationRecord, AttendanceRecord } from "@/lib/supabase/types";
import { OFFICIAL_DOMAINS } from "@/lib/supabase/types";
import { X, Loader2, AlertCircle, Building2, User, Phone, Mail, Hash, Compass, Check } from "lucide-react";

interface EditTeamModalProps {
  registration: RegistrationRecord;
  onClose: () => void;
  onSuccess: (updated: RegistrationRecord, updatedAttendance?: AttendanceRecord[]) => void;
}

export function EditTeamModal({ registration, onClose, onSuccess }: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(registration.team_name || "");
  const [college, setCollege] = useState(registration.college || "");
  const [domain, setDomain] = useState(registration.domain || OFFICIAL_DOMAINS[0]);
  const [leaderName, setLeaderName] = useState(registration.team_leader_name || "");
  const [leaderRoll, setLeaderRoll] = useState(registration.team_leader_roll_no || "");
  const [leaderMobile, setLeaderMobile] = useState(registration.team_leader_mobile || "");
  const [leaderEmail, setLeaderEmail] = useState(registration.team_leader_email || "");

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

    // Client-side quick check
    if (!teamName.trim() || teamName.trim().length < 2) {
      setError("Team name must be at least 2 characters.");
      return;
    }
    if (!college.trim() || college.trim().length < 2) {
      setError("College / Institution must be at least 2 characters.");
      return;
    }
    if (!leaderName.trim() || leaderName.trim().length < 2) {
      setError("Squad leader name must be at least 2 characters.");
      return;
    }
    if (!leaderRoll.trim()) {
      setError("Squad leader roll number is required.");
      return;
    }
    const cleanMobile = leaderMobile.replace(/\D/g, "");
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number for leader.");
      return;
    }
    const cleanEmail = leaderEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address for leader.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: "EDIT_TEAM",
          data: {
            team_name: teamName.trim(),
            college: college.trim(),
            domain,
            team_leader_name: leaderName.trim(),
            team_leader_roll_no: leaderRoll.trim(),
            team_leader_mobile: cleanMobile,
            team_leader_email: cleanEmail,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update team details.");
      }

      onSuccess(data.registration, data.attendance);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save team details.");
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-team-modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0d0b09] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] p-5 sm:p-6 text-neutral-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header HUD */}
        <div className="flex items-start justify-between border-b border-amber-950/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-amber-400 uppercase font-semibold">
                COMMAND CENTER // EDIT TEAM SPECIFICATIONS
              </span>
            </div>
            <h2
              id="edit-team-modal-title"
              className="text-lg sm:text-xl font-bold font-sans tracking-tight text-white uppercase"
            >
              Edit Team &amp; Leader Info
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg border border-neutral-800 bg-[#161310] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close edit team modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Section A: Team Details */}
          <div className="space-y-3 bg-[#14110e] border border-neutral-800 rounded-xl p-4">
            <span className="text-amber-400 font-bold uppercase tracking-wider block text-xs">
              01 // SQUAD SPECIFICATIONS
            </span>

            <div>
              <label className="text-neutral-400 block mb-1 uppercase text-[11px]">
                Team Name
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Name"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
                <Building2 className="w-3 h-3 text-neutral-400" />
                <span>College / Institution</span>
              </label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="College / Institution"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
                <Compass className="w-3 h-3 text-amber-400" />
                <span>Official Technical Domain</span>
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 focus:outline-none focus:border-amber-500/50"
              >
                {OFFICIAL_DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-[#0a0907] text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section B: Leader Details */}
          <div className="space-y-3 bg-[#14110e] border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-xs">
                02 // SQUAD LEADER COMMAND
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                Syncs with Participant #01
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400" />
                  <span>Leader Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="Leader Full Name"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
                  <Hash className="w-3 h-3 text-neutral-400" />
                  <span>Leader Roll Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={leaderRoll}
                  onChange={(e) => setLeaderRoll(e.target.value)}
                  placeholder="e.g. 22IT101"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  <span>Leader Mobile (10-digit)</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={leaderMobile}
                  onChange={(e) => setLeaderMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" />
                  <span>Leader Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  placeholder="leader@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SAVING CHANGES...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SAVE TEAM SPECIFICATIONS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
