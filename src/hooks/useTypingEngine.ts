"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTypingStore } from "@/store/useTypingStore";
import { useSettingsStore, getScoreKey } from "@/store/useSettingsStore";
import { calculateWpm, calculateAccuracy } from "@/lib/stats";

interface UseTypingEngineProps {
  speak: (text: string, forceLang?: "en-US" | "th-TH", bypassToggle?: boolean) => void;
  cancelSpeech: () => void;
  hiddenInputRef: React.RefObject<HTMLInputElement>;
}

export function useTypingEngine({
  speak,
  cancelSpeech,
  hiddenInputRef,
}: UseTypingEngineProps) {
  const {
    lang,
    mode,
    timeOpt,
    wordOpt,
    sentenceLength,
    activeCustomSentence,
    ttsOn,
    hydrated,
    hydrateFromStorage,
    updateBestScore,
  } = useSettingsStore();

  const {
    status,
    words,
    currentSentenceText,
    wi,
    correctChars,
    incorrectChars,
    extraChars,
    elapsedMs,
    restartVersion,
    initTest,
    typeChar,
    backspace,
    nextWord,
    setFocused,
  } = useTypingStore();

  const tabPressedRef = useRef<boolean>(false);
  const currentCustomText = activeCustomSentence[lang] || "";

  // Hydrate persistent settings on mount
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // Initialize test whenever mode, language, word count, sentence length, or custom sentence changes
  useEffect(() => {
    if (!hydrated) return;
    cancelSpeech();
    initTest(lang, mode, wordOpt, sentenceLength, currentCustomText);
  }, [
    hydrated,
    lang,
    mode,
    timeOpt,
    wordOpt,
    sentenceLength,
    currentCustomText,
    initTest,
    cancelSpeech,
  ]);

  // Trigger initial TTS on new test or mode change
  useEffect(() => {
    if (!hydrated || !ttsOn) return;
    const state = useTypingStore.getState();
    if (state.words.length === 0) return;

    const timer = setTimeout(() => {
      const latest = useTypingStore.getState();
      if (latest.status === "finished" || latest.words.length === 0) return;
      if (mode === "sentence") {
        speak(latest.currentSentenceText, lang);
      } else {
        const firstWord = latest.words[0]?.target;
        if (firstWord) speak(firstWord, lang);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [hydrated, restartVersion, mode, lang, ttsOn, speak]);

  // Save best score when test finishes
  useEffect(() => {
    if (status !== "finished") return;
    const wpm = calculateWpm(correctChars, elapsedMs);
    const acc = calculateAccuracy(correctChars, incorrectChars, extraChars);
    const scoreKey = getScoreKey(lang, mode, timeOpt, wordOpt, sentenceLength);
    updateBestScore(scoreKey, wpm, acc);
  }, [
    status,
    correctChars,
    incorrectChars,
    extraChars,
    elapsedMs,
    lang,
    mode,
    timeOpt,
    wordOpt,
    sentenceLength,
    updateBestScore,
  ]);

  const restartTest = useCallback(() => {
    cancelSpeech();
    initTest(lang, mode, wordOpt, sentenceLength, currentCustomText);
    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 10);
  }, [
    cancelSpeech,
    initTest,
    lang,
    mode,
    wordOpt,
    sentenceLength,
    currentCustomText,
    hiddenInputRef,
  ]);

  const replayCurrent = useCallback(() => {
    const state = useTypingStore.getState();
    if (state.words.length === 0) return;
    if (mode === "sentence") {
      speak(state.currentSentenceText, lang, true);
    } else {
      const currentWord = state.words[state.wi]?.target;
      if (currentWord) {
        speak(currentWord, lang, true);
      }
    }
    hiddenInputRef.current?.focus();
  }, [mode, lang, speak, hiddenInputRef]);

  // Global document keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never preventDefault on modifier combinations (Ctrl / Cmd / Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Ignore if user is interacting with a select dropdown, textarea, or custom input field
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "select" ||
        activeTag === "textarea" ||
        (activeTag === "input" && document.activeElement !== hiddenInputRef.current)
      ) {
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        tabPressedRef.current = true;
        return;
      }

      if (e.key === "Enter" && tabPressedRef.current) {
        e.preventDefault();
        tabPressedRef.current = false;
        restartTest();
        return;
      }

      // Any other key resets Tab combo state
      tabPressedRef.current = false;

      const currentState = useTypingStore.getState();
      if (currentState.status === "finished") {
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        setFocused(true);
        const { wordChanged } = backspace();
        if (wordChanged && mode !== "sentence") {
          const updated = useTypingStore.getState();
          const wordToSpeak = updated.words[updated.wi]?.target;
          if (wordToSpeak) speak(wordToSpeak, lang);
        }
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        setFocused(true);
        const { wordChanged } = nextWord(mode, lang);
        if (wordChanged && mode !== "sentence") {
          const updated = useTypingStore.getState();
          const wordToSpeak = updated.words[updated.wi]?.target;
          if (wordToSpeak) speak(wordToSpeak, lang);
        }
        return;
      }

      // Printable single character
      if (e.key.length === 1) {
        e.preventDefault();
        setFocused(true);
        typeChar(e.key, mode, lang);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        tabPressedRef.current = false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    mode,
    lang,
    backspace,
    nextWord,
    typeChar,
    restartTest,
    setFocused,
    speak,
    hiddenInputRef,
  ]);

  return {
    restartTest,
    replayCurrent,
    currentWordText: words[wi]?.target ?? "",
    currentSentenceText,
  };
}
