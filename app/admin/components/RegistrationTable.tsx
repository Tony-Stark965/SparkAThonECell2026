"use client";

import { useState, useMemo } from "react";
import type { RegistrationRecord, AttendanceStatus, AttendanceRecord } from "@/lib/supabase/types";
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
} from "lucide-react";

interface RegistrationTableProps {
  registrations: RegistrationRecord[];
  attendanceMap?: Record<string, AttendanceStatus>;
  onRegistrationUpdated?: (updated: RegistrationRecord, updatedAttendance?: AttendanceRecord[]) => void;
  onRegistrationDeleted?: (deletedId: string) => void;
  onRefresh?: () => Promise<void> | void;
  selectedDomain?: string | null;
  onSelectDomain?: (domain: string | null) => void;
}

type PaymentFilter = "ALL" | "PENDING" | "COMPLETED";

export function RegistrationTable({
  registrations,
  attendanceMap,
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

  const handleUpdate = (
    updated: RegistrationRecord,
    updatedAttendance?: AttendanceRecord[]
  ) => {
    setSelectedRegistration(updated);
    if (onRegistrationUpdated) {
      onRegistrationUpdated(updated, updatedAttendance);
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

  // 2. Filter registrations based on selected domain
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
    return domainFilteredRegistrations.filter((reg) => {
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
  }, [domainFilteredRegistrations, statusFilter, searchQuery]);

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

  // =========================================================================
  // VIEW 1: DOMAIN COMMAND CARDS (LANDING VIEW)
  // Matching the visual benchmarks of Attendance System
  // =========================================================================
  if (selectedDomain === null) {
    return (
      <div className="space-y-6">
        {/* Registration Header HUD & Global Sync Toolbar */}
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

        {/* Feedback Message Toast */}
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

        {/* 5 Domain Command Cards Grid */}
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
                    <span className="text-neutral-400 text-[10px] uppercase block flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Paid Squads</span>
                    </span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                      {ds.paidCount}
                    </span>
                  </div>

                  <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                    <span className="text-neutral-400 text-[10px] uppercase block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Pending</span>
                    </span>
                    <span className="text-base font-bold text-amber-400 mt-0.5 block">
                      {ds.pendingCount}
                    </span>
                  </div>

                  <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                    <span className="text-neutral-400 text-[10px] uppercase block flex items-center gap-1">
                      <Users className="w-3 h-3 text-neutral-400" />
                      <span>Roster Members</span>
                    </span>
                    <span className="text-base font-bold text-neutral-200 mt-0.5 block">
                      {ds.members}
                    </span>
                  </div>

                  <div className="bg-[#0a0907] border border-neutral-800/80 rounded-lg p-2.5">
                    <span className="text-neutral-400 text-[10px] uppercase block flex items-center gap-1">
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
    );
  }

  // =========================================================================
  // VIEW 2: REGISTRATION DOMAIN DRILLDOWN
  // Full ledger of squads within selected domain or all domains
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Polished Breadcrumb Navigation & Operational Filter Bar */}
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

          {/* Quick Filter Tabs: ALL / PENDING / COMPLETED */}
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
        </div>

        {/* Domain Mini-HUD Banner (When a specific domain is active) */}
        {currentDomainSummary && (
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

      {/* Control Bar: Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${
            selectedDomainConfig
              ? selectedDomainConfig.displayName
              : selectedDomain === "ALL"
              ? "all"
              : selectedDomain
          } squads by team, college, leader, roll...`}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12100d] border border-neutral-800 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors shadow-sm"
        />
      </div>

      {/* Empty State */}
      {filteredRegistrations.length === 0 && (
        <div className="bg-[#12100d]/70 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="font-mono text-sm text-neutral-200 font-medium uppercase tracking-wider">
            {searchQuery || statusFilter !== "ALL"
              ? "No matching registrations found"
              : "No registrations recorded in this sector yet"}
          </p>
          <p className="font-mono text-xs text-neutral-400 max-w-sm mx-auto">
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
      )}

      {/* Selected Registration Details Modal */}
      {selectedRegistration && (
        <RegistrationDetails
          key={selectedRegistration.id}
          registration={selectedRegistration}
          attendanceMap={attendanceMap}
          onClose={() => setSelectedRegistration(null)}
          onPaymentStatusUpdated={(updated) => handleUpdate(updated)}
          onRegistrationUpdated={(updated, updatedAttendance) =>
            handleUpdate(updated, updatedAttendance)
          }
          onDeleteRequested={(reg) => setRegistrationToDelete(reg)}
        />
      )}

      {/* Delete Confirmation Modal */}
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
