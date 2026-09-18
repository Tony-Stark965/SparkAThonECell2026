import React from "react";

export function GlobalMotionBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black">
      <style>{`
        @keyframes float-core {
          0%, 100% { transform: scale(1) translate(-10%, -10%); opacity: 0.15; }
          50% { transform: scale(1.3) translate(10%, 10%); opacity: 0.35; }
        }
        @keyframes float-orb1 {
          0%, 100% { transform: scale(1) translate(0%, 0%); opacity: 0.15; }
          50% { transform: scale(1.5) translate(100%, 80%); opacity: 0.4; }
        }
        @keyframes float-orb2 {
          0%, 100% { transform: scale(1) translate(100%, 100%); opacity: 0.1; }
          50% { transform: scale(1.8) translate(-20%, -20%); opacity: 0.3; }
        }
        .bg-anim-core { animation: float-core 15s ease-in-out infinite; }
        .bg-anim-orb1 { animation: float-orb1 18s linear infinite; }
        .bg-anim-orb2 { animation: float-orb2 22s ease-in-out infinite; }
      `}</style>
      
      {/* Heavy animated blurred background layers: Active on desktop, disabled on mobile to eliminate GPU compositor lag */}
      <div className="hidden md:block">
        {/* Deep Ember Core */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0%,transparent_60%)] blur-[80px] bg-anim-core"
        />

        {/* Roving Plasma Orb 1 */}
        <div
          className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.18)_0%,transparent_70%)] blur-[80px] mix-blend-screen bg-anim-orb1"
        />

        {/* Roving Plasma Orb 2 */}
        <div
          className="absolute top-0 left-0 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_70%)] blur-[120px] mix-blend-screen bg-anim-orb2"
        />
      </div>

      {/* Subtle Grid overlay for structural tech feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] md:opacity-[0.02]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #f59e0b 1px, transparent 1px),
            linear-gradient(to bottom, #f59e0b 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px" // Tighter grid on mobile
        }}
      />
    </div>
  );
}
