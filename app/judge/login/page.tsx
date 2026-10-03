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
  ShieldCheck,
} from "lucide-react";

function JudgeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            JUDGE SIGN IN
          </p>
        </div>

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

        {/* Single Direct Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="judge-email"
              className="block font-mono text-xs uppercase tracking-wider text-neutral-300 mb-1.5"
            >
              Judge Email
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
                <span>SIGN IN</span>
              </>
            )}
          </button>
        </form>

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
