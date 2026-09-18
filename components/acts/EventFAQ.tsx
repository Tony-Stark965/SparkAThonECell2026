"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export function EventFAQ() {
  const [openId, setOpenId] = useState<string | null>(null);
  const faqItems = SPARKATHON_CONFIG.faq;

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative z-30 w-full max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-center items-center">
      {/* 1. Act Header */}
      <div className="flex flex-col items-center text-center mb-5 sm:mb-8">
        <div className="inline-flex items-center gap-2.5 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">
            EXPEDITION PROTOCOLS // INTEL
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
          FREQUENTLY ASKED QUESTIONS
        </h2>

        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 font-medium uppercase max-w-md">
          Confirmed event protocols, structures, and guidelines for participating squads.
        </p>
      </div>

      {/* 2. Accessible Obsidian Accordion */}
      <div className="w-full max-w-3xl space-y-2.5 sm:space-y-3">
        {faqItems.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "border-amber-500/60 bg-neutral-950/90 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                  : "border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700"
              }`}
            >
              <button
                type="button"
                id={`faq-btn-${item.id}`}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-amber-400/90 tracking-widest shrink-0 mt-[2px] self-start">
                    {item.number}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-200 tracking-wide text-left">
                    {item.question}
                  </span>
                </div>

                <div
                  className={`shrink-0 w-6 h-6 rounded-full border border-neutral-800 flex items-center justify-center transition-transform duration-300 ${
                    isOpen
                      ? "rotate-180 border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "text-neutral-300 bg-neutral-900/60"
                  }`}
                  aria-hidden="true"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-1 border-t border-neutral-800/60">
                      <p className="font-mono text-xs sm:text-sm text-neutral-300 leading-relaxed pl-6 sm:pl-7">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
