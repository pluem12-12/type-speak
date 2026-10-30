"use client";

import React from "react";
import { Flame, Volume2, Zap, Target, Timer } from "lucide-react";
import { useTypingStore } from "@/store/useTypingStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { calculateWpm, calculateAccuracy } from "@/lib/stats";

interface LiveStatsProps {
  onSpeakWord: (word: string) => void;
}

export function LiveStats({ onSpeakWord }: LiveStatsProps) {
  const {
    status,
    wi,
    words,
    currentSentenceText,
    correctChars,
    incorrectChars,
    extraChars,
    streak,
    elapsedMs,
  } = useTypingStore();
  const { mode, timeOpt } = useSettingsStore();

  const wpm = status === "idle" ? 0 : calculateWpm(correctChars, elapsedMs);
  const acc =
    status === "idle"
      ? 100
      : calculateAccuracy(correctChars, incorrectChars, extraChars);

  let primaryCounter = "";
  let progressPercent = 0;

  if (mode === "time") {
    const totalMs = timeOpt * 1000;
    const remainingSec = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
    primaryCounter = `${remainingSec}s`;
    progressPercent =
      status === "idle"
        ? 0
        : Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  } else {
    primaryCounter = `${wi}/${words.length}`;
    progressPercent =
      words.length > 0
        ? Math.min(100, Math.round((wi / words.length) * 100))
        : 0;
  }

  const spotlightText =
    mode === "sentence"
      ? currentSentenceText
      : words[wi]?.target ?? "";

  return (
    <div className="flex flex-col gap-3">
      {/* Top Row: Stat Cards + Current Word/Sentence Spotlight + Combo Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Colorful Stat Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Timer / Word Counter Pill */}
          <div className="flex items-center gap-2.5 rounded-xl border border-mt-accent/30 bg-mt-panel px-3.5 py-2 shadow-sm">
            <Timer className="h-5 w-5 text-mt-accent" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-mt-muted">
                {mode === "time"
                  ? "เวลาที่เหลือ"
                  : mode === "sentence"
                  ? "วรรคที่พิมพ์"
                  : "คำที่พิมพ์"}
              </div>
              <div className="font-mono text-xl font-extrabold leading-tight text-mt-accent sm:text-2xl">
                {primaryCounter}
              </div>
            </div>
          </div>

          {/* WPM Pill */}
          <div className="flex items-center gap-2.5 rounded-xl border border-mt-muted/20 bg-mt-panel px-3.5 py-2 shadow-sm">
            <Zap className="h-5 w-5 text-mt-accent2" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-mt-muted">
                ความเร็ว (WPM)
              </div>
              <div className="font-mono text-xl font-extrabold leading-tight text-mt-text sm:text-2xl">
                {wpm}
              </div>
            </div>
          </div>

          {/* Accuracy Pill */}
          <div className="flex items-center gap-2.5 rounded-xl border border-mt-muted/20 bg-mt-panel px-3.5 py-2 shadow-sm">
            <Target className="h-5 w-5 text-mt-accent" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-mt-muted">
                ความแม่นยำ
              </div>
              <div className="font-mono text-xl font-extrabold leading-tight text-mt-text sm:text-2xl">
                {acc}%
              </div>
            </div>
          </div>

          {/* Live Combo Streak Badge (Visual focal point for students) */}
          <div
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all duration-200 ${
              streak >= 15
                ? "scale-105 border border-mt-accent2 bg-gradient-to-r from-mt-accent2/25 to-mt-accent/25 shadow-md"
                : streak >= 5
                ? "border border-mt-accent2/50 bg-mt-panel"
                : "border border-mt-muted/20 bg-mt-panel opacity-75"
            }`}
          >
            <Flame
              className={`h-5 w-5 ${
                streak >= 5
                  ? "animate-pulse text-mt-accent2"
                  : "text-mt-muted"
              }`}
            />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-mt-muted">
                คอมโบต่อเนื่อง
              </div>
              <div className="font-mono text-lg font-extrabold leading-tight text-mt-accent2 sm:text-xl">
                {streak}x {streak >= 20 ? "ไฟลุก!" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Current Word / Sentence Audio Spotlight */}
        {spotlightText && (
          <button
            type="button"
            onClick={() => onSpeakWord(spotlightText)}
            title="คลิกเพื่อฟังเสียงอ่านซ้ำ"
            className="group flex max-w-full items-center gap-3 rounded-xl border border-mt-accent/40 bg-gradient-to-r from-mt-panel to-mt-accent/10 px-4 py-2 text-left shadow-sm transition-all hover:border-mt-accent hover:shadow-md sm:max-w-md"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mt-accent/20 text-mt-accent transition-transform group-hover:scale-110">
              <Volume2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium text-mt-muted">
                {mode === "sentence"
                  ? "ประโยคปัจจุบัน (คลิกฟังทั้งประโยค)"
                  : "คำเป้าหมายปัจจุบัน (คลิกฟังเสียง)"}
              </div>
              <div className="truncate font-mono text-base font-bold tracking-wide text-mt-accent sm:text-lg">
                {spotlightText}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Animated Colorful Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-mt-panel p-0.5 ring-1 ring-mt-muted/20">
        <div
          style={{ width: `${progressPercent}%` }}
          className="h-full rounded-full bg-gradient-to-r from-mt-accent via-mt-accent2 to-mt-accent transition-all duration-150 ease-out"
        />
      </div>
    </div>
  );
}
