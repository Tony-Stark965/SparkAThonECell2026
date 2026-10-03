"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface StoredTimerState {
  remaining: number; // seconds remaining in total session (600 max)
  isRunning: boolean;
  lastStartedAt: number | null; // timestamp ms
  duration: number; // total duration (default 600 = 10 min)
}

export type JudgingPhase = "pitch" | "qa" | "time_ended";
export type TimerAlertLevel = "normal" | "warning" | "critical" | "time_up";

export const TOTAL_SESSION_DURATION = 600; // 10 minutes total
export const PITCH_DURATION = 480; // 8 minutes pitch
export const QA_DURATION = 120; // 2 minutes Q&A
export const DEFAULT_DURATION = TOTAL_SESSION_DURATION;

export function formatPitchTime(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function playBeep(freq = 880, duration = 0.25) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio restrictions before user gesture
  }
}

function getStorageKey(teamId: string) {
  return `sparkathon_timer_${teamId}`;
}

function readStoredState(teamId: string): StoredTimerState {
  if (typeof window === "undefined") {
    return {
      remaining: DEFAULT_DURATION,
      isRunning: false,
      lastStartedAt: null,
      duration: DEFAULT_DURATION,
    };
  }

  try {
    const raw = localStorage.getItem(getStorageKey(teamId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.remaining === "number") {
        return {
          remaining: Math.max(0, Math.min(DEFAULT_DURATION, parsed.remaining)),
          isRunning: Boolean(parsed.isRunning),
          lastStartedAt: parsed.lastStartedAt || null,
          duration: parsed.duration || DEFAULT_DURATION,
        };
      }
    }
  } catch (err) {
    console.warn("Error reading timer state from storage:", err);
  }

  return {
    remaining: DEFAULT_DURATION,
    isRunning: false,
    lastStartedAt: null,
    duration: DEFAULT_DURATION,
  };
}

function writeStoredState(teamId: string, state: StoredTimerState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(teamId), JSON.stringify(state));
    window.dispatchEvent(
      new CustomEvent("spark_timer_sync", {
        detail: { teamId, state },
      })
    );
  } catch (err) {
    console.warn("Error saving timer state to storage:", err);
  }
}

