"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

interface ParticipantState {
  name: string;
  rollNo: string;
  mobile: string;
}

interface RegistrationSuccessData {
  id: string;
  teamName: string;
  college: string;
  domain?: string;
  participantCount: number;
  teamLeaderName?: string;
  teamLeaderRollNo?: string;
  teamLeaderMobile?: string;
  teamLeaderEmail?: string;
  participants: Array<{ name: string; roll_no: string; mobile: string; isLeader?: boolean }>;
  fee: number;
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type RegistrationStage = "FORM" | "REVIEW" | "HANDOFF";

export function RegistrationChamber({ onReturnToHero }: RegistrationChamberProps) {
  // 3-Stage Logical Workflow: FORM -> REVIEW -> HANDOFF
  const [stage, setStage] = useState<RegistrationStage>("FORM");

  // Form State
  const [participantCount, setParticipantCount] = useState<2 | 3 | 4 | 5>(2);
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("");
  const [domain, setDomain] = useState("");

  // Leader State (Participant 01)
  const [leaderName, setLeaderName] = useState("");
  const [leaderRollNo, setLeaderRollNo] = useState("");
  const [leaderMobile, setLeaderMobile] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");

  // Dynamic Members (Participants 02, 03, 04, 05)
  const [p2, setP2] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });
  const [p3, setP3] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });
  const [p4, setP4] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });
  const [p5, setP5] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);

  // Dynamic Server-Aligned Fee Calculation
  const currentFeeDisplay = SPARKATHON_CONFIG.pricing.formatFee(participantCount);

  const handleSelectCount = (size: 2 | 3 | 4 | 5) => {
    setParticipantCount(size);
    setErrors((prev) => {
      const next = { ...prev };
      if (size < 5) {
        delete next.p5Name;
        delete next.p5Roll;
        delete next.p5Mobile;
      }
      if (size < 4) {
        delete next.p4Name;
        delete next.p4Roll;
        delete next.p4Mobile;
      }
      if (size < 3) {
        delete next.p3Name;
        delete next.p3Roll;
        delete next.p3Mobile;
      }
      return next;
    });
  };

  // Client Validation for Form before advancing to Review
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Team info
    if (!teamName.trim()) {
      errs.teamName = "Team Name is required.";
    } else if (teamName.trim().length < 2) {
      errs.teamName = "Team Name must be at least 2 characters.";
    }

    if (!college.trim()) {
      errs.college = "College / Institution is required.";
    } else if (college.trim().length < 2) {
      errs.college = "College name must be at least 2 characters.";
    }

    if (!domain) {
      errs.domain = "Official sector domain selection is required.";
    } else if (
      !SPARKATHON_CONFIG.sectors.domains.includes(
        domain as (typeof SPARKATHON_CONFIG.sectors.domains)[number]
      )
    ) {
      errs.domain = "Please select an official Spark-A-Thon domain.";
    }

    // 2. Leader info
    if (!leaderName.trim()) {
      errs.leaderName = "Team Leader Full Name is required.";
    } else if (leaderName.trim().length < 2) {
      errs.leaderName = "Leader name must be at least 2 characters.";
    }

    if (!leaderRollNo.trim()) {
      errs.leaderRollNo = "Team Leader Roll Number is required.";
    }

    const normLeaderMobile = normalizeIndianMobile(leaderMobile);
    if (!normLeaderMobile) {
      errs.leaderMobile = "Leader Mobile Number is required.";
    } else if (!isValidIndianMobile(normLeaderMobile)) {
      errs.leaderMobile = "Enter a valid 10-digit Indian mobile number.";
    }

    const normLeaderEmail = leaderEmail.trim().toLowerCase();
    if (!normLeaderEmail) {
      errs.leaderEmail = "Team Leader Email Address is required.";
    } else if (!isValidEmail(normLeaderEmail)) {
      errs.leaderEmail = "Enter a valid email address (e.g. name@example.com).";
    }

    // 3. Members info & mobile uniqueness
    const seenMobiles = new Set<string>();
    if (normLeaderMobile && isValidIndianMobile(normLeaderMobile)) {
      seenMobiles.add(normLeaderMobile);
    }

    // P2
    if (!p2.name.trim()) {
      errs.p2Name = "Participant 02 Full Name is required.";
    } else if (p2.name.trim().length < 2) {
      errs.p2Name = "Participant 02 name must be at least 2 characters.";
    }
    if (!p2.rollNo.trim()) {
      errs.p2Roll = "Participant 02 Roll Number is required.";
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

    // P3
    if (participantCount >= 3) {
      if (!p3.name.trim()) {
        errs.p3Name = "Participant 03 Full Name is required.";
      } else if (p3.name.trim().length < 2) {
        errs.p3Name = "Participant 03 name must be at least 2 characters.";
      }
      if (!p3.rollNo.trim()) {
        errs.p3Roll = "Participant 03 Roll Number is required.";
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

    // P4
    if (participantCount >= 4) {
      if (!p4.name.trim()) {
        errs.p4Name = "Participant 04 Full Name is required.";
      } else if (p4.name.trim().length < 2) {
        errs.p4Name = "Participant 04 name must be at least 2 characters.";
      }
      if (!p4.rollNo.trim()) {
        errs.p4Roll = "Participant 04 Roll Number is required.";
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

    // P5
    if (participantCount === 5) {
      if (!p5.name.trim()) {
        errs.p5Name = "Participant 05 Full Name is required.";
      } else if (p5.name.trim().length < 2) {
        errs.p5Name = "Participant 05 name must be at least 2 characters.";
      }
      if (!p5.rollNo.trim()) {
        errs.p5Roll = "Participant 05 Roll Number is required.";
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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (validateForm()) {
      setStage("REVIEW");
    }
  };

  const handleCompleteRegistration = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    const participantsPayload = [
      {
        name: leaderName.trim(),
        roll_no: leaderRollNo.trim(),
        mobile: normalizeIndianMobile(leaderMobile),
        isLeader: true,
      },
      {
        name: p2.name.trim(),
        roll_no: p2.rollNo.trim(),
        mobile: normalizeIndianMobile(p2.mobile),
        isLeader: false,
      },
    ];

    if (participantCount >= 3) {
      participantsPayload.push({
        name: p3.name.trim(),
        roll_no: p3.rollNo.trim(),
        mobile: normalizeIndianMobile(p3.mobile),
        isLeader: false,
      });
    }

    if (participantCount >= 4) {
      participantsPayload.push({
        name: p4.name.trim(),
        roll_no: p4.rollNo.trim(),
        mobile: normalizeIndianMobile(p4.mobile),
        isLeader: false,
      });
    }

    if (participantCount === 5) {
      participantsPayload.push({
        name: p5.name.trim(),
        roll_no: p5.rollNo.trim(),
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
          domain: domain,
          participantCount,
          teamLeaderName: leaderName.trim(),
          teamLeaderRollNo: leaderRollNo.trim(),
          teamLeaderMobile: normalizeIndianMobile(leaderMobile),
          teamLeaderEmail: leaderEmail.trim().toLowerCase(),
          participants: participantsPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please review your inputs and try again.");
      }

      setSuccessData(data);
      setStage("HANDOFF");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setSuccessData(null);
    setSubmitError(null);
    setErrors({});
    setTeamName("");
    setCollege("");
    setDomain("");
    setLeaderName("");
    setLeaderRollNo("");
    setLeaderMobile("");
    setLeaderEmail("");
    setP2({ name: "", rollNo: "", mobile: "" });
    setP3({ name: "", rollNo: "", mobile: "" });
    setP4({ name: "", rollNo: "", mobile: "" });
    setP5({ name: "", rollNo: "", mobile: "" });
    setParticipantCount(2);
    setStage("FORM");
  };

  const stagesList = [
    { key: "FORM", num: 1, label: "FORM" },
    { key: "REVIEW", num: 2, label: "REVIEW" },
    { key: "HANDOFF", num: 3, label: "RAZORPAY" },
  ];

  // Complete Squad Roster for Review
  const reviewRoster = [
    {
      num: "01",
      name: leaderName,
      rollNo: leaderRollNo,
      mobile: leaderMobile,
      isLeader: true,
    },
    {
      num: "02",
      name: p2.name,
      rollNo: p2.rollNo,
      mobile: p2.mobile,
      isLeader: false,
    },
    ...(participantCount >= 3
      ? [{ num: "03", name: p3.name, rollNo: p3.rollNo, mobile: p3.mobile, isLeader: false }]
      : []),
    ...(participantCount >= 4
      ? [{ num: "04", name: p4.name, rollNo: p4.rollNo, mobile: p4.mobile, isLeader: false }]
      : []),
    ...(participantCount === 5
      ? [{ num: "05", name: p5.name, rollNo: p5.rollNo, mobile: p5.mobile, isLeader: false }]
      : []),
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
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-neutral-900 w-full">
              <div className="flex items-center justify-start gap-1.5 sm:gap-3">
                {stagesList.map((st, idx) => {
                  const isActive = stage === st.key;
                  const isDone =
                    (st.key === "FORM" && (stage === "REVIEW" || stage === "HANDOFF")) ||
                    (st.key === "REVIEW" && stage === "HANDOFF");

                  return (
                    <div key={st.key} className="flex items-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (st.key === "FORM" && stage === "REVIEW") {
                            setStage("FORM");
                          }
                        }}
                        disabled={stage === "HANDOFF" || (st.key === "REVIEW" && stage === "FORM") || (st.key === "HANDOFF")}
                        className={`px-2 sm:px-3 py-1 rounded text-[7.5px] sm:text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(255,140,0,0.3)]"
                            : isDone
                            ? "text-neutral-300 hover:text-white cursor-pointer"
                            : "text-neutral-600 cursor-not-allowed border border-transparent"
                        }`}
                      >
                        0{st.num} {st.label}
                      </button>
                      {idx < stagesList.length - 1 && (
                        <span className="text-neutral-700 mx-1 text-[8px] sm:text-xs">→</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                <span className="text-amber-400 font-bold uppercase whitespace-nowrap text-[8px] sm:text-xs">
                  {currentFeeDisplay} ({participantCount}P)
                </span>
              </div>
            </div>
          </div>

          {/* Main Stage Core */}
          <div className="relative w-full rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#050403]/98 to-black p-4 sm:p-7 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ================= STAGE 1: FORM ================= */}
              {stage === "FORM" && (
                <motion.form
                  key="stage-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleProceedToReview}
                  className="space-y-6"
                >
                  <div className="text-center pb-1">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                      STAGE 01 // EXPEDITION REGISTRATION FORM
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                      ASSEMBLE SQUAD TELEMETRY
                    </h3>
                    <p className="font-mono text-xs text-neutral-400 mt-1 uppercase">
                      Select capacity, enter team credentials, and provide member details.
                    </p>
                  </div>

                  {/* 1. SQUAD CAPACITY SELECTOR */}
                  <div className="space-y-2">
                    <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider">
                      SQUAD STRENGTH <span className="text-amber-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {([2, 3, 4, 5] as const).map((size) => {
                        const isSelected = participantCount === size;
                        const feeText = SPARKATHON_CONFIG.pricing.formatFee(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleSelectCount(size)}
                            className={`group relative rounded-xl border p-3 font-mono transition-all duration-200 text-center flex flex-col items-center justify-between cursor-pointer overflow-hidden ${
                              isSelected
                                ? "border-amber-400 bg-gradient-to-b from-amber-500/25 via-[#1a1107] to-neutral-950 text-white shadow-[0_0_20px_rgba(255,160,0,0.25)] scale-[1.02]"
                                : "border-neutral-800 bg-neutral-950/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                            }`}
                            style={{ minHeight: "115px" }}
                          >
                            <div className="w-full flex items-center justify-between">
                              <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">
                                TIER //0{size}
                              </span>
                              <div
                                className={`h-2 w-2 rounded-full transition-colors ${
                                  isSelected ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" : "bg-neutral-800"
                                }`}
                              />
                            </div>

                            <div className="my-1">
                              <span
                                className={`text-2xl sm:text-3xl font-black tracking-tight uppercase transition-colors ${
                                  isSelected ? "text-amber-200" : "text-neutral-300"
                                }`}
                              >
                                0{size}
                              </span>
                              <span className="block text-[9px] tracking-[0.25em] text-neutral-400 uppercase font-bold">
                                MEMBERS
                              </span>
                            </div>

                            <div className="w-full pt-1.5 border-t border-neutral-800/80 flex items-center justify-center">
                              <span
                                className={`text-xs font-bold font-mono ${
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
                  </div>

                  {/* 2. TEAM CREDENTIALS */}
                  <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-3.5">
                    <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="font-mono text-xs font-bold text-neutral-200 uppercase tracking-wider">
                        TEAM IDENTITY
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label htmlFor="team-name" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
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
                          placeholder="e.g. Cyber Sentinels"
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.teamName ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          }`}
                        />
                        {errors.teamName && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.teamName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="college-name" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
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
                          placeholder="e.g. FCRIT Vashi"
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.college ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          }`}
                        />
                        {errors.college && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.college}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="team-domain" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
                          DOMAIN / SECTOR <span className="text-amber-400">*</span>
                        </label>
                        <select
                          id="team-domain"
                          value={domain}
                          onChange={(e) => {
                            setDomain(e.target.value);
                            if (errors.domain) setErrors({ ...errors, domain: "" });
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 focus:outline-none transition-colors cursor-pointer ${
                            errors.domain ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          } ${!domain ? "text-neutral-500" : "text-white"}`}
                        >
                          <option value="" disabled className="bg-neutral-950 text-neutral-500">
                            -- SELECT OFFICIAL SECTOR DOMAIN --
                          </option>
                          {SPARKATHON_CONFIG.sectors.domains.map((dom) => (
                            <option key={dom} value={dom} className="bg-neutral-900 text-white font-mono">
                              {dom}
                            </option>
                          ))}
                        </select>
                        {errors.domain && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.domain}</p>
                        )}
                        <p className="mt-1 font-mono text-[10px] text-neutral-500">
                          One domain per squad. Validated against official Spark-A-Thon categories.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. TEAM LEADER (PARTICIPANT 01) */}
                  <div className="rounded-xl border border-amber-500/40 bg-[#140e07]/60 p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider">
                          TEAM LEADER // PARTICIPANT 01
                        </span>
                      </div>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/20 text-amber-300 font-bold uppercase">
                        PRIMARY CONTACT
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label htmlFor="leader-name" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
                          FULL NAME <span className="text-amber-400">*</span>
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
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.leaderName ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          }`}
                        />
                        {errors.leaderName && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.leaderName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="leader-roll-no" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
                          ROLL NUMBER <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="leader-roll-no"
                          type="text"
                          value={leaderRollNo}
                          onChange={(e) => {
                            setLeaderRollNo(e.target.value);
                            if (errors.leaderRollNo) setErrors({ ...errors, leaderRollNo: "" });
                          }}
                          placeholder="Leader Roll Number (e.g. 23BCE10482)"
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.leaderRollNo ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          }`}
                        />
                        {errors.leaderRollNo && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.leaderRollNo}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="leader-mobile" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
                          MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
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
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.leaderMobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          }`}
                        />
                        {errors.leaderMobile && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.leaderMobile}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="leader-email" className="block font-mono text-[11px] text-neutral-300 uppercase tracking-wider mb-1">
                          EMAIL ADDRESS <span className="text-amber-400">*</span>
                        </label>
                        <input
                          id="leader-email"
                          type="email"
                          value={leaderEmail}
                          onChange={(e) => {
                            setLeaderEmail(e.target.value);
                            if (errors.leaderEmail) setErrors({ ...errors, leaderEmail: "" });
                          }}
                          placeholder="e.g. leader@gmail.com"
                          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                            errors.leaderEmail ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                          }`}
                        />
                        {errors.leaderEmail && (
                          <p className="mt-1 font-mono text-[10px] text-red-400">{errors.leaderEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. SQUAD MEMBERS (P02 to P0N) */}
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="font-mono text-xs font-bold text-neutral-200 uppercase tracking-wider">
                        SQUAD ROSTER DETAILS (PARTICIPANTS 02 – 0{participantCount})
                      </span>
                    </div>

                    {/* Participant 02 */}
                    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-3">
                      <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/60 pb-1.5">
                        PARTICIPANT 02
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                            FULL NAME <span className="text-amber-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={p2.name}
                            onChange={(e) => {
                              setP2({ ...p2, name: e.target.value });
                              if (errors.p2Name) setErrors({ ...errors, p2Name: "" });
                            }}
                            placeholder="Full Name"
                            className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                              errors.p2Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                            }`}
                          />
                          {errors.p2Name && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p2Name}</p>}
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                            ROLL NUMBER <span className="text-amber-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={p2.rollNo}
                            onChange={(e) => {
                              setP2({ ...p2, rollNo: e.target.value });
                              if (errors.p2Roll) setErrors({ ...errors, p2Roll: "" });
                            }}
                            placeholder="Roll Number"
                            className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                              errors.p2Roll ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                            }`}
                          />
                          {errors.p2Roll && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p2Roll}</p>}
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                            MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={p2.mobile}
                            onChange={(e) => {
                              setP2({ ...p2, mobile: e.target.value });
                              if (errors.p2Mobile) setErrors({ ...errors, p2Mobile: "" });
                            }}
                            placeholder="Mobile Number"
                            className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                              errors.p2Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                            }`}
                          />
                          {errors.p2Mobile && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p2Mobile}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Participant 03 (if count >= 3) */}
                    {participantCount >= 3 && (
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-3">
                        <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/60 pb-1.5">
                          PARTICIPANT 03
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              FULL NAME <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={p3.name}
                              onChange={(e) => {
                                setP3({ ...p3, name: e.target.value });
                                if (errors.p3Name) setErrors({ ...errors, p3Name: "" });
                              }}
                              placeholder="Full Name"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p3Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p3Name && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p3Name}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              ROLL NUMBER <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={p3.rollNo}
                              onChange={(e) => {
                                setP3({ ...p3, rollNo: e.target.value });
                                if (errors.p3Roll) setErrors({ ...errors, p3Roll: "" });
                              }}
                              placeholder="Roll Number"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p3Roll ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p3Roll && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p3Roll}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="tel"
                              maxLength={10}
                              value={p3.mobile}
                              onChange={(e) => {
                                setP3({ ...p3, mobile: e.target.value });
                                if (errors.p3Mobile) setErrors({ ...errors, p3Mobile: "" });
                              }}
                              placeholder="Mobile Number"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p3Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p3Mobile && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p3Mobile}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Participant 04 (if count >= 4) */}
                    {participantCount >= 4 && (
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-3">
                        <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/60 pb-1.5">
                          PARTICIPANT 04
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              FULL NAME <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={p4.name}
                              onChange={(e) => {
                                setP4({ ...p4, name: e.target.value });
                                if (errors.p4Name) setErrors({ ...errors, p4Name: "" });
                              }}
                              placeholder="Full Name"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p4Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p4Name && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p4Name}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              ROLL NUMBER <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={p4.rollNo}
                              onChange={(e) => {
                                setP4({ ...p4, rollNo: e.target.value });
                                if (errors.p4Roll) setErrors({ ...errors, p4Roll: "" });
                              }}
                              placeholder="Roll Number"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p4Roll ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p4Roll && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p4Roll}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="tel"
                              maxLength={10}
                              value={p4.mobile}
                              onChange={(e) => {
                                setP4({ ...p4, mobile: e.target.value });
                                if (errors.p4Mobile) setErrors({ ...errors, p4Mobile: "" });
                              }}
                              placeholder="Mobile Number"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p4Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p4Mobile && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p4Mobile}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Participant 05 (if count === 5) */}
                    {participantCount === 5 && (
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-3">
                        <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/60 pb-1.5">
                          PARTICIPANT 05
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              FULL NAME <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={p5.name}
                              onChange={(e) => {
                                setP5({ ...p5, name: e.target.value });
                                if (errors.p5Name) setErrors({ ...errors, p5Name: "" });
                              }}
                              placeholder="Full Name"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p5Name ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p5Name && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p5Name}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              ROLL NUMBER <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={p5.rollNo}
                              onChange={(e) => {
                                setP5({ ...p5, rollNo: e.target.value });
                                if (errors.p5Roll) setErrors({ ...errors, p5Roll: "" });
                              }}
                              placeholder="Roll Number"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p5Roll ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p5Roll && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p5Roll}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                              MOBILE (10 DIGITS) <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="tel"
                              maxLength={10}
                              value={p5.mobile}
                              onChange={(e) => {
                                setP5({ ...p5, mobile: e.target.value });
                                if (errors.p5Mobile) setErrors({ ...errors, p5Mobile: "" });
                              }}
                              placeholder="Mobile Number"
                              className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${
                                errors.p5Mobile ? "border-red-500 focus:border-red-400" : "border-neutral-800 focus:border-amber-400"
                              }`}
                            />
                            {errors.p5Mobile && <p className="mt-1 font-mono text-[9px] text-red-400">{errors.p5Mobile}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary / Fee Note */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-center">
                    <p className="font-mono text-[11px] text-neutral-400 uppercase">
                      Official Fee: <span className="text-amber-300 font-bold">₹400</span> for 2–4 members, and <span className="text-amber-300 font-bold">₹450</span> for 5 members.
                    </p>
                  </div>

                  {/* Submit Button to Review */}
                  <div className="flex justify-center pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-mono text-xs sm:text-sm font-bold tracking-widest text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all cursor-pointer uppercase"
                    >
                      <span>PROCEED TO REVIEW ({currentFeeDisplay})</span>
                      <span>→</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ================= STAGE 2: REVIEW ALL DETAILS ================= */}
              {stage === "REVIEW" && (
                <motion.div
                  key="stage-review"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="text-center pb-1">
                    <span className="font-mono text-[10px] tracking-[0.3em] text-amber-400 uppercase font-bold">
                      STAGE 02 // DOSSIER REVIEW
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                      VERIFY ALL SQUAD DETAILS
                    </h3>
                    <p className="font-mono text-xs text-neutral-400 mt-1 uppercase">
                      Review all entered information thoroughly before finalizing registration dispatch.
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-lg border border-red-500/60 bg-red-500/10 text-red-300 font-mono text-xs text-center">
                      {submitError}
                    </div>
                  )}

                  {/* Team & Fee Summary Card */}
                  <div className="rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-[#140e08] to-neutral-950 p-4 font-mono text-xs space-y-2.5 shadow-[0_0_25px_rgba(245,158,11,0.1)]">
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                      <span className="text-neutral-400 uppercase text-[10px]">TEAM NAME</span>
                      <span className="text-white font-bold text-sm uppercase">{teamName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                      <span className="text-neutral-400 uppercase text-[10px]">COLLEGE / INSTITUTION</span>
                      <span className="text-neutral-200 font-medium">{college}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                      <span className="text-neutral-400 uppercase text-[10px]">SECTOR DOMAIN</span>
                      <span className="text-amber-300 font-bold uppercase">{domain}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                      <span className="text-neutral-400 uppercase text-[10px]">SQUAD STRENGTH</span>
                      <span className="text-amber-300 font-bold">{participantCount} PIONEERS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 uppercase text-[10px]">CALCULATED REGISTRATION FEE</span>
                      <span className="text-amber-400 font-black text-base">{currentFeeDisplay}</span>
                    </div>
                  </div>

                  {/* Team Leader Card */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 font-mono text-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-400 font-bold uppercase text-[10px]">DESIGNATED TEAM LEADER</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                        PARTICIPANT 01
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">NAME</span>
                        <span className="text-white font-semibold">{leaderName}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">ROLL NUMBER</span>
                        <span className="text-amber-200 font-semibold">{leaderRollNo}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">MOBILE</span>
                        <span>{leaderMobile}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">EMAIL</span>
                        <span className="text-neutral-200 break-all">{leaderEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Squad Members Roster */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 font-mono text-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-400 font-bold uppercase text-[10px]">ALL PARTICIPANTS ROSTER</span>
                      <span className="text-neutral-500 text-[10px]">{participantCount} TOTAL</span>
                    </div>
                    <div className="space-y-2">
                      {reviewRoster.map((m) => (
                        <div
                          key={m.num}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60 gap-1 sm:gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold text-[11px]">{m.num}.</span>
                            <span className="text-white font-semibold">{m.name}</span>
                            {m.isLeader && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] border border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold uppercase">
                                LEADER
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                            <span>Roll: <strong className="text-neutral-200">{m.rollNo}</strong></span>
                            <span>•</span>
                            <span>{m.mobile}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStage("FORM")}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto font-mono text-xs text-neutral-400 hover:text-white uppercase py-2.5 px-5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                    >
                      ← EDIT DETAILS
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteRegistration}
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
                          <span>RECORDING REGISTRATION...</span>
                        </>
                      ) : (
                        <>
                          <span>COMPLETE REGISTRATION ({currentFeeDisplay})</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================= STAGE 3: RAZORPAY HANDOFF ================= */}
              {stage === "HANDOFF" && successData && (
                <motion.div
                  key="stage-handoff"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center py-3"
                >
                  <div className="h-12 w-12 rounded-full border border-amber-400/80 bg-amber-500/10 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>

                  <span className="mt-4 font-mono text-[10px] sm:text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">
                    EXPEDITION CONFIRMED // REGISTRATION RECORDED
                  </span>

                  <h3 className="mt-1 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {successData.teamName}
                  </h3>

                  <p className="mt-1 font-mono text-xs text-neutral-400 uppercase">
                    {successData.college}
                  </p>

                  {/* Registration Summary Card */}
                  <div className="my-5 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5 font-mono text-xs text-left">
                    <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-500 uppercase">REGISTRATION ID</span>
                      <span className="text-amber-300 font-bold uppercase select-all">{successData.id}</span>
                    </div>
                    {(successData.domain || domain) && (
                      <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                        <span className="text-neutral-500 uppercase">SECTOR DOMAIN</span>
                        <span className="text-amber-300 font-bold uppercase">{successData.domain || domain}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-500 uppercase">SQUAD STRENGTH</span>
                      <span className="text-white font-semibold">{successData.participantCount} MEMBERS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 uppercase">ENTRY PROTOCOL FEE</span>
                      <span className="text-amber-400 font-bold text-sm">₹{successData.fee}</span>
                    </div>
                  </div>

                  {/* Roster Preview */}
                  <div className="w-full max-w-md rounded-xl border border-neutral-900 bg-[#0a0805]/80 p-3 mb-5 text-left font-mono text-xs">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-2">
                      SQUAD ROSTER SUMMARY:
                    </span>
                    <div className="space-y-1.5">
                      {successData.participants.map((m, idx) => (
                        <div key={idx} className="flex justify-between text-neutral-300 text-[11px]">
                          <span>
                            0{idx + 1}. {m.name}{" "}
                            {m.isLeader && <span className="text-amber-400 text-[9px]">[LEADER]</span>}
                          </span>
                          <span className="text-neutral-400">Roll: {m.roll_no}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Razorpay Handoff Card */}
                  {(() => {
                    const isPaymentEnabled = Boolean(SPARKATHON_CONFIG.payment?.enabled);
                    const feeAmount = Number(successData.fee);
                    const paymentUrl =
                      isPaymentEnabled && feeAmount === 400 && SPARKATHON_CONFIG.payment?.url400?.trim()
                        ? SPARKATHON_CONFIG.payment.url400.trim()
                        : isPaymentEnabled && feeAmount === 450 && SPARKATHON_CONFIG.payment?.url450?.trim()
                        ? SPARKATHON_CONFIG.payment.url450.trim()
                        : successData.paymentUrl?.trim() || null;

                    if (paymentUrl) {
                      return (
                        <div className="w-full max-w-md p-4 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-neutral-950 to-neutral-950 text-center mb-5 shadow-[0_0_25px_rgba(245,158,11,0.1)] space-y-3">
                          <span className="font-mono text-[10px] text-amber-400 font-bold tracking-widest uppercase block">
                            ENTRY PROTOCOL FEE READY
                          </span>
                          <a
                            href={paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full font-mono text-xs sm:text-sm font-black tracking-widest uppercase border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <span>PROCEED TO RAZORPAY (₹{successData.fee})</span>
                            <span>→</span>
                          </a>
                          <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
                            OFFICIAL RAZORPAY PAYMENT GATEWAY • SECURE 256-BIT ENCRYPTED DISPATCH
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="w-full max-w-md p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center mb-5 space-y-1.5">
                        <span className="font-mono text-[10px] text-amber-400 font-bold tracking-wider uppercase block">
                          OFFICIAL PAYMENT LINK AWAITED
                        </span>
                        <p className="font-mono text-[11px] text-neutral-400 leading-relaxed">
                          Your squad dossier has been officially recorded under Registration ID <strong className="text-amber-300 select-all">{successData.id}</strong>. Official Razorpay payment gateway credentials and links are currently being provisioned by the event committee. Payment collection will be initiated through verified organizer channels.
                        </p>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRegisterAnother}
                      className="font-mono text-xs text-neutral-400 hover:text-white uppercase py-2.5 px-5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
                    >
                      REGISTER ANOTHER SQUAD
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
