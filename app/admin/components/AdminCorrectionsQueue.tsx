"use client";

import { useState, useEffect, useCallback } from "react";
import type { JudgingCorrectionRequest } from "@/lib/supabase/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Filter,
  History,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  X,
  XCircle,
} from "lucide-react";

export function AdminCorrectionsQueue() {
  const [requests, setRequests] = useState<JudgingCorrectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [selectedRequest, setSelectedRequest] =
    useState<JudgingCorrectionRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchCorrections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/corrections");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load correction requests.");
      }
      setRequests(data.requests || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load corrections."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/admin/corrections")
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.success) {
          setRequests(data.requests || []);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Failed to load corrections."
          );
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCorrections();
  };

  const handleOpenActionModal = (
    req: JudgingCorrectionRequest,
    type: "approve" | "reject"
  ) => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminNotes(
      type === "approve"
        ? "Reopening score ledger for judge adjustments per request."
        : "Correction request reviewed and declined by administrator."
    );
    setActionFeedback(null);
  };

  const handleCloseModal = () => {
    if (isSubmittingAction) return;
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
    setActionFeedback(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsSubmittingAction(true);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/admin/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          requestId: selectedRequest.id,
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || `Failed to ${actionType} correction request.`
        );
      }

      setActionFeedback({
        type: "success",
        text: data.message || `Correction request successfully ${actionType}d.`,
      });

      // Update state locally
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? {
                ...r,
                status: actionType === "approve" ? "approved" : "rejected",
                admin_notes: adminNotes.trim(),
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );

      setTimeout(() => {
        handleCloseModal();
        fetchCorrections();
      }, 1200);
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Submission failed.",
      });
      setIsSubmittingAction(false);
    }
  };

  // Metrics
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const completedCount = requests.filter(
    (r) => r.status === "completed"
  ).length;

  // Filtered requests
  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== "ALL" && req.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchJudge = (req.judge_name || "").toLowerCase().includes(q);
      const matchTeam = (req.team_name || "").toLowerCase().includes(q);
      const matchDomain = (req.domain || "").toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      if (!matchJudge && !matchTeam && !matchDomain && !matchReason)
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12100d] border border-amber-500/25 rounded-xl p-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <Shield className="w-3 h-3" />
            JUDGING AUDIT &amp; CORRECTION DISPATCH
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            Score Correction Queue
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            Review formal evaluator petitions to reopen locked scoring sessions
            with complete audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#161310] hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh corrections queue"
            aria-label="Refresh corrections queue"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshing ? "animate-spin text-amber-400" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
        <div className="bg-[#12100d] border border-amber-500/30 rounded-xl p-4 space-y-1">
          <span className="text-amber-400 uppercase tracking-wider text-[11px] font-bold block">
            PENDING APPROVAL
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">
              {pendingCount}
            </span>
            <Clock className="w-4 h-4 text-amber-500/60" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-cyan-500/30 rounded-xl p-4 space-y-1">
          <span className="text-cyan-400 uppercase tracking-wider text-[11px] font-bold block">
            REOPENED / IN PROGRESS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400">
              {approvedCount}
            </span>
            <FileEdit className="w-4 h-4 text-cyan-500/60" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <span className="text-emerald-400 uppercase tracking-wider text-[11px] font-bold block">
            COMPLETED &amp; RE-LOCKED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">
              {completedCount}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
          </div>
        </div>

        <div className="bg-[#12100d] border border-red-500/30 rounded-xl p-4 space-y-1">
          <span className="text-red-400 uppercase tracking-wider text-[11px] font-bold block">
            REJECTED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-400">
              {rejectedCount}
            </span>
            <XCircle className="w-4 h-4 text-red-500/60" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200 uppercase tracking-wider block">
              CORRECTIONS QUEUE NOTICE
            </span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-[#12100d] border border-neutral-800 rounded-xl p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by judge name, squad name, domain, or reason..."
              className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl pl-9 pr-4 py-2 text-white placeholder-neutral-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#0a0907] border border-neutral-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-neutral-900 text-white">
                All Status ({requests.length})
              </option>
              <option value="pending" className="bg-neutral-900 text-amber-400">
                Pending Approval ({pendingCount})
              </option>
              <option value="approved" className="bg-neutral-900 text-cyan-400">
                Reopened / In Progress ({approvedCount})
              </option>
              <option
                value="completed"
                className="bg-neutral-900 text-emerald-400"
              >
                Completed &amp; Locked ({completedCount})
              </option>
              <option value="rejected" className="bg-neutral-900 text-red-400">
                Rejected ({rejectedCount})
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[#12100d] border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400 font-mono text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span>Loading score correction petitions...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3 font-mono text-xs">
            <History className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-neutral-300 font-semibold text-sm">
              No Correction Requests Found
            </p>
            <p className="text-neutral-500 max-w-sm mx-auto text-[11px]">
              {requests.length === 0
                ? "No evaluators have submitted correction requests. All submitted scores remain sealed."
                : "No petitions match the active status or search query."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-[#0a0907] text-neutral-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Judge Evaluator</th>
                  <th className="py-3.5 px-4 font-semibold">Target Squad</th>
                  <th className="py-3.5 px-4 font-semibold">Domain</th>
                  <th className="py-3.5 px-4 font-semibold">Reason</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Original Score</th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-neutral-900/40 transition-colors group"
                  >
                    {/* Judge */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">
                          {req.judge_name || "Official Judge"}
                        </span>
                        <span className="text-neutral-400 text-[11px]">
                          {req.judge_email}
                        </span>
                      </div>
                    </td>

                    {/* Squad */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-300 block">
                          {req.team_name}
                        </span>
                        <span className="text-neutral-400 text-[11px]">
                          {req.college || "Participant Squad"}
                        </span>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-300 text-[11px]">
                        {req.domain}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-neutral-200 block truncate">
                          {req.reason}
                        </span>
                        <p className="text-neutral-400 text-[11px] line-clamp-2">
                          {req.explanation}
                        </p>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {req.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-400 font-bold text-[11px]">
                          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span>PENDING REVIEW</span>
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
                          <FileEdit className="w-3 h-3 text-cyan-400" />
                          <span>REOPENED (IN PROGRESS)</span>
                        </span>
                      )}
                      {req.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>COMPLETED &amp; RE-LOCKED</span>
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-[11px]">
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </td>

                    {/* Original Score */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-white text-sm">
                        {req.original_total_score !== null &&
                        req.original_total_score !== undefined
                          ? `${req.original_total_score} pts`
                          : "N/A"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType(null);
                          }}
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                          title="View Petition Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {req.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenActionModal(req, "approve")
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                              title="Approve & Reopen Evaluation"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>APPROVE</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenActionModal(req, "reject")
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                              title="Reject Correction Request"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>REJECT</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review / Action Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#12100d] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
                  <ShieldAlert className="w-3 h-3" />
                  CORRECTION PETITION DOSSIER
                </div>
                <h3 className="text-lg font-bold text-white uppercase font-sans">
                  {actionType === "approve"
                    ? "Approve & Reopen Evaluation"
                    : actionType === "reject"
                    ? "Reject Correction Request"
                    : "Correction Request Details"}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Petition ID: {selectedRequest.id}
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                disabled={isSubmittingAction}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#0a0907] p-3.5 rounded-xl border border-neutral-800">
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase block">
                    JUDGE
                  </span>
                  <span className="font-bold text-white">
                    {selectedRequest.judge_name}
                  </span>
                  <span className="text-neutral-400 text-[10px] block">
                    {selectedRequest.judge_email}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase block">
                    TARGET SQUAD
                  </span>
                  <span className="font-bold text-amber-300">
                    {selectedRequest.team_name}
                  </span>
                  <span className="text-neutral-400 text-[10px] block">
                    {selectedRequest.domain}
                  </span>
                </div>
              </div>

              <div className="space-y-1 bg-[#0a0907] p-3.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">
                  PRIMARY REASON
                </span>
                <span className="font-bold text-white">
                  {selectedRequest.reason}
                </span>
              </div>

              <div className="space-y-1 bg-[#0a0907] p-3.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">
                  JUDGE EXPLANATION
                </span>
                <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.explanation}
                </p>
              </div>

              <div className="flex items-center justify-between bg-[#0a0907] p-3.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-400">Locked Total Score:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {selectedRequest.original_total_score} pts
                </span>
              </div>

              {selectedRequest.admin_notes && (
                <div className="space-y-1 bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/30">
                  <span className="text-amber-400 text-[10px] uppercase font-bold block">
                    ADMINISTRATOR AUDIT NOTE
                  </span>
                  <p className="text-neutral-300 whitespace-pre-wrap">
                    {selectedRequest.admin_notes}
                  </p>
                </div>
              )}

              {/* Action Form If Action is Active */}
              {actionType && (
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-bold uppercase text-[11px] block">
                      Admin Decision Note / Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add an administrative note for the judge and audit log..."
                      className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl p-3 text-white placeholder-neutral-600 outline-none"
                    />
                  </div>

                  {actionFeedback && (
                    <div
                      className={`p-3 rounded-xl border font-mono text-xs flex items-center gap-2 ${
                        actionFeedback.type === "success"
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          : "bg-red-950/30 border-red-500/40 text-red-300"
                      }`}
                    >
                      {actionFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{actionFeedback.text}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isSubmittingAction}
                      className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold uppercase cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmAction}
                      disabled={isSubmittingAction}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold uppercase tracking-wider text-white cursor-pointer shadow-lg disabled:opacity-50 ${
                        actionType === "approve"
                          ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40"
                          : "bg-red-600 hover:bg-red-500 shadow-red-900/40"
                      }`}
                    >
                      {isSubmittingAction ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : actionType === "approve" ? (
                        <>
                          <ThumbsUp className="w-4 h-4" />
                          <span>Confirm &amp; Reopen</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4" />
                          <span>Confirm Rejection</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
