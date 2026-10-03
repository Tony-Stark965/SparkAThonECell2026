import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Judge Portal | SPARK-A-THON 2026",
  description: "Official Judge Command Center for SPARK-A-THON 2026",
  robots: {
    index: false,
    follow: false,
  },
};

export default function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#0a0907] text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Security & Protocol Bar */}
      <header className="sticky top-0 z-40 h-12 border-b border-amber-950/40 bg-[#0c0a08]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase">
              SPARK-A-THON 2026
            </span>
            <span className="hidden sm:inline text-neutral-600">{"//"}</span>
            <span className="hidden sm:inline font-mono text-xs tracking-wider text-neutral-400 uppercase">
              JUDGE COMMAND CENTER
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-[11px] font-mono tracking-wider uppercase rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
            EVALUATION NETWORK
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-[#080705] px-4 sm:px-8 py-3 text-center">
        <p className="font-mono text-xs tracking-wider text-neutral-300 uppercase">
          SPARK-A-THON 2026 • E-CELL FCRIT • OFFICIAL JUDGING PORTAL • SECURE EVALUATION ENVIRONMENT
        </p>
      </footer>
    </div>
  );
}
