"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorldAct } from "@/components/scene/CameraJourneyRig";

import { CinematicHero } from "@/components/hero/CinematicHero";
import dynamic from "next/dynamic";
import { TerritoryOrchestrator } from "@/components/acts/TerritoryOrchestrator";

const TheArena = dynamic(() => import("@/components/acts/TheArena").then(mod => mod.TheArena), { ssr: true });
const TheBounty = dynamic(() => import("@/components/acts/TheBounty").then(mod => mod.TheBounty), { ssr: true });
const EventFlow = dynamic(() => import("@/components/acts/EventFlow").then(mod => mod.EventFlow), { ssr: true });
const FrontierPortal = dynamic(() => import("@/components/acts/FrontierPortal").then(mod => mod.FrontierPortal), { ssr: true });
const RegistrationChamber = dynamic(() => import("@/components/acts/RegistrationChamber").then(mod => mod.RegistrationChamber), { ssr: true });
const EventFAQ = dynamic(() => import("@/components/acts/EventFAQ").then(mod => mod.EventFAQ), { ssr: true });
import { Footer } from "@/components/ui/Footer";
import Image from "next/image";

const NAV_ITEMS: { act: WorldAct; label: string; hash: string; sectionId: string }[] = [
  { act: "HERO", label: "HEARTH", hash: "#hearth", sectionId: "hearth" },
  { act: "TERRITORIES", label: "SECTORS", hash: "#sectors", sectionId: "sectors" },
  { act: "ARENA", label: "ARENA", hash: "#arena", sectionId: "arena" },
  { act: "BOUNTY", label: "BOUNTY", hash: "#bounty", sectionId: "bounty" },
  { act: "FLOW", label: "FLOW", hash: "#flow", sectionId: "flow" },
  { act: "PORTAL", label: "PORTAL", hash: "#portal", sectionId: "portal" },
  { act: "REGISTER", label: "REGISTER", hash: "#register", sectionId: "register" },
];

