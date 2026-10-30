"use client";

import React, { useRef } from "react";
import { Info, Volume2, Keyboard } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LiveStats } from "@/components/LiveStats";
import { TypingArea } from "@/components/TypingArea";
import { Results } from "@/components/Results";
import { useTts } from "@/hooks/useTts";
import { useTimer } from "@/hooks/useTimer";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useTypingStore } from "@/store/useTypingStore";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function HomePage() {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const { supported, voiceModels, missingThaiVoice, speak, cancelSpeech } =
    useTts();

  useTimer();

  const { restartTest, replayCurrent } = useTypingEngine({
    speak,
    cancelSpeech,
    hiddenInputRef,
  });

  const status = useTypingStore((s) => s.status);
  const lang = useSettingsStore((s) => s.lang);

  const handleSpeakClickedWord = (word: string) => {
    speak(word, lang, true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Decorative Background Glows for Student Appeal */}
      <div className="pointer-events-none fixed -left-28 -top-28 -z-10 h-96 w-96 rounded-full bg-mt-accent/15 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-28 -right-28 -z-10 h-96 w-96 rounded-full bg-mt-accent2/15 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-4 py-4 sm:px-8">
        {/* Top section: Header + Settings */}
        <div className="flex flex-col gap-4">
          <TopBar />
          <SettingsPanel
            supported={supported}
            voiceModels={voiceModels}
            missingThaiVoice={missingThaiVoice}
            onReplay={replayCurrent}
            onNextSentence={restartTest}
          />
        </div>

        {/* Center section: LiveStats + TypingArea or Results */}
        <main className="my-auto flex w-full flex-col gap-4 py-6">
          {status !== "finished" ? (
            <>
              <LiveStats onSpeakWord={handleSpeakClickedWord} />
              <TypingArea
                hiddenInputRef={hiddenInputRef}
                onSpeakWord={handleSpeakClickedWord}
                onRestart={restartTest}
              />
            </>
          ) : (
            <Results
              onRestart={restartTest}
              onReplay={replayCurrent}
              supported={supported}
            />
          )}
        </main>

        {/* Footer section: Browser & Shortcut hints */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-mt-muted/20 pt-4 text-xs text-mt-muted sm:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5 text-mt-accent" />
              <span>
                กด{" "}
                <kbd className="rounded bg-mt-panel px-1.5 py-0.5 font-mono text-mt-text ring-1 ring-mt-muted/30">
                  Tab
                </kbd>{" "}
                +{" "}
                <kbd className="rounded bg-mt-panel px-1.5 py-0.5 font-mono text-mt-text ring-1 ring-mt-muted/30">
                  Enter
                </kbd>{" "}
                เพื่อเริ่มใหม่ทันที
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-mt-accent2" />
              <span>คลิกที่คำใดก็ได้เพื่อฟังการออกเสียงซ้ำ</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-mt-accent" />
            <span>
              แนะนำให้ใช้ Google Chrome หรือ Microsoft Edge เพื่อเสียงภาษาไทยที่ครบถ้วน
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
