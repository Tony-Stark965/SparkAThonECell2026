"use client";

import { useState, useEffect } from "react";
import type { RegistrationRecord, AttendanceStatus } from "@/lib/supabase/types";
import {
  X,
  User,
  Phone,
  Hash,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  Trash2,
} from "lucide-react";

interface RegistrationDetailsProps {
  registration: RegistrationRecord;
  attendanceMap?: Record<string, AttendanceStatus>;
  onClose: () => void;
  onPaymentStatusUpdated?: (updated: RegistrationRecord) => void;
  onDeleteRequested?: (registration: RegistrationRecord) => void;
}

export function RegistrationDetails({
  registration,
  attendanceMap,
  onClose,
  onPaymentStatusUpdated,
  onDeleteRequested,
}: RegistrationDetailsProps) {
  const [currentReg, setCurrentReg] = useState<RegistrationRecord>(registration);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const rawStatus = (currentReg.payment_status || "pending").toLowerCase();
  const isPaid = rawStatus === "completed" || rawStatus === "paid";
  const displayStatus = isPaid ? "COMPLETED" : "PENDING";

  const handleTogglePayment = async () => {
    setIsUpdating(true);
    setActionError(null);
    setActionSuccess(null);

    const targetStatus: "pending" | "completed" = isPaid ? "pending" : "completed";

    try {
      const res = await fetch("/api/admin/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: currentReg.id,
          paymentStatus: targetStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment status synchronization failed.");
      }

      setCurrentReg(data.registration);
      setActionSuccess(
        targetStatus === "completed"
          ? "Payment verified & marked as COMPLETED."
          : "Payment status reverted to PENDING."
      );

      if (onPaymentStatusUpdated) {
        onPaymentStatusUpdated(data.registration);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update payment status."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(currentReg.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0d0b09] border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.12)] p-5 sm:p-7 text-neutral-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header HUD */}
        <div className="flex items-start justify-between border-b border-neutral-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-amber-400 uppercase font-semibold">
                COMMAND DOSSIER // REGISTRATION
              </span>
            </div>
            <h2
              id="modal-headline"
              className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white uppercase"
            >
              {currentReg.team_name}
            </h2>
            <p className="font-mono text-xs text-neutral-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <span>{currentReg.college}</span>
            </p>
            {currentReg.domain && (
              <div className="pt-0.5">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider border border-amber-500/40 bg-amber-500/10 text-amber-300">
                  {currentReg.domain}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-neutral-800 bg-[#161310] text-neutral-300 hover:text-white hover:border-amber-500/40 transition-colors cursor-pointer"
            aria-label="Close details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section 1: Team & Registration Metadata */}
        <div className="space-y-2.5">
          <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase font-semibold block">
            01 // SQUAD SPECIFICATION
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="col-span-2 sm:col-span-3 bg-gradient-to-r from-amber-500/15 via-[#16120d] to-[#120f0c] border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-amber-400 font-mono block text-xs uppercase font-bold tracking-widest">
                  OFFICIAL SECTOR DOMAIN
                </span>
                <span className="text-white font-mono font-bold text-sm sm:text-base mt-0.5 block">
                  {currentReg.domain || "Not specified / Legacy"}
                </span>
              </div>
              <span className="self-start sm:self-center px-2.5 py-1 rounded text-[9.5px] font-mono uppercase tracking-widest border border-amber-500/40 bg-amber-500/15 text-amber-300 font-bold">
                OFFICIAL DOMAIN
              </span>
            </div>

            <div className="bg-[#14110e] border border-neutral-800/90 rounded-xl p-3">
              <span className="text-neutral-300 block text-xs uppercase">Strength</span>
              <span className="text-neutral-100 font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                {currentReg.participant_count} Members
              </span>
            </div>

            <div className="bg-[#14110e] border border-neutral-800/90 rounded-xl p-3">
              <span className="text-neutral-300 block text-xs uppercase">Protocol Fee</span>
              <span className="text-amber-400 font-bold text-sm mt-0.5 block">
                ₹{currentReg.registration_fee}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#14110e] border border-neutral-800/90 rounded-xl p-3">
              <span className="text-neutral-300 block text-xs uppercase">Submission Date</span>
              <span className="text-neutral-300 text-xs mt-0.5 flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                {formattedDate}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-3 bg-[#14110e]/70 border border-neutral-800/80 rounded-xl p-3">
              <span className="text-neutral-300 block text-xs uppercase">Database Registration ID</span>
              <span className="text-amber-300/90 text-xs font-mono select-all break-all block mt-0.5">
                {currentReg.id}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Team Leader Contact Dossier */}
        <div className="space-y-2.5">
          <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase font-semibold block">
            02 // SQUAD LEADER COMMAND
          </span>

          <div className="bg-gradient-to-br from-amber-500/10 via-[#14110e] to-[#120f0c] border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-sans font-bold text-white text-base block">
                  {currentReg.team_leader_name}
                </span>
                <span className="font-mono text-xs text-amber-400 uppercase tracking-wider">
                  DESIGNATED TEAM LEADER
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-amber-950/40 font-mono text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <Hash className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span className="text-neutral-300 text-xs">ROLL:</span>
                <span className="text-white font-medium truncate">
                  {currentReg.team_leader_roll_no || "—"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-neutral-300">
                <Phone className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span className="text-neutral-300 text-xs">PHONE:</span>
                <a
                  href={`tel:${currentReg.team_leader_mobile}`}
                  className="text-amber-400 hover:underline font-medium truncate"
                >
                  {currentReg.team_leader_mobile}
                </a>
              </div>

              <div className="flex items-center gap-2 text-neutral-300">
                <Mail className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span className="text-neutral-300 text-xs">EMAIL:</span>
                <span className="text-neutral-200 truncate" title={currentReg.team_leader_email || "Not recorded"}>
                  {currentReg.team_leader_email || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Full Participants Roster */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase font-semibold">
              03 // PARTICIPANT ROSTER
            </span>
            <span className="font-mono text-xs text-neutral-300">
              {currentReg.participants?.length || currentReg.participant_count} MEMBERS REGISTERED
            </span>
          </div>

          <div className="space-y-2">
            {(currentReg.participants || []).map((member, index) => {
              const isLeader = member.isLeader || index === 0;
              const attKey = `${currentReg.id}_${index}`;
              const attStatus = attendanceMap ? attendanceMap[attKey] || "not_marked" : null;

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#14110e] border border-neutral-800/90 gap-2 font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-300 font-bold text-xs">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-sans font-medium text-white text-sm">
                      {member.name}
                    </span>
                    {isLeader && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-mono tracking-wider uppercase border border-amber-500/40 bg-amber-500/10 text-amber-400">
                        LEADER
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-neutral-300 text-xs pl-7 sm:pl-0 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400 text-xs">ROLL:</span>
                      <span className="text-neutral-200">{member.roll_no || "—"}</span>
                    </div>

                    <a
                      href={`tel:${member.mobile}`}
                      className="hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span>{member.mobile}</span>
                    </a>

                    {attStatus && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                          attStatus === "present"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                            : attStatus === "absent"
                            ? "bg-red-950/60 text-red-400 border-red-500/40"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800"
                        }`}
                      >
                        {attStatus === "present"
                          ? "PRESENT"
                          : attStatus === "absent"
                          ? "ABSENT"
                          : "NOT MARKED"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Payment Status & Organizer Controls */}
        <div className="space-y-2.5">
          <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase font-semibold block">
            04 // PAYMENT CONTROLS
          </span>

          <div className="bg-[#14110e] border border-neutral-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-300 font-mono text-xs uppercase">Current Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                      isPaid
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                        : "bg-amber-950/60 text-amber-400 border-amber-500/40"
                    }`}
                  >
                    {displayStatus}
                  </span>
                </div>
                <p className="font-mono text-xs text-neutral-300">
                  {isPaid
                    ? "Payment verified. Dues counted in total collected revenue."
                    : "Payment verification pending. Dues contribute ₹0 to collected revenue."}
                </p>
                {currentReg.payment_reference && (
                  <p className="font-mono text-xs text-neutral-300 pt-1">
                    Reference ID: <span className="text-neutral-200 font-semibold">{currentReg.payment_reference}</span>
                  </p>
                )}
              </div>

              {/* Status Mutation Button */}
              <button
                onClick={handleTogglePayment}
                disabled={isUpdating}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                  isPaid
                    ? "bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 hover:text-amber-200"
                    : "bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SYNCHRONIZING...</span>
                  </>
                ) : isPaid ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>REVERT TO PENDING</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>MARK AS COMPLETED</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
          {onDeleteRequested && (
            <button
              onClick={() => onDeleteRequested(currentReg)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-red-200 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE REGISTRATION</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ml-auto"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
