"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface StoredTimerState {
  remaining: number; // seconds
  isRunning: boolean;
  lastStartedAt: number | null; // timestamp ms
  duration: number; // default 600 (10 min)
}

export type TimerPhase = "normal" | "warning" | "critical" | "time_up";

export const DEFAULT_DURATION = 600; // 10 minutes

export function formatPitchTime(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
          remaining: parsed.remaining,
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

  // Compute live seconds remaining
  const secondsRemaining = calculateEffectiveRemaining(timerState, currentTimeMs);

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
    if (!timerState.isRunning || !timerState.lastStartedAt) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTimeMs(now);

      const effective = calculateEffectiveRemaining(timerState, now);
      if (effective <= 0) {
        const finalState: StoredTimerState = {
          ...timerState,
          remaining: 0,
          isRunning: false,
          lastStartedAt: null,
        };
        setTimerState(finalState);
        writeStoredState(teamId, finalState);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerState, calculateEffectiveRemaining, teamId]);

  // Action: START
  const start = useCallback(() => {
    const current = stateRef.current;
    let baseRemaining = current.remaining;

    // If already at 0, reset to 10 min first
    if (baseRemaining <= 0) {
      baseRemaining = DEFAULT_DURATION;
    }

    const now = Date.now();
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
  }, [teamId, options]);

  // Action: STOP
  const stop = useCallback(() => {
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

  // Action: RESET
  const reset = useCallback(
    (newDuration: number = DEFAULT_DURATION) => {
      const now = Date.now();
      const nextState: StoredTimerState = {
        remaining: newDuration,
        isRunning: false,
        lastStartedAt: null,
        duration: newDuration,
      };

      setTimerState(nextState);
      setCurrentTimeMs(now);
      writeStoredState(teamId, nextState);

      if (options?.onReset) {
        options.onReset();
      }
    },
    [teamId, options]
  );

  // Compute timer phases based on official specifications:
  // 10:00 -> 03:01 = normal
  // 03:00 -> 01:01 = warning
  // 01:00 -> 00:01 = critical
  // 00:00 = time_up
  let timerPhase: TimerPhase = "normal";
  if (secondsRemaining <= 0) {
    timerPhase = "time_up";
  } else if (secondsRemaining <= 60) {
    timerPhase = "critical";
  } else if (secondsRemaining <= 180) {
    timerPhase = "warning";
  } else {
    timerPhase = "normal";
  }

  // Progress percentage (0% to 100% of duration elapsed)
  const totalDuration = timerState.duration || DEFAULT_DURATION;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalDuration - secondsRemaining) / totalDuration) * 100))
  );

  return {
    secondsRemaining,
    formattedTime: formatPitchTime(secondsRemaining),
    isRunning: timerState.isRunning,
    isComplete: secondsRemaining === 0,
    isWarning: timerPhase === "warning",
    isCritical: timerPhase === "critical",
    isTimeUp: timerPhase === "time_up",
    timerPhase,
    progressPercent,
    start,
    stop,
    reset,
  };
}