export function useTeamTimer(
  teamId: string,
  options?: {
    initialStartedAt?: string | null;
    isSubmitted?: boolean;
    onStart?: () => void;
    onStop?: () => void;
    onReset?: () => void;
  }
) {
  const [timerState, setTimerState] = useState<StoredTimerState>(() => {
    return readStoredState(teamId);
  });

  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());
  const [showQaTransition, setShowQaTransition] = useState<boolean>(false);

  // Vibration guard ref: ensure vibration fires at most ONCE per session completion
  const hasVibratedRef = useRef(false);

  // Ref to hold the latest timer state safely without mutating during render
  const stateRef = useRef(timerState);
  useEffect(() => {
    stateRef.current = timerState;
  }, [timerState]);

  // Calculate effective seconds remaining derived purely from state & current time
  const calculateEffectiveRemaining = useCallback((state: StoredTimerState, now: number): number => {
    if (!state.isRunning || !state.lastStartedAt) {
      return state.remaining;
    }
    const elapsed = Math.floor((now - state.lastStartedAt) / 1000);
    return Math.max(0, state.remaining - elapsed);
  }, []);

  // Compute live seconds remaining in overall 10-minute session (600 -> 0)
  const sessionRemaining = calculateEffectiveRemaining(timerState, currentTimeMs);

  // Compute Judging Phase & Phase Remaining Seconds
  // Phase 1: PITCH (8 minutes = 480s) when sessionRemaining > 120s
  // Phase 2: Q&A (2 minutes = 120s) when 0 < sessionRemaining <= 120s
  // Phase 3: TIME ENDED when sessionRemaining === 0
  let judgingPhase: JudgingPhase = "pitch";
  let phaseRemaining = 0;
  let phaseDuration = PITCH_DURATION;

  if (sessionRemaining <= 0) {
    judgingPhase = "time_ended";
    phaseRemaining = 0;
    phaseDuration = QA_DURATION;
  } else if (sessionRemaining <= QA_DURATION) {
    judgingPhase = "qa";
    phaseRemaining = sessionRemaining;
    phaseDuration = QA_DURATION;
  } else {
    judgingPhase = "pitch";
    phaseRemaining = sessionRemaining - QA_DURATION;
    phaseDuration = PITCH_DURATION;
  }

  // Ref to track phase changes and detect exact pitch -> qa transition
  const prevPhaseRef = useRef<JudgingPhase>(judgingPhase);

  // Sync with storage on mount and when external events fire
  useEffect(() => {
    const syncState = () => {
      const stored = readStoredState(teamId);
      setTimerState(stored);
      setCurrentTimeMs(Date.now());
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ teamId: string; state: StoredTimerState }>;
      if (customEvent.detail?.teamId === teamId) {
        setTimerState(customEvent.detail.state);
        setCurrentTimeMs(Date.now());
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === getStorageKey(teamId)) {
        syncState();
      }
    };

    window.addEventListener("spark_timer_sync", handleCustomSync);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("spark_timer_sync", handleCustomSync);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [teamId]);

  // Drift-free interval ticker when running
  useEffect(() => {
    if (options?.isSubmitted || !timerState.isRunning || !timerState.lastStartedAt) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTimeMs(now);

      const effective = calculateEffectiveRemaining(timerState, now);

      // Detect automatic transition from PITCH to Q&A
      if (effective <= QA_DURATION && effective > 0 && prevPhaseRef.current === "pitch") {
        prevPhaseRef.current = "qa";
        setShowQaTransition(true);
        playBeep(880, 0.3);
      }

      if (effective <= 0) {
        if (prevPhaseRef.current !== "time_ended") {
          playBeep(440, 0.5);
        }
        prevPhaseRef.current = "time_ended";
        const finalState: StoredTimerState = {
          ...timerState,
          remaining: 0,
          isRunning: false,
          lastStartedAt: null,
        };
        setTimerState(finalState);
        writeStoredState(teamId, finalState);

        // Trigger device vibration EXACTLY ONCE on final 10-minute session completion
        if (!hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if (
            typeof window !== "undefined" &&
            "navigator" in window &&
            typeof navigator.vibrate === "function"
          ) {
            try {
              navigator.vibrate([300, 150, 300, 150, 500]);
            } catch {
              // Ignored if browser security/platform restricts vibration
            }
          }
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerState, calculateEffectiveRemaining, teamId, options?.isSubmitted]);

  // Auto-dismiss the Q&A cinematic transition after 5 seconds
  useEffect(() => {
    if (!showQaTransition) return;
    const timeout = setTimeout(() => {
      setShowQaTransition(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [showQaTransition]);

  // Action: START
  const start = useCallback(() => {
    if (options?.isSubmitted) return;

    const current = stateRef.current;
    const now = Date.now();
    let baseRemaining = calculateEffectiveRemaining(current, now);

    // If already at 0 (or finished), reset to full 10-minute session first
    if (baseRemaining <= 0) {
      baseRemaining = DEFAULT_DURATION;
      hasVibratedRef.current = false;
      prevPhaseRef.current = "pitch";
    }

    const nextState: StoredTimerState = {
      remaining: baseRemaining,
      isRunning: true,
      lastStartedAt: now,
      duration: current.duration || DEFAULT_DURATION,
    };

    setTimerState(nextState);
    setCurrentTimeMs(now);
    writeStoredState(teamId, nextState);

    if (options?.onStart) {
      options.onStart();
    }
  }, [teamId, calculateEffectiveRemaining, options]);

  // Action: STOP / PAUSE
  const stop = useCallback(() => {
    if (options?.isSubmitted) return;

    const current = stateRef.current;
    if (!current.isRunning) return;

    const now = Date.now();
    const remainingNow = calculateEffectiveRemaining(current, now);
    const nextState: StoredTimerState = {
      remaining: remainingNow,
      isRunning: false,
      lastStartedAt: null,
      duration: current.duration || DEFAULT_DURATION,
    };

    setTimerState(nextState);
    setCurrentTimeMs(now);
    writeStoredState(teamId, nextState);

    if (options?.onStop) {
      options.onStop();
    }
  }, [teamId, calculateEffectiveRemaining, options]);

  // Action: RESET (returns timer back to full 10:00 duration)
  const reset = useCallback(
    (targetPhase?: "pitch" | "qa") => {
      if (options?.isSubmitted) return;

      hasVibratedRef.current = false;
      setShowQaTransition(false);

      const isQa = targetPhase === "qa";
      const newRemaining = isQa ? QA_DURATION : TOTAL_SESSION_DURATION;
      prevPhaseRef.current = isQa ? "qa" : "pitch";

      const nextState: StoredTimerState = {
        remaining: newRemaining,
        isRunning: false,
        lastStartedAt: null,
        duration: TOTAL_SESSION_DURATION,
      };

      setTimerState(nextState);
      setCurrentTimeMs(Date.now());
      writeStoredState(teamId, nextState);

      if (options?.onReset) {
        options.onReset();
      }
    },
    [teamId, options]
  );

  // Action: Skip to Q&A phase (02:00)
  const skipToQa = useCallback(() => {
    if (options?.isSubmitted) return;
    hasVibratedRef.current = false;
    prevPhaseRef.current = "qa";
    const current = stateRef.current;
    const nextState: StoredTimerState = {
      ...current,
      remaining: QA_DURATION,
      lastStartedAt: current.isRunning ? Date.now() : null,
    };
    setTimerState(nextState);
    setCurrentTimeMs(Date.now());
    writeStoredState(teamId, nextState);
    playBeep(660, 0.2);
  }, [teamId, options]);

  // Action: Back to Pitch phase (08:00)
  const backToPitch = useCallback(() => {
    if (options?.isSubmitted) return;
    hasVibratedRef.current = false;
    prevPhaseRef.current = "pitch";
    const current = stateRef.current;
    const nextState: StoredTimerState = {
      ...current,
      remaining: TOTAL_SESSION_DURATION,
      lastStartedAt: current.isRunning ? Date.now() : null,
    };
    setTimerState(nextState);
    setCurrentTimeMs(Date.now());
    writeStoredState(teamId, nextState);
  }, [teamId, options]);

  const dismissQaTransition = useCallback(() => {
    setShowQaTransition(false);
  }, []);

  // Compute alert level based on phase:
  // In Pitch:
  // <= 10s: critical (red + subtle pulse)
  // <= 60s: warning (amber)
  // In Q&A:
  // <= 10s: critical (red + subtle pulse)
  // <= 30s: warning (amber)
  // At Time Ended:
  // 00:00 = time_up
  let timerAlertLevel: TimerAlertLevel = "normal";
  if (sessionRemaining <= 0) {
    timerAlertLevel = "time_up";
  } else if (judgingPhase === "qa") {
    if (phaseRemaining <= 10) {
      timerAlertLevel = "critical";
    } else if (phaseRemaining <= 30) {
      timerAlertLevel = "warning";
    } else {
      timerAlertLevel = "normal";
    }
  } else {
    // Pitch phase
    if (phaseRemaining <= 10) {
      timerAlertLevel = "critical";
    } else if (phaseRemaining <= 60) {
      timerAlertLevel = "warning";
    } else {
      timerAlertLevel = "normal";
    }
  }

  // Phase-specific progress percentage (0% to 100% of current phase elapsed)
  const phaseProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(((phaseDuration - phaseRemaining) / phaseDuration) * 100))
  );

  // Overall session progress (0% to 100% of 10-minute session elapsed)
  const sessionProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(((TOTAL_SESSION_DURATION - sessionRemaining) / TOTAL_SESSION_DURATION) * 100))
  );

  const phaseFormattedTime = formatPitchTime(phaseRemaining);

  return {
    // Current phase readout (PITCH countdown 08:00->00:00, then Q&A countdown 02:00->00:00, then 00:00)
    secondsRemaining: phaseRemaining,
    formattedTime: phaseFormattedTime,
    phaseFormattedTime,
    phaseRemaining,
    phaseDuration,

    // Overall 10-minute session data
    sessionRemaining,
    sessionFormattedTime: formatPitchTime(sessionRemaining),
    totalDuration: TOTAL_SESSION_DURATION,

    // Phase identification
    judgingPhase,
    isPitch: judgingPhase === "pitch",
    isQa: judgingPhase === "qa",
    isTimeEnded: judgingPhase === "time_ended",

    // State flags
    isRunning: options?.isSubmitted ? false : timerState.isRunning,
    isComplete: sessionRemaining === 0,
    isTimeUp: sessionRemaining === 0,
    isWarning: timerAlertLevel === "warning",
    isCritical: timerAlertLevel === "critical",
    timerPhase: timerAlertLevel,

    // Progress
    progressPercent: phaseProgressPercent,
    sessionProgressPercent,

    // Cinematic transition
    showQaTransition,
    dismissQaTransition,

    // Control actions
    start,
    stop,
    reset,
    skipToQa,
    backToPitch,
  };
}
