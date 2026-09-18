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
  displayId?: string;
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

export function RegistrationChamber({ onReturnToHero }: RegistrationChamberProps) {
  // New 7-Step Workflow
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1); // 7 is HANDOFF (Success)

  // Form State
  const [participantCount, setParticipantCount] = useState<2 | 3 | 4 | 5>(2);
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("");
  const [domain, setDomain] = useState("");

  // Leader State
  const [leaderName, setLeaderName] = useState("");
  const [leaderRollNo, setLeaderRollNo] = useState("");
  const [leaderMobile, setLeaderMobile] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");

  // Dynamic Members
  const [p2, setP2] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });
  const [p3, setP3] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });
  const [p4, setP4] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });
  const [p5, setP5] = useState<ParticipantState>({ name: "", rollNo: "", mobile: "" });

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);
  const [domainCapacities, setDomainCapacities] = useState<Record<string, number>>({});
  const [isFetchingCapacities, setIsFetchingCapacities] = useState(false);
  
  // Payment State
  const [utr, setUtr] = useState("");
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  React.useEffect(() => {
    if (step === 2) {
      setIsFetchingCapacities(true);
      fetch("/api/domains")
        .then((res) => res.json())
        .then((data) => setDomainCapacities(data))
        .catch((err) => console.error("Failed to fetch domain capacities", err))
        .finally(() => setIsFetchingCapacities(false));
    }
  }, [step]);

  const currentFeeDisplay = SPARKATHON_CONFIG.pricing.formatFee(participantCount);

  const handleSelectCount = (size: 2 | 3 | 4 | 5) => {
    setParticipantCount(size);
    setErrors((prev) => {
      const next = { ...prev };
      if (size < 5) { delete next.p5Name; delete next.p5Roll; delete next.p5Mobile; }
      if (size < 4) { delete next.p4Name; delete next.p4Roll; delete next.p4Mobile; }
      if (size < 3) { delete next.p3Name; delete next.p3Roll; delete next.p3Mobile; }
      return next;
    });
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) errs.teamName = "Team Name is required.";
    else if (teamName.trim().length < 2) errs.teamName = "Team Name must be at least 2 characters.";
    
    if (!college.trim()) errs.college = "College is required.";
    else if (college.trim().length < 2) errs.college = "College must be at least 2 characters.";
    
    if (!domain) errs.domain = "Official sector domain selection is required.";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!leaderName.trim()) errs.leaderName = "Leader Name is required.";
    else if (leaderName.trim().length < 2) errs.leaderName = "Leader Name must be at least 2 characters.";
    
    if (!leaderRollNo.trim()) errs.leaderRollNo = "Leader Roll Number is required.";
    
    const normLeaderMobile = normalizeIndianMobile(leaderMobile);
    if (!normLeaderMobile) errs.leaderMobile = "Leader Mobile Number is required.";
    else if (!isValidIndianMobile(normLeaderMobile)) errs.leaderMobile = "Enter a valid 10-digit Indian mobile number.";
    
    const normLeaderEmail = leaderEmail.trim().toLowerCase();
    if (!normLeaderEmail) errs.leaderEmail = "Leader Email Address is required.";
    else if (!isValidEmail(normLeaderEmail)) errs.leaderEmail = "Enter a valid email address.";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errs: Record<string, string> = {};
    const seenMobiles = new Set<string>();
    const normLeaderMobile = normalizeIndianMobile(leaderMobile);
    if (normLeaderMobile && isValidIndianMobile(normLeaderMobile)) seenMobiles.add(normLeaderMobile);

    const validateParticipant = (p: ParticipantState, pKey: string, pLabel: string) => {
      if (!p.name.trim()) errs[pKey + "Name"] = `${pLabel} Full Name is required.`;
      else if (p.name.trim().length < 2) errs[pKey + "Name"] = `${pLabel} name must be at least 2 characters.`;
      if (!p.rollNo.trim()) errs[pKey + "Roll"] = `${pLabel} Roll Number is required.`;
      const normMobile = normalizeIndianMobile(p.mobile);
      if (!normMobile) errs[pKey + "Mobile"] = `${pLabel} Mobile Number is required.`;
      else if (!isValidIndianMobile(normMobile)) errs[pKey + "Mobile"] = "Enter a valid 10-digit mobile number.";
      else if (seenMobiles.has(normMobile)) errs[pKey + "Mobile"] = "Duplicate mobile number with another member.";
      else seenMobiles.add(normMobile);
    };

    validateParticipant(p2, "p2", "Participant 02");
    if (participantCount >= 3) validateParticipant(p3, "p3", "Participant 03");
    if (participantCount >= 4) validateParticipant(p4, "p4", "Participant 04");
    if (participantCount === 5) validateParticipant(p5, "p5", "Participant 05");

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    setSubmitError(null);
    if (step === 1) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4 && validateStep4()) setStep(5);
  };

  const handleBack = () => {
    setSubmitError(null);
    if (step > 1 && step < 6) setStep((s) => (s - 1) as typeof step);
  };

  const handleCompleteRegistration = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    const participantsPayload = [
      { name: leaderName.trim(), roll_no: leaderRollNo.trim(), mobile: normalizeIndianMobile(leaderMobile), isLeader: true },
      { name: p2.name.trim(), roll_no: p2.rollNo.trim(), mobile: normalizeIndianMobile(p2.mobile), isLeader: false },
    ];
    if (participantCount >= 3) participantsPayload.push({ name: p3.name.trim(), roll_no: p3.rollNo.trim(), mobile: normalizeIndianMobile(p3.mobile), isLeader: false });
    if (participantCount >= 4) participantsPayload.push({ name: p4.name.trim(), roll_no: p4.rollNo.trim(), mobile: normalizeIndianMobile(p4.mobile), isLeader: false });
    if (participantCount === 5) participantsPayload.push({ name: p5.name.trim(), roll_no: p5.rollNo.trim(), mobile: normalizeIndianMobile(p5.mobile), isLeader: false });

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        if (response.status === 400 && data.error?.includes("maximum capacity")) {
          setSubmitError(data.error);
          setStep(2);
          return;
        }
        throw new Error(data.error || "Registration failed. Please review your inputs and try again.");
      }
      setSuccessData(data);
      setStep(6); // Go to Payment Screen
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setSuccessData(null);
    setSubmitError(null);
    setErrors({});
    setTeamName(""); setCollege(""); setDomain("");
    setLeaderName(""); setLeaderRollNo(""); setLeaderMobile(""); setLeaderEmail("");
    setP2({ name: "", rollNo: "", mobile: "" });
    setP3({ name: "", rollNo: "", mobile: "" });
    setP4({ name: "", rollNo: "", mobile: "" });
    setP5({ name: "", rollNo: "", mobile: "" });
    setParticipantCount(2);
    setStep(1);
  };

  const handlePaymentSubmit = async () => {
    setPaymentError(null);
    const paymentMode = SPARKATHON_CONFIG.payment?.mode || "GPay";

    if (paymentMode === "GPay") {
      if (!utr || utr.trim().length < 5) {
        setPaymentError("Please enter a valid UTR or Transaction ID.");
        return;
      }
      setIsPaymentSubmitting(true);
      try {
        const res = await fetch("/api/register/payment", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: successData?.registrationId, utr: utr.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to submit payment details.");
        
        setStep(7);
      } catch (err: unknown) {
        setPaymentError(err instanceof Error ? err.message : "Network error");
      } finally {
        setIsPaymentSubmitting(false);
      }
    }
  };

  const stagesList = [
    { num: 1, label: "SIZE" },
    { num: 2, label: "TEAM" },
    { num: 3, label: "LEADER" },
    { num: 4, label: "MEMBERS" },
    { num: 5, label: "PAYMENT" },
  ];

  const reviewRoster = [
    { num: "01", name: leaderName, rollNo: leaderRollNo, mobile: leaderMobile, isLeader: true },
    { num: "02", name: p2.name, rollNo: p2.rollNo, mobile: p2.mobile, isLeader: false },
    ...(participantCount >= 3 ? [{ num: "03", name: p3.name, rollNo: p3.rollNo, mobile: p3.mobile, isLeader: false }] : []),
    ...(participantCount >= 4 ? [{ num: "04", name: p4.name, rollNo: p4.rollNo, mobile: p4.mobile, isLeader: false }] : []),
    ...(participantCount === 5 ? [{ num: "05", name: p5.name, rollNo: p5.rollNo, mobile: p5.mobile, isLeader: false }] : []),
  ];

  return (
    <section id="register" className="relative z-30 w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex flex-col justify-between items-center text-center min-h-[90vh]">
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-2.5 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] text-amber-400 uppercase font-bold">ACT IX // REGISTRATION CHAMBER</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]" />
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">{SPARKATHON_CONFIG.registration.chamberTitle}</h2>
        <p className="mt-2 font-mono text-xs sm:text-sm tracking-wider text-neutral-300 uppercase max-w-md">{SPARKATHON_CONFIG.registration.chamberSubtitle}</p>
      </div>

      <div className="relative my-auto w-full max-w-2xl mt-6 sm:mt-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[85%] rounded-full blur-[100px] opacity-25" style={{ background: "radial-gradient(circle, rgba(255, 140, 0, 0.5) 0%, rgba(255, 60, 0, 0.15) 50%, transparent 75%)" }} aria-hidden="true" />

        <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#070709] p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden text-left">
          {/* Top Progress Tracker */}
          {step < 6 && (
            <div className="flex flex-col border-b border-neutral-800/80 bg-neutral-950/90 font-mono text-xs sm:text-sm">
              <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-neutral-900 w-full overflow-x-auto">
                <div className="flex items-center justify-start gap-1.5 sm:gap-3 min-w-max">
                  {stagesList.map((st, idx) => {
                    const isActive = step === st.num;
                    const isDone = step > st.num;
                    return (
                      <div key={st.num} className="flex items-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => { if (isDone) setStep(st.num as any); }}
                          disabled={!isDone}
                          className={`px-2 sm:px-3 py-1 rounded text-[9px] sm:text-xs font-bold uppercase transition-all whitespace-nowrap ${
                            isActive ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(255,140,0,0.3)]" : 
                            isDone ? "text-neutral-300 hover:text-white cursor-pointer" : "text-neutral-300 cursor-not-allowed border border-transparent"
                          }`}
                        >
                          0{st.num} {st.label}
                        </button>
                        {idx < stagesList.length - 1 && <span className="text-neutral-700 mx-1 text-xs sm:text-sm">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="relative w-full rounded-xl sm:rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-[#0e0a06]/95 via-[#050403]/98 to-black p-4 sm:p-7 overflow-hidden">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: TEAM SIZE */}
              {step === 1 && (
                <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="text-center pb-1">
                    <span className="font-mono text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">STEP 01 // TEAM SIZE</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">SELECT SQUAD CAPACITY</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {([2, 3, 4, 5] as const).map((size) => {
                      const isSelected = participantCount === size;
                      return (
                        <button key={size} type="button" onClick={() => handleSelectCount(size)} className={`group relative rounded-xl border p-3 font-mono transition-all duration-200 text-center flex flex-col items-center justify-between cursor-pointer ${isSelected ? "border-amber-400 bg-gradient-to-b from-amber-500/25 via-[#1a1107] to-neutral-950 text-white shadow-[0_0_20px_rgba(255,160,0,0.25)] scale-[1.02]" : "border-neutral-800 bg-neutral-950/80 text-neutral-300 hover:border-neutral-700"}`} style={{ minHeight: "115px" }}>
                          <div className="w-full flex items-center justify-between">
                            <span className="text-xs text-neutral-300 uppercase tracking-widest font-bold">TIER //0{size}</span>
                            <div className={`h-2 w-2 rounded-full transition-colors ${isSelected ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" : "bg-neutral-800"}`} />
                          </div>
                          <div className="my-1">
                            <span className={`text-2xl sm:text-3xl font-black tracking-tight uppercase transition-colors ${isSelected ? "text-amber-200" : "text-neutral-300"}`}>0{size}</span>
                            <span className="block text-xs tracking-[0.25em] text-neutral-300 uppercase font-bold">MEMBERS</span>
                          </div>
                          <div className="w-full pt-1.5 border-t border-neutral-800/80">
                            <span className={`text-xs font-bold font-mono ${isSelected ? "text-amber-400" : "text-neutral-300"}`}>{SPARKATHON_CONFIG.pricing.formatFee(size)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="button" onClick={handleNext} className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-mono text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all uppercase">
                      <span>NEXT STEP</span><span>→</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: TEAM DETAILS */}
              {step === 2 && (
                <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="text-center pb-1">
                    <span className="font-mono text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">STEP 02 // TEAM IDENTITY</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">ENTER TEAM DETAILS</h3>
                  </div>
                  {submitError && <div className="p-3 rounded-lg border border-red-500/60 bg-red-500/10 text-red-300 font-mono text-xs text-center">{submitError}</div>}
                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">TEAM NAME <span className="text-amber-400">*</span></label>
                      <input type="text" value={teamName} onChange={(e) => { setTeamName(e.target.value); if(errors.teamName) setErrors({...errors, teamName: ""})}} className={`w-full px-4 py-3.5 sm:py-3 rounded-lg border font-mono text-sm sm:text-base bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors.teamName ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="e.g. Cyber Sentinels" />
                      {errors.teamName && <p className="mt-1.5 font-mono text-xs text-red-400">{errors.teamName}</p>}
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">COLLEGE / INSTITUTION <span className="text-amber-400">*</span></label>
                      <input type="text" value={college} onChange={(e) => { setCollege(e.target.value); if(errors.college) setErrors({...errors, college: ""})}} className={`w-full px-4 py-3.5 sm:py-3 rounded-lg border font-mono text-sm sm:text-base bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors.college ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="e.g. FCRIT Vashi" />
                      {errors.college && <p className="mt-1.5 font-mono text-xs text-red-400">{errors.college}</p>}
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1.5">
                        DOMAIN / SECTOR <span className="text-amber-400">*</span>
                        {isFetchingCapacities && <span className="ml-2 text-amber-500/70 lowercase tracking-normal">(updating live capacity...)</span>}
                      </label>
                      <select value={domain} onChange={(e) => { setDomain(e.target.value); if(errors.domain) setErrors({...errors, domain: ""})}} className={`w-full px-4 py-3.5 sm:py-3 rounded-lg border font-mono text-sm sm:text-base bg-neutral-950 focus:outline-none transition-colors text-ellipsis overflow-hidden ${errors.domain ? "border-red-500" : "border-neutral-800 focus:border-amber-400"} ${!domain ? "text-neutral-300" : "text-white"}`}>
                        <option value="" disabled>-- SELECT OFFICIAL SECTOR DOMAIN --</option>
                        {SPARKATHON_CONFIG.sectors.domains.map((dom) => {
                          const count = domainCapacities[dom] || 0;
                          const isFull = count >= 10;
                          return (
                            <option key={dom} value={dom} disabled={isFull} className="py-2">
                              {dom} ({count}/10){isFull ? " — FULL" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {errors.domain && <p className="mt-1.5 font-mono text-xs text-red-400">{errors.domain}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                    <button type="button" onClick={handleBack} className="w-full sm:w-auto font-mono text-xs text-neutral-300 hover:text-white uppercase py-3.5 sm:py-2.5 px-5 rounded-lg border border-neutral-800 transition-colors">← BACK</button>
                    <button type="button" onClick={handleNext} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 sm:py-3 rounded-full font-mono text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all uppercase">
                      <span>NEXT STEP</span><span>→</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: TEAM LEADER */}
              {step === 3 && (
                <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="text-center pb-1">
                    <span className="font-mono text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">STEP 03 // PARTICIPANT 01</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">TEAM LEADER DETAILS</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">FULL NAME <span className="text-amber-400">*</span></label>
                      <input type="text" value={leaderName} onChange={(e) => { setLeaderName(e.target.value); if(errors.leaderName) setErrors({...errors, leaderName: ""})}} className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors.leaderName ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="Full Name" />
                      {errors.leaderName && <p className="mt-1 font-mono text-xs text-red-400">{errors.leaderName}</p>}
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">ROLL NUMBER <span className="text-amber-400">*</span></label>
                      <input type="text" value={leaderRollNo} onChange={(e) => { setLeaderRollNo(e.target.value); if(errors.leaderRollNo) setErrors({...errors, leaderRollNo: ""})}} className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors.leaderRollNo ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="Roll Number" />
                      {errors.leaderRollNo && <p className="mt-1 font-mono text-xs text-red-400">{errors.leaderRollNo}</p>}
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">MOBILE <span className="text-amber-400">*</span></label>
                      <input type="tel" maxLength={10} value={leaderMobile} onChange={(e) => { setLeaderMobile(e.target.value); if(errors.leaderMobile) setErrors({...errors, leaderMobile: ""})}} className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors.leaderMobile ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="10 Digits" />
                      {errors.leaderMobile && <p className="mt-1 font-mono text-xs text-red-400">{errors.leaderMobile}</p>}
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">EMAIL <span className="text-amber-400">*</span></label>
                      <input type="email" value={leaderEmail} onChange={(e) => { setLeaderEmail(e.target.value); if(errors.leaderEmail) setErrors({...errors, leaderEmail: ""})}} className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors.leaderEmail ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="Email Address" />
                      {errors.leaderEmail && <p className="mt-1 font-mono text-xs text-red-400">{errors.leaderEmail}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                    <button type="button" onClick={handleBack} className="w-full sm:w-auto font-mono text-xs text-neutral-300 hover:text-white uppercase py-3.5 sm:py-2.5 px-5 rounded-lg border border-neutral-800 transition-colors">← BACK</button>
                    <button type="button" onClick={handleNext} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 sm:py-3 rounded-full font-mono text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all uppercase">
                      <span>NEXT STEP</span><span>→</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: TEAM MEMBERS */}
              {step === 4 && (
                <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="text-center pb-1">
                    <span className="font-mono text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">STEP 04 // SQUAD ROSTER</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">TEAM MEMBERS DETAILS</h3>
                  </div>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {[
                      { p: p2, setP: setP2, num: 2, label: "PARTICIPANT 02" },
                      ...(participantCount >= 3 ? [{ p: p3, setP: setP3, num: 3, label: "PARTICIPANT 03" }] : []),
                      ...(participantCount >= 4 ? [{ p: p4, setP: setP4, num: 4, label: "PARTICIPANT 04" }] : []),
                      ...(participantCount === 5 ? [{ p: p5, setP: setP5, num: 5, label: "PARTICIPANT 05" }] : []),
                    ].map(({ p, setP, num, label }) => (
                      <div key={num} className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-3">
                        <span className="font-mono text-xs font-bold text-neutral-300 uppercase tracking-wider block border-b border-neutral-800/60 pb-1.5">{label}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">FULL NAME <span className="text-amber-400">*</span></label>
                            <input type="text" value={p.name} onChange={(e) => { setP({ ...p, name: e.target.value }); if(errors[`p${num}Name`]) setErrors({...errors, [`p${num}Name`]: ""})}} className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors[`p${num}Name`] ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="Full Name" />
                            {errors[`p${num}Name`] && <p className="mt-1 font-mono text-xs text-red-400">{errors[`p${num}Name`]}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">ROLL NUMBER <span className="text-amber-400">*</span></label>
                            <input type="text" value={p.rollNo} onChange={(e) => { setP({ ...p, rollNo: e.target.value }); if(errors[`p${num}Roll`]) setErrors({...errors, [`p${num}Roll`]: ""})}} className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors[`p${num}Roll`] ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="Roll Number" />
                            {errors[`p${num}Roll`] && <p className="mt-1 font-mono text-xs text-red-400">{errors[`p${num}Roll`]}</p>}
                          </div>
                          <div>
                            <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">MOBILE <span className="text-amber-400">*</span></label>
                            <input type="tel" maxLength={10} value={p.mobile} onChange={(e) => { setP({ ...p, mobile: e.target.value }); if(errors[`p${num}Mobile`]) setErrors({...errors, [`p${num}Mobile`]: ""})}} className={`w-full px-3 py-2 rounded-lg border font-mono text-xs bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none transition-colors ${errors[`p${num}Mobile`] ? "border-red-500" : "border-neutral-800 focus:border-amber-400"}`} placeholder="10 Digits" />
                            {errors[`p${num}Mobile`] && <p className="mt-1 font-mono text-xs text-red-400">{errors[`p${num}Mobile`]}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                    <button type="button" onClick={handleBack} className="w-full sm:w-auto font-mono text-xs text-neutral-300 hover:text-white uppercase py-3.5 sm:py-2.5 px-5 rounded-lg border border-neutral-800 transition-colors">← BACK</button>
                    <button type="button" onClick={handleNext} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3.5 sm:py-3 rounded-full font-mono text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all uppercase">
                      <span>NEXT STEP</span><span>→</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: REVIEW & SAVE */}
              {step === 5 && (
                <motion.div key="step-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="text-center pb-1">
                    <span className="font-mono text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">STEP 05 // REVIEW SQUAD</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">CONFIRM DISPATCH</h3>
                  </div>

                  {submitError && <div className="p-3 rounded-lg border border-red-500/60 bg-red-500/10 text-red-300 font-mono text-xs text-center">{submitError}</div>}

                  <div className="rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-[#140e08] to-neutral-950 p-4 font-mono text-xs space-y-2.5 shadow-[0_0_25px_rgba(245,158,11,0.1)]">
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2"><span className="text-neutral-300 uppercase text-xs">TEAM NAME</span><span className="text-white font-bold text-sm uppercase">{teamName}</span></div>
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2"><span className="text-neutral-300 uppercase text-xs">COLLEGE / INSTITUTION</span><span className="text-neutral-200 font-medium">{college}</span></div>
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2"><span className="text-neutral-300 uppercase text-xs">SQUAD STRENGTH</span><span className="text-amber-300 font-bold">{participantCount} MEMBERS</span></div>
                    <div className="flex justify-between items-center"><span className="text-neutral-300 uppercase text-xs">REGISTRATION FEE</span><span className="text-amber-400 font-black text-base">{currentFeeDisplay}</span></div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button type="button" onClick={handleBack} disabled={isSubmitting} className="w-full sm:w-auto font-mono text-xs text-neutral-300 hover:text-white uppercase py-2.5 px-5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer">← EDIT DETAILS</button>
                    <button type="button" onClick={handleCompleteRegistration} disabled={isSubmitting} className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-mono text-xs sm:text-sm font-black tracking-widest uppercase transition-all cursor-pointer ${isSubmitting ? "bg-neutral-800 text-neutral-300 border border-neutral-700 cursor-not-allowed" : "border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] hover:scale-[1.01] active:scale-[0.99]"}`}>
                      {isSubmitting ? <span>SAVING...</span> : <span>SAVE REGISTRATION →</span>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: PAYMENT SCREEN */}
              {step === 6 && successData && (
                <motion.div key="step-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="text-center pb-1">
                    <span className="font-mono text-xs tracking-[0.3em] text-amber-400 uppercase font-bold">STEP 06 // FEE SETTLEMENT</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">PAYMENT PROTOCOL</h3>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 font-mono text-xs text-left space-y-2.5">
                    <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2"><span className="text-neutral-400 uppercase">REGISTRATION ID</span><span className="text-amber-300 font-bold uppercase select-all">{successData.displayId || successData.id}</span></div>
                    <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2"><span className="text-neutral-400 uppercase">SQUAD STRENGTH</span><span className="text-white font-semibold">{successData.participantCount} MEMBERS</span></div>
                    <div className="flex justify-between items-center"><span className="text-neutral-400 uppercase">AMOUNT DUE</span><span className="text-amber-400 font-bold text-base">₹{successData.fee}</span></div>
                  </div>

                  {paymentError && <div className="p-3 rounded-lg border border-red-500/60 bg-red-500/10 text-red-300 font-mono text-xs text-center">{paymentError}</div>}

                  {SPARKATHON_CONFIG.payment?.mode === "GPay" ? (
                    <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-5 space-y-4">
                      <div className="text-center">
                        <p className="font-mono text-xs text-neutral-300 mb-4">{SPARKATHON_CONFIG.payment.gpay.note}</p>
                        <div className="inline-block p-2 bg-white rounded-xl shadow-lg border border-neutral-700">
                           {/* Add an actual Image when you have the local QR codes, using placeholder below */}
                           <div className="w-48 h-48 bg-neutral-200 flex flex-col items-center justify-center text-neutral-900 rounded-lg">
                             {successData.fee === 400 ? <img src={SPARKATHON_CONFIG.payment.gpay.qr400} alt="QR 400" className="w-full h-full object-cover" /> : <img src={SPARKATHON_CONFIG.payment.gpay.qr350} alt="QR 350" className="w-full h-full object-cover" />}
                           </div>
                        </div>
                      </div>
                      <div>
                        <label className="block font-mono text-xs text-neutral-300 uppercase tracking-wider mb-1">ENTER UTR / TRANSACTION ID <span className="text-amber-400">*</span></label>
                        <input type="text" value={utr} onChange={(e) => { setUtr(e.target.value); if(paymentError) setPaymentError(null);}} className="w-full px-3.5 py-3 rounded-lg border font-mono text-sm bg-neutral-950 text-white border-neutral-800 focus:border-amber-400 focus:outline-none transition-colors" placeholder="e.g. 3154XXXXXXXX" />
                      </div>
                      <button type="button" onClick={handlePaymentSubmit} disabled={isPaymentSubmitting || utr.trim().length < 5} className="w-full inline-flex justify-center items-center gap-2 px-8 py-3.5 rounded-full font-mono text-xs sm:text-sm font-bold text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none">
                        {isPaymentSubmitting ? "VERIFYING..." : "SUBMIT UTR"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-5 space-y-4 text-center">
                      <p className="font-mono text-xs text-neutral-300">{SPARKATHON_CONFIG.payment?.external?.note}</p>
                      {SPARKATHON_CONFIG.payment?.external?.url ? (
                        <a href={SPARKATHON_CONFIG.payment.external.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-full font-mono text-sm font-black tracking-widest uppercase border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 transition-all hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]">
                          <span>PAY NOW VIA RAZORPAY (₹{successData.fee})</span><span>→</span>
                        </a>
                      ) : (
                        <div className="w-full p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center mt-3">
                           <span className="font-mono text-xs text-amber-400 font-bold tracking-wider uppercase block">PAYMENT LINK AWAITED</span>
                           <p className="font-mono text-[10px] text-neutral-300 mt-2">The official college payment portal is currently being provisioned. Your registration is saved under ID <strong className="text-amber-300">{successData.displayId || successData.id}</strong>.</p>
                        </div>
                      )}
                      {/* Allow advancing to step 7 even in external mode to clear the screen, or they just close the site */}
                      <button type="button" onClick={() => setStep(7)} className="mt-4 font-mono text-[10px] text-neutral-500 hover:text-neutral-300 uppercase underline underline-offset-4">I HAVE COMPLETED PAYMENT</button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 7: HANDOFF SUCCESS */}
              {step === 7 && successData && (
                <motion.div key="step-7" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center text-center py-3">
                  <div className="h-12 w-12 rounded-full border border-amber-400/80 bg-amber-500/10 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <span className="mt-4 font-mono text-xs sm:text-sm tracking-[0.3em] text-amber-400 uppercase font-bold">EXPEDITION CONFIRMED</span>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">{successData.teamName}</h3>
                  <p className="mt-1 font-mono text-xs text-neutral-300 uppercase">{successData.college}</p>
                  
                  <div className="my-5 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5 font-mono text-xs text-left">
                    <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2"><span className="text-neutral-300 uppercase">REGISTRATION ID</span><span className="text-amber-300 font-bold uppercase select-all">{successData.displayId || successData.id}</span></div>
                    <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2"><span className="text-neutral-300 uppercase">SQUAD STRENGTH</span><span className="text-white font-semibold">{successData.participantCount} MEMBERS</span></div>
                    <div className="flex justify-between items-center"><span className="text-neutral-300 uppercase">PAYMENT STATUS</span><span className="text-amber-400 font-bold text-sm">PENDING VERIFICATION</span></div>
                  </div>

                  <div className="w-full max-w-md p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center mb-5 space-y-1.5">
                     <p className="font-mono text-xs text-neutral-300 leading-relaxed">Your squad dossier has been officially recorded. Our operators will manually verify your payment and finalize your domain dispatch.</p>
                  </div>

                  <button type="button" onClick={handleRegisterAnother} className="font-mono text-xs text-neutral-300 hover:text-white uppercase py-2.5 px-5 rounded-lg border border-neutral-800 transition-colors">REGISTER ANOTHER SQUAD</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/90 font-mono text-xs sm:text-sm text-neutral-300 tracking-wider">
            <div className="flex items-center gap-2"><span className="text-neutral-300">DATA PROTOCOL:</span><span className="text-amber-400/90">ENCRYPTED // SQUAD PROTOCOL</span></div>
            <div className="flex items-center gap-2"><span className="text-neutral-300">ORGANIZER DISPATCH:</span><span className="text-neutral-300">STAGE 01 REGISTRATION DESK</span></div>
          </div>
        </div>
      </div>

      {onReturnToHero && (
        <button onClick={onReturnToHero} className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-neutral-300 hover:text-amber-300 uppercase py-2 px-5 rounded-full border border-neutral-800 hover:border-amber-500/50 transition-colors">
          <span>↑ RETURN TO THE HEARTH</span>
        </button>
      )}
    </section>
  );
}
