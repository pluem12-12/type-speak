"use client";

import React from "react";
import {
  RotateCcw,
  Trophy,
  Zap,
  Target,
  Activity,
  Volume2,
  CheckCircle2,
  Flame,
  Crown,
} from "lucide-react";
import { useTypingStore } from "@/store/useTypingStore";
import { useSettingsStore, getScoreKey } from "@/store/useSettingsStore";
import {
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
} from "@/lib/stats";

interface ResultsProps {
  onRestart: () => void;
  onReplay: () => void;
  supported: boolean;
}

function getStudentRank(wpm: number, accuracy: number): {
  title: string;
  subtitle: string;
} {
  if (accuracy < 60) {
    return {
      title: "นักสำรวจแป้นพิมพ์ (Explorer)",
      subtitle: "ลองเน้นความแม่นยำขึ้นอีกนิด แล้วความเร็วจะตามมาเอง!",
    };
  }
  if (wpm >= 80) {
    return {
      title: "ปรมาจารย์ความไวแสง (Grandmaster)",
      subtitle: "สุดยอดมาก! พิมพ์เร็วและแม่นยำระดับท็อปของโรงเรียน",
    };
  }
  if (wpm >= 60) {
    return {
      title: "โปรคีย์บอร์ดสายฟ้า (Keyboard Pro)",
      subtitle: "คล่องแคล่วมาก! ทั้งทักษะการฟังและการพิมพ์ยอดเยี่ยม",
    };
  }
  if (wpm >= 40) {
    return {
      title: "นักพิมพ์ติดสปีด (Speed Sprinter)",
      subtitle: "ความเร็วกำลังดีเลย ฝึกต่ออีกนิดทะลุ 60 WPM แน่นอน!",
    };
  }
  if (wpm >= 25) {
    return {
      title: "ดาวรุ่งพุ่งแรง (Rising Star)",
      subtitle: "จับจังหวะการพิมพ์และฟังเสียงได้ดีขึ้นเรื่อยๆ แล้ว!",
    };
  }
  return {
    title: "มือใหม่ไฟแรง (Rookie Typer)",
    subtitle: "เริ่มต้นได้ดีมาก! ฝึกฟังและพิมพ์ทุกวันเก่งขึ้นแน่นอน",
  };
}

