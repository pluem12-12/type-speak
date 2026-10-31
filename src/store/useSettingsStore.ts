import { create } from "zustand";
import {
  Language,
  PracticeMode,
  SentenceLength,
  TimeOption,
  WordOption,
  ThemeId,
  THEMES,
  TIME_LIMITS,
  WORD_LIMITS,
  SENTENCE_COUNT_LIMITS,
  STORAGE_KEYS,
} from "@/lib/constants";

interface PersistedTtsSettings {
  theme: ThemeId;
  ttsOn: boolean;
  voiceMap: Record<Language, string>;
  rate: number;
  pitch: number;
  volume: number;
  timeOpt: number;
  wordOpt: number;
  sentenceLength: SentenceLength;
  sentenceCount: number;
}

interface BestScoresMap {
  [key: string]: {
    wpm: number;
    acc: number;
    date: string;
  };
}

interface SettingsState {
  theme: ThemeId;
  lang: Language;
  mode: PracticeMode;
  timeOpt: TimeOption;
  wordOpt: WordOption;
  sentenceLength: SentenceLength;
  sentenceCount: number;
  ttsOn: boolean;
  voiceMap: Record<Language, string>;
  rate: number;
  pitch: number;
  volume: number;
  bestScores: BestScoresMap;
  hydrated: boolean;

  setTheme: (theme: ThemeId) => void;
  setLang: (lang: Language) => void;
  setMode: (mode: PracticeMode) => void;
  setTimeOpt: (timeOpt: TimeOption) => void;
  setWordOpt: (wordOpt: WordOption) => void;
  setSentenceLength: (sentenceLength: SentenceLength) => void;
  setSentenceCount: (sentenceCount: number) => void;
  setTtsOn: (ttsOn: boolean) => void;
  setVoiceForLang: (lang: Language, voiceURI: string) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  updateBestScore: (key: string, wpm: number, acc: number) => boolean;
  hydrateFromStorage: () => void;
}

function applyDocumentTheme(theme: ThemeId) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

