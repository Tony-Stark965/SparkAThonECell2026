import React from "react";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export function Footer() {
  return (
    <footer className="w-full bg-black border-t border-neutral-900 py-12 px-6 text-neutral-500 font-mono text-xs">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="flex flex-col items-center md:items-start gap-1">
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

        {/* Contact Us Section */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
              CONTACT US
            </span>
            <span className="h-1 w-1 rounded-full bg-amber-400" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px] tracking-wider">
            <a
              href="tel:+916282908679"
              className="text-neutral-400 hover:text-amber-300 transition-colors"
            >
              <span>Joviee — </span>
              <span className="text-neutral-300 font-medium">+91 62829 08679</span>
            </a>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <a
              href="tel:+918454010645"
              className="text-neutral-400 hover:text-amber-300 transition-colors"
            >
              <span>Abhinaya Gowda — </span>
              <span className="text-neutral-300 font-medium">+91 84540 10645</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right text-[11px] tracking-wider uppercase">
          <p className="text-neutral-500">
            <span>ORGANIZED BY E-CELL FCRIT</span>
            <span className="mx-2">•</span>
            <span>IN COLLABORATION WITH IIC</span>
          </p>
          <p className="text-neutral-600">
            <span>OFFICIAL EVENT PLATFORM</span>
            <span className="mx-2">•</span>
            <span>FRONTIER ENGINE</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