export function Results({ onRestart, onReplay, supported }: ResultsProps) {
  const {
    correctChars,
    incorrectChars,
    extraChars,
    missedChars,
    totalTyped,
    maxStreak,
    elapsedMs,
    wpmSamples,
    currentSentenceText,
  } = useTypingStore();

  const { lang, mode, timeOpt, wordOpt, sentenceLength, bestScores } =
    useSettingsStore();

  const wpm = calculateWpm(correctChars, elapsedMs);
  const rawWpm = calculateRawWpm(totalTyped, elapsedMs);
  const accuracy = calculateAccuracy(correctChars, incorrectChars, extraChars);
  const consistency = calculateConsistency(wpmSamples);

  const scoreKey = getScoreKey(lang, mode, timeOpt, wordOpt, sentenceLength);
  const bestScore = bestScores[scoreKey];
  const rank = getStudentRank(wpm, accuracy);

  const sentenceLengthLabel =
    sentenceLength === "short"
      ? "ความยาวสั้น"
      : sentenceLength === "medium"
      ? "ความยาวปานกลาง"
      : sentenceLength === "long"
      ? "ความยาวยาว"
      : "ประโยคกำหนดเอง";

  const modeLabel =
    mode === "time"
      ? `โหมดเวลา ${timeOpt} วินาที`
      : mode === "words"
      ? `โหมดจำนวนคำ ${wordOpt} คำ`
      : `โหมดฝึกประโยค (${sentenceLengthLabel})`;

  // TODO: เพิ่มกราฟแสดงความก้าวหน้าตามเวลา (recharts)
  return (
    <div className="panel-glow flex flex-col gap-6 rounded-2xl border-2 border-mt-accent/30 bg-mt-panel p-6 sm:p-8">
      {/* Header & Student Rank Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-mt-muted/20 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mt-accent to-mt-accent2 text-mt-bg shadow-md">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-mt-accent">
              สรุปผลการฝึกพิมพ์ • {lang === "th-TH" ? "ภาษาไทย" : "English"} •{" "}
              {modeLabel}
            </span>
            <h2 className="mt-0.5 text-xl font-extrabold text-mt-text sm:text-2xl">
              {rank.title}
            </h2>
            <p className="text-xs text-mt-muted">{rank.subtitle}</p>
          </div>
        </div>

        {bestScore && (
          <div className="flex items-center gap-3 rounded-xl border border-mt-accent2/40 bg-mt-bg px-4 py-2.5 shadow-sm">
            <Trophy className="h-6 w-6 text-mt-accent2" />
            <div>
              <div className="text-[11px] font-medium text-mt-muted">
                สถิติสูงสุดในโหมดนี้
              </div>
              <div className="font-mono text-base font-extrabold text-mt-accent2">
                {bestScore.wpm} WPM ({bestScore.acc}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {/* Primary WPM */}
        <div className="flex flex-col justify-between rounded-xl border border-mt-accent/30 bg-mt-bg p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-mt-muted">
            <Zap className="h-4 w-4 text-mt-accent" />
            <span>ความเร็วสุทธิ (WPM)</span>
          </div>
          <div className="mt-2 font-mono text-4xl font-extrabold text-mt-accent sm:text-5xl">
            {wpm}
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col justify-between rounded-xl border border-mt-accent2/30 bg-mt-bg p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-mt-muted">
            <Target className="h-4 w-4 text-mt-accent2" />
            <span>ความแม่นยำ</span>
          </div>
          <div className="mt-2 font-mono text-4xl font-extrabold text-mt-accent2 sm:text-5xl">
            {accuracy}%
          </div>
        </div>

        {/* Max Combo Streak */}
        <div className="flex flex-col justify-between rounded-xl border border-mt-muted/20 bg-mt-bg p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-mt-muted">
            <Flame className="h-4 w-4 text-mt-accent2" />
            <span>คอมโบสูงสุด</span>
          </div>
          <div className="mt-2 font-mono text-3xl font-extrabold text-mt-text sm:text-4xl">
            {maxStreak}x
          </div>
        </div>

        {/* Raw WPM */}
        <div className="flex flex-col justify-between rounded-xl border border-mt-muted/20 bg-mt-bg p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-mt-muted">
            <Activity className="h-4 w-4 text-mt-muted" />
            <span>ความเร็วดิบ (Raw)</span>
          </div>
          <div className="mt-2 font-mono text-3xl font-extrabold text-mt-text sm:text-4xl">
            {rawWpm}
          </div>
        </div>

        {/* Consistency */}
        <div className="col-span-2 flex flex-col justify-between rounded-xl border border-mt-muted/20 bg-mt-bg p-4 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-mt-muted">
            <CheckCircle2 className="h-4 w-4 text-mt-muted" />
            <span>ความสม่ำเสมอ</span>
          </div>
          <div className="mt-2 font-mono text-3xl font-extrabold text-mt-text sm:text-4xl">
            {consistency}%
          </div>
        </div>
      </div>

      {/* Character Breakdown Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-mt-muted/20 bg-mt-bg p-4">
        <div className="text-sm font-medium text-mt-muted">
          รายละเอียดตัวอักษร (พิมพ์ถูก / พิมพ์ผิด / ตกหล่น / พิมพ์เกิน)
        </div>
        <div className="flex items-center gap-3 font-mono text-lg font-bold">
          <span className="text-mt-accent" title="พิมพ์ถูก (Correct)">
            {correctChars} ถูก
          </span>
          <span className="text-mt-muted">/</span>
          <span className="text-mt-error" title="พิมพ์ผิด (Incorrect)">
            {incorrectChars} ผิด
          </span>
          <span className="text-mt-muted">/</span>
          <span className="text-mt-muted" title="ตกหล่น (Missed)">
            {missedChars} ตกหล่น
          </span>
          <span className="text-mt-muted">/</span>
          <span className="text-mt-errorExtra" title="พิมพ์เกิน (Extra)">
            {extraChars} เกิน
          </span>
        </div>
      </div>

      {/* Sentence Replay Box if in sentence mode */}
      {mode === "sentence" && currentSentenceText && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mt-accent/30 bg-mt-bg/80 px-4 py-3">
          <div className="text-sm text-mt-text">
            <span className="mr-2 text-xs text-mt-muted">ประโยคที่ฝึก:</span>
            <span className="font-mono font-semibold">{currentSentenceText}</span>
          </div>
          <button
            type="button"
            disabled={!supported}
            onClick={onReplay}
            className="flex items-center gap-1.5 rounded-lg bg-mt-accent px-3.5 py-1.5 text-xs font-bold text-mt-bg transition-transform hover:scale-105 disabled:opacity-40"
          >
            <Volume2 className="h-4 w-4" />
            <span>ฟังประโยคนี้ซ้ำ</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-mt-accent to-mt-accent2 px-7 py-3.5 font-bold text-mt-bg shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.99]"
        >
          <RotateCcw className="h-5 w-5" />
          <span>ลุยรอบต่อไป!</span>
          <kbd className="ml-1 rounded bg-mt-bg/25 px-2 py-0.5 font-mono text-xs text-mt-bg">
            Tab + Enter
          </kbd>
        </button>
      </div>
    </div>
  );
}
