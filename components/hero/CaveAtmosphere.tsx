"use client";

import React from "react";

interface CaveAtmosphereProps {
  glowLevel: number; // 0 to 1, orchestrates cave revelation
  className?: string;
}

export function CaveAtmosphere({ glowLevel, className = "" }: CaveAtmosphereProps) {
  // Clamp glowLevel between 0 and 1
  const clampedGlow = Math.max(0, Math.min(1, glowLevel));

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-clip select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep Cavern Transparent Atmospheric Shroud */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* 2. Procedural Film Grain Overlay (Cinematic Texture, Zero Asset Cost) */}
      <div
        className="absolute inset-0 opacity-[0.28] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.7'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 3. Layered Hearth Fire Radiance (Simulates fire burning inside a cavern) */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{ opacity: clampedGlow }}
      >
        {/* Flanking Side Brazier Illumination (Frames the screen, leaves central stepping stone path crystal clear) */}
        <div
          className="absolute -left-10 bottom-[18%] w-[50vw] max-w-[420px] h-[50vh] rounded-full blur-[60px] md:blur-[110px] opacity-65 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255, 100, 10, 0.35) 0%, rgba(200, 50, 0, 0.15) 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute -right-10 bottom-[18%] w-[50vw] max-w-[420px] h-[50vh] rounded-full blur-[60px] md:blur-[110px] opacity-65 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255, 100, 10, 0.35) 0%, rgba(200, 50, 0, 0.15) 50%, transparent 80%)",
          }}
        />

        {/* Ambient Cave Wall Glow: Diffused illumination revealing depth */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vw] max-w-[1000px] h-[75vh] rounded-full blur-[80px] md:blur-[170px] opacity-60"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255, 140, 20, 0.22) 0%, rgba(160, 40, 0, 0.12) 45%, transparent 75%)",
          }}
        />

        {/* Subtle Cavernous Top Rim Falloff */}
        <div
          className="absolute top-0 inset-x-0 h-44 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(200, 70, 10, 0.15), transparent 70%)",
          }}
        />
      </div>

      {/* 4. Cavern Silhouette Facets & Geological Contours */}
      <svg
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out"
        style={{ opacity: clampedGlow * 0.4 }}
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="caveShadowGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#140a05" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="caveShadowGradR" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#120904" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ff5500" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="rimLight" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Left Cavern Wall Silhouette */}
        <path
          d="M0 0 L260 0 L180 280 L290 480 L140 680 L220 900 L0 900 Z"
          fill="url(#caveShadowGradL)"
        />

        {/* Right Cavern Wall Silhouette */}
        <path
          d="M1440 0 L1180 0 L1260 300 L1150 510 L1300 700 L1220 900 L1440 900 Z"
          fill="url(#caveShadowGradR)"
        />

        {/* Cavern Arch Crest Silhouette */}
        <path
          d="M0 0 Q720 130 1440 0 L1440 60 Q720 180 0 60 Z"
          fill="#000000"
          opacity="0.8"
        />

        {/* Frontier Floor Basalt Ridge */}
        <path
          d="M0 880 L380 840 L720 865 L1060 835 L1440 880 L1440 900 L0 900 Z"
          fill="url(#rimLight)"
        />
      </svg>

      {/* 5. Perimeter Vignette (Guarantees deep framing darkness at outer screen borders) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(2, 2, 2, 0.45) 78%, rgba(2, 2, 2, 0.88) 98%)",
        }}
      />
    </div>
  );
}
