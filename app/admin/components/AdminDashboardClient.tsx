"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  RegistrationRecord,
  RegistrationStats,
} from "@/lib/supabase/types";
import { calculateRegistrationStats } from "@/lib/supabase/types";
import { ATTENDANCE_DOMAINS, getTeamsForDomain } from "@/lib/attendance-export";
import { createClient } from "@/lib/supabase/client";
import { AdminStats } from "./AdminStats";
import { RegistrationTable } from "./RegistrationTable";
import { JudgesManagement } from "./JudgesManagement";
import { RubricsManagement } from "./RubricsManagement";
import { JudgingOverview } from "./JudgingOverview";
import { JudgingResults } from "./JudgingResults";
import {
  LogOut,
  RefreshCw,
  Shield,
  AlertTriangle,
  LayoutDashboard,
  FileText,
  Compass,
  ArrowRight,
  Users,
  Award,
  Activity,
  Trophy,
} from "lucide-react";

interface AdminDashboardClientProps {
  initialRegistrations: RegistrationRecord[];
  userEmail: string;
  fetchError?: string | null;
  onLogout: () => Promise<void>;
}

type ActiveTab =
  | "OVERVIEW"
  | "SQUADS"
  | "JUDGING"
  | "RESULTS"
  | "JUDGES"
  | "RUBRICS";

