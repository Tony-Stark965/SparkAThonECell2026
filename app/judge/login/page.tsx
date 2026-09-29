"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Gavel,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

function JudgeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "activate">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getInitialError = () => {
    if (errorParam === "unauthorized") {
      return "Access Denied: Your account is not authorized as an official Spark-A-Thon judge.";
    }
    if (errorParam === "inactive") {
      return "Access Denied: Your judge account is inactive. Please contact event administrators.";
    }
    if (errorParam === "unauthorized_team") {
      return "Security Alert: You attempted to access a team not assigned to your judging squad.";
    }
    return null;
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(getInitialError());
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authError || !authData?.session) {
          setErrorMessage("Invalid credentials. Please verify your email and password.");
          return;
        }

        // Verify judge authorization on server
        const verifyRes = await fetch("/api/judge/me", {
          cache: "no-store",
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.success || !verifyData.judge) {
          // Immediately revoke session if not an active judge
          await supabase.auth.signOut();
          setErrorMessage(
            verifyData.error ||
              "Access Denied: You are not registered as an active judge for Spark-A-Thon 2026."
          );
          return;
        }

        router.push("/judge");
        router.refresh();
      } catch (err) {
        console.error("Login error:", err);
        setErrorMessage("An unexpected error occurred during authentication.");
      }
    });
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your registered judge email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/judge/auth/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Failed to activate judge account.");
          return;
        }

        setSuccessMessage(
          "Account credentials established! Authenticating your judge session..."
        );

        // Sign in with the newly created credentials
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          setErrorMessage("Credentials set, but automatic sign-in failed. Please log in.");
          setMode("login");
          return;
        }

        router.push("/judge");
        router.refresh();
      } catch (err) {
        console.error("Activation error:", err);
        setErrorMessage("An unexpected error occurred during account activation.");
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
      <div className="w-full max-w-md bg-[#110f0c]/90 border border-amber-500/25 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.09)] backdrop-blur-xl">
        {/* Header HUD */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Gavel className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            SPARK-A-THON 2026
          </h1>
          <p className="font-mono text-xs tracking-widest text-amber-400 uppercase mt-1">
            OFFICIAL JUDGE PORTAL
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-neutral-900/80 p-1 border border-neutral-800 mb-6 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "login"
                ? "bg-amber-500 text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            JUDGE SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("activate");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "activate"
                ? "bg-amber-500 text-black shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            FIRST TIME SETUP
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-emerald-300 text-xs font-mono"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-red-300 text-xs font-mono"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="judge-email"
                className="block font-mono text-xs uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Registered Judge Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="judge-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="judge@institution.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="judge-password"
                className="block font-mono text-xs uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="judge-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                  disabled={isPending}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ACCESS JUDGE PORTAL</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Activate / First-time setup Form */
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label
                htmlFor="activate-email"
                className="block font-mono text-xs uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Registered Email (Added by Admin)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="activate-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="judge@institution.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                  disabled={isPending}
                />
              </div>
              <p className="text-[11px] font-mono text-neutral-400 mt-1">
                Must match the official email address registered by the hackathon committee.
              </p>
            </div>

            <div>
              <label
                htmlFor="activate-password"
                className="block font-mono text-xs uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Set Password (Min 6 Characters)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="activate-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="activate-confirm"
                className="block font-mono text-xs uppercase tracking-wider text-neutral-300 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="activate-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                  disabled={isPending}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>ACTIVATING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ACTIVATE &amp; ENTER PORTAL</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-neutral-900 text-center">
          <p className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
            JUDGE EVALUATION PROTOCOL // ENCRYPTED SESSION
          </p>
        </div>
      </div>
    </div>
  );
}

export default function JudgeLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <div className="w-full max-w-md bg-[#110f0c]/90 border border-amber-500/25 rounded-2xl p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        </div>
      }
    >
      <JudgeLoginForm />
    </Suspense>
  );
}
