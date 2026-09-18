"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get("error") === "unauthorized";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isUnauthorized
      ? "Access Denied: Your account is not authorized as an event administrator."
      : null
  );
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setErrorMessage("Invalid credentials. Please verify your email and password.");
          return;
        }

        if (data?.session) {
          router.push("/admin");
          router.refresh();
        }
      } catch {
        setErrorMessage("An unexpected error occurred during authentication.");
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-neutral-950/90 border border-amber-500/25 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.08)] backdrop-blur-xl">
        {/* Header HUD */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3.5 text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
            SPARK-A-THON 2026
          </h1>
          <p className="font-mono text-xs tracking-widest text-amber-500/90 uppercase mt-1">
            ORGANIZER ADMIN GATEWAY
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3.5 text-red-300 text-xs font-mono"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block font-mono text-xs uppercase tracking-wider text-neutral-400 mb-2"
            >
              Organizer Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sparkathon.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block font-mono text-xs uppercase tracking-wider text-neutral-400 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 font-mono transition-colors"
                disabled={isPending}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-black font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>ACCESS ADMIN PANEL</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-neutral-900 text-center">
          <p className="font-mono text-[11px] text-neutral-600 uppercase tracking-wider">
            SECURITY PROTOCOL ACTIVE // ENCRYPTED SESSION
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-neutral-950/90 border border-amber-500/25 rounded-2xl p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
