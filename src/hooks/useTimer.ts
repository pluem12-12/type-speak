"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTypingStore } from "@/store/useTypingStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { calculateWpm } from "@/lib/stats";

export function useTimer() {
  const status = useTypingStore((s) => s.status);
  const startTime = useTypingStore((s) => s.startTime);
  const restartVersion = useTypingStore((s) => s.restartVersion);
  const tickTimer = useTypingStore((s) => s.tickTimer);
  const finishTest = useTypingStore((s) => s.finishTest);

  const mode = useSettingsStore((s) => s.mode);
  const timeOpt = useSettingsStore((s) => s.timeOpt);
  const lang = useSettingsStore((s) => s.lang);
  const wordOpt = useSettingsStore((s) => s.wordOpt);

  // Single ref holding timer interval handle to guarantee no timer leak
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSampleSecondRef = useRef<number>(0);

  const clearExistingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Always clear timer on mode/language/option/restart changes
  useEffect(() => {
    clearExistingTimer();
    lastSampleSecondRef.current = 0;
  }, [lang, mode, timeOpt, wordOpt, restartVersion, clearExistingTimer]);

  useEffect(() => {
    clearExistingTimer();

    if (status !== "running" || startTime === null) {
      lastSampleSecondRef.current = 0;
      return;
    }

    timerRef.current = setInterval(() => {
      const state = useTypingStore.getState();
      if (state.status !== "running" || state.startTime === null) {
        clearExistingTimer();
        return;
      }

      const now = Date.now();
      const elapsedMs = Math.max(0, now - state.startTime);
      const currentSecond = Math.floor(elapsedMs / 1000);

      let sampleWpm: number | undefined = undefined;
      if (currentSecond > lastSampleSecondRef.current) {
        lastSampleSecondRef.current = currentSecond;
        sampleWpm = calculateWpm(state.correctChars, elapsedMs);
      }

      if (mode === "time") {
        const limitMs = timeOpt * 1000;
        if (elapsedMs >= limitMs) {
          tickTimer(limitMs, sampleWpm);
          finishTest(limitMs);
          clearExistingTimer();
          return;
        }
      }

      tickTimer(elapsedMs, sampleWpm);
    }, 100);

    return () => {
      clearExistingTimer();
    };
  }, [status, startTime, mode, timeOpt, tickTimer, finishTest, clearExistingTimer]);

  return { clearExistingTimer };
}

