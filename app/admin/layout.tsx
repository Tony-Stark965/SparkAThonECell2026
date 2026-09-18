import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Center | SPARK-A-THON 2026",
  description: "Organizer Command Center for SPARK-A-THON 2026",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#0a0907] text-neutral-100 flex flex-col font-sans">
      {/* Top Admin Security Bar */}
      <header className="sticky top-0 z-40 border-b border-amber-950/50 bg-[#0c0a08]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-amber-400 uppercase">
            SPARK-A-THON 2026 // COMMAND CENTER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-[10px] font-mono tracking-wider uppercase rounded border border-amber-950/50 bg-[#14110e] text-neutral-400">
            ORGANIZER NETWORK
          </span>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Admin Footer */}
      <footer className="border-t border-neutral-900/90 bg-[#080705] px-4 sm:px-8 py-3 text-center">
        <p className="font-mono text-[10px] tracking-wider text-neutral-500 uppercase">
          SPARK-A-THON 2026 • E-CELL FCRIT • INTERNAL ORGANIZER COMMAND CENTER • CONFIDENTIAL
        </p>
      </footer>
    </div>
  );
}
