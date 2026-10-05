"use client";

import { useState, useMemo } from "react";
import type { RegistrationRecord, Participant } from "@/lib/supabase/types";
import {
  ATTENDANCE_DOMAINS,
  type AttendanceDomainConfig,
  getTeamsForDomain,
} from "@/lib/attendance-export";
import { RegistrationDetails } from "./RegistrationDetails";
import { DeleteRegistrationModal } from "./DeleteRegistrationModal";
import {
  Search,
  Eye,
  Users,
  Trash2,
  Compass,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  FolderOpen,
  X,
} from "lucide-react";

/**
 * Safely extracts participants roster from registration record,
 * handling array, stringified JSON, or undefined.
 */
function getRegistrationParticipants(reg: RegistrationRecord): Participant[] {
  if (Array.isArray(reg.participants)) {
    return reg.participants;
  }
  if (typeof reg.participants === "string") {
    try {
      const parsed = JSON.parse(reg.participants);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore parse errors
    }
  }
  return [];
}

interface SearchMatchInfo {
  matches: boolean;
  matchedMemberName?: string;
  matchedMemberRoll?: string;
}

/**
 * Robust case-insensitive search across squad, college, domain, leader,
 * and EVERY participant (name, roll_no, mobile, email).
 */
function registrationMatchesSearch(
  reg: RegistrationRecord,
  query: string
): SearchMatchInfo {
  if (!query.trim()) return { matches: true };
  const q = query.toLowerCase().trim();

  const team = String(reg.team_name || "").toLowerCase();
  const college = String(reg.college || "").toLowerCase();
  const domain = String(reg.domain || "").toLowerCase();
  const leader = String(reg.team_leader_name || "").toLowerCase();
  const roll = String(reg.team_leader_roll_no || "").toLowerCase();
  const mobile = String(reg.team_leader_mobile || "").toLowerCase();
  const email = String(reg.team_leader_email || "").toLowerCase();

  const matchesDirect =
    team.includes(q) ||
    college.includes(q) ||
    domain.includes(q) ||
    leader.includes(q) ||
    roll.includes(q) ||
    mobile.includes(q) ||
    email.includes(q);

  const members = getRegistrationParticipants(reg);
  let matchedMember: Participant | undefined;

  for (const p of members) {
    if (!p || typeof p !== "object") continue;
    const pName = String(p.name || "").toLowerCase();
    const pRoll = String(p.roll_no || "").toLowerCase();
    const pMobile = String(p.mobile || "").toLowerCase();
    const pEmail = String(p.email || "").toLowerCase();

    if (
      pName.includes(q) ||
      pRoll.includes(q) ||
      pMobile.includes(q) ||
      pEmail.includes(q)
    ) {
      matchedMember = p;
      break;
    }
  }

  if (matchesDirect || matchedMember) {
    const isDirectLeader =
      leader.includes(q) ||
      roll.includes(q) ||
      mobile.includes(q) ||
      email.includes(q);

    return {
      matches: true,
      matchedMemberName:
        matchedMember && !isDirectLeader ? matchedMember.name : undefined,
      matchedMemberRoll:
        matchedMember && !isDirectLeader ? matchedMember.roll_no : undefined,
    };
  }

  return { matches: false };
}

interface RegistrationTableProps {
  registrations: RegistrationRecord[];
  onRegistrationUpdated?: (updated: RegistrationRecord) => void;
  onRegistrationDeleted?: (deletedId: string) => void;
  onRefresh?: () => Promise<void> | void;
  selectedDomain?: string | null;
  onSelectDomain?: (domain: string | null) => void;
}

type PaymentFilter = "ALL" | "PENDING" | "COMPLETED";

