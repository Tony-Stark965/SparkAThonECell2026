"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  RegistrationRecord,
  RegistrationStats,
  AttendanceRecord,
  AttendanceStatus,
} from "@/lib/supabase/types";
import { calculateRegistrationStats } from "@/lib/supabase/types";
import { AdminStats } from "./AdminStats";
import { RegistrationTable } from "./RegistrationTable";
import { AttendanceRegister } from "./AttendanceRegister";
import {
  LogOut,
  RefreshCw,
  Shield,
  AlertTriangle,
  LayoutDashboard,
  FileText,
  UserCheck,
  Compass,
  ArrowRight,
} from "lucide-react";

interface AdminDashboardClientProps {
  initialRegistrations: RegistrationRecord[];
  initialAttendance?: AttendanceRecord[];
  userEmail: string;
  fetchError?: string | null;
  onLogout: () => Promise<void>;
}

type ActiveTab = "COMMAND_CENTER" | "REGISTRATIONS" | "ATTENDANCE";

const OFFICIAL_DOMAINS = [
  "AI and Cybersec",
  "Smart Energy Systems",
  "Robotics or Drone and Fixed Wing",
  "IoT or Embedded Systems",
  "Open Innovation",
];

export function AdminDashboardClient({
  initialRegistrations,
  initialAttendance = [],
  userEmail,
  fetchError,
  onLogout,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("COMMAND_CENTER");
  const [registrations, setRegistrations] =
    useState<RegistrationRecord[]>(initialRegistrations);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize attendance map from server records
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const rec of initialAttendance) {
      map[`${rec.registration_id}_${rec.participant_index}`] = rec.status;
    }
    return map;
  });

  // Dynamic live telemetry calculated from current registrations state
  const stats: RegistrationStats = calculateRegistrationStats(registrations);

  // Domain breakdown calculation
  const domainBreakdown = OFFICIAL_DOMAINS.map((domainName) => {
    const matching = registrations.filter(
      (r) => (r.domain || "").trim().toLowerCase() === domainName.toLowerCase()
    );
    const count = matching.length;
    const percentage =
      registrations.length > 0
        ? Math.round((count / registrations.length) * 100)
        : 0;
    return { name: domainName, count, percentage };
  });

  const handleRegistrationUpdated = (updated: RegistrationRecord) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleRegistrationDeleted = (deletedId: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== deletedId));
    setAttendanceMap((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${deletedId}_`)) {
          delete next[key];
        }
      }
      return next;
    });
  };

  const handleAttendanceUpdated = (key: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [key]: status,
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header HUD / Organizer Command Bar */}
      <div className="bg-[#12100d] border border-amber-500/25 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-[0_0_40px_rgba(245,158,11,0.06)] flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ORGANIZER COMMAND CENTER // AUTHENTICATED
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase font-sans">
            SPARK-A-THON 2026
          </h1>
          <p className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
            OPERATIONAL REGISTRATION, PAYMENT &amp; ATTENDANCE LEDGER
          </p>
        </div>

        {/* User Badge & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#0a0907] border border-neutral-800 rounded-xl p-3 sm:p-3.5">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                ACTIVE OPERATOR
              </span>
            </div>
            <span className="block font-mono text-xs sm:text-sm text-neutral-200 font-medium">
              {userEmail}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh ledger data"
              aria-label="Refresh ledger data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? "animate-spin text-amber-400" : ""
                }`}
              />
            </button>

            <form action={onLogout} className="w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-red-200 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Database Error Alert (If Any) */}
      {fetchError && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300 text-xs font-mono"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200 uppercase tracking-wider block">
              DATABASE COMMUNICATION NOTICE
            </span>
            <p>{fetchError}</p>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <nav
        className="flex items-center gap-2 border-b border-neutral-800/80 pb-3 overflow-x-auto"
        aria-label="Admin Navigation"
      >
        <button
          onClick={() => setActiveTab("COMMAND_CENTER")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "COMMAND_CENTER"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>COMMAND CENTER</span>
        </button>

        <button
          onClick={() => setActiveTab("REGISTRATIONS")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "REGISTRATIONS"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>REGISTRATIONS ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ATTENDANCE")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "ATTENDANCE"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>ATTENDANCE</span>
        </button>
      </nav>

      {/* Tab 1: COMMAND CENTER */}
      {activeTab === "COMMAND_CENTER" && (
        <div className="space-y-6">
          {/* Telemetry Overview: 5 Stat Cards */}
          <section aria-labelledby="telemetry-heading">
            <h2 id="telemetry-heading" className="sr-only">
              Registration Telemetry
            </h2>
            <AdminStats stats={stats} />
          </section>

          {/* Sector Domain Distribution */}
          <section className="bg-[#12100d] border border-neutral-800/90 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  OFFICIAL SECTOR DOMAIN DISTRIBUTION
                </h3>
              </div>
              <span className="font-mono text-xs text-neutral-400">
                {registrations.length} Total Teams
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
              {domainBreakdown.map((domain) => (
                <div
                  key={domain.name}
                  className="bg-[#0e0c0a] border border-neutral-800/80 rounded-lg p-3.5 space-y-2 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="font-bold text-neutral-200 text-xs leading-snug line-clamp-2"
                      title={domain.name}
                    >
                      {domain.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[10px] shrink-0">
                      {domain.percentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xl font-bold text-amber-400">
                      {domain.count}
                    </span>
                    <span className="text-neutral-500 text-[11px]">squads</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${domain.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div
              onClick={() => setActiveTab("REGISTRATIONS")}
              className="bg-[#12100d] border border-neutral-800 hover:border-amber-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  MANAGE REGISTRATIONS
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Review squad rosters, verify participant payment transactions,
                open dossiers, or remove registrations.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("ATTENDANCE")}
              className="bg-[#12100d] border border-neutral-800 hover:border-emerald-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  EVENT ATTENDANCE
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Check in participants on event day, mark present/absent status,
                and monitor live venue check-in statistics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: REGISTRATIONS */}
      {activeTab === "REGISTRATIONS" && (
        <section aria-labelledby="ledger-heading">
          <h2 id="ledger-heading" className="sr-only">
            Registration Control Ledger
          </h2>
          <RegistrationTable
            registrations={registrations}
            attendanceMap={attendanceMap}
            onRegistrationUpdated={handleRegistrationUpdated}
            onRegistrationDeleted={handleRegistrationDeleted}
          />
        </section>
      )}

      {/* Tab 3: ATTENDANCE */}
      {activeTab === "ATTENDANCE" && (
        <section aria-labelledby="attendance-heading">
          <h2 id="attendance-heading" className="sr-only">
            Event Day Attendance
          </h2>
          <AttendanceRegister
            registrations={registrations}
            attendanceMap={attendanceMap}
            onAttendanceUpdated={handleAttendanceUpdated}
          />
        </section>
      )}
    </div>
  );
}
