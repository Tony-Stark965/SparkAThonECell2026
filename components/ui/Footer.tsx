import React from "react";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export function Footer() {
  return (
    <footer className="w-full bg-black border-t border-neutral-900 py-12 px-6 text-neutral-500 font-mono text-xs">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="font-bold tracking-widest text-neutral-300 uppercase">
              {SPARKATHON_CONFIG.name} {SPARKATHON_CONFIG.year}
            </span>
          </div>
          <p className="text-[11px] tracking-wider text-neutral-500 uppercase">
            {SPARKATHON_CONFIG.tagline}
          </p>
        </div>

        <div className="text-center sm:text-right text-[11px] tracking-wider text-neutral-600 uppercase">
          <span>OFFICIAL EVENT PLATFORM</span>
          <span className="mx-2">•</span>
          <span>FRONTIER ENGINE</span>
        </div>
      </div>
    </footer>
  );
}
