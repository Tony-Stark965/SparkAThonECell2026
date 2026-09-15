"use client";

import React, { useEffect, useRef } from "react";

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  decayRate: number;
  sparkleFreq: number;
  sparkleOffset: number;
  colorR: number;
  colorG: number;
  colorB: number;
}

interface EmberFieldProps {
  intensity?: number; // 0 (calm ember) to 1 (full hearth fire)
  interactive?: boolean;
  className?: string;
}

export function EmberField({
  intensity = 1,
  interactive = true,
  className = "",
}: EmberFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // Interaction coordinates in canvas space (normalized or actual)
  const pointerRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    prevX: number;
    prevY: number;
    speed: number;
  }>({
    x: -1000,
    y: -1000,
    active: false,
    prevX: -1000,
    prevY: -1000,
    speed: 0,
  });

  // Track scroll velocity for kinetic upward lift
  const scrollVelocityRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Responsive particle count: lean for mobile 390px, rich for desktop
    const getParticleCount = () => {
      const isMobile = window.innerWidth < 768;
      return isMobile ? 55 : 115;
    };

    let particleCount = getParticleCount();
    let embers: Ember[] = [];

    const createEmber = (initialBurst = false, spawnX?: number, spawnY?: number): Ember => {
      const isMobile = width < 768;
      const isBurst = typeof spawnX === "number" && typeof spawnY === "number";

      // Embers spawn primarily near the bottom/center where the hearth lives, or at pointer
      const x = isBurst
        ? spawnX + (Math.random() - 0.5) * 35
        : Math.random() * width;

      const y = isBurst
        ? spawnY + (Math.random() - 0.5) * 35
        : initialBurst
        ? Math.random() * height
        : height + Math.random() * 40;

      // Organic upward velocity with natural campfire thermal draft
      const baseVy = isBurst
        ? -(Math.random() * 2.5 + 1.2)
        : -(Math.random() * 1.4 + 0.5);

      const baseVx = isBurst
        ? (Math.random() - 0.5) * 2.5
        : (Math.random() - 0.5) * 0.8;

      const maxLife = Math.random() * 240 + 160;
      const radius = isMobile
        ? Math.random() * 1.8 + 0.6
        : Math.random() * 2.4 + 0.7;

      // Color temperature variation: bright warm core -> gold -> deep amber
      const tempRoll = Math.random();
      const colorR = 255;
      let colorG = 160;
      let colorB = 40;

      if (tempRoll > 0.85) {
        // Hot white-gold core
        colorG = 230;
        colorB = 160;
      } else if (tempRoll > 0.45) {
        // Vibrant flame amber
        colorG = 135;
        colorB = 25;
      } else {
        // Deep glowing crimson/ember coal
        colorG = 65;
        colorB = 10;
      }

      return {
        x,
        y,
        vx: baseVx,
        vy: baseVy,
        radius,
        alpha: 0,
        maxAlpha: Math.random() * 0.7 + 0.3,
        life: 0,
        maxLife,
        decayRate: 1 / maxLife,
        sparkleFreq: Math.random() * 0.08 + 0.02,
        sparkleOffset: Math.random() * Math.PI * 2,
        colorR,
        colorG,
        colorB,
      };
    };

    const initEmbers = () => {
      embers = [];
      for (let i = 0; i < particleCount; i++) {
        embers.push(createEmber(true));
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      particleCount = getParticleCount();
      if (embers.length < particleCount) {
        while (embers.length < particleCount) {
          embers.push(createEmber(true));
        }
      } else if (embers.length > particleCount) {
        embers = embers.slice(0, particleCount);
      }
    };

    handleResize();
    initEmbers();

    // Pointer events (PointerEvent handles both mouse and touch transparently)
    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const p = pointerRef.current;
      const dx = clientX - p.prevX;
      const dy = clientY - p.prevY;
      p.speed = Math.sqrt(dx * dx + dy * dy);
      p.x = clientX;
      p.y = clientY;
      p.prevX = clientX;
      p.prevY = clientY;
      p.active = true;

      // On energetic touch or fast drag, spawn responsive micro-sparks (capped)
      if (p.speed > 8 && embers.length < particleCount + 20) {
        embers.push(createEmber(false, clientX, clientY));
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      pointerRef.current.active = true;
      pointerRef.current.x = clientX;
      pointerRef.current.y = clientY;

      // Spawn a burst of 5-8 sparks at touch / click locus
      const burstCount = Math.floor(Math.random() * 4) + 4;
      for (let i = 0; i < burstCount; i++) {
        embers.push(createEmber(false, clientX, clientY));
      }
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.x = -1000;
      pointerRef.current.y = -1000;
    };

    // Scroll velocity tracker
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      scrollVelocityRef.current = delta;
      lastScrollYRef.current = currentY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerLeave);
    window.addEventListener("pointercancel", handlePointerLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.015;

      // Dampen scroll velocity smoothly each frame
      scrollVelocityRef.current *= 0.9;
      const scrollDraft = Math.max(-4, Math.min(4, scrollVelocityRef.current * 0.15));

      // Pointer momentum decay
      pointerRef.current.speed *= 0.88;

      ctx.clearRect(0, 0, width, height);

      const curIntensity = intensityRef.current;
      if (curIntensity <= 0.01) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const p = pointerRef.current;

      // Update and render each ember
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life++;

        // Life curve: fade in -> gentle flicker -> fade out
        const progress = e.life / e.maxLife;
        if (progress < 0.2) {
          e.alpha = (progress / 0.2) * e.maxAlpha;
        } else if (progress > 0.75) {
          e.alpha = (1 - (progress - 0.75) / 0.25) * e.maxAlpha;
        } else {
          // Organic campfire flicker
          const flicker = Math.sin(time * 6 + e.sparkleOffset) * 0.15;
          e.alpha = Math.max(0.05, Math.min(1, e.maxAlpha + flicker));
        }

        // Upward thermal buoyant force + gentle horizontal swaying draft
        const sway = Math.sin(time * 2 + e.y * 0.01) * 0.45;
        e.x += e.vx + sway;
        e.y += e.vy - Math.abs(scrollDraft);

        // Interactive deflection / attraction near pointer
        if (p.active) {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 140;

          if (distSq < maxDist * maxDist && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 0.75;
            
            // Gentle swirling updraft away from finger / cursor
            e.vx -= (dx / dist) * force * 0.9;
            e.vy -= force * 1.2; // Updraft
          }
        }

        // Natural air friction
        e.vx *= 0.985;
        e.vy *= 0.995;

        // Render ember with luminous core
        const drawAlpha = e.alpha * curIntensity;
        if (drawAlpha > 0.01) {
          const r = Math.max(0.5, e.radius);

          // Subtle radial halo for fire luminance
          const grad = ctx.createRadialGradient(
            e.x,
            e.y,
            0,
            e.x,
            e.y,
            r * 2.8
          );
          grad.addColorStop(0, `rgba(${e.colorR}, ${e.colorG}, ${e.colorB}, ${drawAlpha})`);
          grad.addColorStop(0.35, `rgba(${e.colorR}, ${Math.floor(e.colorG * 0.7)}, 15, ${drawAlpha * 0.6})`);
          grad.addColorStop(1, `rgba(${e.colorR}, 30, 0, 0)`);

          ctx.beginPath();
          ctx.arc(e.x, e.y, r * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Hot intense inner point
          ctx.beginPath();
          ctx.arc(e.x, e.y, r * 0.65, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 240, ${drawAlpha * 0.9})`;
          ctx.fill();
        }

        // Recycle ember once it dies or exits upper bounds
        if (e.life >= e.maxLife || e.y < -30 || e.x < -40 || e.x > width + 40) {
          if (embers.length > particleCount) {
            // Trim excess burst particles
            embers.splice(i, 1);
          } else {
            embers[i] = createEmber(false);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerLeave);
      window.removeEventListener("pointercancel", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-10 block h-full w-full ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}
