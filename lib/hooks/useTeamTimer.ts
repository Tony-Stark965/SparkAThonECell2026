"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface StoredTimerState {
  remaining: number; // seconds
  isRunning: boolean;
  lastStartedAt: number | null; // timestamp ms
  duration: number; // default 600 (10 min)
}

const DEFAULT_DURATION = 600; // 10 minutes

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

  const stateRef = useRef(timerState);
  stateRef.current = timerState;

  // Calculate current effective seconds remaining
  const calculateEffectiveRemaining = useCallback((state: StoredTimerState): number => {
    if (!state.isRunning || !state.lastStartedAt) {
      return state.remaining;
    }
    const elapsed = Math.floor((Date.now() - state.lastStartedAt) / 1000);
    return Math.max(0, state.remaining - elapsed);
  }, []);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    calculateEffectiveRemaining(timerState)
  );

  // Sync with storage on mount and when external events fire
  useEffect(() => {
    const syncState = () => {
      const stored = readStoredState(teamId);
      setTimerState(stored);
      setSecondsRemaining(calculateEffectiveRemaining(stored));
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ teamId: string; state: StoredTimerState }>;
      if (customEvent.detail?.teamId === teamId) {
        setTimerState(customEvent.detail.state);
        setSecondsRemaining(calculateEffectiveRemaining(customEvent.detail.state));
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
  }, [teamId, calculateEffectiveRemaining]);

  // Main countdown tick interval
  useEffect(() => {
    if (!timerState.isRunning || !timerState.lastStartedAt) {
      setSecondsRemaining(timerState.remaining);
      return;
    }

    const interval = setInterval(() => {
      const currentRemaining = calculateEffectiveRemaining(timerState);
      setSecondsRemaining(currentRemaining);

      if (currentRemaining <= 0) {
        const finalState: StoredTimerState = {
          ...timerState,
          remaining: 0,
          isRunning: false,
          lastStartedAt: null,
        };
        setTimerState(finalState);
        writeStoredState(teamId, finalState);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [timerState, calculateEffectiveRemaining, teamId]);

  // Actions: Start, Stop, Reset
  const start = useCallback(() => {
    const current = stateRef.current;
    let baseRemaining = current.remaining;

    // If already at 0, reset to 10 min first
    if (baseRemaining <= 0) {
      baseRemaining = DEFAULT_DURATION;
    }

    const nextState: StoredTimerState = {
      remaining: baseRemaining,
      isRunning: true,
      lastStartedAt: Date.now(),
      duration: current.duration || DEFAULT_DURATION,
    };

    setTimerState(nextState);
    setSecondsRemaining(baseRemaining);
    writeStoredState(teamId, nextState);

    if (options?.onStart) {
      options.onStart();
    }
  }, [teamId, options]);

  const stop = useCallback(() => {
    const current = stateRef.current;
    if (!current.isRunning) return;

    const remainingNow = calculateEffectiveRemaining(current);
    const nextState: StoredTimerState = {
      remaining: remainingNow,
      isRunning: false,
      lastStartedAt: null,
      duration: current.duration || DEFAULT_DURATION,
    };

    setTimerState(nextState);
    setSecondsRemaining(remainingNow);
    writeStoredState(teamId, nextState);

    if (options?.onStop) {
      options.onStop();
    }
  }, [teamId, calculateEffectiveRemaining, options]);

  const reset = useCallback(
    (newDuration: number = DEFAULT_DURATION) => {
      const nextState: StoredTimerState = {
        remaining: newDuration,
        isRunning: false,
        lastStartedAt: null,
        duration: newDuration,
      };

      setTimerState(nextState);
      setSecondsRemaining(newDuration);
      writeStoredState(teamId, nextState);

      if (options?.onReset) {
        options.onReset();
      }
    },
    [teamId, options]
  );

  return {
    secondsRemaining,
    formattedTime: formatPitchTime(secondsRemaining),
    isRunning: timerState.isRunning,
    isComplete: secondsRemaining === 0,
    isWarning: secondsRemaining <= 120 && secondsRemaining > 0,
    start,
    stop,
    reset,
  };
}
