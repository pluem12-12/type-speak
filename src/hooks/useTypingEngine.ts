"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTypingStore } from "@/store/useTypingStore";
import { useSettingsStore, getScoreKey } from "@/store/useSettingsStore";
import { calculateWpm, calculateAccuracy } from "@/lib/stats";
import { Language } from "@/lib/constants";

interface UseTypingEngineProps {
  speak: (
    text: string,
    forceLang?: Language,
    bypassToggle?: boolean,
    overrideVoiceId?: string
  ) => void;
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
    sentenceCount,
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
  const userInteractedRef = useRef<boolean>(false);
  const spokeInitialRef = useRef<boolean>(false);

  // Hydrate persistent settings on mount
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // Initialize test whenever mode, language, word count, sentence length, or sentence count changes
  useEffect(() => {
    if (!hydrated) return;
    spokeInitialRef.current = false;
    cancelSpeech();
    initTest(lang, mode, wordOpt, sentenceLength, sentenceCount);
  }, [
    hydrated,
    lang,
    mode,
    timeOpt,
    wordOpt,
    sentenceLength,
    sentenceCount,
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
      if (userInteractedRef.current) {
        spokeInitialRef.current = true;
      }
      if (mode === "sentence") {
        const firstSentence =
          latest.words[0]?.sentenceFullText || latest.currentSentenceText;
        if (firstSentence) speak(firstSentence, lang);
      } else {
        const firstWord = latest.words[0]?.target;
        if (firstWord) speak(firstWord, lang);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [hydrated, restartVersion, mode, lang, ttsOn, speak]);

  // Save best score when test finishes
  useEffect(() => {
    if (status !== "finished") return;
    const wpm = calculateWpm(correctChars, elapsedMs);
    const acc = calculateAccuracy(correctChars, incorrectChars, extraChars);
    const scoreKey = getScoreKey(
      lang,
      mode,
      timeOpt,
      wordOpt,
      sentenceLength,
      sentenceCount
    );
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
    sentenceCount,
    updateBestScore,
  ]);

  const restartTest = useCallback(() => {
    userInteractedRef.current = true;
    spokeInitialRef.current = false;
    cancelSpeech();
    initTest(lang, mode, wordOpt, sentenceLength, sentenceCount);
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
    sentenceCount,
    hiddenInputRef,
  ]);

  const replayCurrent = useCallback(
    (overrideVoiceId?: string) => {
      userInteractedRef.current = true;
      spokeInitialRef.current = true;
      const state = useTypingStore.getState();
      if (state.words.length === 0) return;
      if (mode === "sentence") {
        const activeSentence =
          state.words[state.wi]?.sentenceFullText || state.currentSentenceText;
        speak(activeSentence, lang, true, overrideVoiceId);
      } else {
        const currentWord = state.words[state.wi]?.target;
        if (currentWord) {
          speak(currentWord, lang, true, overrideVoiceId);
        }
      }
      hiddenInputRef.current?.focus();
    },
    [mode, lang, speak, hiddenInputRef]
  );

  // Global document keydown & click listener for user interaction & typing
  useEffect(() => {
    const handlePointerDown = () => {
      userInteractedRef.current = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      userInteractedRef.current = true;

      // Never preventDefault on modifier combinations (Ctrl / Cmd / Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Ignore if user is interacting with a select dropdown, textarea, or custom input field
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "select" ||
        activeTag === "textarea" ||
        (activeTag === "input" &&
          document.activeElement !== hiddenInputRef.current)
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
        const prevSentenceIdx = currentState.words[currentState.wi]?.sentenceIdx;
        const { wordChanged } = nextWord(mode, lang);
        if (wordChanged) {
          const updated = useTypingStore.getState();
          const nextItem = updated.words[updated.wi];
          if (mode === "sentence") {
            // If entering a new sentence, read the full new sentence; otherwise read the next clause
            if (
              nextItem?.sentenceIdx !== prevSentenceIdx &&
              nextItem?.sentenceFullText
            ) {
              speak(nextItem.sentenceFullText, lang);
            } else if (nextItem?.target) {
              speak(nextItem.target, lang);
            }
          } else if (nextItem?.target) {
            speak(nextItem.target, lang);
          }
        }
        return;
      }

      // Printable single character
      if (e.key.length === 1) {
        e.preventDefault();
        setFocused(true);

        // If browser blocked initial autoplay on page load, speak the first word/sentence on first keystroke
        if (
          currentState.status === "idle" &&
          currentState.wi === 0 &&
          currentState.ci === 0 &&
          !spokeInitialRef.current
        ) {
          spokeInitialRef.current = true;
          if (mode === "sentence") {
            const firstSentence =
              currentState.words[0]?.sentenceFullText ||
              currentState.currentSentenceText;
            if (firstSentence) speak(firstSentence, lang);
          } else {
            const firstWord = currentState.words[0]?.target;
            if (firstWord) speak(firstWord, lang);
          }
        }

        typeChar(e.key, mode, lang);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        tabPressedRef.current = false;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
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
