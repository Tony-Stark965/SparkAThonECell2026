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
  description: `${SPARKATHON_CONFIG.tagline} Official portal for Spark-A-Thon 2026.`,
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

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
      <body className="min-h-full flex flex-col bg-black text-neutral-100 overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
