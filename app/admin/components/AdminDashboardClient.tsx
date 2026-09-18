"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RegistrationRecord,
  RegistrationStats,
  calculateRegistrationStats,
} from "@/lib/supabase/types";
import { AdminStats } from "./AdminStats";
import { RegistrationTable } from "./RegistrationTable";
import { LogOut, RefreshCw, Shield, AlertTriangle } from "lucide-react";

interface AdminDashboardClientProps {
  initialRegistrations: RegistrationRecord[];
  userEmail: string;
  fetchError?: string | null;
  onLogout: () => Promise<void>;
}

export function AdminDashboardClient({
  initialRegistrations,
  userEmail,
  fetchError,
  onLogout,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [registrations, setRegistrations] =
    useState<RegistrationRecord[]>(initialRegistrations);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic live telemetry calculated from current registrations state
  const stats: RegistrationStats = calculateRegistrationStats(registrations);

  const handleRegistrationUpdated = (updated: RegistrationRecord) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
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
          <p className="font-mono text-xs tracking-widest text-neutral-300 uppercase">
            OPERATIONAL REGISTRATION &amp; PAYMENT LEDGER
          </p>
        </div>

        {/* User Badge & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#0a0907] border border-neutral-800 rounded-xl p-3 sm:p-3.5">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
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
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
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

      {/* Telemetry Overview: 5 Stat Cards */}
      <section aria-labelledby="telemetry-heading">
        <h2 id="telemetry-heading" className="sr-only">
          Registration Telemetry
        </h2>
        <AdminStats stats={stats} />
      </section>

      {/* Registration Controls: Search, Filters, Desktop Table & Mobile Cards */}
      <section aria-labelledby="ledger-heading">
        <h2 id="ledger-heading" className="sr-only">
          Registration Control Ledger
        </h2>
        <RegistrationTable
          registrations={registrations}
          onRegistrationUpdated={handleRegistrationUpdated}
        />
      </section>
    </div>
  );
}