export function WorldController() {
  const [currentAct, setCurrentAct] = useState<WorldAct>("HERO");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTerritory, setActiveTerritory] = useState<number>(0);
  const [selectedStele, setSelectedStele] = useState<number>(0);
  const heroProgressRef = useRef<number>(
    typeof window !== "undefined" && window.location.hash && window.location.hash !== "#hearth" ? 1 : 0
  );

  const scrollToSection = useCallback((sectionId: string, updateHash = true) => {
    const target = sectionId.replace("#", "");
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (updateHash && typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${target}`);
      }
    }
  }, []);

  // Zero-overhead scroll tracking using native IntersectionObserver (no layout reflows or scroll thrashing)
  useEffect(() => {
    const sectionToAct: Record<string, WorldAct> = {
      hearth: "HERO",
      sectors: "TERRITORIES",
      arena: "ARENA",
      bounty: "BOUNTY",
      flow: "FLOW",
      portal: "PORTAL",
      register: "REGISTER",
      faq: "REGISTER",
    };

    const sectionIds = Object.keys(sectionToAct);
    let historyTimeout: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const act = sectionToAct[entry.target.id];
            if (act) {
              setCurrentAct(act);
              if (historyTimeout) clearTimeout(historyTimeout);
              const targetId = entry.target.id;
              historyTimeout = setTimeout(() => {
                if (targetId && typeof window !== "undefined") {
                  window.history.replaceState(null, "", `#${targetId}`);
                }
              }, 200);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -35% 0px", // Centered viewport trigger band
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (historyTimeout) clearTimeout(historyTimeout);
    };
  }, []);

  // Deep-link URL hash synchronization on initial load & hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace("#", "");
      if (hash) {
        scrollToSection(hash, false);
      }
    };

    const timer = setTimeout(handleHash, 350);
    window.addEventListener("hashchange", handleHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHash);
    };
  }, [scrollToSection]);

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white overflow-x-hidden select-none">


      {/* 2. Continuous Native Experience Layer (Scroll-Driven World Journey) */}
      <main className="relative z-20 w-full flex flex-col">
        {/* ACT I / II / III: HEARTH / HERO */}
        <section id="hearth" className="relative w-full min-h-[100svh] flex flex-col justify-between">
          <CinematicHero
            onEnter={() => scrollToSection("sectors")}
            hasOwnScene={false}
            onProgressChange={(p) => {
              heroProgressRef.current = p;
            }}
          />
        </section>

        {/* ACT IV: SECTORS */}
        <section id="sectors" className="relative w-full min-h-[90vh] py-4 sm:py-6 flex flex-col justify-center">
          {/* Subtle background treatment for readability on scroll */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-black/95 md:bg-black/35 md:backdrop-blur-[4px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]" />
          
          <div className="relative z-10 w-full">
            <TerritoryOrchestrator
              activeIndex={activeTerritory}
              onSelectIndex={setActiveTerritory}
              onNextAct={() => scrollToSection("arena")}
            />
          </div>
        </section>

        {/* ACT V: THE ARENA */}
        <section id="arena" className="relative w-full min-h-[90vh] py-4 sm:py-6 flex flex-col justify-center">
          <TheArena
            selectedIndex={selectedStele}
            onSelectIndex={setSelectedStele}
            onNextAct={() => scrollToSection("bounty")}
          />
        </section>

        {/* ACT VI: THE BOUNTY */}
        <section id="bounty" className="relative w-full min-h-[90vh] py-4 sm:py-6 flex flex-col justify-center">
          <TheBounty onNextAct={() => scrollToSection("flow")} />
        </section>

        {/* ACT VII: THE FLOW */}
        <section id="flow" className="relative w-full min-h-[90vh] py-4 sm:py-6 flex flex-col justify-center">
          <EventFlow onNextAct={() => scrollToSection("portal")} />
        </section>

        {/* ACT VIII: THE PORTAL */}
        <section id="portal" className="relative w-full min-h-[90vh] py-4 sm:py-6 flex flex-col justify-center">
          <FrontierPortal
            onProceedToRegister={() => scrollToSection("register")}
            onReturnToHero={() => scrollToSection("hearth")}
          />
        </section>

        {/* ACT IX: REGISTRATION CHAMBER */}
        <section id="register" className="relative w-full min-h-[90vh] py-14 sm:py-24 flex flex-col justify-center">
          <RegistrationChamber onReturnToHero={() => scrollToSection("hearth")} />
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="relative w-full min-h-[90vh] py-12 sm:py-16 flex flex-col justify-center">
          <EventFAQ />
        </section>

        {/* Platform Footer */}
        <div className="w-full mt-10">
          <Footer />
        </div>
      </main>

      {/* 3. Top Navigation Bar (Desktop + Mobile Hamburger) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center w-full max-w-7xl px-4 justify-center pointer-events-none">
        {/* Desktop Nav */}
        <nav
          aria-label="Frontier Journey Navigation"
          className="hidden md:flex items-center gap-1 lg:gap-1.5 rounded-full border border-neutral-800/90 bg-neutral-950/85 px-2 lg:px-3 py-1.5 lg:py-2 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.85)] pointer-events-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentAct === item.act;
            return (
              <button
                key={item.act}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className={`font-mono text-xs lg:text-sm px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-full uppercase tracking-widest lg:tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${isActive
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/60 shadow-[0_0_15px_rgba(255,140,0,0.15)] font-bold"
                  : "text-neutral-300 hover:text-white border border-transparent"
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center justify-end w-full relative z-50 pointer-events-none">

          {/* Hamburger Right Pill */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full border border-neutral-800/90 bg-neutral-950/95 md:bg-neutral-950/85 md:backdrop-blur-lg shadow-lg relative w-12 h-12 flex items-center justify-center text-white focus:outline-none pointer-events-auto"
            aria-label="Toggle Menu"
          >
            <div className="flex flex-col gap-[5px] items-center justify-center w-5">
              <span className={`block h-[2px] w-full bg-amber-400 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`block h-[2px] w-full bg-amber-400 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "opacity-0 translate-x-2" : ""}`} />
              <span className={`block h-[2px] w-full bg-amber-400 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-16 left-4 right-4 bg-gradient-to-b from-[#161009]/95 via-[#0b0804]/98 to-black border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2 md:backdrop-blur-xl md:hidden pointer-events-auto shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(255,140,0,0.15)] origin-top z-40 overflow-hidden"
            >
              {/* Decorative top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

              {NAV_ITEMS.map((item, idx) => {
                const isActive = currentAct === item.act;
                return (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.3 }}
                    key={item.act}
                    onClick={() => {
                      scrollToSection(item.sectionId);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-left font-mono text-sm px-5 py-4 rounded-xl uppercase tracking-widest transition-all duration-300 flex items-center justify-between group ${isActive
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/50 shadow-[inset_0_0_15px_rgba(251,191,36,0.1)]"
                      : "text-neutral-300 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="text-amber-400 text-xs">◆</span>}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
