"use client";

import { useState, useEffect } from "react";
import type { Judge } from "@/lib/supabase/types";
import { OFFICIAL_DOMAINS } from "@/lib/supabase/types";
import {
  X,
  Loader2,
  AlertCircle,
  UserPlus,
  Mail,
  User,
  Layers,
  Key,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

interface AddJudgeModalProps {
  onClose: () => void;
  onSuccess: (judge: Judge) => void;
}

export function AddJudgeModal({ onClose, onSuccess }: AddJudgeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState<string>(OFFICIAL_DOMAINS[0]);
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success view state with generated credentials
  const [createdCredentials, setCreatedCredentials] = useState<{
    judge: Judge;
    email: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSaving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("Judge name must be at least 2 characters.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!domain.trim()) {
      setError("Please assign an official domain.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          domain: domain.trim(),
          is_active: isActive,
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register judge.");
      }

      onSuccess(data.judge);
      setCreatedCredentials({
        judge: data.judge,
        email: data.credentials?.email || email.trim().toLowerCase(),
        password: data.credentials?.password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register judge.");
      setIsSaving(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `SPARK-A-THON 2026 JUDGE PORTAL CREDENTIALS\nPortal: https://sparkathon.tech/judge/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password || "(Not specified)"}\nDomain: ${createdCredentials.judge.domain}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-judge-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#12100d] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.12)] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
              <UserPlus className="w-3 h-3" />
              JUDGE RECRUITMENT &amp; ONBOARDING
            </div>
            <h2
              id="add-judge-modal-title"
              className="text-lg sm:text-xl font-bold text-white uppercase font-sans tracking-wide"
            >
              {createdCredentials ? "Judge Credentials Ready" : "Add New Official Judge"}
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              {createdCredentials
                ? "Account provisioned. Safely copy and dispatch access credentials to the evaluator."
                : "Onboard an evaluator, provision Supabase Auth credentials, and bind to their technical domain."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials View After Successful Creation */}
        {createdCredentials ? (
          <div className="space-y-5 font-mono text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>EVALUATOR ONBOARDED &amp; ACTIVATED</span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Official profile created for <strong>{createdCredentials.judge.name}</strong> under domain{" "}
                <strong>{createdCredentials.judge.domain}</strong>.
              </p>
            </div>

            <div className="bg-[#0a0907] border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <span className="text-neutral-400 uppercase text-[10px] tracking-wider">
                  LOGIN CREDENTIALS
                </span>
                <span className="text-[10px] text-amber-400">DISPATCH READY</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-neutral-500 text-[11px] block">Login Email:</span>
                <span className="font-bold text-white select-all block bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                  {createdCredentials.email}
                </span>
              </div>

              {createdCredentials.password && (
                <div className="space-y-1.5">
                  <span className="text-neutral-500 text-[11px] block">Initial Password:</span>
                  <span className="font-bold text-amber-400 select-all block bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 font-mono">
                    {createdCredentials.password}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-neutral-500 text-[11px] block">Assigned Technical Domain:</span>
                <span className="font-bold text-cyan-300 block bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                  {createdCredentials.judge.domain}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>COPY CREDENTIALS</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                DONE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                FULL NAME <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                EMAIL ADDRESS <span className="text-amber-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="judge@institution.edu or personal email"
                className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                INITIAL PASSWORD (OPTIONAL)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate a secure password"
                className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-600 outline-none transition-colors font-mono"
              />
              <p className="text-[11px] text-neutral-500 pt-0.5">
                If left blank, an official strong password will be generated automatically.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                ASSIGNED TECHNICAL DOMAIN <span className="text-amber-500">*</span>
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-[#0a0907] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-3.5 py-2.5 text-white outline-none transition-colors cursor-pointer"
              >
                {OFFICIAL_DOMAINS.map((dom) => (
                  <option key={dom} value={dom} className="bg-neutral-900 text-white">
                    {dom}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-500 pt-0.5">
                Judges can strictly evaluate teams registered under their assigned domain.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                />
                <span className="text-neutral-300">Active Judge (Authorized for Evaluation)</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>ONBOARDING...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>ADD JUDGE</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
