"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SplashScreen } from "@/components/ui/SplashScreen";

const WorldController = dynamic(() => import("@/components/journey/WorldController").then(mod => mod.WorldController), {
  ssr: true,
});

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <main className="min-h-screen w-full bg-transparent text-white">
      {!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}
      {isLoaded && (
        <div className="transition-opacity duration-700 opacity-100">
          <WorldController />
        </div>
      )}
    </main>
  );
}