export function AdminDashboardClient({
  initialRegistrations,
  userEmail,
  fetchError,
  onLogout,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("OVERVIEW");
  const [registrations, setRegistrations] =
    useState<RegistrationRecord[]>(initialRegistrations);
  const [selectedRegistrationDomain, setSelectedRegistrationDomain] =
    useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic live telemetry calculated from current registrations state
  const stats: RegistrationStats = calculateRegistrationStats(registrations);

  // Domain breakdown calculation using unified ATTENDANCE_DOMAINS source
  const domainBreakdown = ATTENDANCE_DOMAINS.map((domainConfig, index) => {
    const matching = getTeamsForDomain(registrations, domainConfig);
    const count = matching.length;
    const max = domainConfig.maxTeams;
    const capacityPercent = Math.min(100, Math.round((count / max) * 100));
    const percentage = capacityPercent;
    const isFull = count >= max;
    const slotsRemaining = Math.max(0, max - count);

    return {
      sectorNumber: `0${index + 1}`,
      name: domainConfig.key,
      displayName: domainConfig.displayName,
      count,
      max,
      capacityPercent,
      percentage,
      isFull,
      slotsRemaining,
    };
  });

  const handleRegistrationUpdated = (updated: RegistrationRecord) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleRegistrationDeleted = (deletedId: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== deletedId));
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/registration", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.registrations)) {
          setRegistrations(data.registrations);
        }
      }
      router.refresh();
    } catch (err) {
      console.warn("Could not sync registrations:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [router]);

  // Real-time synchronization for registration mutations across multiple admin devices
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin_registrations_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registrations",
        },
        () => {
          handleRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleRefresh]);

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
            OPERATIONAL REGISTRATION, JUDGING &amp; RESULTS LEDGER
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
          onClick={() => setActiveTab("OVERVIEW")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "OVERVIEW"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>OVERVIEW</span>
        </button>

        <button
          onClick={() => setActiveTab("SQUADS")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "SQUADS"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>SQUADS ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("JUDGING")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "JUDGING"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>JUDGING</span>
        </button>

        <button
          onClick={() => setActiveTab("RESULTS")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "RESULTS"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>RESULTS</span>
        </button>

        <button
          onClick={() => setActiveTab("JUDGES")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "JUDGES"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>JUDGES</span>
        </button>

        <button
          onClick={() => setActiveTab("RUBRICS")}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeTab === "RUBRICS"
              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>RUBRICS</span>
        </button>
      </nav>

      {/* Tab 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
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
                  OFFICIAL TECHNICAL DOMAIN DISTRIBUTION
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
                  onClick={() => {
                    setSelectedRegistrationDomain(domain.name);
                    setActiveTab("SQUADS");
                  }}
                  className="bg-[#0e0c0a] border border-neutral-800/80 rounded-lg p-3.5 space-y-2 hover:border-amber-500/40 hover:bg-[#12100d] transition-all cursor-pointer group shadow-sm"
                  title={`View ${domain.displayName} registrations`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] text-amber-400/80 font-bold uppercase tracking-wider block">
                        SECTOR {domain.sectorNumber}
                      </span>
                      <span
                        className="font-bold text-neutral-200 text-xs leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors uppercase"
                        title={domain.displayName}
                      >
                        {domain.displayName}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[10px] shrink-0">
                      {domain.percentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xl font-bold text-amber-400 font-sans">
                      {domain.count}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      / {domain.max} squads
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        domain.isFull
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-amber-500 to-amber-400"
                      }`}
                      style={{ width: `${domain.capacityPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                    <span>{domain.capacityPercent}% filled</span>
                    <span
                      className={
                        domain.isFull
                          ? "text-red-400 font-bold"
                          : "text-amber-400/90 font-medium"
                      }
                    >
                      {domain.isFull ? "FULL" : `${domain.slotsRemaining} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            <div
              onClick={() => {
                setSelectedRegistrationDomain(null);
                setActiveTab("SQUADS");
              }}
              className="bg-[#12100d] border border-neutral-800 hover:border-amber-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  MANAGE SQUADS
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Review squad rosters, verify participant payment transactions,
                open dossiers, or remove registrations.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("JUDGING")}
              className="bg-[#12100d] border border-neutral-800 hover:border-cyan-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  JUDGING TELEMETRY
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Track live evaluation completion across domains, inspect judge
                workload, and monitor pending scorecards.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("RESULTS")}
              className="bg-[#12100d] border border-neutral-800 hover:border-amber-400/50 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  RESULTS &amp; RANKINGS
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                View real-time domain leaderboards, top ranks, and winner
                spotlights dynamically scored by evaluators.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("JUDGES")}
              className="bg-[#12100d] border border-neutral-800 hover:border-blue-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  JUDGES MANAGEMENT
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Register official evaluators, assign squads by technical domain,
                and manage evaluator accounts.
              </p>
            </div>

            <div
              onClick={() => setActiveTab("RUBRICS")}
              className="bg-[#12100d] border border-neutral-800 hover:border-purple-500/40 rounded-xl p-5 space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">
                  RUBRIC CRITERIA
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Configure standardized evaluation criteria, maximum points,
                weighting, and score guidelines.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SQUADS */}
      {activeTab === "SQUADS" && (
        <section aria-labelledby="ledger-heading">
          <h2 id="ledger-heading" className="sr-only">
            Registration Control Ledger
          </h2>
          <RegistrationTable
            registrations={registrations}
            onRegistrationUpdated={handleRegistrationUpdated}
            onRegistrationDeleted={handleRegistrationDeleted}
            onRefresh={handleRefresh}
            selectedDomain={selectedRegistrationDomain}
            onSelectDomain={setSelectedRegistrationDomain}
          />
        </section>
      )}

      {/* Tab 3: JUDGES */}
      {activeTab === "JUDGES" && (
        <section aria-labelledby="judges-heading">
          <h2 id="judges-heading" className="sr-only">
            Judges Management Roster
          </h2>
          <JudgesManagement registrations={registrations} />
        </section>
      )}

      {/* Tab 4: RUBRICS */}
      {activeTab === "RUBRICS" && (
        <section aria-labelledby="rubrics-heading">
          <h2 id="rubrics-heading" className="sr-only">
            Standardized Rubrics Management
          </h2>
          <RubricsManagement />
        </section>
      )}

      {/* Tab 5: JUDGING TELEMETRY */}
      {activeTab === "JUDGING" && (
        <section aria-labelledby="judging-heading">
          <h2 id="judging-heading" className="sr-only">
            Judging Operations Telemetry
          </h2>
          <JudgingOverview />
        </section>
      )}

      {/* Tab 6: RESULTS & RANKINGS */}
      {activeTab === "RESULTS" && (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">
            Domain Results &amp; Rankings Leaderboard
          </h2>
          <JudgingResults />
        </section>
      )}
    </div>
  );
}
