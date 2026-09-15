"use client";

import React, { useEffect, useRef } from "react";

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  decay: number;
  colorR: number;
  colorG: number;
  colorB: number;
  turbOffset: number;
  isHot: boolean;
}

export function SparkCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic pointer & touch state tracking
    const pointer = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      lerpX: -1000,
      lerpY: -1000,
      vx: 0,
      vy: 0,
      speed: 0,
      pressure: 1.0,
      active: false,
      isDown: false,
      revealAlpha: 0,
    };

    const sparks: SparkParticle[] = [];
    const maxSparks = 280; // High particle budget for rich energy brush

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const spawnSparks = (x: number, y: number, count: number, speedBoost: number, burst = false) => {
      for (let i = 0; i < count; i++) {
        if (sparks.length >= maxSparks) {
          sparks.shift();
        }

        const angle = Math.random() * Math.PI * 2;
        const spread = burst
          ? Math.random() * 4.5 + 1.2
          : Math.random() * (speedBoost * 0.4 + 1.6) + 0.6;

        // Tangential & radial velocity with momentum
        const vx = Math.cos(angle) * spread - pointer.vx * 0.2;
        const vy = Math.sin(angle) * spread - pointer.vy * 0.2;

        const maxLife = Math.floor(Math.random() * 40 + 25);
        const radius = Math.random() * 2.4 + 0.7;
        const isHot = Math.random() > 0.6;

        sparks.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx,
          vy,
          radius,
          life: 0,
          maxLife,
          decay: 1 / maxLife,
          colorR: 255,
          colorG: isHot ? 240 : 165,
          colorB: isHot ? 190 : 35,
          turbOffset: Math.random() * Math.PI * 2,
          isHot,
        });
      }
    };

    const updatePointerCoords = (
      clientX: number,
      clientY: number,
      pressure = 1.0,
      isTouch = false
    ) => {
      if (!pointer.active) {
        pointer.x = clientX;
        pointer.y = clientY;
        pointer.prevX = clientX;
        pointer.prevY = clientY;
        pointer.lerpX = clientX;
        pointer.lerpY = clientY;
        pointer.active = true;
      }

      const dx = clientX - pointer.prevX;
      const dy = clientY - pointer.prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      pointer.vx = dx;
      pointer.vy = dy;
      pointer.speed = speed;
      pointer.pressure = pressure;
      pointer.x = clientX;
      pointer.y = clientY;
      if (isTouch) {
        pointer.lerpX = clientX;
        pointer.lerpY = clientY;
      }
      pointer.revealAlpha = Math.min(pointer.revealAlpha + 0.25, 0.55);

      // High-frequency stroke interpolation so rapid mouse/finger strokes form an unbroken, luminous spark ribbon
      const sparkDensity = Math.min(Math.floor(speed * 0.4 * pressure) + 1, 14);
      if (speed > 8) {
        const steps = Math.min(Math.floor(speed / 10), 6);
        for (let s = 1; s <= steps; s++) {
          const stepX = pointer.prevX + (dx * s) / steps;
          const stepY = pointer.prevY + (dy * s) / steps;
          spawnSparks(stepX, stepY, Math.ceil(sparkDensity / steps), speed);
        }
      } else {
        spawnSparks(clientX, clientY, sparkDensity, speed);
      }

      pointer.prevX = clientX;
      pointer.prevY = clientY;
    };

    // Desktop Pointer Events
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Handled by native touch events
      updatePointerCoords(e.clientX, e.clientY, 1.0, false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.isDown = true;
      pointer.active = true;
      updatePointerCoords(e.clientX, e.clientY, 1.5, false);
      spawnSparks(e.clientX, e.clientY, 16, 7, true);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.isDown = false;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    // Native Mobile Touch Events (Explicit touchstart, touchmove, touchend for 100% mobile touch brush feel)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        pointer.isDown = true;
        pointer.active = true;
        pointer.lerpX = t.clientX;
        pointer.lerpY = t.clientY;
        const force = ((t as unknown as { force?: number }).force ?? 1.0) || 1.0;
        updatePointerCoords(t.clientX, t.clientY, force, true);
        spawnSparks(t.clientX, t.clientY, 22, 8, true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const force = ((t as unknown as { force?: number }).force ?? 1.0) || 1.0;
        updatePointerCoords(t.clientX, t.clientY, force, true);
      }
    };

    const onTouchEnd = () => {
      pointer.isDown = false;
      spawnSparks(pointer.x, pointer.y, 6, 2, false);
      // Soft fading trail
      setTimeout(() => {
        if (!pointer.isDown) pointer.active = false;
      }, 400);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });

    // Mobile touch listeners
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Localized Energy Highlighter Brush under Cursor/Finger
      // Briefly illuminates nearby darkness with faint warm glow that fades naturally
      if (pointer.active && pointer.x > 0) {
        pointer.lerpX += (pointer.x - pointer.lerpX) * 0.26;
        pointer.lerpY += (pointer.y - pointer.lerpY) * 0.26;
        pointer.revealAlpha *= 0.94; // Smoothly fades back to darkness

        if (pointer.revealAlpha > 0.02) {
          const glowGrad = ctx.createRadialGradient(
            pointer.lerpX,
            pointer.lerpY,
            0,
            pointer.lerpX,
            pointer.lerpY,
            75
          );
          glowGrad.addColorStop(0, `rgba(255, 140, 20, ${pointer.revealAlpha * 0.35})`);
          glowGrad.addColorStop(0.45, `rgba(220, 70, 0, ${pointer.revealAlpha * 0.15})`);
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.beginPath();
          ctx.arc(pointer.lerpX, pointer.lerpY, 75, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Golden tactile cursor ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(pointer.lerpX, pointer.lerpY, 13, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 180, 40, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "rgba(255, 140, 0, 0.65)";
        ctx.shadowBlur = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pointer.lerpX, pointer.lerpY, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 250, 210, 0.9)";
        ctx.shadowColor = "rgba(255, 200, 50, 1)";
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.restore();
      }

      pointer.speed *= 0.88;
      pointer.vx *= 0.88;
      pointer.vy *= 0.88;

      // 2. Physical Spark Particles
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;

        const progress = s.life / s.maxLife;
        if (progress >= 1.0) {
          sparks.splice(i, 1);
          continue;
        }

        s.vx *= 0.96;
        s.vy = s.vy * 0.96 + 0.10; // Downward gravity

        const sway = Math.sin(time * 5.0 + s.turbOffset) * 0.35;
        s.x += s.vx + sway;
        s.y += s.vy;

        const alpha = Math.sin(progress * Math.PI) * (s.isHot ? 1.0 : 0.85);

        const r = s.colorR;
        let g = s.colorG;
        let b = s.colorB;

        if (progress > 0.45) {
          g = Math.floor(g * (1.0 - (progress - 0.45) * 1.5));
          b = Math.floor(b * (1.0 - (progress - 0.45) * 2.0));
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * (1.0 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.shadowColor = `rgba(${r}, ${g}, 0, ${alpha * 0.7})`;
        ctx.shadowBlur = s.isHot ? 8 : 4;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 block h-full w-full select-none"
      style={{ touchAction: "none" }}
      aria-hidden="true"
    />
  );
}
