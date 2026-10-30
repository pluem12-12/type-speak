export type Language = "en-US" | "th-TH";
export type PracticeMode = "time" | "words" | "sentence";
export type SentenceLength = "short" | "medium" | "long" | "custom";

export type ThemeId =
  | "neon-pop"
  | "pastel-candy"
  | "mint-fizz"
  | "sunset-pop"
  | "classic-dark";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  previewBg: string;
  previewAccent: string;
  previewAccent2: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "neon-pop",
    name: "นีออนป๊อป",
    previewBg: "#18142c",
    previewAccent: "#38bdf8",
    previewAccent2: "#f472b6",
  },
  {
    id: "pastel-candy",
    name: "พาสเทลแคนดี้",
    previewBg: "#f5f3ff",
    previewAccent: "#ec4899",
    previewAccent2: "#8b5cf6",
  },
  {
    id: "mint-fizz",
    name: "มิ้นต์โซดา",
    previewBg: "#0f292f",
    previewAccent: "#2dd4bf",
    previewAccent2: "#facc15",
  },
  {
    id: "sunset-pop",
    name: "ซันเซ็ตพีช",
    previewBg: "#261429",
    previewAccent: "#fb923c",
    previewAccent2: "#f43f5e",
  },
  {
    id: "classic-dark",
    name: "คลาสสิก",
    previewBg: "#323437",
    previewAccent: "#e2b714",
    previewAccent2: "#f59e0b",
  },
];

export const SENTENCE_LENGTH_OPTS: {
  id: SentenceLength;
  label: string;
  desc: string;
}[] = [
  {
    id: "short",
    label: "สั้น (Short)",
    desc: "ประโยคสั้นกระชับ ฝึกออกเสียงและพิมพ์ได้คล่อง",
  },
  {
    id: "medium",
    label: "กลาง (Medium)",
    desc: "ประโยคความยาวปานกลาง เว้นวรรคตามไวยากรณ์",
  },
  {
    id: "long",
    label: "ยาว (Long)",
    desc: "ประโยคยาวหลายวรรค ฝึกความต่อเนื่องและสมาธิ",
  },
  {
    id: "custom",
    label: "ปรับแต่งเอง (Custom)",
    desc: "พิมพ์หรือเพิ่มประโยคที่ต้องการฝึกด้วยตัวเอง",
  },
];

export const TIME_OPTS = [15, 30, 60, 120] as const;
export const WORD_OPTS = [10, 25, 50, 100] as const;

export type TimeOption = number;
export type WordOption = number;

export const TIME_LIMITS = {
  MIN: 5,
  MAX: 600,
} as const;

export const WORD_LIMITS = {
  MIN: 1,
  MAX: 500,
} as const;

export const RATE_PRESETS = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "0.9x", value: 0.9 },
  { label: "1.0x", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2.0x", value: 2.0 },
] as const;

export const COLORS = {
  bg: "#18142c",
  panel: "#251f42",
  text: "#f4f0ff",
  muted: "#8c82b5",
  accent: "#38bdf8",
  accent2: "#f472b6",
  error: "#fb7185",
  errorExtra: "#be123c",
} as const;

export const STORAGE_KEYS = {
  SETTINGS: "typespeak_settings_v1",
  BEST_SCORES: "typespeak_best_scores_v1",
} as const;
