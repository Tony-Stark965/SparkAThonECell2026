"use client";

import { useState, useEffect } from "react";
import type { RegistrationRecord, AttendanceRecord, Participant } from "@/lib/supabase/types";
import { calculateRegistrationFee } from "@/lib/supabase/types";
import { X, Loader2, AlertCircle, UserMinus, AlertTriangle } from "lucide-react";

interface RemoveMemberModalProps {
  registration: RegistrationRecord;
  memberIndex: number;
  participant: Participant;
  onClose: () => void;
  onSuccess: (updated: RegistrationRecord, updatedAttendance?: AttendanceRecord[]) => void;
}

export function RemoveMemberModal({
  registration,
  memberIndex,
  participant,
  onClose,
  onSuccess,
}: RemoveMemberModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCount = registration.participants?.length || registration.participant_count;
  const newCount = currentCount - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRemoving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isRemoving]);

  const handleConfirm = async () => {
    if (memberIndex === 0) {
      setError("The designated squad leader cannot be removed.");
      return;
    }
    if (currentCount <= 2) {
      setError("Teams must have at least 2 members. Cannot remove.");
      return;
    }

    setIsRemoving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          action: "REMOVE_MEMBER",
          memberIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove participant.");
      }

      onSuccess(data.registration, data.attendance);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove participant.");
      setIsRemoving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isRemoving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#0d0b09] border border-red-500/40 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] p-5 sm:p-6 text-neutral-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header HUD */}
        <div className="flex items-start justify-between border-b border-red-950/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-red-400 uppercase font-semibold">
                CONFIRM PARTICIPANT REMOVAL
              </span>
            </div>
            <h2
              id="remove-member-modal-title"
              className="text-lg sm:text-xl font-bold font-sans tracking-tight text-white uppercase"
            >
              Remove Member from Squad
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isRemoving}
            className="p-1.5 rounded-lg border border-neutral-800 bg-[#161310] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close remove member modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Details Card */}
        <div className="bg-[#14110e] border border-neutral-800 rounded-xl p-3.5 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">Participant:</span>
            <span className="text-white font-sans font-bold text-sm">{participant.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">Roll Number:</span>
            <span className="text-neutral-200">{participant.roll_no || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">Mobile:</span>
            <span className="text-neutral-200">{participant.mobile}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
            <span className="text-neutral-400 uppercase">Squad:</span>
            <span className="text-amber-400 font-semibold">{registration.team_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">New Squad Size:</span>
            <span className="text-neutral-200">{newCount} Members (₹{calculateRegistrationFee(newCount)})</span>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 font-mono text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Removing this member will update the squad roster. Minimum squad size requirement is 2 members. Protocol fee will be ₹{calculateRegistrationFee(newCount)}.
          </p>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className="px-4 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isRemoving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/50 text-red-200 hover:text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>REMOVING...</span>
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>CONFIRM REMOVE PARTICIPANT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
