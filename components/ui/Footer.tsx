import React from "react";
import Image from "next/image";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export function Footer() {
  return (
    <footer className="relative w-full border-t border-neutral-900 bg-black overflow-hidden font-mono text-xs text-neutral-300">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 items-start">
          
          {/* Column 1: Branding */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)]" />
              <span className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                {SPARKATHON_CONFIG.name} <span className="text-amber-500">{SPARKATHON_CONFIG.year}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm tracking-[0.2em] text-neutral-400 uppercase leading-relaxed max-w-xs">
              {SPARKATHON_CONFIG.tagline}
            </p>
            <div className="pt-2">
              <p className="text-[10px] tracking-widest text-neutral-500 uppercase leading-loose">
                Organized by E-Cell FCRIT
                <br />
                In collaboration with IIC
              </p>
            </div>
          </div>

          {/* Column 2: Contact */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              <span className="text-sm font-bold tracking-[0.3em] text-amber-400 uppercase">
                CONTACT
              </span>
              <span className="h-1 w-1 rounded-full bg-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-[500px]">
              {/* Event Info */}
              <div className="group rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-3 sm:p-4 transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] break-words flex flex-col items-center justify-center">
                <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-1.5 group-hover:text-amber-500/70 transition-colors">Event Info</p>
                <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Abhinaya Gowda</p>
                <a href="tel:+918454010645" className="mt-1 block py-2 -mb-2 font-mono text-[10px] sm:text-xs tracking-widest text-amber-400 hover:text-amber-300 transition-colors">
                  +91 84540 10645
                </a>
              </div>
              
              {/* Registration Issues */}
              <div className="group rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-3 sm:p-4 transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] break-words flex flex-col items-center justify-center">
                <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-1.5 group-hover:text-amber-500/70 transition-colors">Reg Issues</p>
                <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Abhishek Kulbainur</p>
                <a href="tel:+919867522536" className="mt-1 block py-2 -mb-2 font-mono text-[10px] sm:text-xs tracking-widest text-amber-400 hover:text-amber-300 transition-colors">
                  +91 98675 22536
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Connect & Socials */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-5">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              <span className="text-sm font-bold tracking-[0.3em] text-amber-400 uppercase">
                CONNECT
              </span>
              <span className="h-1 w-1 rounded-full bg-amber-400" />
            </div>

            <div className="flex items-center justify-center md:justify-end gap-5 w-full">
              {/* Instagram */}
              <a href="#" className="group relative p-3 rounded-full border border-neutral-800 bg-neutral-900/80 hover:border-amber-500 hover:bg-amber-500/10 transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center h-[46px] w-[46px]" aria-label="Instagram">
                <svg className="w-5 h-5 text-neutral-400 group-hover:text-amber-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="#" className="group relative p-3 rounded-full border border-neutral-800 bg-neutral-900/80 hover:border-amber-500 hover:bg-amber-500/10 transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center h-[46px] w-[46px]" aria-label="LinkedIn">
                <svg className="w-5 h-5 text-neutral-400 group-hover:text-amber-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>

            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-14 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-widest text-neutral-600 uppercase">
          <p>© {new Date().getFullYear()} {SPARKATHON_CONFIG.name}. All rights reserved.</p>
          <p>Frontier Engine • V2.0</p>
        </div>
      </div>
    </footer>
  );
}
