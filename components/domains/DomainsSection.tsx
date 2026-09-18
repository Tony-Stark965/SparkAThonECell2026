"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SPARKATHON_CONFIG, DomainItem } from "@/config/sparkathon.config";

export function DomainsSection() {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  return (
    <section
      id="frontier-domains"
      className="relative w-full bg-[#050505] text-white py-24 px-5 sm:px-8 md:px-12 border-t border-neutral-900 overflow-hidden"
    >
      {/* Cavern ambient background subtle lighting */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[140px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 90, 0, 0.4) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="flex flex-col items-start md:items-center text-left md:text-center mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
            <span className="font-mono text-xs tracking-[0.25em] text-amber-400 uppercase font-medium">
              TERRITORIES // SPARK-A-THON 2026
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-100">
            OFFICIAL DOMAINS
          </h2>

          <p className="mt-4 max-w-xl text-xs sm:text-sm md:text-base font-mono text-neutral-300 uppercase tracking-wider leading-relaxed">
            Five validated frontier domains. Choose your ground. Build what does not yet exist.
          </p>
        </div>

        {/* Domain Cards Grid (Mobile 390px optimized -> Tablet -> Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {SPARKATHON_CONFIG.domains.map((domain: DomainItem, index: number) => {
            const isFifth = index === 4;
            const isSelected = activeDomain === domain.id;

            return (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                onClick={() => setActiveDomain(isSelected ? null : domain.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-gradient-to-b from-neutral-900/60 to-black p-6 sm:p-7 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "border-amber-500/80 shadow-[0_0_24px_rgba(255,100,0,0.18)]"
                    : "border-neutral-800/90 hover:border-neutral-700 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                } ${isFifth ? "md:col-span-2 lg:col-span-1" : ""}`}
              >
                {/* Subtle top rim amber line on active or hover */}
                <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div>
                  {/* Top card bar: index + status */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-sm tracking-widest text-amber-400/90 font-semibold">
                      /{domain.number}
                    </span>
                    <span className="font-mono text-xs tracking-wider text-neutral-300 uppercase px-2 py-0.5 rounded border border-neutral-800 bg-neutral-950">
                      FRONTIER TRACK
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-amber-100 transition-colors">
                    {domain.title}
                  </h3>

                  <p className="mt-1 font-mono text-xs tracking-wide text-amber-500/80 uppercase">
                    {domain.subtitle}
                  </p>

                  {/* Description */}
                  <p className="mt-4 text-xs sm:text-sm text-neutral-300/90 leading-relaxed">
                    {domain.description}
                  </p>
                </div>

                {/* Pillar tags */}
                <div className="mt-6 pt-5 border-t border-neutral-800/70">
                  <div className="flex flex-wrap gap-1.5">
                    {domain.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="font-mono text-xs tracking-wider text-neutral-300 bg-neutral-900/90 border border-neutral-800 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Configurable External Registration Callout */}
        <div className="mt-16 sm:mt-20 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Subtle warm ember center glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 rounded-full blur-[90px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 120, 0, 0.4) 0%, transparent 80%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            <span className="font-mono text-xs tracking-[0.25em] text-amber-400 uppercase font-semibold">
              PRE-EVENT REGISTRATION OF INTEREST
            </span>

            <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ready to build on the frontier?
            </h3>

            <p className="mt-3 font-mono text-xs sm:text-sm text-neutral-300 uppercase tracking-wide leading-relaxed">
              {SPARKATHON_CONFIG.dates.note}.
              <br />
              Register early interest to receive direct notification once dates are locked.
            </p>

            <a
              href="#register"
              className="mt-7 inline-flex items-center justify-center gap-2.5 rounded-full border border-amber-500/60 bg-amber-500/10 px-8 py-3.5 font-mono text-xs sm:text-sm font-semibold tracking-[0.2em] text-amber-300 uppercase transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-400 hover:text-white hover:shadow-[0_0_25px_rgba(255,120,0,0.3)] active:scale-[0.98]"
            >
              <span>{SPARKATHON_CONFIG.registration.label}</span>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