function saveSettings(state: {
  theme: ThemeId;
  ttsOn: boolean;
  voiceMap: Record<Language, string>;
  rate: number;
  pitch: number;
  volume: number;
  timeOpt: number;
  wordOpt: number;
  sentenceLength: SentenceLength;
  sentenceCount: number;
}) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedTtsSettings = {
      theme: state.theme,
      ttsOn: state.ttsOn,
      voiceMap: state.voiceMap,
      rate: state.rate,
      pitch: state.pitch,
      volume: state.volume,
      timeOpt: state.timeOpt,
      wordOpt: state.wordOpt,
      sentenceLength: state.sentenceLength,
      sentenceCount: state.sentenceCount,
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "neon-pop",
  lang: "en-US",
  mode: "time",
  timeOpt: 30,
  wordOpt: 25,
  sentenceLength: "medium",
  sentenceCount: 1,
  ttsOn: true,
  voiceMap: {
    "en-US": "",
    "th-TH": "",
  },
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
  bestScores: {},
  hydrated: false,

  setTheme: (theme) => {
    set({ theme });
    applyDocumentTheme(theme);
    saveSettings({ ...get(), theme });
  },

  setLang: (lang) => set({ lang }),
  setMode: (mode) => set({ mode }),

  setTimeOpt: (timeOpt) => {
    const clamped = Math.max(
      TIME_LIMITS.MIN,
      Math.min(TIME_LIMITS.MAX, Math.round(timeOpt))
    );
    set({ timeOpt: clamped });
    saveSettings({ ...get(), timeOpt: clamped });
  },

  setWordOpt: (wordOpt) => {
    const clamped = Math.max(
      WORD_LIMITS.MIN,
      Math.min(WORD_LIMITS.MAX, Math.round(wordOpt))
    );
    set({ wordOpt: clamped });
    saveSettings({ ...get(), wordOpt: clamped });
  },

  setSentenceLength: (sentenceLength) => {
    set({ sentenceLength });
    saveSettings({ ...get(), sentenceLength });
  },

  setSentenceCount: (sentenceCount) => {
    const clamped = Math.max(
      SENTENCE_COUNT_LIMITS.MIN,
      Math.min(SENTENCE_COUNT_LIMITS.MAX, Math.round(sentenceCount))
    );
    set({ sentenceCount: clamped });
    saveSettings({ ...get(), sentenceCount: clamped });
  },

  setTtsOn: (ttsOn) => {
    set({ ttsOn });
    saveSettings({ ...get(), ttsOn });
  },

  setVoiceForLang: (lang, voiceURI) => {
    const nextMap = { ...get().voiceMap, [lang]: voiceURI };
    set({ voiceMap: nextMap });
    saveSettings({ ...get(), voiceMap: nextMap });
  },

  setRate: (rate) => {
    const clamped = Math.round(Math.max(0.25, Math.min(2.0, rate)) * 100) / 100;
    set({ rate: clamped });
    saveSettings({ ...get(), rate: clamped });
  },

  setPitch: (pitch) => {
    const clamped = Math.round(Math.max(0.5, Math.min(1.5, pitch)) * 10) / 10;
    set({ pitch: clamped });
    saveSettings({ ...get(), pitch: clamped });
  },

  setVolume: (volume) => {
    const clamped = Math.round(Math.max(0.1, Math.min(1.0, volume)) * 10) / 10;
    set({ volume: clamped });
    saveSettings({ ...get(), volume: clamped });
  },

  // TODO: เชื่อม backend (Supabase / Next.js API + Prisma) บันทึกประวัติผลการฝึก
  updateBestScore: (key, wpm, acc) => {
    const current = get().bestScores[key];
    if (
      !current ||
      wpm > current.wpm ||
      (wpm === current.wpm && acc > current.acc)
    ) {
      const nextScores: BestScoresMap = {
        ...get().bestScores,
        [key]: {
          wpm,
          acc,
          date: new Date().toISOString(),
        },
      };
      set({ bestScores: nextScores });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            STORAGE_KEYS.BEST_SCORES,
            JSON.stringify(nextScores)
          );
        } catch {
          // Ignore storage errors
        }
      }
      return true;
    }
    return false;
  },

  hydrateFromStorage: () => {
    if (typeof window === "undefined" || get().hydrated) return;
    try {
      const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings) as Partial<PersistedTtsSettings>;
        const validTheme = THEMES.some((t) => t.id === parsed.theme)
          ? (parsed.theme as ThemeId)
          : "neon-pop";
        applyDocumentTheme(validTheme);

        const validSentenceLength: SentenceLength =
          parsed.sentenceLength === "short" ||
          parsed.sentenceLength === "medium" ||
          parsed.sentenceLength === "long"
            ? parsed.sentenceLength
            : "medium";

        set((state) => ({
          theme: validTheme,
          ttsOn: typeof parsed.ttsOn === "boolean" ? parsed.ttsOn : state.ttsOn,
          voiceMap: parsed.voiceMap
            ? { ...state.voiceMap, ...parsed.voiceMap }
            : state.voiceMap,
          rate:
            typeof parsed.rate === "number" &&
            parsed.rate >= 0.25 &&
            parsed.rate <= 2.0
              ? parsed.rate
              : state.rate,
          pitch:
            typeof parsed.pitch === "number" &&
            parsed.pitch >= 0.5 &&
            parsed.pitch <= 1.5
              ? parsed.pitch
              : state.pitch,
          volume:
            typeof parsed.volume === "number" &&
            parsed.volume >= 0.1 &&
            parsed.volume <= 1.0
              ? parsed.volume
              : state.volume,
          timeOpt:
            typeof parsed.timeOpt === "number" &&
            parsed.timeOpt >= TIME_LIMITS.MIN &&
            parsed.timeOpt <= TIME_LIMITS.MAX
              ? parsed.timeOpt
              : state.timeOpt,
          wordOpt:
            typeof parsed.wordOpt === "number" &&
            parsed.wordOpt >= WORD_LIMITS.MIN &&
            parsed.wordOpt <= WORD_LIMITS.MAX
              ? parsed.wordOpt
              : state.wordOpt,
          sentenceLength: validSentenceLength,
          sentenceCount:
            typeof parsed.sentenceCount === "number" &&
            parsed.sentenceCount >= SENTENCE_COUNT_LIMITS.MIN &&
            parsed.sentenceCount <= SENTENCE_COUNT_LIMITS.MAX
              ? Math.round(parsed.sentenceCount)
              : state.sentenceCount,
        }));
      } else {
        applyDocumentTheme("neon-pop");
      }

      const rawScores = localStorage.getItem(STORAGE_KEYS.BEST_SCORES);
      if (rawScores) {
        const parsedScores = JSON.parse(rawScores) as BestScoresMap;
        if (parsedScores && typeof parsedScores === "object") {
          set({ bestScores: parsedScores });
        }
      }
    } catch {
      applyDocumentTheme("neon-pop");
    } finally {
      set({ hydrated: true });
    }
  },
}));

export function getScoreKey(
  lang: Language,
  mode: PracticeMode,
  timeOpt: TimeOption,
  wordOpt: WordOption,
  sentenceLength: SentenceLength = "medium",
  sentenceCount: number = 1
): string {
  if (mode === "time") return `${lang}_time_${timeOpt}`;
  if (mode === "words") return `${lang}_words_${wordOpt}`;
  return `${lang}_sentence_${sentenceLength}_${sentenceCount}`;
}
