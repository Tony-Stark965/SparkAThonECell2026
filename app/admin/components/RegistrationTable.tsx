"use client";

import { useState } from "react";
import type { RegistrationRecord } from "@/lib/supabase/types";
import { RegistrationDetails } from "./RegistrationDetails";
import { Search, Eye, Users } from "lucide-react";

interface RegistrationTableProps {
  registrations: RegistrationRecord[];
  onRegistrationUpdated?: (updated: RegistrationRecord) => void;
}

type PaymentFilter = "ALL" | "PENDING" | "COMPLETED";

export function RegistrationTable({
  registrations,
  onRegistrationUpdated,
}: RegistrationTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("ALL");
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationRecord | null>(null);

  const handleUpdate = (updated: RegistrationRecord) => {
    setSelectedRegistration(updated);
    if (onRegistrationUpdated) {
      onRegistrationUpdated(updated);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const rawStatus = (reg.payment_status || "pending").toLowerCase();
    const isCompleted = rawStatus === "completed" || rawStatus === "paid";

    // Status Filter Check
    if (statusFilter === "PENDING" && isCompleted) return false;
    if (statusFilter === "COMPLETED" && !isCompleted) return false;

    // Search Query Check
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const team = (reg.team_name || "").toLowerCase();
    const college = (reg.college || "").toLowerCase();
    const domain = (reg.domain || "").toLowerCase();
    const leader = (reg.team_leader_name || "").toLowerCase();
    const roll = (reg.team_leader_roll_no || "").toLowerCase();
    const mobile = (reg.team_leader_mobile || "").toLowerCase();
    const email = (reg.team_leader_email || "").toLowerCase();

    return (
      team.includes(q) ||
      college.includes(q) ||
      domain.includes(q) ||
      leader.includes(q) ||
      roll.includes(q) ||
      mobile.includes(q) ||
      email.includes(q)
    );
  });

  const getStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed" || s === "paid") {
      return {
        label: "COMPLETED",
        classes: "bg-emerald-950/60 text-emerald-400 border-emerald-500/40",
      };
    }
    return {
      label: "PENDING",
      classes: "bg-amber-950/60 text-amber-400 border-amber-500/40",
    };
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Status Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#12100d] border border-neutral-800/90 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-400 mr-2">
            REGISTRATIONS ({filteredRegistrations.length} of {registrations.length})
          </span>

          {/* Quick Filter Tabs */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#0a0907] border border-neutral-800">
            {(["ALL", "PENDING", "COMPLETED"] as PaymentFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, domain, college, leader, roll..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0a0907] border border-neutral-800 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredRegistrations.length === 0 && (
        <div className="bg-[#12100d]/70 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-neutral-600 mx-auto" />
          <p className="font-mono text-sm text-neutral-400 font-medium uppercase tracking-wider">
            {searchQuery || statusFilter !== "ALL"
              ? "No matching registrations found"
              : "No registrations recorded yet"}
          </p>
          <p className="font-mono text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search query or switching the status filter tab."
              : "Submissions from the registration chamber will appear here automatically."}
          </p>
        </div>
      )}

      {/* Desktop Table View (lg and above) */}
      {filteredRegistrations.length > 0 && (
        <div className="hidden lg:block bg-[#12100d] border border-neutral-800/90 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#0a0907] text-neutral-400 uppercase tracking-wider border-b border-neutral-800/80">
                <tr>
                  <th className="py-3 px-4 font-semibold">Team</th>
                  <th className="py-3 px-4 font-semibold">Sector Domain</th>
                  <th className="py-3 px-4 font-semibold">College</th>
                  <th className="py-3 px-4 font-semibold">Leader</th>
                  <th className="py-3 px-3 font-semibold text-center">Members</th>
                  <th className="py-3 px-4 font-semibold text-right">Fee</th>
                  <th className="py-3 px-4 font-semibold text-center">Payment Status</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredRegistrations.map((reg) => {
                  const badge = getStatusBadge(reg.payment_status);
                  return (
                    <tr
                      key={reg.id}
                      onClick={() => setSelectedRegistration(reg)}
                      className="hover:bg-neutral-900/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {reg.team_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {reg.domain ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-semibold uppercase tracking-wider max-w-[150px] truncate"
                            title={reg.domain}
                          >
                            {reg.domain}
                          </span>
                        ) : (
                          <span className="text-neutral-600 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-neutral-300 max-w-[170px] truncate"
                        title={reg.college}
                      >
                        {reg.college}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-200">
                        <div>{reg.team_leader_name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {reg.team_leader_roll_no || reg.team_leader_mobile}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-[#0a0907] border border-neutral-800 text-neutral-300 font-semibold">
                          {reg.participant_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                        ₹{reg.registration_fee}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                        {formatDate(reg.created_at)}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedRegistration(reg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161310] hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 text-neutral-300 hover:text-amber-400 transition-colors text-[11px] cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>DOSSIER</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card List View (Below lg screen size) */}
      {filteredRegistrations.length > 0 && (
        <div className="lg:hidden space-y-3">
          {filteredRegistrations.map((reg) => {
            const badge = getStatusBadge(reg.payment_status);
            return (
              <div
                key={reg.id}
                onClick={() => setSelectedRegistration(reg)}
                className="bg-[#12100d] border border-neutral-800 hover:border-amber-500/30 rounded-xl p-4 shadow-sm space-y-3 cursor-pointer transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-base text-white">
                      {reg.team_name}
                    </h3>
                    <p className="font-mono text-xs text-neutral-400 truncate max-w-[220px]">
                      {reg.college}
                    </p>
                    {reg.domain && (
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300">
                          {reg.domain}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badge.classes}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Card Body: Leader Info */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-900 font-mono text-xs">
                  <div>
                    <span className="text-neutral-500 text-[10px] block uppercase">Squad Leader</span>
                    <span className="text-neutral-200 font-medium truncate block">
                      {reg.team_leader_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block uppercase">Roll / Mobile</span>
                    <span className="text-neutral-300 block truncate">
                      {reg.team_leader_roll_no || reg.team_leader_mobile}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Members, Fee & Details Button */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#0a0907] border border-neutral-800 text-neutral-300 text-[11px]">
                      {reg.participant_count} Members
                    </span>
                    <span className="text-amber-400 font-bold">
                      ₹{reg.registration_fee}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegistration(reg);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#161310] border border-neutral-700 text-neutral-200 hover:text-amber-400 font-mono text-[11px] uppercase tracking-wider"
                  >
                    <Eye className="w-3 h-3" />
                    <span>DOSSIER</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Registration Details Modal */}
      {selectedRegistration && (
        <RegistrationDetails
          key={selectedRegistration.id}
          registration={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          onPaymentStatusUpdated={handleUpdate}
        />
      )}
    </div>
  );
}
