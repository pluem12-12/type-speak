"use client";

import React, { useState } from "react";
import {
  Clock,
  Type,
  MessageSquareQuote,
  Volume2,
  VolumeX,
  SkipForward,
  Gauge,
  SlidersHorizontal,
  Minus,
  Plus,
  Sparkles,
  Check,
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  TIME_OPTS,
  WORD_OPTS,
  TIME_LIMITS,
  WORD_LIMITS,
  SENTENCE_COUNT_LIMITS,
  RATE_PRESETS,
  SENTENCE_LENGTH_OPTS,
  PracticeMode,
  SentenceLength,
} from "@/lib/constants";
import { VoiceModelOption } from "@/hooks/useTts";
import { ReplayButton } from "./ReplayButton";

interface SettingsPanelProps {
  supported: boolean;
  voiceModels: VoiceModelOption[];
  missingThaiVoice: boolean;
  onReplay: (overrideVoiceId?: string) => void;
  onNextSentence: () => void;
}

export function SettingsPanel({
  supported,
  voiceModels,
  missingThaiVoice,
  onReplay,
  onNextSentence,
}: SettingsPanelProps) {
  const {
    lang,
    mode,
    timeOpt,
    wordOpt,
    sentenceLength,
    sentenceCount,
    ttsOn,
    voiceMap,
    rate,
    pitch,
    volume,
    setMode,
    setTimeOpt,
    setWordOpt,
    setSentenceLength,
    setSentenceCount,
    setTtsOn,
    setVoiceForLang,
    setRate,
    setPitch,
    setVolume,
  } = useSettingsStore();

  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState(String(timeOpt));

  const [showCustomWords, setShowCustomWords] = useState(false);
  const [customWordsInput, setCustomWordsInput] = useState(String(wordOpt));

  const [showCustomSentences, setShowCustomSentences] = useState(false);
  const [customSentenceCountInput, setCustomSentenceCountInput] = useState(
    String(sentenceCount)
  );

  const [showAdvancedTts, setShowAdvancedTts] = useState(false);

  const modes: { id: PracticeMode; label: string; icon: React.ReactNode }[] = [
    { id: "time", label: "เวลา (Time)", icon: <Clock className="h-3.5 w-3.5" /> },
    { id: "words", label: "จำนวนคำ (Words)", icon: <Type className="h-3.5 w-3.5" /> },
    {
      id: "sentence",
      label: "ประโยค (Sentence)",
      icon: <MessageSquareQuote className="h-3.5 w-3.5" />,
    },
  ];

  const selectedVoiceId = voiceMap[lang] || "";
  const isCustomTimeActive = !(TIME_OPTS as readonly number[]).includes(timeOpt);
  const isCustomWordActive = !(WORD_OPTS as readonly number[]).includes(wordOpt);

  const applyCustomTime = () => {
    const parsed = parseInt(customTimeInput, 10);
    if (!isNaN(parsed)) {
      setTimeOpt(parsed);
    }
    setShowCustomTime(false);
  };

  const applyCustomWords = () => {
    const parsed = parseInt(customWordsInput, 10);
    if (!isNaN(parsed)) {
      setWordOpt(parsed);
    }
    setShowCustomWords(false);
  };

  const applyCustomSentenceCount = () => {
    const parsed = parseInt(customSentenceCountInput, 10);
    if (!isNaN(parsed)) {
      setSentenceCount(parsed);
    }
    setShowCustomSentences(false);
  };

  const handleVoiceModelChange = (nextVoiceId: string) => {
    setVoiceForLang(lang, nextVoiceId);
    onReplay(nextVoiceId);
  };

  const cloudModels = voiceModels.filter((m) => m.isCloudModel);
  const systemModels = voiceModels.filter((m) => !m.isSyntheticPreset);
  const tonePresetModels = voiceModels.filter(
    (m) => m.isSyntheticPreset && !m.isCloudModel
  );

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-3 rounded-xl bg-mt-panel px-4 py-3 text-xs sm:text-sm">
        {/* Row 1: Mode, Time/Word/Sentence Length & Count Options, and Main TTS Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Practice Modes & Mode Options */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                    mode === m.id
                      ? "bg-mt-bg/60 text-mt-accent"
                      : "text-mt-muted hover:text-mt-text"
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-mt-muted/30" />

            {/* Time Mode Options + Custom Input */}
            {mode === "time" && (
              <div className="flex flex-wrap items-center gap-1">
                {TIME_OPTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTimeOpt(t);
                      setShowCustomTime(false);
                    }}
                    className={`rounded-md px-2 py-1 font-mono transition-colors ${
                      timeOpt === t && !showCustomTime
                        ? "bg-mt-bg/50 font-bold text-mt-accent"
                        : "text-mt-muted hover:text-mt-text"
                    }`}
                  >
                    {t}s
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCustomTimeInput(String(timeOpt));
                    setShowCustomTime(!showCustomTime);
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono transition-colors ${
                    isCustomTimeActive || showCustomTime
                      ? "bg-mt-bg/60 font-bold text-mt-accent ring-1 ring-mt-accent/40"
                      : "text-mt-muted hover:text-mt-text"
                  }`}
                  title="กำหนดเวลาเอง (5 - 600 วินาที)"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>
                    {isCustomTimeActive ? `${timeOpt}s (กำหนดเอง)` : "กำหนดเอง"}
                  </span>
                </button>

                {showCustomTime && (
                  <div className="ml-1 flex items-center gap-1.5 rounded-lg bg-mt-bg px-2 py-1 ring-1 ring-mt-accent/50">
                    <input
                      type="number"
                      min={TIME_LIMITS.MIN}
                      max={TIME_LIMITS.MAX}
                      value={customTimeInput}
                      onChange={(e) => setCustomTimeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyCustomTime();
                      }}
                      className="w-16 rounded bg-mt-panel px-2 py-0.5 font-mono text-xs text-mt-text outline-none focus:ring-1 focus:ring-mt-accent"
                      placeholder="วินาที"
                    />
                    <span className="text-[11px] text-mt-muted">วินาที</span>
                    <button
                      type="button"
                      onClick={applyCustomTime}
                      className="flex items-center gap-1 rounded bg-mt-accent px-2 py-0.5 text-xs font-semibold text-mt-bg hover:opacity-90"
                    >
                      <Check className="h-3 w-3" />
                      <span>ตกลง</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Words Mode Options + Custom Input */}
            {mode === "words" && (
              <div className="flex flex-wrap items-center gap-1">
                {WORD_OPTS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setWordOpt(w);
                      setShowCustomWords(false);
                    }}
                    className={`rounded-md px-2 py-1 font-mono transition-colors ${
                      wordOpt === w && !showCustomWords
                        ? "bg-mt-bg/50 font-bold text-mt-accent"
                        : "text-mt-muted hover:text-mt-text"
                    }`}
                  >
                    {w}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCustomWordsInput(String(wordOpt));
                    setShowCustomWords(!showCustomWords);
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono transition-colors ${
                    isCustomWordActive || showCustomWords
                      ? "bg-mt-bg/60 font-bold text-mt-accent ring-1 ring-mt-accent/40"
                      : "text-mt-muted hover:text-mt-text"
                  }`}
                  title="กำหนดจำนวนคำเอง (1 - 500 คำ)"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>
                    {isCustomWordActive ? `${wordOpt} คำ (กำหนดเอง)` : "กำหนดเอง"}
                  </span>
                </button>

                {showCustomWords && (
                  <div className="ml-1 flex items-center gap-1.5 rounded-lg bg-mt-bg px-2 py-1 ring-1 ring-mt-accent/50">
                    <input
                      type="number"
                      min={WORD_LIMITS.MIN}
                      max={WORD_LIMITS.MAX}
                      value={customWordsInput}
                      onChange={(e) => setCustomWordsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyCustomWords();
                      }}
                      className="w-16 rounded bg-mt-panel px-2 py-0.5 font-mono text-xs text-mt-text outline-none focus:ring-1 focus:ring-mt-accent"
                      placeholder="จำนวนคำ"
                    />
                    <span className="text-[11px] text-mt-muted">คำ</span>
                    <button
                      type="button"
                      onClick={applyCustomWords}
                      className="flex items-center gap-1 rounded bg-mt-accent px-2 py-0.5 text-xs font-semibold text-mt-bg hover:opacity-90"
                    >
                      <Check className="h-3 w-3" />
                      <span>ตกลง</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sentence Mode Options: Short / Medium / Long + Custom Sentence Count (Number Input) */}
            {mode === "sentence" && (
              <div className="flex flex-wrap items-center gap-1">
                {SENTENCE_LENGTH_OPTS.map(
                  (opt: { id: SentenceLength; label: string; desc: string }) => {
                    const isActive = sentenceLength === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSentenceLength(opt.id)}
                        title={opt.desc}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-mt-bg/60 font-bold text-mt-accent"
                            : "text-mt-muted hover:text-mt-text"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  }
                )}

                {/* Custom Number of Sentences Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCustomSentenceCountInput(String(sentenceCount));
                    setShowCustomSentences(!showCustomSentences);
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                    sentenceCount > 1 || showCustomSentences
                      ? "bg-mt-bg/60 font-bold text-mt-accent ring-1 ring-mt-accent/40"
                      : "text-mt-muted hover:text-mt-text"
                  }`}
                  title="กำหนดจำนวนประโยคที่ต้องการพิมพ์ (1 - 50 ประโยค)"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>
                    ปรับแต่งเอง ({sentenceCount} ประโยค)
                  </span>
                </button>

                {showCustomSentences && (
                  <div className="ml-1 flex items-center gap-1.5 rounded-lg bg-mt-bg px-2 py-1 ring-1 ring-mt-accent/50">
                    <input
                      type="number"
                      min={SENTENCE_COUNT_LIMITS.MIN}
                      max={SENTENCE_COUNT_LIMITS.MAX}
                      value={customSentenceCountInput}
                      onChange={(e) =>
                        setCustomSentenceCountInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyCustomSentenceCount();
                      }}
                      className="w-16 rounded bg-mt-panel px-2 py-0.5 font-mono text-xs text-mt-text outline-none focus:ring-1 focus:ring-mt-accent"
                      placeholder="จำนวน"
                    />
                    <span className="text-[11px] text-mt-muted">ประโยค</span>
                    <button
                      type="button"
                      onClick={applyCustomSentenceCount}
                      className="flex items-center gap-1 rounded bg-mt-accent px-2 py-0.5 text-xs font-semibold text-mt-bg hover:opacity-90"
                    >
                      <Check className="h-3 w-3" />
                      <span>ตกลง</span>
                    </button>
                  </div>
                )}

                <div className="mx-1 h-4 w-[1px] bg-mt-muted/30" />

                <button
                  type="button"
                  onClick={onNextSentence}
                  className="flex items-center gap-1 rounded-md bg-mt-bg/60 px-2.5 py-1 text-xs font-medium text-mt-text transition-colors hover:text-mt-accent"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  <span>สุ่มประโยคถัดไป</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Quick TTS Toggle & Replay */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!supported}
              onClick={() => setTtsOn(!ttsOn)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                ttsOn && supported
                  ? "bg-mt-bg/60 text-mt-accent"
                  : "text-mt-muted hover:text-mt-text"
              }`}
            >
              {ttsOn && supported ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span>{ttsOn ? "เสียงอ่าน: เปิด" : "เสียงอ่าน: ปิด"}</span>
            </button>

            <ReplayButton
              onClick={() => onReplay()}
              disabled={!supported}
              label="ทดสอบ / ฟังซ้ำ"
            />

            <button
              type="button"
              disabled={!supported}
              onClick={() => setShowAdvancedTts(!showAdvancedTts)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                showAdvancedTts
                  ? "bg-mt-accent font-semibold text-mt-bg"
                  : "bg-mt-bg/60 text-mt-text hover:text-mt-accent"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>ตั้งค่าเสียงเพิ่มเติม</span>
            </button>
          </div>
        </div>

        {/* Row 2: Language Voice Model Selector & Speed Controls (Always visible for easy access) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mt-bg/70 pt-2.5">
          {/* Voice / Language Model Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-mt-muted">
              <Sparkles className="h-3.5 w-3.5 text-mt-accent" />
              <span>โมเดลเสียงภาษา ({lang === "th-TH" ? "TH" : "EN"}):</span>
            </span>
            <select
              aria-label="เลือกโมเดลเสียงอ่าน"
              disabled={!supported || !ttsOn}
              value={selectedVoiceId}
              onChange={(e) => handleVoiceModelChange(e.target.value)}
              className="max-w-[280px] truncate rounded-md bg-mt-bg px-2.5 py-1 text-xs text-mt-text outline-none ring-1 ring-mt-muted/30 focus:ring-mt-accent disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-[350px]"
            >
              <optgroup label="โมเดลเสียง Cloud AI (ใช้ได้ทุกเบราว์เซอร์ - แนะนำ)">
                {cloudModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
              {systemModels.length > 0 && (
                <optgroup label="โมเดลเสียงในเครื่อง (System Voices)">
                  {systemModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="โมเดลโทนเสียงปรับแต่ง (Voice Presets)">
                {tonePresetModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Speech Rate Controls: Fine buttons + Slider + Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-mt-muted">
              <Gauge className="h-3.5 w-3.5 text-mt-accent" />
              <span>ความเร็วอ่าน:</span>
            </span>

            {/* Minus button */}
            <button
              type="button"
              disabled={!supported || !ttsOn || rate <= 0.25}
              onClick={() => setRate(rate - 0.05)}
              title="ลดความเร็วลง 0.05x"
              className="rounded bg-mt-bg p-1 text-mt-muted hover:text-mt-text disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>

            {/* Continuous slider */}
            <input
              type="range"
              aria-label="ความเร็วเสียงอ่าน"
              min={0.25}
              max={2.0}
              step={0.05}
              disabled={!supported || !ttsOn}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="h-1.5 w-24 cursor-pointer accent-mt-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-28"
            />

            {/* Plus button */}
            <button
              type="button"
              disabled={!supported || !ttsOn || rate >= 2.0}
              onClick={() => setRate(rate + 0.05)}
              title="เพิ่มความเร็วขึ้น 0.05x"
              className="rounded bg-mt-bg p-1 text-mt-muted hover:text-mt-text disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>

            <span className="w-11 text-center font-mono text-xs font-bold text-mt-accent">
              {rate.toFixed(2)}x
            </span>

            {/* Quick Speed Preset Pills */}
            <div className="hidden items-center gap-1 lg:flex">
              {RATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={!supported || !ttsOn}
                  onClick={() => setRate(p.value)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                    Math.abs(rate - p.value) < 0.01
                      ? "bg-mt-accent font-bold text-mt-bg"
                      : "bg-mt-bg/60 text-mt-muted hover:text-mt-text"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3 (Collapsible): Advanced Voice Pitch, Volume & Mobile Speed Presets */}
        {showAdvancedTts && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-mt-bg/60 px-3.5 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-mt-muted">ความเร็วสำเร็จรูป:</span>
              {RATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={!supported || !ttsOn}
                  onClick={() => setRate(p.value)}
                  className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                    Math.abs(rate - p.value) < 0.01
                      ? "bg-mt-accent font-bold text-mt-bg"
                      : "bg-mt-panel text-mt-muted hover:text-mt-text"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* Pitch adjustment */}
              <div className="flex items-center gap-2">
                <span className="text-mt-muted">ระดับโทนเสียง (Pitch):</span>
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  disabled={!supported || !ttsOn}
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="h-1.5 w-20 cursor-pointer accent-mt-accent"
                />
                <span className="w-8 font-mono text-mt-text">
                  {pitch.toFixed(1)}
                </span>
              </div>

              {/* Volume adjustment */}
              <div className="flex items-center gap-2">
                <span className="text-mt-muted">ความดัง (Volume):</span>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  disabled={!supported || !ttsOn}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="h-1.5 w-20 cursor-pointer accent-mt-accent"
                />
                <span className="w-9 font-mono text-mt-text">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Info for Missing Local Thai Voice */}
      {supported && missingThaiVoice && (
        <div className="flex items-center gap-2 rounded-lg border border-mt-accent/40 bg-mt-accent/10 px-3.5 py-2 text-xs text-mt-accent">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            ไม่พบเสียงภาษาไทยในระบบ Windows ของเครื่องนี้ — ระบบได้สลับมาใช้{" "}
            <strong>Thai Cloud AI</strong> ให้อัตโนมัติเพื่อให้สามารถฟังเสียงภาษาไทยได้ทันที
          </span>
        </div>
      )}
    </section>
  );
}
