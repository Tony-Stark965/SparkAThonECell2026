"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WorldAct } from "@/components/scene/CameraJourneyRig";
import { CaveScene } from "@/components/scene/CaveScene";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { TerritoryOrchestrator } from "@/components/acts/TerritoryOrchestrator";
import { TheArena } from "@/components/acts/TheArena";
import { TheBounty } from "@/components/acts/TheBounty";
import { EventFlow } from "@/components/acts/EventFlow";
import { FrontierPortal } from "@/components/acts/FrontierPortal";
import { RegistrationChamber } from "@/components/acts/RegistrationChamber";
import { SparkCursor } from "@/components/interaction/SparkCursor";
import { Footer } from "@/components/ui/Footer";

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
      {/* 0. Signature Physical Spark Brush Cursor Overlay */}
      <SparkCursor />

      {/* 1. Single Persistent 3D WebGL Cavern with Multi-Act Camera Rig */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CaveScene
          progress={currentAct === "HERO" ? heroSceneProgress : 1}
          currentAct={currentAct}
          activeTerritory={activeTerritory}
          selectedStele={selectedStele}
        />
      </div>

      {/* 2. Micro-Film Grain Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.14] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* 3. Continuous Native Experience Layer (Scroll-Driven World Journey) */}
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
        <section id="sectors" className="relative w-full min-h-[90vh] py-14 sm:py-24 flex flex-col justify-center">
          <TerritoryOrchestrator
            activeIndex={activeTerritory}
            onSelectIndex={setActiveTerritory}
            onNextAct={() => scrollToSection("arena")}
          />
        </section>

        {/* ACT V: THE ARENA */}
        <section id="arena" className="relative w-full min-h-[90vh] py-14 sm:py-24 flex flex-col justify-center">
          <TheArena
            selectedIndex={selectedStele}
            onSelectIndex={setSelectedStele}
            onNextAct={() => scrollToSection("bounty")}
          />
        </section>

        {/* ACT VI: THE BOUNTY */}
        <section id="bounty" className="relative w-full min-h-[90vh] py-14 sm:py-24 flex flex-col justify-center">
          <TheBounty onNextAct={() => scrollToSection("flow")} />
        </section>

        {/* ACT VII: THE FLOW */}
        <section id="flow" className="relative w-full min-h-[90vh] py-14 sm:py-24 flex flex-col justify-center">
          <EventFlow onNextAct={() => scrollToSection("portal")} />
        </section>

        {/* ACT VIII: THE PORTAL */}
        <section id="portal" className="relative w-full min-h-[90vh] py-14 sm:py-24 flex flex-col justify-center">
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

      {/* 4. Floating Frontier HUD Navigation Dock (Thumb-Friendly on 390px Mobile) */}
      <nav
        aria-label="Frontier Journey Navigation"
        className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] overflow-x-auto rounded-full border border-neutral-800/90 bg-neutral-950/85 px-2.5 sm:px-3 py-1.5 sm:py-2 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.85)] flex items-center gap-1 sm:gap-1.5 no-scrollbar"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentAct === item.act;
          return (
            <button
              key={item.act}
              type="button"
              onClick={() => scrollToSection(item.sectionId)}
              className={`font-mono text-[9px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(255,140,0,0.3)] font-bold"
                  : "text-neutral-400 hover:text-white border border-transparent"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
