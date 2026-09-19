"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CameraJourneyRig, WorldAct } from "./CameraJourneyRig";
import { CaveEnvironment } from "./CaveEnvironment";
import { FlameCore } from "./FlameCore";
import { EmberSystem } from "./EmberSystem";
import { WorldChambers } from "./WorldChambers";
import { InteractionField } from "./InteractionField";
import { EmberField } from "@/components/hero/EmberField";
import { CaveAtmosphere } from "@/components/hero/CaveAtmosphere";

export interface CaveSceneProps {
  progress?: number; // 0 (darkness) to 1 (revelation)
  progressRef?: React.RefObject<number | null> | React.MutableRefObject<number>;
  currentAct?: WorldAct;
  activeTerritory?: number;
  selectedStele?: number;
  scrollProgress?: number;
  className?: string;
}

const isWebGLAvailable = (): boolean => {
  if (typeof window === "undefined") return true;
  // Zero-lag optimization: Completely disable WebGL on mobile devices
  if (typeof window !== "undefined" && window.innerWidth < 768) return false;

  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
};

export function CaveScene({
  progress = 1,
  progressRef: externalProgressRef,
  currentAct,
  activeTerritory = 0,
  selectedStele = 0,
  scrollProgress = 0,
  className = "",
}: CaveSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());
  const progressRef = useRef(progress);
  const actRef = useRef<WorldAct>(currentAct || (progress >= 1 ? "HERO" : "IGNITION"));
  const territoryRef = useRef(activeTerritory);
  const steleRef = useRef(selectedStele);
  const scrollProgressRef = useRef(scrollProgress);

  useEffect(() => {
    progressRef.current = progress;
    actRef.current = currentAct || (progress >= 1 ? "HERO" : "IGNITION");
    territoryRef.current = activeTerritory;
    steleRef.current = selectedStele;
    scrollProgressRef.current = scrollProgress;
  }, [progress, currentAct, activeTerritory, selectedStele, scrollProgress]);

  useEffect(() => {
    if (!webglSupported) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false, // Opaque canvas: guarantees deep dark obsidian cavern base
        antialias: window.innerWidth >= 768,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Restrained tone mapping exposure to prevent blow-out
    renderer.toneMappingExposure = 0.85;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);

    // Camera Rig with multi-act trajectory
    const cameraRig = new CameraJourneyRig(52, window.innerWidth / window.innerHeight, 0.1, 70);

    // 1. Procedural 3D Cavern Environment (Basalt rock arch, floor, hearth ring)
    const caveEnv = new CaveEnvironment();
    scene.add(caveEnv.group);

    // 2. Compact Living Flame Core (Living 3D flame volume at hearth: 6 planes on mobile vs 18 on desktop)
    const flameCore = new FlameCore(isMobile);
    scene.add(flameCore.group);

    // 3. Fine Rising Embers
    const emberSystem = new EmberSystem(isMobile, dpr);
    scene.add(emberSystem.points);

    // 4. Physical Multi-Act Chamber Artifacts (Territories, Arena Steles, Vault, Beacons)
    const worldChambers = new WorldChambers();
    scene.add(worldChambers.group);

    // 5. Subtle ambient gloom: very low (0.04) so 80%+ of screen is deep black/charcoal
    const ambientLight = new THREE.AmbientLight(0x0e0804, 0.06);
    scene.add(ambientLight);

    // Interaction Field
    const interaction = new InteractionField();

    let animationFrameId: number;
    const clock = new THREE.Clock();
    let isVisible = true;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || window.innerWidth < 768) return;
      interaction.onPointerMove(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || window.innerWidth < 768) return;
      interaction.onPointerDown();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch" || window.innerWidth < 768) return;
      interaction.onPointerUp();
    };

    let cachedTotalScroll = 1;
    const updateTotalScroll = () => {
      if (typeof document !== "undefined" && typeof window !== "undefined") {
        cachedTotalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      }
    };
    updateTotalScroll();
    const settleTimer = setTimeout(updateTotalScroll, 500);

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const widthChanged = Math.abs(width - lastWidth) > 8;
      const heightChanged = Math.abs(height - lastHeight) > 100;
      
      // If the device rotates or is resized to a mobile width, we should technically reload to disable WebGL, 
      // but for now we just handle resizing the existing canvas if it's already active.
      const isCurrentlyMobile = width < 768;

      // Mobile keyboard freeze protection:
      // When software keyboard opens/closes, only height changes.
      // Do NOT destroy and recreate WebGL canvas buffers (renderer.setSize),
      // as buffer reallocation causes noticeable frame freezes and keyboard stutter.
      if (isCurrentlyMobile && !widthChanged && heightChanged) {
        cameraRig.updateAspect(width / height);
        updateTotalScroll();
        return;
      }

      lastWidth = width;
      lastHeight = height;

      cameraRig.updateAspect(width / height);
      const newDpr = Math.min(window.devicePixelRatio || 1, isCurrentlyMobile ? 1.0 : 2);
      renderer.setPixelRatio(newDpr);
      renderer.setSize(width, height);
      emberSystem.setPixelRatio(newDpr);
      updateTotalScroll();
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    // Attach mouse pointer listeners only on non-touch desktop devices
    if (!isMobile) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerdown", handlePointerDown, { passive: true });
      window.addEventListener("pointerup", handlePointerUp, { passive: true });
    }
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    let lastRenderTime = 0;
    const mobileFrameInterval = 1 / 30; // 30 FPS cap on mobile displays (cuts GPU draw load in half, prevents thermal throttling and frame drops)

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const act = actRef.current;

      // Dynamic Occlusion Pausing:
      // When the user is in the Registration Chamber, FAQ, or below Arena on mobile,
      // the entire screen is covered by 100% opaque industrial basalt panels.
      // Skipping 3D WebGL computation and render() drops GPU/CPU consumption to 0%
      const isOccluded =
        act === "REGISTER" ||
        (isMobile && (act === "FLOW" || act === "BOUNTY" || act === "ARENA"));

      if (isOccluded) {
        // Run a slower loop to check when we come out of occlusion (approx 4fps check)
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(animate);
        }, 250);
        return;
      }

      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Mobile frame pacing: throttle mobile screens (including 90/120Hz LTPO) to stable 30 FPS
      if (isMobile) {
        const delta = elapsedTime - lastRenderTime;
        if (delta < mobileFrameInterval - 0.002) {
          return;
        }
        lastRenderTime = elapsedTime;
      }

      const currentProg =
        act && act !== "HERO"
          ? 1
          : (externalProgressRef && externalProgressRef.current !== null
              ? externalProgressRef.current
              : progressRef.current);

      // Update interaction inertia and 3D world projection (desktop only)
      if (!isMobile) {
        interaction.update(cameraRig.camera);
      }

      // Sample instantaneous native window scroll without forced document reflow
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      const liveScroll =
        cachedTotalScroll > 0 ? Math.min(1, Math.max(0, scrollY / cachedTotalScroll)) : scrollProgressRef.current;

      // Camera dolly forward and multi-act trajectory with immediate scroll response
      cameraRig.update(
        elapsedTime,
        act,
        currentProg,
        interaction.pointerNormalized.x,
        interaction.pointerNormalized.y,
        liveScroll
      );

      // Living flame core with aerodynamic wind displacement
      flameCore.update(elapsedTime, currentProg, interaction.wind);

      // Cave environment indirect illumination from hearth
      caveEnv.update(elapsedTime, currentProg);

      // Fine embers rising from hearth
      emberSystem.update(
        elapsedTime,
        currentProg,
        currentProg,
        interaction.worldPointer
      );

      // Multi-act 3D physical chamber structures
      worldChambers.updateVisibility(act, territoryRef.current, steleRef.current);
      worldChambers.update(elapsedTime, act);

      renderer.render(scene, cameraRig.camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(settleTimer);
      if (!isMobile) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointerup", handlePointerUp);
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);

      caveEnv.dispose();
      flameCore.dispose();
      emberSystem.dispose();
      worldChambers.dispose();
      renderer.dispose();
    };
  }, [webglSupported, externalProgressRef]);

  if (!webglSupported) {
    return (
      <div className={`pointer-events-none absolute inset-0 ${className}`}>
        <CaveAtmosphere glowLevel={progress} />
        <EmberField intensity={progress} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
