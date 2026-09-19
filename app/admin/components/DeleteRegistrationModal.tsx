"use client";

import { useState, useEffect } from "react";
import type { RegistrationRecord } from "@/lib/supabase/types";
import { PROTECTED_QA_IDS } from "@/lib/supabase/types";
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  Building2,
  Users,
  ShieldAlert,
} from "lucide-react";

interface DeleteRegistrationModalProps {
  registration: RegistrationRecord;
  onClose: () => void;
  onDeleted: (deletedId: string) => void;
}

export function DeleteRegistrationModal({
  registration,
  onClose,
  onDeleted,
}: DeleteRegistrationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProtected = PROTECTED_QA_IDS.includes(registration.id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isDeleting]);

  const handleDelete = async () => {
    if (isProtected) {
      setError("This is a protected system QA record and cannot be deleted.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/registration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registration.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete registration record.");
      }

      onDeleted(registration.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#0d0b09] border border-red-500/40 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] p-5 sm:p-6 text-neutral-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header HUD */}
        <div className="flex items-start justify-between border-b border-red-950/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-red-400 uppercase font-semibold">
                CONFIRM DELETION // DANGER ZONE
              </span>
            </div>
            <h2
              id="delete-modal-title"
              className="text-lg sm:text-xl font-bold font-sans tracking-tight text-white uppercase"
            >
              Delete Registration
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg border border-neutral-800 bg-[#161310] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close delete modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 font-mono text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Protected Notice */}
        {isProtected && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block uppercase">PROTECTED SYSTEM QA RECORD</span>
              <span>This record is designated for persistent QA and cannot be deleted.</span>
            </div>
          </div>
        )}

        {/* Squad Details Card */}
        <div className="bg-[#14110e] border border-neutral-800 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">Team:</span>
            <span className="text-white font-sans font-bold text-sm">
              {registration.team_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">College:</span>
            <span className="text-neutral-200 truncate max-w-[200px] flex items-center gap-1">
              <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
              {registration.college}
            </span>
          </div>
          {registration.domain && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 uppercase">Domain:</span>
              <span className="text-amber-300 font-semibold truncate max-w-[200px]">
                {registration.domain}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">Squad Leader:</span>
            <span className="text-neutral-200">{registration.team_leader_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 uppercase">Members / Fee:</span>
            <span className="text-neutral-200 flex items-center gap-2">
              <span className="flex items-center gap-1 text-neutral-300">
                <Users className="w-3 h-3 text-amber-500" />
                {registration.participant_count}
              </span>
              <span className="text-amber-400 font-bold">
                ₹{registration.registration_fee}
              </span>
            </span>
          </div>
        </div>

        {/* Warning Callout */}
        <p className="font-mono text-xs text-neutral-400 leading-relaxed">
          Are you sure you want to permanently delete this registration? All
          associated participant records and attendance data will be permanently
          removed.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800/80">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting || isProtected}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/50 text-red-200 hover:text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>DELETING...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM DELETE REGISTRATION</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
