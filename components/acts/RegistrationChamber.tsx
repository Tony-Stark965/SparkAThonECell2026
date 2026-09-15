"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

interface ParticipantState {
  name: string;
  mobile: string;
}

interface RegistrationSuccessData {
  id: string;
  teamName: string;
  college: string;
  participantCount: number;
  participants: Array<{ name: string; mobile: string; isLeader?: boolean }>;
  fee: number;
  paymentStatus: string;
  paymentUrl?: string;
  persisted: boolean;
  message?: string;
}

interface RegistrationChamberProps {
  onReturnToHero?: () => void;
}

function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

function isValidIndianMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

export function RegistrationChamber({ onReturnToHero }: RegistrationChamberProps) {
  // Expedition Sequence Step: 1 (Capacity) | 2 (Intel) | 3 (Leader) | 4 (Roster) | 5 (Fee & Confirm)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [participantCount, setParticipantCount] = useState<2 | 3 | 4 | 5>(2);
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("");

  // Leader state (synced with Participant 01)
  const [leaderName, setLeaderName] = useState("");
  const [leaderMobile, setLeaderMobile] = useState("");

  // Dynamic participants 02, 03, 04, 05
  const [p2, setP2] = useState<ParticipantState>({ name: "", mobile: "" });
  const [p3, setP3] = useState<ParticipantState>({ name: "", mobile: "" });
  const [p4, setP4] = useState<ParticipantState>({ name: "", mobile: "" });
  const [p5, setP5] = useState<ParticipantState>({ name: "", mobile: "" });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);

  // Dynamic fee calculation
  const currentFee = SPARKATHON_CONFIG.pricing.calculateFee(participantCount);
  const currentFeeDisplay = SPARKATHON_CONFIG.pricing.formatFee(participantCount);

  const handleSelectCount = (size: 2 | 3 | 4 | 5) => {
    setParticipantCount(size);
    setErrors((prev) => {
      const next = { ...prev };
      if (size < 5) {
        delete next.p5Name;
        delete next.p5Mobile;
      }
      if (size < 4) {
        delete next.p4Name;
        delete next.p4Mobile;
      }
      if (size < 3) {
        delete next.p3Name;
        delete next.p3Mobile;
      }
      return next;
    });
  };

  // Step 2 Validation (Team Intel)
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) {
      errs.teamName = "Team Name is required.";
    } else if (teamName.trim().length < 2) {
      errs.teamName = "Team Name must be at least 2 characters.";
    }

    if (!college.trim()) {
      errs.college = "College / Institution is required.";
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation (Team Leader)
  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!leaderName.trim()) {
      errs.leaderName = "Team Leader Full Name is required.";
    }

    const normLeaderMobile = normalizeIndianMobile(leaderMobile);
    if (!normLeaderMobile) {
      errs.leaderMobile = "Leader Mobile Number is required.";
    } else if (!isValidIndianMobile(normLeaderMobile)) {
      errs.leaderMobile = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Step 4 Validation (Squad Roster)
  const validateStep4 = (): boolean => {
    const errs: Record<string, string> = {};
    const normLeaderMobile = normalizeIndianMobile(leaderMobile);
    const seenMobiles = new Set<string>();

    if (normLeaderMobile && isValidIndianMobile(normLeaderMobile)) {
      seenMobiles.add(normLeaderMobile);
    }

    // Participant 02
    if (!p2.name.trim()) {
      errs.p2Name = "Participant 02 Full Name is required.";
    }
    const normP2Mobile = normalizeIndianMobile(p2.mobile);
    if (!normP2Mobile) {
      errs.p2Mobile = "Participant 02 Mobile Number is required.";
    } else if (!isValidIndianMobile(normP2Mobile)) {
      errs.p2Mobile = "Enter a valid 10-digit Indian mobile number.";
    } else if (seenMobiles.has(normP2Mobile)) {
      errs.p2Mobile = "Duplicate mobile number with another member.";
    } else {
      seenMobiles.add(normP2Mobile);
    }

    // Participant 03 (if >= 3)
    if (participantCount >= 3) {
      if (!p3.name.trim()) {
        errs.p3Name = "Participant 03 Full Name is required.";
      }
      const normP3Mobile = normalizeIndianMobile(p3.mobile);
      if (!normP3Mobile) {
        errs.p3Mobile = "Participant 03 Mobile Number is required.";
      } else if (!isValidIndianMobile(normP3Mobile)) {
        errs.p3Mobile = "Enter a valid 10-digit Indian mobile number.";
      } else if (seenMobiles.has(normP3Mobile)) {
        errs.p3Mobile = "Duplicate mobile number with another member.";
      } else {
        seenMobiles.add(normP3Mobile);
      }
    }

    // Participant 04 (if >= 4)
    if (participantCount >= 4) {
      if (!p4.name.trim()) {
        errs.p4Name = "Participant 04 Full Name is required.";
      }
      const normP4Mobile = normalizeIndianMobile(p4.mobile);
      if (!normP4Mobile) {
        errs.p4Mobile = "Participant 04 Mobile Number is required.";
      } else if (!isValidIndianMobile(normP4Mobile)) {
        errs.p4Mobile = "Enter a valid 10-digit Indian mobile number.";
      } else if (seenMobiles.has(normP4Mobile)) {
        errs.p4Mobile = "Duplicate mobile number with another member.";
      } else {
        seenMobiles.add(normP4Mobile);
      }
    }

    // Participant 05 (if === 5)
    if (participantCount === 5) {
      if (!p5.name.trim()) {
        errs.p5Name = "Participant 05 Full Name is required.";
      }
      const normP5Mobile = normalizeIndianMobile(p5.mobile);
      if (!normP5Mobile) {
        errs.p5Mobile = "Participant 05 Mobile Number is required.";
      } else if (!isValidIndianMobile(normP5Mobile)) {
        errs.p5Mobile = "Enter a valid 10-digit Indian mobile number.";
      } else if (seenMobiles.has(normP5Mobile)) {
        errs.p5Mobile = "Duplicate mobile number with another member.";
      } else {
        seenMobiles.add(normP5Mobile);
      }
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Full form validation prior to submission
  const validateAll = (): boolean => {
    return validateStep2() && validateStep3() && validateStep4();
  };

  const handleNextStep = (targetStep: number) => {
    if (targetStep === 2) {
      setCurrentStep(2);
    } else if (targetStep === 3) {
      if (validateStep2()) setCurrentStep(3);
    } else if (targetStep === 4) {
      if (validateStep3()) setCurrentStep(4);
    } else if (targetStep === 5) {
      if (validateStep4()) setCurrentStep(5);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    const participantsPayload = [
      {
        name: leaderName.trim(),
        mobile: normalizeIndianMobile(leaderMobile),
        isLeader: true,
      },
      {
        name: p2.name.trim(),
        mobile: normalizeIndianMobile(p2.mobile),
        isLeader: false,
      },
    ];

    if (participantCount >= 3) {
      participantsPayload.push({
        name: p3.name.trim(),
        mobile: normalizeIndianMobile(p3.mobile),
        isLeader: false,
      });
    }

    if (participantCount >= 4) {
      participantsPayload.push({
        name: p4.name.trim(),
        mobile: normalizeIndianMobile(p4.mobile),
        isLeader: false,
      });
    }

    if (participantCount === 5) {
      participantsPayload.push({
        name: p5.name.trim(),
        mobile: normalizeIndianMobile(p5.mobile),
        isLeader: false,
      });
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: teamName.trim(),
          college: college.trim(),
          participantCount,
          teamLeaderName: leaderName.trim(),
          teamLeaderMobile: normalizeIndianMobile(leaderMobile),
          participants: participantsPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please check your inputs.");
      }

      setSuccessData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "CAPACITY" },
    { num: 2, label: "INTEL" },
    { num: 3, label: "LEADER" },
    { num: 4, label: "ROSTER" },
    { num: 5, label: "DISPATCH" },
  ];

  return (
    <section
      id="register"
      className="relative z-30 w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col justify-between items-center text-center min-h-[90vh]"
    >
      {/* 1. Act Header */}
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-[10px] sm:text-xs tracking-[0.35em] text-amber-400 uppercase font-bold">
            ACT IX // REGISTRATION CHAMBER
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
          {SPARKATHON_CONFIG.registration.chamberTitle}
        </h2>

        <p className="mt-2 font-mono text-[11px] sm:text-xs tracking-wider text-neutral-400 uppercase max-w-md">
          {SPARKATHON_CONFIG.registration.chamberSubtitle}
        </p>
      </div>

      {/* 2. Main Chamber Container */}
      <div className="relative my-auto w-full max-w-2xl mt-6 sm:mt-8">
        {/* Exterior Atmospheric Core Radiance */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[85%] rounded-full blur-[100px] opacity-25"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 140, 0, 0.5) 0%, rgba(255, 60, 0, 0.15) 50%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* Industrial Vault Outer Chassis */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#070709] p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden text-left">
          {/* Top Telemetry & Step Progress Tracker */}
          <div className="flex flex-col border-b border-neutral-800/80 bg-neutral-950/90 font-mono text-[9px] sm:text-[10px]">
            {/* Step Indicators */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-900 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 sm:gap-2">
                {stepsList.map((st, idx) => {
                  const isActive = currentStep === st.num;
                  const isDone = currentStep > st.num;
                  return (
                    <div key={st.num} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isDone || st.num < currentStep) {
                            setCurrentStep(st.num);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold uppercase transition-all ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(255,140,0,0.3)]"
                            : isDone
                            ? "text-neutral-300 hover:text-white cursor-pointer"
                            : "text-neutral-600 cursor-not-allowed"
                        }`}
                      >
                        <span>0{st.num} {st.label}</span>
                      </button>
                      {idx < stepsList.length - 1 && (
                        <span className="text-neutral-700 mx-1">→</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pl-2">
                <span className="text-amber-400 font-bold uppercase whitespace-nowrap">
                  {currentFeeDisplay} ({participantCount}P)
                </span>
              </div>
            </div>
          </div>

          {/* Form / Success State Core */}
          <div className="relative w-full rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#050403]/98 to-black p-5 sm:p-8 overflow-hidden">
            {successData ? (
              // ================= SUCCESS DISPATCH STATE =================
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-4"
              >
                <div className="h-12 w-12 rounded-full border border-amber-400/80 bg-amber-500/10 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <span className="mt-4 font-mono text-[10px] sm:text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">
                  DISPATCH CONFIRMED // TERMINAL ALLOCATED
                </span>

                <h3 className="mt-1 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {successData.teamName}
                </h3>

                <p className="mt-1 font-mono text-xs text-neutral-400 uppercase">
                  {successData.college}
                </p>

                {/* Dispatch Ledger Summary */}
                <div className="my-6 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                    <span className="text-neutral-500 uppercase">REGISTRATION ID</span>
                    <span className="text-amber-300 font-bold uppercase">{successData.id}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                    <span className="text-neutral-500 uppercase">TEAM STRENGTH</span>
                    <span className="text-white font-semibold">{successData.participantCount} MEMBERS</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                    <span className="text-neutral-500 uppercase">CALCULATED FEE</span>
                    <span className="text-amber-400 font-bold text-sm">₹{successData.fee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 uppercase">PAYMENT STATUS</span>
                    <span className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 uppercase text-[10px]">
                      {successData.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Member Roster Preview */}
                <div className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0805]/80 p-3 mb-6 text-left">
                  <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider block mb-2">
                    SQUAD ROSTER:
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    {successData.participants.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-neutral-300">
                        <span>
                          0{idx + 1}. {m.name}{" "}
                          {m.isLeader && <span className="text-amber-400 text-[10px]">[LEADER]</span>}
                        </span>
                        <span className="text-neutral-500">******{m.mobile.slice(-4)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Honest Payment Status Notice */}
                <div className="w-full max-w-md p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center mb-6">
                  <span className="font-mono text-[10px] text-amber-400 font-semibold tracking-wider uppercase block">
                    PAYMENT LINK AWAITED
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-neutral-400 leading-relaxed">
                    Official Razorpay payment gateway is being provisioned by the event committee. Your squad dossier is reserved. Payment will be collected via verified organizer channels.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessData(null);
                      setCurrentStep(1);
                    }}
                    className="font-mono text-xs text-neutral-400 hover:text-white uppercase py-2 px-4 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                  >
                    REGISTER ANOTHER SQUAD
                  </button>
                </div>
              </motion.div>
            ) : (
              // ================= EXPEDITION SEQUENCE =================
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="p-3 rounded-lg border border-red-500/60 bg-red-500/10 text-red-300 font-mono text-xs text-center">
                    {submitError}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {/* STEP 01: SQUAD CAPACITY SELECTION */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step-capacity"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                          STEP 01 // CAPACITY SELECTION
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                          HOW MANY PIONEERS?
                        </h3>
                        <p className="font-mono text-xs text-neutral-400 mt-1 uppercase">
                          Select squad strength (2 to 5 members). Fees adjust dynamically.
                        </p>
                      </div>

                      {/* 4 Interactive Frontier Stone Markers */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {([2, 3, 4, 5] as const).map((size) => {
                          const isSelected = participantCount === size;
                          const feeText = SPARKATHON_CONFIG.pricing.formatFee(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSelectCount(size)}
                              className={`group relative rounded-xl border p-4 font-mono transition-all duration-300 text-center flex flex-col items-center justify-between cursor-pointer overflow-hidden ${
                                isSelected
                                  ? "border-amber-400 bg-gradient-to-b from-amber-500/25 via-[#1a1107] to-neutral-950 text-white shadow-[0_0_25px_rgba(255,160,0,0.3)] scale-[1.03]"
                                  : "border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 hover:bg-neutral-900/60"
                              }`}
                              style={{ minHeight: "135px" }}
                            >
                              {/* Top Cap Indicator */}
                              <div className="w-full flex items-center justify-between">
                                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">
                                  TIER //0{size}
                                </span>
                                <div
                                  className={`h-2 w-2 rounded-full transition-colors ${
                                    isSelected
                                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] animate-pulse"
                                      : "bg-neutral-800"
                                  }`}
                                />
                              </div>

                              {/* Large Monumental Number */}
                              <div className="my-1">
                                <span
                                  className={`text-3xl sm:text-4xl font-black tracking-tight uppercase transition-colors ${
                                    isSelected ? "text-amber-200 drop-shadow-[0_0_12px_rgba(255,160,0,0.4)]" : "text-neutral-300"
                                  }`}
                                >
                                  0{size}
                                </span>
                                <span className="block text-[10px] tracking-[0.25em] text-neutral-400 uppercase font-bold">
                                  SQUAD
                                </span>
                              </div>

                              {/* Dynamic Fee Badge */}
                              <div className="w-full pt-2 border-t border-neutral-800/80 flex items-center justify-center">
                                <span
                                  className={`text-xs font-bold font-mono transition-colors ${
                                    isSelected ? "text-amber-400" : "text-neutral-400"
                                  }`}
                                >
                                  {feeText}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Fee Explanation Note */}
                      <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 p-3 text-center">
                        <p className="font-mono text-[11px] text-neutral-400 uppercase">
                          Pricing Structure: <span className="text-amber-300 font-bold">₹300 BASE TEAM FEE</span> (2 members) + <span className="text-amber-300 font-bold">₹50</span> per additional pioneer up to 5.
                        </p>
                      </div>

                      {/* Step 1 CTA */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleNextStep(2)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-bold tracking-widest text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
                        >
                          <span>PROCEED TO TEAM INTEL</span>
                          <span>→</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 02: TEAM INTEL */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step-intel"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-center pb-2">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                          STEP 02 // TEAM INTEL
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                          ENTER SQUAD IDENTITY
                        </h3>
                      </div>

                      {/* Team Name */}
                      <div>
                        <label htmlFor="team-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">
                          TEAM NAME <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="team-name"
                          type="text"
                          value={teamName}
                          onChange={(e) => {
                            setTeamName(e.target.value);
                            if (errors.teamName) setErrors({ ...errors, teamName: "" });
                          }}
                          placeholder="e.g. Frontier Sentinels"
                          className={`w-full px-4 py-3 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.teamName
                              ? "border-red-500 focus:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              : "border-neutral-800 focus:border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                          }`}
                        />
                        {errors.teamName && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.teamName}</p>
                        )}
                      </div>

                      {/* College / Institution */}
                      <div>
                        <label htmlFor="college-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">
                          COLLEGE / INSTITUTION <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="college-name"
                          type="text"
                          value={college}
                          onChange={(e) => {
                            setCollege(e.target.value);
                            if (errors.college) setErrors({ ...errors, college: "" });
                          }}
                          placeholder="e.g. National Institute of Technology"
                          className={`w-full px-4 py-3 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.college
                              ? "border-red-500 focus:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              : "border-neutral-800 focus:border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                          }`}
                        />
                        {errors.college && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.college}</p>
                        )}
                      </div>

                      {/* Step 2 Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="font-mono text-xs text-neutral-400 hover:text-white uppercase py-2 px-4 rounded-lg border border-neutral-800 cursor-pointer"
                        >
                          ← BACK TO CAPACITY
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(3)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-bold tracking-widest text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
                        >
                          <span>CONTINUE TO LEADER</span>
                          <span>→</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 03: TEAM LEADER */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step-leader"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-center pb-2">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                          STEP 03 // TEAM LEADER
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                          DESIGNATE PRIMARY CONTACT
                        </h3>
                        <p className="font-mono text-xs text-neutral-400 mt-1 uppercase">
                          The leader coordinates the squad and is automatically synced to Participant 01.
                        </p>
                      </div>

                      {/* Leader Full Name */}
                      <div>
                        <label htmlFor="leader-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">
                          TEAM LEADER FULL NAME <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="leader-name"
                          type="text"
                          value={leaderName}
                          onChange={(e) => {
                            setLeaderName(e.target.value);
                            if (errors.leaderName) setErrors({ ...errors, leaderName: "" });
                          }}
                          placeholder="Leader Full Name"
                          className={`w-full px-4 py-3 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.leaderName
                              ? "border-red-500 focus:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              : "border-neutral-800 focus:border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                          }`}
                        />
                        {errors.leaderName && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.leaderName}</p>
                        )}
                      </div>

                      {/* Leader Mobile Number */}
                      <div>
                        <label htmlFor="leader-mobile" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">
                          LEADER MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="leader-mobile"
                          type="tel"
                          maxLength={10}
                          value={leaderMobile}
                          onChange={(e) => {
                            setLeaderMobile(e.target.value);
                            if (errors.leaderMobile) setErrors({ ...errors, leaderMobile: "" });
                          }}
                          placeholder="e.g. 9876543210"
                          className={`w-full px-4 py-3 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.leaderMobile
                              ? "border-red-500 focus:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              : "border-neutral-800 focus:border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                          }`}
                        />
                        {errors.leaderMobile && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.leaderMobile}</p>
                        )}
                      </div>

                      {/* Auto-Sync Badge Notice */}
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-2.5">
                        <span className="font-mono text-xs text-amber-400 font-bold">[LEADER // SYNCED]</span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          Participant 01 is automatically populated from this leader profile.
                        </span>
                      </div>

                      {/* Step 3 Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="font-mono text-xs text-neutral-400 hover:text-white uppercase py-2 px-4 rounded-lg border border-neutral-800 cursor-pointer"
                        >
                          ← BACK TO INTEL
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(4)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-bold tracking-widest text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
                        >
                          <span>CONTINUE TO SQUAD ROSTER</span>
                          <span>→</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 04: SQUAD ROSTER */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step-roster"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-center pb-2">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                          STEP 04 // SQUAD ROSTER
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                          COMPLETE ROSTER ({participantCount} MEMBERS)
                        </h3>
                      </div>

                      {/* Participant 01: Auto-Synced Team Leader */}
                      <div className="rounded-xl border border-amber-500/40 bg-[#160f08]/70 p-4">
                        <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
                          <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider">
                            PARTICIPANT 01 — TEAM LEADER
                          </span>
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-amber-500/60 bg-amber-500/20 text-amber-300 font-bold uppercase">
                            [LEADER // SYNCED]
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 uppercase block">FULL NAME</span>
                            <span className="text-white font-semibold">{leaderName || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 uppercase block">MOBILE NUMBER</span>
                            <span className="text-amber-300 font-semibold">{leaderMobile || "—"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Participant 02: PLAYER */}
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
                        <div className="flex items-center justify-between mb-3 border-b border-neutral-800/60 pb-2">
                          <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider">
                            PARTICIPANT 02 — PLAYER
                          </span>
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300 uppercase">
                            PLAYER
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="p2-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                              FULL NAME <span className="text-amber-400">*</span>
                            </label>
                            <input
                              id="p2-name"
                              type="text"
                              value={p2.name}
                              onChange={(e) => {
                                setP2({ ...p2, name: e.target.value });
                                if (errors.p2Name) setErrors({ ...errors, p2Name: "" });
                              }}
                              placeholder="Member Full Name"
                              className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p2Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p2Name && (
                              <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p2Name}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="p2-mobile" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                              MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                            </label>
                            <input
                              id="p2-mobile"
                              type="tel"
                              maxLength={10}
                              value={p2.mobile}
                              onChange={(e) => {
                                setP2({ ...p2, mobile: e.target.value });
                                if (errors.p2Mobile) setErrors({ ...errors, p2Mobile: "" });
                              }}
                              placeholder="e.g. 9876543211"
                              className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p2Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p2Mobile && (
                              <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p2Mobile}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Participant 03: PLAYER (If count >= 3) */}
                      {participantCount >= 3 && (
                        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
                          <div className="flex items-center justify-between mb-3 border-b border-neutral-800/60 pb-2">
                            <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider">
                              PARTICIPANT 03 — PLAYER
                            </span>
                            <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300 uppercase">
                              PLAYER
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="p3-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                                FULL NAME <span className="text-amber-400">*</span>
                              </label>
                              <input
                                id="p3-name"
                                type="text"
                                value={p3.name}
                                onChange={(e) => {
                                  setP3({ ...p3, name: e.target.value });
                                  if (errors.p3Name) setErrors({ ...errors, p3Name: "" });
                                }}
                                placeholder="Member Full Name"
                                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                  errors.p3Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                                }`}
                              />
                              {errors.p3Name && (
                                <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p3Name}</p>
                              )}
                            </div>
                            <div>
                              <label htmlFor="p3-mobile" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                                MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                              </label>
                              <input
                                id="p3-mobile"
                                type="tel"
                                maxLength={10}
                                value={p3.mobile}
                                onChange={(e) => {
                                  setP3({ ...p3, mobile: e.target.value });
                                  if (errors.p3Mobile) setErrors({ ...errors, p3Mobile: "" });
                                }}
                                placeholder="e.g. 9876543212"
                                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                  errors.p3Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                                }`}
                              />
                              {errors.p3Mobile && (
                                <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p3Mobile}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Participant 04: PLAYER (If count >= 4) */}
                      {participantCount >= 4 && (
                        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
                          <div className="flex items-center justify-between mb-3 border-b border-neutral-800/60 pb-2">
                            <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider">
                              PARTICIPANT 04 — PLAYER
                            </span>
                            <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300 uppercase">
                              PLAYER
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="p4-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                                FULL NAME <span className="text-amber-400">*</span>
                              </label>
                              <input
                                id="p4-name"
                                type="text"
                                value={p4.name}
                                onChange={(e) => {
                                  setP4({ ...p4, name: e.target.value });
                                  if (errors.p4Name) setErrors({ ...errors, p4Name: "" });
                                }}
                                placeholder="Member Full Name"
                                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                  errors.p4Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                                }`}
                              />
                              {errors.p4Name && (
                                <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p4Name}</p>
                              )}
                            </div>
                            <div>
                              <label htmlFor="p4-mobile" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                                MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                              </label>
                              <input
                                id="p4-mobile"
                                type="tel"
                                maxLength={10}
                                value={p4.mobile}
                                onChange={(e) => {
                                  setP4({ ...p4, mobile: e.target.value });
                                  if (errors.p4Mobile) setErrors({ ...errors, p4Mobile: "" });
                                }}
                                placeholder="e.g. 9876543213"
                                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                  errors.p4Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                                }`}
                              />
                              {errors.p4Mobile && (
                                <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p4Mobile}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Participant 05: PLAYER (If count === 5) */}
                      {participantCount === 5 && (
                        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
                          <div className="flex items-center justify-between mb-3 border-b border-neutral-800/60 pb-2">
                            <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider">
                              PARTICIPANT 05 — PLAYER
                            </span>
                            <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300 uppercase">
                              PLAYER
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="p5-name" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                                FULL NAME <span className="text-amber-400">*</span>
                              </label>
                              <input
                                id="p5-name"
                                type="text"
                                value={p5.name}
                                onChange={(e) => {
                                  setP5({ ...p5, name: e.target.value });
                                  if (errors.p5Name) setErrors({ ...errors, p5Name: "" });
                                }}
                                placeholder="Member Full Name"
                                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                  errors.p5Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                                }`}
                              />
                              {errors.p5Name && (
                                <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p5Name}</p>
                              )}
                            </div>
                            <div>
                              <label htmlFor="p5-mobile" className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">
                                MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                              </label>
                              <input
                                id="p5-mobile"
                                type="tel"
                                maxLength={10}
                                value={p5.mobile}
                                onChange={(e) => {
                                  setP5({ ...p5, mobile: e.target.value });
                                  if (errors.p5Mobile) setErrors({ ...errors, p5Mobile: "" });
                                }}
                                placeholder="e.g. 9876543214"
                                className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                  errors.p5Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                                }`}
                              />
                              {errors.p5Mobile && (
                                <p className="mt-1 font-mono text-[10px] text-red-400">{errors.p5Mobile}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4 Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/80">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="font-mono text-xs text-neutral-400 hover:text-white uppercase py-2 px-4 rounded-lg border border-neutral-800 cursor-pointer"
                        >
                          ← BACK TO LEADER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(5)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-bold tracking-widest text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
                        >
                          <span>REVIEW MISSION FEE</span>
                          <span>→</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 05: MISSION FEE & DISPATCH CONFIRMATION */}
                  {currentStep === 5 && (
                    <motion.div
                      key="step-dispatch"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center pb-2">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                          STEP 05 // MISSION FEE & DISPATCH
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                          CONFIRM SQUAD REGISTRATION
                        </h3>
                      </div>

                      {/* Dynamic Fee Highlight Box */}
                      <div className="rounded-2xl border border-amber-500/60 bg-gradient-to-b from-amber-500/15 via-[#181109] to-neutral-950 p-5 text-center shadow-[0_0_30px_rgba(255,140,0,0.15)]">
                        <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                          TOTAL MISSION ENTRY PROTOCOL
                        </span>
                        <span className="font-mono text-4xl sm:text-5xl font-black text-amber-200 block my-2 drop-shadow-[0_0_20px_rgba(255,160,0,0.5)]">
                          ₹{currentFee}
                        </span>
                        <span className="font-mono text-xs text-neutral-300 uppercase tracking-wider block">
                          {participantCount} MEMBERS // {participantCount === 2 ? "₹300 BASE FEE" : `₹300 BASE + ${participantCount - 2} × ₹50 ADDITIONAL`}
                        </span>
                      </div>

                      {/* Squad Review Dossier */}
                      <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 font-mono text-xs space-y-2">
                        <div className="flex justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-neutral-500 uppercase">TEAM NAME</span>
                          <span className="text-white font-bold">{teamName}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-neutral-500 uppercase">COLLEGE</span>
                          <span className="text-neutral-300">{college}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-neutral-500 uppercase">TEAM LEADER</span>
                          <span className="text-amber-300 font-semibold">{leaderName} ({leaderMobile})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500 uppercase">SQUAD ROSTER</span>
                          <span className="text-neutral-300">{participantCount} Verified Pioneers</span>
                        </div>
                      </div>

                      {/* Explicit No-Fake-Payment Guarantee */}
                      <p className="text-center font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
                        OFFICIAL SPARK-A-THON 2026 PLATFORM • NO PAYMENT PROCESSED ON THIS WEBSITE • PAYMENT DISPATCH LINK WILL BE SENT BY ORGANIZERS
                      </p>

                      {/* Step 5 Buttons & Final Submit */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="font-mono text-xs text-neutral-400 hover:text-white uppercase py-2 px-4 rounded-lg border border-neutral-800 cursor-pointer w-full sm:w-auto"
                        >
                          ← EDIT ROSTER
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-mono text-xs sm:text-sm font-black tracking-widest uppercase transition-all cursor-pointer ${
                            isSubmitting
                              ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                              : "border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.01] active:scale-[0.99]"
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-neutral-500 border-t-transparent animate-spin" />
                              <span>DISPATCHING SQUAD DOSSIER...</span>
                            </>
                          ) : (
                            <>
                              <span>CONFIRM REGISTRATION</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}
          </div>

          {/* Bottom Chassis Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/90 font-mono text-[9px] sm:text-[10px] text-neutral-500 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">DATA PROTOCOL:</span>
              <span className="text-amber-400/90">ENCRYPTED // SQUAD PROTOCOL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">ORGANIZER DISPATCH:</span>
              <span className="text-neutral-300">STAGE 01 REGISTRATION DESK</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Return to Hearth Navigation Button */}
      {onReturnToHero && (
        <button
          onClick={onReturnToHero}
          className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-neutral-500 hover:text-amber-300 uppercase py-2 px-5 rounded-full border border-neutral-800 hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <span>↑ RETURN TO THE HEARTH</span>
        </button>
      )}
    </section>
  );
}
