import { create } from "zustand";
import {
  Language,
  PracticeMode,
  SentenceLength,
  WordOption,
} from "@/lib/constants";
import { enWords } from "@/data/enWords";
import { thWords } from "@/data/thWords";
import { enSentencesByLength } from "@/data/enSentences";
import { thSentencesByLength } from "@/data/thSentences";

export type TestStatus = "idle" | "running" | "finished";

export interface WordItem {
  target: string;
  typed: string;
  skippedWithMissed: number;
}

interface TypingState {
  status: TestStatus;
  words: WordItem[];
  currentSentenceText: string;
  wi: number; // current word/clause index
  ci: number; // current char index within words[wi]
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalTyped: number;
  streak: number;
  maxStreak: number;
  startTime: number | null;
  elapsedMs: number;
  wpmSamples: number[];
  isFocused: boolean;
  restartVersion: number; // increments on every reset to trigger effects cleanly

  initTest: (
    lang: Language,
    mode: PracticeMode,
    wordOpt: WordOption,
    sentenceLength?: SentenceLength,
    customSentenceText?: string
  ) => void;
  typeChar: (
    char: string,
    mode: PracticeMode,
    lang: Language
  ) => { finished: boolean; wordChanged: boolean };
  backspace: () => { wordChanged: boolean };
  nextWord: (
    mode: PracticeMode,
    lang: Language
  ) => { finished: boolean; wordChanged: boolean };
  tickTimer: (elapsedMs: number, sampleWpm?: number) => void;
  finishTest: (finalElapsedMs?: number) => void;
  setFocused: (focused: boolean) => void;
}

const MAX_EXTRA_CHARS = 15;

function pickRandomWords(lang: Language, count: number): WordItem[] {
  const pool = lang === "th-TH" ? thWords : enWords;
  const result: WordItem[] = [];
  let prev = "";
  for (let i = 0; i < count; i++) {
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && candidate === prev) {
      candidate = pool[(pool.indexOf(candidate) + 1) % pool.length];
    }
    prev = candidate;
    result.push({
      target: candidate,
      typed: "",
      skippedWithMissed: 0,
    });
  }
  return result;
}

function pickSentenceByOptions(
  lang: Language,
  sentenceLength: SentenceLength,
  customSentenceText?: string,
  excludeSentence?: string
): { words: WordItem[]; sentenceText: string } {
  let sentence = "";

  if (sentenceLength === "custom" && customSentenceText?.trim()) {
    sentence = customSentenceText.trim().replace(/\s+/g, " ");
  } else {
    const lengthKey: "short" | "medium" | "long" =
      sentenceLength === "short" ||
      sentenceLength === "medium" ||
      sentenceLength === "long"
        ? sentenceLength
        : "medium";
    const pool =
      lang === "th-TH"
        ? thSentencesByLength[lengthKey]
        : enSentencesByLength[lengthKey];

    sentence = pool[Math.floor(Math.random() * pool.length)].trim();
    if (pool.length > 1 && sentence === excludeSentence) {
      sentence = pool[(pool.indexOf(sentence) + 1) % pool.length].trim();
    }
  }

  // Split by grammatical spaces so each clause/word is typed continuously and separated by Spacebar
  const splitWords = sentence.split(/\s+/).map((w) => ({
    target: w,
    typed: "",
    skippedWithMissed: 0,
  }));
  return { words: splitWords, sentenceText: sentence };
}

