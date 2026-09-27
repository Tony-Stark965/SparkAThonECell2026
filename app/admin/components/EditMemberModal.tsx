"use client";

import { useState, useEffect } from "react";
import type { RegistrationRecord, AttendanceRecord, Participant } from "@/lib/supabase/types";
import { X, Loader2, AlertCircle, User, Phone, Hash, Check } from "lucide-react";

interface EditMemberModalProps {
  registration: RegistrationRecord;
  memberIndex: number;
  participant: Participant;
  onClose: () => void;
  onSuccess: (updated: RegistrationRecord, updatedAttendance?: AttendanceRecord[]) => void;
}

export function EditMemberModal({
  registration,
  memberIndex,
  participant,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const [name, setName] = useState(participant.name || "");
  const [rollNo, setRollNo] = useState(participant.roll_no || "");
  const [mobile, setMobile] = useState(participant.mobile || "");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLeader = memberIndex === 0 || participant.isLeader;

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

    if (!name.trim() || name.trim().length < 2) {
      setError("Participant name must be at least 2 characters.");
      return;
    }
    if (!rollNo.trim()) {
      setError("Participant roll number is required.");
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, "");
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: "EDIT_MEMBER",
          memberIndex,
          data: {
            name: name.trim(),
            roll_no: rollNo.trim(),
            mobile: cleanMobile,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update participant.");
      }

      onSuccess(data.registration, data.attendance);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save participant.");
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#0d0b09] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] p-5 sm:p-6 text-neutral-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header HUD */}
        <div className="flex items-start justify-between border-b border-amber-950/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-amber-400 uppercase font-semibold">
                ROSTER COMMAND // PARTICIPANT #{String(memberIndex + 1).padStart(2, "0")}
              </span>
            </div>
            <h2
              id="edit-member-modal-title"
              className="text-lg sm:text-xl font-bold font-sans tracking-tight text-white uppercase"
            >
              {isLeader ? "Edit Squad Leader" : `Edit Participant 0${memberIndex + 1}`}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg border border-neutral-800 bg-[#161310] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close edit member modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLeader && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
            Note: This participant is the designated Squad Leader. Updates here also synchronize the primary squad leader contact info.
          </div>
        )}

        {/* Error Feedback Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
              <User className="w-3 h-3 text-neutral-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
              <Hash className="w-3 h-3 text-neutral-400" />
              <span>College Roll Number</span>
            </label>
            <input
              type="text"
              required
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 22IT101"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1 uppercase text-[11px] flex items-center gap-1">
              <Phone className="w-3 h-3 text-neutral-400" />
              <span>Mobile Number (10-digit)</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0907] border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
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
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SAVE PARTICIPANT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
