"use client";

import { useState } from "react";
import type { RegistrationRecord } from "@/lib/supabase/types";
import {
  ATTENDANCE_DOMAINS,
  type AttendanceDomainConfig,
  getTeamsForDomain,
  getTeamMembersList,
  generateAttendanceCsv,
  generateAttendanceXlsx,
  triggerFileDownload,
} from "@/lib/attendance-export";
import {
  FileSpreadsheet,
  Download,
  Eye,
  Printer,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
} from "lucide-react";

interface DomainAttendanceSheetsProps {
  registrations: RegistrationRecord[];
  onRefresh?: () => Promise<void> | void;
}

export function DomainAttendanceSheets({
  registrations,
  onRefresh,
}: DomainAttendanceSheetsProps) {
  const [selectedDomain, setSelectedDomain] =
    useState<AttendanceDomainConfig | null>(null);
  const [downloadingDomain, setDownloadingDomain] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"CSV" | "XLSX" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchedRecords, setFetchedRecords] =
    useState<RegistrationRecord[] | null>(null);

  const activeRecords = fetchedRecords ?? registrations;

  // Fetch freshest registrations before generating export
  const fetchFreshestRegistrations = async (): Promise<RegistrationRecord[]> => {
    try {
      const res = await fetch("/api/admin/registration", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.registrations)) {
          setFetchedRecords(data.registrations);
          return data.registrations;
        }
      }
    } catch (err) {
      console.warn("Could not fetch fresh registrations; using current ledger state:", err);
    }
    return activeRecords;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchFreshestRegistrations();
      if (onRefresh) await onRefresh();
      setFeedbackMessage({
        type: "success",
        text: `Ledger synchronized (${fresh.length} total registrations).`,
      });
    } catch {
      setFeedbackMessage({
        type: "error",
        text: "Could not synchronize with the database.",
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleDownloadCsv = async (domain: AttendanceDomainConfig) => {
    setDownloadingDomain(domain.key);
    setDownloadFormat("CSV");
    setFeedbackMessage(null);
    try {
      const freshRecords = await fetchFreshestRegistrations();
      const domainTeams = getTeamsForDomain(freshRecords, domain);
      const csvString = generateAttendanceCsv(domain.displayName, domainTeams);
      const blob = new Blob([csvString], {
        type: "text/csv;charset=utf-8;",
      });
      triggerFileDownload(blob, domain.csvFilename);
      setFeedbackMessage({
        type: "success",
        text: `Downloaded ${domain.csvFilename} (${domainTeams.length} squads).`,
      });
    } catch (err) {
      console.error("CSV Download error:", err);
      setFeedbackMessage({
        type: "error",
        text: "Failed to generate CSV attendance sheet.",
      });
    } finally {
      setDownloadingDomain(null);
      setDownloadFormat(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleDownloadXlsx = async (domain: AttendanceDomainConfig) => {
    setDownloadingDomain(domain.key);
    setDownloadFormat("XLSX");
    setFeedbackMessage(null);
    try {
      const freshRecords = await fetchFreshestRegistrations();
      const domainTeams = getTeamsForDomain(freshRecords, domain);
      const blob = await generateAttendanceXlsx(domain.displayName, domainTeams);
      triggerFileDownload(blob, domain.xlsxFilename);
      setFeedbackMessage({
        type: "success",
        text: `Downloaded ${domain.xlsxFilename} (${domainTeams.length} squads).`,
      });
    } catch (err) {
      console.error("XLSX Download error:", err);
      setFeedbackMessage({
        type: "error",
        text: "Failed to generate XLSX attendance sheet.",
      });
    } finally {
      setDownloadingDomain(null);
      setDownloadFormat(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // If a domain is selected, show the Attendance Sheet Preview
  if (selectedDomain) {
    const domainTeams = getTeamsForDomain(activeRecords, selectedDomain);

    return (
      <div className="space-y-6">
        {/* Printable CSS overrides */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .no-print,
            header,
            nav,
            footer,
            .organizer-hud {
              display: none !important;
            }
            .printable-sheet {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .printable-sheet table {
              border: 2px solid #000000 !important;
              page-break-inside: auto;
            }
            .printable-sheet tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .printable-sheet th,
            .printable-sheet td {
              border: 1px solid #000000 !important;
              color: #000000 !important;
            }
          }
        `}</style>

        {/* Action & Navigation Toolbar (Hidden during print) */}
        <div className="no-print bg-[#12100d] border border-amber-500/25 rounded-2xl p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.05)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDomain(null)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181512] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ALL DOMAINS</span>
            </button>

            <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

            {/* Quick Domain Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {ATTENDANCE_DOMAINS.map((dom) => (
                <button
                  key={dom.key}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    selectedDomain.key === dom.key
                      ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                  }`}
                >
                  {dom.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Export & Print actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              title="Print official attendance roster"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>PRINT SHEET</span>
            </button>

            <button
              onClick={() => handleDownloadCsv(selectedDomain)}
              disabled={downloadingDomain === selectedDomain.key}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-amber-300 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {downloadingDomain === selectedDomain.key && downloadFormat === "CSV"
                  ? "GENERATING CSV..."
                  : "DOWNLOAD CSV"}
              </span>
            </button>

            <button
              onClick={() => handleDownloadXlsx(selectedDomain)}
              disabled={downloadingDomain === selectedDomain.key}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 font-bold shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {downloadingDomain === selectedDomain.key && downloadFormat === "XLSX"
                  ? "GENERATING XLSX..."
                  : "DOWNLOAD XLSX"}
              </span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {feedbackMessage && (
          <div
            className={`no-print flex items-center gap-2 p-3 rounded-lg border font-mono text-xs ${
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

        {/* ATTENDANCE SHEET PREVIEW (Matches reference format) */}
        <div className="printable-sheet bg-white text-black p-6 sm:p-10 rounded-2xl shadow-2xl border border-neutral-300 max-w-5xl mx-auto font-sans transition-all">
          {/* Sheet Header */}
          <div className="text-center pb-4 border-b-2 border-black mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-black font-sans">
              Spark-A-Thon 2026
            </h1>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mt-1 font-sans">
              {selectedDomain.displayName}
            </h2>
            <div className="no-print mt-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-neutral-100 border border-neutral-300 font-mono text-[11px] text-neutral-600">
              <span>Verified Squads: {domainTeams.length} / {selectedDomain.maxTeams}</span>
              <span>•</span>
              <span>Official Academic Ledger Format</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-black text-sm text-black">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black font-bold">
                  <th className="border border-black px-3 py-2.5 w-16 text-center text-xs uppercase tracking-wider">
                    Sr.no.
                  </th>
                  <th className="border border-black px-4 py-2.5 w-48 text-center text-xs uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="border border-black px-4 py-2.5 text-left text-xs uppercase tracking-wider">
                    Team Members
                  </th>
                  <th className="border border-black px-4 py-2.5 w-36 text-center text-xs uppercase tracking-wider">
                    Roll No.
                  </th>
                  <th className="border border-black px-4 py-2.5 w-44 text-center text-xs uppercase tracking-wider">
                    Signature
                  </th>
                </tr>
              </thead>
              <tbody>
                {domainTeams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-black px-4 py-12 text-center text-neutral-500 italic"
                    >
                      No registered teams found in this domain yet. Once teams register in{" "}
                      <strong>{selectedDomain.displayName}</strong>, they will dynamically appear here.
                    </td>
                  </tr>
                ) : (
                  domainTeams.map((team, teamIndex) => {
                    const members = getTeamMembersList(team);
                    const srNo = teamIndex + 1;

                    return members.map((member, memberIndex) => (
                      <tr
                        key={`${team.id}-${memberIndex}`}
                        className="border-b border-black hover:bg-neutral-50/50 transition-colors"
                      >
                        {/* Sr.no. vertically merged across team member rows */}
                        {memberIndex === 0 && (
                          <td
                            rowSpan={members.length}
                            className="border border-black px-3 py-2 text-center align-middle font-medium bg-white"
                          >
                            {srNo}
                          </td>
                        )}

                        {/* Team Name vertically merged across team member rows */}
                        {memberIndex === 0 && (
                          <td
                            rowSpan={members.length}
                            className="border border-black px-3 py-2 text-center align-middle font-bold break-words bg-white"
                          >
                            {team.team_name}
                          </td>
                        )}

                        {/* Team Member Name (Separate row per member) */}
                        <td className="border border-black px-4 py-2 text-left align-middle font-normal">
                          <div className="flex items-center gap-2">
                            <span>{member.name}</span>
                            {member.isLeader && (
                              <span className="no-print text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold font-mono">
                                LEADER
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Member Roll Number */}
                        <td className="border border-black px-4 py-2 text-center align-middle font-mono font-medium">
                          {member.roll_no || "—"}
                        </td>

                        {/* Signature (Always Blank for physical signing) */}
                        <td className="border border-black px-4 py-2 text-center align-middle h-10">
                          {/* Signature cell remains blank */}
                        </td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Notes for Printout */}
          <div className="mt-8 pt-4 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono gap-2">
            <span>Spark-A-Thon 2026 • Verified Domain Roster</span>
            <span>Printed on: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
            <span>Signatures Verified by Domain Proctor</span>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: 5 Domain Cards
  return (
    <div className="space-y-6">
      {/* Attendance Header & Information */}
      <div className="bg-[#12100d] border border-amber-500/25 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.05)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ATTENDANCE LEDGER // OFFICIAL DOMAIN ROSTERS
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white uppercase">
            ATTENDANCE SYSTEM
          </h2>
          <p className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
            OFFICIAL ATTENDANCE SHEETS • LIVE DATABASE SYNCHRONIZATION
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-amber-400 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>SYNC DATA</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* 5 Domain Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ATTENDANCE_DOMAINS.map((domainConfig, index) => {
          const domainTeams = getTeamsForDomain(activeRecords, domainConfig);
          const count = domainTeams.length;
          const max = domainConfig.maxTeams;
          const percent = Math.min(100, Math.round((count / max) * 100));
          const isFull = count >= max;
          const isDownloadingThis = downloadingDomain === domainConfig.key;

          return (
            <div
              key={domainConfig.key}
              className="bg-[#12100d] border border-neutral-800/90 hover:border-amber-500/40 rounded-xl p-5 flex flex-col justify-between space-y-5 transition-all shadow-md group"
            >
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">
                      SECTOR 0{index + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {domainConfig.displayName}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold shrink-0 border ${
                      isFull
                        ? "bg-red-950/40 border-red-500/40 text-red-300"
                        : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {isFull ? "FULL" : `${max - count} SLOTS LEFT`}
                  </span>
                </div>

                {/* Capacity Counter */}
                <div className="flex items-baseline justify-between pt-1 font-mono text-xs">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-400 font-sans">
                      {count}
                    </span>
                    <span className="text-neutral-400 font-medium">
                      / {max} Teams
                    </span>
                  </div>
                  <span className="text-neutral-400 font-semibold">
                    {max} Team Capacity
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? "bg-red-500" : "bg-gradient-to-r from-amber-500 to-amber-400"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons: [ View Attendance ] [ Download CSV ] [ Download XLSX ] */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <button
                  onClick={() => setSelectedDomain(domainConfig)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white hover:text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>VIEW ATTENDANCE</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadCsv(domainConfig)}
                    disabled={isDownloadingThis}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    title={`Download ${domainConfig.csvFilename}`}
                  >
                    <Download className="w-3 h-3 text-blue-400" />
                    <span>
                      {isDownloadingThis && downloadFormat === "CSV"
                        ? "DOWNLOADING..."
                        : "CSV"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDownloadXlsx(domainConfig)}
                    disabled={isDownloadingThis}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-mono text-[11px] uppercase tracking-wider font-bold transition-colors cursor-pointer disabled:opacity-50"
                    title={`Download ${domainConfig.xlsxFilename}`}
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    <span>
                      {isDownloadingThis && downloadFormat === "XLSX"
                        ? "DOWNLOADING..."
                        : "XLSX"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="bg-[#100e0c] border border-neutral-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-400 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>
            Total Registered Teams Across All Domains:{" "}
            <strong className="text-white font-sans text-sm">
              {activeRecords.length}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-500" />
          <span>Exact Printable Academic Format • Sr.no. &amp; Team Name Vertically Merged</span>
        </div>
      </div>
    </div>
  );
}