export const useTypingStore = create<TypingState>((set, get) => ({
  status: "idle",
  words: [],
  currentSentenceText: "",
  wi: 0,
  ci: 0,
  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  missedChars: 0,
  totalTyped: 0,
  streak: 0,
  maxStreak: 0,
  startTime: null,
  elapsedMs: 0,
  wpmSamples: [],
  isFocused: true,
  restartVersion: 0,

  initTest: (
    lang,
    mode,
    wordOpt,
    sentenceLength = "medium",
    customSentenceText
  ) => {
    let words: WordItem[] = [];
    let currentSentenceText = "";

    if (mode === "time") {
      words = pickRandomWords(lang, 70);
    } else if (mode === "words") {
      words = pickRandomWords(lang, wordOpt);
    } else {
      const picked = pickSentenceByOptions(
        lang,
        sentenceLength,
        customSentenceText,
        get().currentSentenceText
      );
      words = picked.words;
      currentSentenceText = picked.sentenceText;
    }

    set((state) => ({
      status: "idle",
      words,
      currentSentenceText,
      wi: 0,
      ci: 0,
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      totalTyped: 0,
      streak: 0,
      maxStreak: 0,
      startTime: null,
      elapsedMs: 0,
      wpmSamples: [],
      isFocused: true,
      restartVersion: state.restartVersion + 1,
    }));
  },

  typeChar: (char, mode, lang) => {
    const state = get();
    if (state.status === "finished" || state.words.length === 0) {
      return { finished: false, wordChanged: false };
    }

    const currentWord = state.words[state.wi];
    if (!currentWord) return { finished: false, wordChanged: false };

    // Prevent excessive extra chars per word
    if (state.ci >= currentWord.target.length + MAX_EXTRA_CHARS) {
      return { finished: false, wordChanged: false };
    }

    const now = Date.now();
    const nextStatus: TestStatus =
      state.status === "idle" ? "running" : state.status;
    const nextStartTime = state.startTime ?? now;

    const newTyped = currentWord.typed + char;
    const nextCi = state.ci + 1;

    let addCorrect = 0;
    let addIncorrect = 0;
    let addExtra = 0;

    if (state.ci < currentWord.target.length) {
      if (char === currentWord.target[state.ci]) {
        addCorrect = 1;
      } else {
        addIncorrect = 1;
      }
    } else {
      addExtra = 1;
    }

    const nextStreak = addCorrect === 1 ? state.streak + 1 : 0;
    const nextMaxStreak = Math.max(state.maxStreak, nextStreak);

    const nextWords = [...state.words];
    nextWords[state.wi] = {
      ...currentWord,
      typed: newTyped,
    };

    // Check if this completes the final word in words/sentence mode
    const isLastWord = state.wi === nextWords.length - 1;
    const reachedEndOfLastWord =
      (mode === "words" || mode === "sentence") &&
      isLastWord &&
      nextCi === currentWord.target.length;

    if (reachedEndOfLastWord) {
      const finalElapsed = Math.max(1, now - nextStartTime);
      set({
        status: "finished",
        words: nextWords,
        ci: nextCi,
        correctChars: state.correctChars + addCorrect,
        incorrectChars: state.incorrectChars + addIncorrect,
        extraChars: state.extraChars + addExtra,
        totalTyped: state.totalTyped + 1,
        streak: nextStreak,
        maxStreak: nextMaxStreak,
        startTime: nextStartTime,
        elapsedMs: finalElapsed,
      });
      return { finished: true, wordChanged: false };
    }

    set({
      status: nextStatus,
      words: nextWords,
      ci: nextCi,
      correctChars: state.correctChars + addCorrect,
      incorrectChars: state.incorrectChars + addIncorrect,
      extraChars: state.extraChars + addExtra,
      totalTyped: state.totalTyped + 1,
      streak: nextStreak,
      maxStreak: nextMaxStreak,
      startTime: nextStartTime,
    });

    // If time mode and getting close to end of word list, append more words
    if (mode === "time" && state.wi > nextWords.length - 30) {
      const moreWords = pickRandomWords(lang, 40);
      set((s) => ({ words: [...s.words, ...moreWords] }));
    }

    return { finished: false, wordChanged: false };
  },

  backspace: () => {
    const state = get();
    if (state.status !== "running" || state.words.length === 0) {
      return { wordChanged: false };
    }

    // Case 1: Inside current word (ci > 0)
    if (state.ci > 0) {
      const currentWord = state.words[state.wi];
      const removedCharIndex = state.ci - 1;
      const removedChar = currentWord.typed[removedCharIndex];

      let subCorrect = 0;
      let subIncorrect = 0;
      let subExtra = 0;

      if (removedCharIndex < currentWord.target.length) {
        if (removedChar === currentWord.target[removedCharIndex]) {
          subCorrect = 1;
        } else {
          subIncorrect = 1;
        }
      } else {
        subExtra = 1;
      }

      const nextWords = [...state.words];
      nextWords[state.wi] = {
        ...currentWord,
        typed: currentWord.typed.slice(0, -1),
      };

      set({
        words: nextWords,
        ci: removedCharIndex,
        correctChars: Math.max(0, state.correctChars - subCorrect),
        incorrectChars: Math.max(0, state.incorrectChars - subIncorrect),
        extraChars: Math.max(0, state.extraChars - subExtra),
        totalTyped: Math.max(0, state.totalTyped - 1),
      });

      return { wordChanged: false };
    }

    // Case 2: At start of word (ci === 0) and not first word (wi > 0)
    if (state.ci === 0 && state.wi > 0) {
      const prevWi = state.wi - 1;
      const prevWord = state.words[prevWi];

      // Restore any missed chars that were added when skipping the previous word
      const restoredMissed = prevWord.skippedWithMissed;
      // Also if the space transition counted as correct char, undo it
      const wasPrevCorrectSpace =
        prevWord.typed === prevWord.target ? 1 : 0;

      const nextWords = [...state.words];
      nextWords[prevWi] = {
        ...prevWord,
        skippedWithMissed: 0,
      };

      set({
        words: nextWords,
        wi: prevWi,
        ci: prevWord.typed.length,
        missedChars: Math.max(0, state.missedChars - restoredMissed),
        correctChars: Math.max(0, state.correctChars - wasPrevCorrectSpace),
        totalTyped: Math.max(0, state.totalTyped - 1),
      });

      return { wordChanged: true };
    }

    return { wordChanged: false };
  },

  nextWord: (mode, lang) => {
    const state = get();
    if (state.status !== "running" || state.words.length === 0) {
      return { finished: false, wordChanged: false };
    }

    // Guard: If nothing typed in current word (ci === 0), ignore Space
    if (state.ci === 0) {
      return { finished: false, wordChanged: false };
    }

    const currentWord = state.words[state.wi];
    const unTypedCount = Math.max(
      0,
      currentWord.target.length - currentWord.typed.length
    );
    const isWordExact = currentWord.typed === currentWord.target;

    const nextWords = [...state.words];
    nextWords[state.wi] = {
      ...currentWord,
      skippedWithMissed: unTypedCount,
    };

    const isLastWord = state.wi === nextWords.length - 1;

    // If pressing space on the last word in words/sentence mode, finish the test
    if ((mode === "words" || mode === "sentence") && isLastWord) {
      const now = Date.now();
      const finalElapsed = state.startTime
        ? Math.max(1, now - state.startTime)
        : state.elapsedMs;

      set({
        status: "finished",
        words: nextWords,
        missedChars: state.missedChars + unTypedCount,
        streak: isWordExact ? state.streak + 1 : 0,
        maxStreak: isWordExact
          ? Math.max(state.maxStreak, state.streak + 1)
          : state.maxStreak,
        elapsedMs: finalElapsed,
      });
      return { finished: true, wordChanged: false };
    }

    // Append more words in time mode if needed
    if (mode === "time" && state.wi + 1 > nextWords.length - 30) {
      const moreWords = pickRandomWords(lang, 40);
      nextWords.push(...moreWords);
    }

    const nextStreak = isWordExact ? state.streak + 1 : 0;

    set({
      words: nextWords,
      wi: state.wi + 1,
      ci: 0,
      missedChars: state.missedChars + unTypedCount,
      // Space key between words counts toward monkeytype WPM when word is correct
      correctChars: state.correctChars + (isWordExact ? 1 : 0),
      totalTyped: state.totalTyped + 1,
      streak: nextStreak,
      maxStreak: Math.max(state.maxStreak, nextStreak),
    });

    return { finished: false, wordChanged: true };
  },

  tickTimer: (elapsedMs, sampleWpm) => {
    set((state) => ({
      elapsedMs,
      wpmSamples:
        typeof sampleWpm === "number"
          ? [...state.wpmSamples, sampleWpm]
          : state.wpmSamples,
    }));
  },

  finishTest: (finalElapsedMs) => {
    set((state) => ({
      status: "finished",
      elapsedMs:
        typeof finalElapsedMs === "number" ? finalElapsedMs : state.elapsedMs,
    }));
  },

  setFocused: (focused) => set({ isFocused: focused }),
}));

export function hasWordError(word: WordItem, isPastWord: boolean): boolean {
  if (isPastWord && word.skippedWithMissed > 0) return true;
  if (word.typed.length > word.target.length) return true;
  for (let i = 0; i < word.typed.length; i++) {
    if (word.typed[i] !== word.target[i]) return true;
  }
  return false;
}