export function RegistrationTable({
  registrations,
  onRegistrationUpdated,
  onRegistrationDeleted,
  onRefresh,
  selectedDomain: controlledDomain,
  onSelectDomain,
}: RegistrationTableProps) {
  const [internalDomain, setInternalDomain] = useState<string | null>(null);
  const selectedDomain = controlledDomain !== undefined ? controlledDomain : internalDomain;

  const setSelectedDomain = (dom: string | null) => {
    if (onSelectDomain) {
      onSelectDomain(dom);
    }
    setInternalDomain(dom);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("ALL");
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationRecord | null>(null);
  const [registrationToDelete, setRegistrationToDelete] =
    useState<RegistrationRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdate = (updated: RegistrationRecord) => {
    setSelectedRegistration(updated);
    if (onRegistrationUpdated) {
      onRegistrationUpdated(updated);
    }
  };

  const handleDeleted = (deletedId: string) => {
    if (selectedRegistration?.id === deletedId) {
      setSelectedRegistration(null);
    }
    setRegistrationToDelete(null);
    if (onRegistrationDeleted) {
      onRegistrationDeleted(deletedId);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setFeedbackMessage(null);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setFeedbackMessage({
        type: "success",
        text: `Ledger synchronized (${registrations.length} total registrations).`,
      });
    } catch {
      setFeedbackMessage({
        type: "error",
        text: "Could not synchronize with the database.",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // 1. Calculate live domain metrics for the 5 official domains
  const domainSummaries = useMemo(() => {
    return ATTENDANCE_DOMAINS.map((domainConfig, index) => {
      const domainSquads = getTeamsForDomain(registrations, domainConfig);
      const count = domainSquads.length;
      const max = domainConfig.maxTeams;
      const percentFilled = Math.min(100, Math.round((count / max) * 100));
      const slotsRemaining = Math.max(0, max - count);
      const isFull = count >= max;

      const members = domainSquads.reduce(
        (sum, r) => sum + (Number(r.participant_count) || r.participants?.length || 0),
        0
      );

      const paidSquads = domainSquads.filter((r) => {
        const s = (r.payment_status || "pending").toLowerCase();
        return s === "completed" || s === "paid";
      });
      const paidCount = paidSquads.length;
      const pendingCount = count - paidCount;

      const revenue = paidSquads.reduce(
        (sum, r) => sum + (Number(r.registration_fee) || 0),
        0
      );

      return {
        sectorNumber: `0${index + 1}`,
        config: domainConfig,
        key: domainConfig.key,
        displayName: domainConfig.displayName,
        count,
        max,
        percentFilled,
        slotsRemaining,
        isFull,
        members,
        paidCount,
        pendingCount,
        revenue,
      };
    });
  }, [registrations]);

  // Overall totals across all 5 domains
  const totalCapacity = useMemo(() => {
    return ATTENDANCE_DOMAINS.reduce((sum, d) => sum + d.maxTeams, 0);
  }, []);

  const totalRevenue = useMemo(() => {
    return registrations
      .filter((r) => {
        const s = (r.payment_status || "pending").toLowerCase();
        return s === "completed" || s === "paid";
      })
      .reduce((sum, r) => sum + (Number(r.registration_fee) || 0), 0);
  }, [registrations]);

  const totalPaidTeams = useMemo(() => {
    return registrations.filter((r) => {
      const s = (r.payment_status || "pending").toLowerCase();
      return s === "completed" || s === "paid";
    }).length;
  }, [registrations]);

  // Find currently selected domain config (if any)
  const selectedDomainConfig = useMemo<AttendanceDomainConfig | null>(() => {
    if (!selectedDomain || selectedDomain === "ALL") return null;
    return (
      ATTENDANCE_DOMAINS.find(
        (d) =>
          d.key.toLowerCase() === selectedDomain.toLowerCase() ||
          d.displayName.toLowerCase() === selectedDomain.toLowerCase()
      ) || null
    );
  }, [selectedDomain]);

  // Current domain summary metrics when drilled into a specific domain
  const currentDomainSummary = useMemo(() => {
    if (!selectedDomainConfig) return null;
    return domainSummaries.find((d) => d.key === selectedDomainConfig.key) || null;
  }, [selectedDomainConfig, domainSummaries]);

  // Determine whether search mode is active
  const isSearchActive = Boolean(searchQuery.trim());

  // 2. Filter registrations based on selected domain (used when NOT searching)
  const domainFilteredRegistrations = useMemo(() => {
    if (!selectedDomain || selectedDomain === "ALL") {
      return registrations;
    }
    if (selectedDomainConfig) {
      return getTeamsForDomain(registrations, selectedDomainConfig);
    }
    return registrations.filter(
      (r) => (r.domain || "").trim().toLowerCase() === selectedDomain.toLowerCase()
    );
  }, [registrations, selectedDomain, selectedDomainConfig]);

  // 3. Filter by search query and payment status
  const filteredRegistrations = useMemo(() => {
    // When a search query is active, search across ALL registrations so that ANY
    // participant, student, leader, or squad anywhere in the event is found immediately!
    const baseRegistrations = isSearchActive
      ? registrations
      : domainFilteredRegistrations;

    return baseRegistrations.filter((reg) => {
      const rawStatus = (reg.payment_status || "pending").toLowerCase();
      const isCompleted = rawStatus === "completed" || rawStatus === "paid";

      // Status Filter Check
      if (statusFilter === "PENDING" && isCompleted) return false;
      if (statusFilter === "COMPLETED" && !isCompleted) return false;

      // Search Query Check across Team, College, Domain, Leader, and EVERY Member
      if (!isSearchActive) return true;
      return registrationMatchesSearch(reg, searchQuery).matches;
    });
  }, [registrations, domainFilteredRegistrations, statusFilter, searchQuery, isSearchActive]);

  // Precompute matched member information for UI highlight when searching
  const matchResultMap = useMemo(() => {
    if (!isSearchActive) return new Map<string, SearchMatchInfo>();
    const map = new Map<string, SearchMatchInfo>();
    for (const reg of filteredRegistrations) {
      const res = registrationMatchesSearch(reg, searchQuery);
      if (res.matchedMemberName) {
        map.set(reg.id, res);
      }
    }
    return map;
  }, [filteredRegistrations, searchQuery, isSearchActive]);

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

  // Helper to render Desktop Table
  const renderDesktopTable = (squads: RegistrationRecord[]) => (
    <div className="hidden lg:block bg-[#12100d] border border-neutral-800/90 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#0a0907] text-neutral-300 uppercase tracking-wider border-b border-neutral-800/80">
            <tr>
              <th className="py-3 px-4 font-semibold">Team</th>
              <th className="py-3 px-4 font-semibold">Technical Domain</th>
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
            {squads.map((reg) => {
              const badge = getStatusBadge(reg.payment_status);
              return (
                <tr
                  key={reg.id}
                  onClick={() => setSelectedRegistration(reg)}
                  className="hover:bg-neutral-900/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-sans font-semibold text-white group-hover:text-amber-400 transition-colors">
                    <div>{reg.team_name}</div>
                    {matchResultMap.has(reg.id) && (
                      <div className="text-[11px] text-amber-400 font-mono font-normal flex items-center gap-1 mt-0.5">
                        <span>↳ Member:</span>
                        <span className="text-amber-300 font-semibold">
                          {matchResultMap.get(reg.id)?.matchedMemberName}
                        </span>
                        {matchResultMap.get(reg.id)?.matchedMemberRoll && (
                          <span className="text-neutral-400">
                            ({matchResultMap.get(reg.id)?.matchedMemberRoll})
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {reg.domain ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider max-w-[150px] truncate"
                        title={reg.domain}
                      >
                        {reg.domain}
                      </span>
                    ) : (
                      <span className="text-neutral-500 font-mono text-xs">—</span>
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
                    <div className="text-xs text-neutral-400 truncate">
                      {reg.team_leader_roll_no || reg.team_leader_mobile}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-[#0a0907] border border-neutral-800 text-neutral-300 font-semibold">
                      {reg.participant_count}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-400 font-sans">
                    ₹{reg.registration_fee}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 text-xs">
                    {formatDate(reg.created_at)}
                  </td>
                  <td
                    className="py-3.5 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedRegistration(reg)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161310] hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 text-neutral-300 hover:text-amber-400 transition-colors text-xs cursor-pointer"
                        title="Open Squad Dossier"
                      >
                        <Eye className="w-3 h-3" />
                        <span>DOSSIER</span>
                      </button>
                      <button
                        onClick={() => setRegistrationToDelete(reg)}
                        className="p-1 rounded bg-[#161310] hover:bg-red-950/40 border border-neutral-700 hover:border-red-500/40 text-neutral-400 hover:text-red-400 transition-colors text-xs cursor-pointer"
                        title="Delete Registration"
                        aria-label={`Delete registration for ${reg.team_name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Helper to render Mobile Cards
  const renderMobileCards = (squads: RegistrationRecord[]) => (
    <div className="lg:hidden space-y-3">
      {squads.map((reg) => {
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
                {matchResultMap.has(reg.id) && (
                  <div className="text-[11px] text-amber-400 font-mono font-normal flex items-center gap-1">
                    <span>↳ Member:</span>
                    <span className="text-amber-300 font-semibold">
                      {matchResultMap.get(reg.id)?.matchedMemberName}
                    </span>
                    {matchResultMap.get(reg.id)?.matchedMemberRoll && (
                      <span className="text-neutral-400">
                        ({matchResultMap.get(reg.id)?.matchedMemberRoll})
                      </span>
                    )}
                  </div>
                )}
                <p className="font-mono text-xs text-neutral-300 truncate max-w-[220px]">
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
                className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border shrink-0 ${badge.classes}`}
              >
                {badge.label}
              </span>
            </div>

            {/* Card Body: Leader Info */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-900 font-mono text-xs">
              <div>
                <span className="text-neutral-400 text-xs block uppercase">
                  Squad Leader
                </span>
                <span className="text-neutral-200 font-medium truncate block">
                  {reg.team_leader_name}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 text-xs block uppercase">
                  Roll / Mobile
                </span>
                <span className="text-neutral-300 block truncate">
                  {reg.team_leader_roll_no || reg.team_leader_mobile}
                </span>
              </div>
            </div>

            {/* Card Footer: Members, Fee & Details Button */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-900 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-[#0a0907] border border-neutral-800 text-neutral-300 text-xs">
                  {reg.participant_count} Members
                </span>
                <span className="text-amber-400 font-bold font-sans">
                  ₹{reg.registration_fee}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRegistration(reg);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#161310] border border-neutral-700 text-neutral-200 hover:text-amber-400 font-mono text-xs uppercase tracking-wider"
                >
                  <Eye className="w-3 h-3" />
                  <span>DOSSIER</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRegistrationToDelete(reg);
                  }}
                  className="p-1.5 rounded bg-[#161310] border border-neutral-700 hover:border-red-500/40 text-neutral-400 hover:text-red-400 font-mono text-xs transition-colors"
                  title="Delete Registration"
                  aria-label={`Delete registration for ${reg.team_name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* =====================================================================
          SECTION 1: CONTEXTUAL HEADER & NAVIGATION HUD
          - Landing View: Technical Domains Directory Title & Global Actions
          - Drilldown View: Breadcrumbs & Domain Status Controls
         ===================================================================== */}
      {selectedDomain === null ? (
        <div className="bg-[#12100d] border border-amber-500/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.05)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              REGISTRATION LEDGER // OFFICIAL DOMAIN CAPACITY
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white uppercase">
              TECHNICAL DOMAINS DIRECTORY
            </h2>
            <p className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
              OFFICIAL DOMAIN DOSSIERS • LIVE CAPACITY &amp; REVENUE TELEMETRY
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              title="Synchronize registration ledger with database"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-amber-400 ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span>{isSyncing ? "SYNCING..." : "SYNC DATA"}</span>
            </button>

            <button
              onClick={() => setSelectedDomain("ALL")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-[#1a1612] border border-neutral-700 hover:border-amber-500/50 text-white hover:text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>VIEW ALL SQUADS ({registrations.length})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#12100d] border border-neutral-800/90 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumb line: REGISTRATIONS -> [DOMAIN] */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <button
                onClick={() => setSelectedDomain(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 uppercase tracking-wider transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>REGISTRATIONS</span>
              </button>

              <span className="text-amber-500/60 font-bold">→</span>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {selectedDomainConfig
                    ? selectedDomainConfig.displayName
                    : selectedDomain === "ALL"
                    ? "ALL TECHNICAL DOMAINS"
                    : selectedDomain}
                </span>
              </div>

              {selectedDomainConfig && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border border-neutral-700 bg-neutral-900 text-neutral-400">
                  SECTOR {currentDomainSummary?.sectorNumber || "01"}
                </span>
              )}
            </div>

            {/* Quick Filter Tabs: ALL / PENDING / COMPLETED (shown when not searching) */}
            {!isSearchActive && (
              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#0a0907] border border-neutral-800 self-start sm:self-center">
                {(["ALL", "PENDING", "COMPLETED"] as PaymentFilter[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                      statusFilter === tab
                        ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Domain Mini-HUD Banner (When a specific domain is active and not searching) */}
          {currentDomainSummary && !isSearchActive && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-neutral-800/80 font-mono text-xs">
              <div className="bg-[#0a0907] border border-neutral-800/60 rounded-lg p-2.5">
                <span className="text-neutral-500 text-[10px] uppercase block">
                  Domain Capacity
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block font-sans">
                  {currentDomainSummary.count} / {currentDomainSummary.max} Squads (
                  {currentDomainSummary.percentFilled}%)
                </span>
              </div>
              <div className="bg-[#0a0907] border border-neutral-800/60 rounded-lg p-2.5">
                <span className="text-neutral-500 text-[10px] uppercase block">
                  Paid Squads
                </span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block font-sans">
                  {currentDomainSummary.paidCount} Verified
                </span>
              </div>
              <div className="bg-[#0a0907] border border-neutral-800/60 rounded-lg p-2.5">
                <span className="text-neutral-500 text-[10px] uppercase block">
                  Pending Payment
                </span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block font-sans">
                  {currentDomainSummary.pendingCount} Awaiting
                </span>
              </div>
              <div className="bg-[#0a0907] border border-neutral-800/60 rounded-lg p-2.5">
                <span className="text-neutral-500 text-[10px] uppercase block">
                  Verified Revenue
                </span>
                <span className="text-sm font-bold text-amber-300 mt-0.5 block font-sans">
                  ₹{currentDomainSummary.revenue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Toast Message */}
      {feedbackMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-lg border font-mono text-xs ${
            feedbackMessage.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/30 border-red-500/40 text-red-300"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: PERMANENT GLOBAL SEARCH INPUT
          - Stays mounted permanently in BOTH landing view and domain view
          - Focus and caret are never lost
          - Clear button cleanly restores previous view
         ===================================================================== */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search across all ${registrations.length} squads by team, college, leader, member name, roll number, mobile, email...`}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#12100d] border border-neutral-800 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors shadow-sm"
          autoComplete="off"
          spellCheck="false"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded cursor-pointer transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* =====================================================================
          SECTION 3: CONTENT DISPLAY
          - If search is active: Show Global Search Results Banner + Matching Squads
          - If search is empty AND selectedDomain is null: Show 5 Domain Command Cards
          - If search is empty AND selectedDomain is set: Show Domain Squads Ledger
         ===================================================================== */}
      {isSearchActive ? (
        <div className="space-y-4">
          {/* Active Search Results Banner */}
          <div className="bg-[#12100d] border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider">
                <Search className="w-3 h-3 text-amber-400" />
                GLOBAL SEARCH ACTIVE
              </span>
              <span className="text-neutral-300">
                Query: <strong className="text-white font-sans">&quot;{searchQuery.trim()}&quot;</strong>
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-amber-400 font-bold">
                {filteredRegistrations.length}{" "}
                {filteredRegistrations.length === 1 ? "squad found" : "squads found"}{" "}
                across all {registrations.length} registrations
              </span>
              {selectedDomain !== null && (
                <span className="text-neutral-500 text-[11px]">
                  (Domain view will restore on clear)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Status Filter for Search Results */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#0a0907] border border-neutral-800">
                {(["ALL", "PENDING", "COMPLETED"] as PaymentFilter[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                      statusFilter === tab
                        ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/40 text-xs font-mono text-amber-400 hover:text-amber-300 uppercase tracking-wider transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>CLEAR SEARCH</span>
              </button>
            </div>
          </div>

          {/* Empty Search State */}
          {filteredRegistrations.length === 0 ? (
            <div className="bg-[#12100d]/70 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
              <Users className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="font-mono text-sm text-neutral-200 font-medium uppercase tracking-wider">
                No matching registrations found
              </p>
              <p className="font-mono text-xs text-neutral-400 max-w-sm mx-auto">
                No squad, participant, leader, roll number, mobile, or email matched &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-amber-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>CLEAR SEARCH</span>
              </button>
            </div>
          ) : (
            <>
              {renderDesktopTable(filteredRegistrations)}
              {renderMobileCards(filteredRegistrations)}
            </>
          )}
        </div>
      ) : selectedDomain === null ? (
        /* Landing View: 5 Domain Command Cards Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {domainSummaries.map((ds) => (
              <div
                key={ds.key}
                onClick={() => setSelectedDomain(ds.key)}
                className="bg-[#12100d] border border-neutral-800/90 hover:border-amber-500/50 rounded-xl p-5 flex flex-col justify-between space-y-5 transition-all shadow-md group cursor-pointer hover:shadow-[0_0_25px_rgba(245,158,11,0.08)]"
              >
                {/* Card Header: Sector & Status Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">
                        SECTOR {ds.sectorNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors uppercase leading-snug">
                        {ds.displayName}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold shrink-0 border ${
                        ds.isFull
                          ? "bg-red-950/40 border-red-500/40 text-red-300"
                          : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                      }`}
                    >
                      {ds.isFull
                        ? "FULL"
                        : `${ds.slotsRemaining} ${
                            ds.slotsRemaining === 1 ? "SLOT" : "SLOTS"
                          } LEFT`}
                    </span>
                  </div>

                  {/* Capacity Counter & Filled Percentage */}
                  <div className="flex items-baseline justify-between pt-1 font-mono text-xs">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 font-sans">
                        {ds.count}
                      </span>
                      <span className="text-neutral-400 font-medium">
                        / {ds.max} Teams
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-xs font-bold ${
                          ds.isFull ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {ds.percentFilled}% FILLED
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress / Capacity Bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ds.isFull
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      }`}
                      style={{ width: `${ds.percentFilled}%` }}
                    />
                  </div>

                  {/* 4-Cell Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80 font-mono text-xs">
                    <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                      <span className="text-neutral-400 text-[10px] uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Paid Squads</span>
                      </span>
                      <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                        {ds.paidCount}
                      </span>
                    </div>

                    <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                      <span className="text-neutral-400 text-[10px] uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pending</span>
                      </span>
                      <span className="text-base font-bold text-amber-400 mt-0.5 block">
                        {ds.pendingCount}
                      </span>
                    </div>

                    <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                      <span className="text-neutral-400 text-[10px] uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span>Roster Members</span>
                      </span>
                      <span className="text-base font-bold text-neutral-200 mt-0.5 block">
                        {ds.members}
                      </span>
                    </div>

                    <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                      <span className="text-neutral-400 text-[10px] uppercase flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-amber-400" />
                        <span>Verified Rev.</span>
                      </span>
                      <span className="text-base font-bold text-amber-300 mt-0.5 block">
                        ₹{ds.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button: Open Domain Dossiers */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-neutral-900 group-hover:bg-[#1a1612] border border-neutral-700/80 group-hover:border-amber-500/50 text-white group-hover:text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-sm">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>OPEN SQUAD DOSSIERS</span>
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 text-amber-400 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Summary Footer */}
          <div className="bg-[#100e0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-400 gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>
                Total Registered Squads Across All Domains:{" "}
                <strong className="text-white font-sans text-sm">
                  {registrations.length}
                </strong>
                <span className="text-neutral-500 ml-1">
                  / {totalCapacity} Max Capacity (
                  {Math.round((registrations.length / totalCapacity) * 100)}%
                  Filled)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span>
                Verified Revenue:{" "}
                <strong className="text-amber-300 font-sans">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </strong>
              </span>
              <span className="text-neutral-600">|</span>
              <span>
                Paid:{" "}
                <strong className="text-emerald-400 font-sans">
                  {totalPaidTeams}
                </strong>
              </span>
              <span className="text-neutral-600">|</span>
              <span>
                Pending:{" "}
                <strong className="text-amber-400 font-sans">
                  {registrations.length - totalPaidTeams}
                </strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Drilldown View: Specific Domain Squads Ledger */
        <div className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <div className="bg-[#12100d]/70 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
              <Users className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="font-mono text-sm text-neutral-200 font-medium uppercase tracking-wider">
                {statusFilter !== "ALL"
                  ? "No matching registrations found"
                  : "No registrations recorded in this sector yet"}
              </p>
              <p className="font-mono text-xs text-neutral-400 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? "Try adjusting your status filter tab."
                  : "Submissions from the registration chamber will appear here automatically."}
              </p>
            </div>
          ) : (
            <>
              {renderDesktopTable(filteredRegistrations)}
              {renderMobileCards(filteredRegistrations)}
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          SECTION 4: MODALS (Dossier & Delete)
         ===================================================================== */}
      {selectedRegistration && (
        <RegistrationDetails
          key={selectedRegistration.id}
          registration={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          onPaymentStatusUpdated={(updated) => handleUpdate(updated)}
          onRegistrationUpdated={(updated) => handleUpdate(updated)}
          onDeleteRequested={(reg) => setRegistrationToDelete(reg)}
        />
      )}

      {registrationToDelete && (
        <DeleteRegistrationModal
          registration={registrationToDelete}
          onClose={() => setRegistrationToDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
