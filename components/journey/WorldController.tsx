"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorldAct } from "@/components/scene/CameraJourneyRig";
import { CaveScene } from "@/components/scene/CaveScene";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { TerritoryOrchestrator } from "@/components/acts/TerritoryOrchestrator";
import { TheArena } from "@/components/acts/TheArena";
import { TheBounty } from "@/components/acts/TheBounty";
import { EventFlow } from "@/components/acts/EventFlow";
import { FrontierPortal } from "@/components/acts/FrontierPortal";
import { RegistrationChamber } from "@/components/acts/RegistrationChamber";
import { Footer } from "@/components/ui/Footer";
import { Menu, X } from "lucide-react";

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
  const [heroSceneProgress, setHeroSceneProgress] = useState<number>(() => {
    if (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#hearth") {
      return 1;
    }
    return 0;
  });

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

  // Continuous passive scroll-driven navigation tracking across all acts (mobile & desktop)
  useEffect(() => {
    const sectionToAct: Record<string, WorldAct> = {
      hearth: "HERO",
      sectors: "TERRITORIES",
      arena: "ARENA",
      bounty: "BOUNTY",
      flow: "FLOW",
      portal: "PORTAL",
      register: "REGISTER",
    };

    const sectionIds = Object.keys(sectionToAct);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const centerY = window.innerHeight * 0.45;
          for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= centerY && rect.bottom > centerY) {
                const act = sectionToAct[id];
                if (act) {
                  setCurrentAct(act);
                  window.history.replaceState(null, "", `#${id}`);
                }
                break;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
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
    <div className="relative min-h-screen w-full bg-[#020202] text-white overflow-x-hidden select-none">
      {/* 1. Single Persistent 3D WebGL Cavern with Multi-Act Camera Rig */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CaveScene
          progress={currentAct === "HERO" ? heroSceneProgress : 1}
          currentAct={currentAct}
          activeTerritory={activeTerritory}
          selectedStele={selectedStele}
        />
      </div>

      {/* 2. Continuous Native Experience Layer (Scroll-Driven World Journey) */}
      <main className="relative z-20 w-full flex flex-col">
        {/* ACT I / II / III: HEARTH / HERO */}
        <section id="hearth" className="relative w-full min-h-[100svh] flex flex-col justify-between">
          <CinematicHero
            onEnter={() => scrollToSection("sectors")}
            hasOwnScene={false}
            onProgressChange={setHeroSceneProgress}
          />
        </section>

        {/* ACT IV: SECTORS */}
        <section id="sectors" className="relative w-full min-h-[90vh] py-4 sm:py-6 flex flex-col justify-center">
          <TerritoryOrchestrator
            activeIndex={activeTerritory}
            onSelectIndex={setActiveTerritory}
            onNextAct={() => scrollToSection("arena")}
          />
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
                className={`font-mono text-[10px] lg:text-xs px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-full uppercase tracking-widest lg:tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${isActive
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/60 shadow-[0_0_15px_rgba(255,140,0,0.15)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center justify-between w-full relative z-50 pointer-events-none">
          {/* E-CELL Left Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-neutral-800/90 bg-neutral-950/85 px-4 py-2 backdrop-blur-lg shadow-lg pointer-events-auto">
            <div className="bg-white/90 rounded p-0.5 flex items-center justify-center gap-1.5">
              <img src="/images/iic-logo.png" alt="IIC Logo" className="h-4 sm:h-5 w-auto" />
              <div className="w-[1px] h-3.5 bg-neutral-300 mx-0.5" />
              <img src="/images/ecell-logo-new.png" alt="E-Cell Official Logo" className="h-4 sm:h-5 w-auto" />
            </div>
            <span className="text-amber-500 font-black text-[10px] sm:text-xs tracking-[0.25em] font-mono">
              ECELL FCRIT
            </span>
          </div>

          {/* Hamburger Right Pill */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full border border-neutral-800/90 bg-neutral-950/85 backdrop-blur-lg shadow-lg relative w-12 h-12 flex items-center justify-center text-white focus:outline-none pointer-events-auto"
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
              className="absolute top-16 left-4 right-4 bg-gradient-to-b from-[#161009]/95 via-[#0b0804]/98 to-black border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-xl md:hidden pointer-events-auto shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(255,140,0,0.15)] origin-top z-40 overflow-hidden"
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
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="text-amber-400 text-[10px]">◆</span>}
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
