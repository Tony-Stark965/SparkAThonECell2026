"use client";

import { useState } from "react";
import { WorldController } from "@/components/journey/WorldController";
import { SplashScreen } from "@/components/ui/SplashScreen";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <main className="min-h-screen w-full bg-[#020202] text-white">
      {!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}
      {isLoaded && (
        <div className="transition-opacity duration-700 opacity-100">
          <WorldController />
        </div>
      )}
    </main>
  );
}
