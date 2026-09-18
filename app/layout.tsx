import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SPARKATHON_CONFIG.name} ${SPARKATHON_CONFIG.year} | The Frontier`,
  description:
    "SPARK-A-THON 2026 — Official hackathon portal organized by E-Cell FCRIT in collaboration with IIC. The frontier is not found. It is built.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { GlobalMotionBackground } from "@/components/ui/GlobalMotionBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-black text-white antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-black text-neutral-100 overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200 cursor-crosshair">
        <GlobalMotionBackground />
        
        {/* Global CRT Scanline Overlay */}
        <div className="fixed inset-0 z-[9999] pointer-events-none mix-blend-overlay opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)", backgroundSize: "100% 4px" }} aria-hidden="true" />
        
        {/* Global Deep Vignette */}
        <div className="fixed inset-0 z-[9998] pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]" aria-hidden="true" />
        
        {children}
      </body>
    </html>
  );
}
