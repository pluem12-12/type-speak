"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Language } from "@/lib/constants";
import { useSettingsStore } from "@/store/useSettingsStore";

export interface VoiceModelOption {
  id: string;
  label: string;
  voiceURI: string;
  lang: string;
  rateMultiplier: number;
  pitchOffset: number;
  isSyntheticPreset?: boolean;
  isCloudModel?: boolean;
  cloudTl?: string;
}

export interface UseTtsReturn {
  supported: boolean;
  filteredVoices: SpeechSynthesisVoice[];
  voiceModels: VoiceModelOption[];
  missingThaiVoice: boolean;
  speak: (
    text: string,
    forceLang?: Language,
    bypassToggle?: boolean,
    overrideVoiceId?: string
  ) => void;
  cancelSpeech: () => void;
}

const THAI_MODEL_PRESETS: VoiceModelOption[] = [
  {
    id: "cloud:th-standard",
    label: "Thai Cloud AI (แนะนำ) — เสียงธรรมชาติชัดเจน ใช้ได้ทุกเครื่อง",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 1.0,
    pitchOffset: 0,
    isSyntheticPreset: true,
    isCloudModel: true,
    cloudTl: "th",
  },
  {
    id: "cloud:th-slow",
    label: "Thai Cloud Learner — เสียง AI อ่านช้าชัดสำหรับฝึกฟัง",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 0.8,
    pitchOffset: 0,
    isSyntheticPreset: true,
    isCloudModel: true,
    cloudTl: "th",
  },
  {
    id: "preset:th-standard",
    label: "Thai System Standard — โมเดลเสียงระบบมาตรฐาน",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 1.0,
    pitchOffset: 0,
    isSyntheticPreset: true,
  },
  {
    id: "preset:th-clear-slow",
    label: "Thai Clear Learner — โมเดลฝึกออกเสียงช้าชัด",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 0.85,
    pitchOffset: 0,
    isSyntheticPreset: true,
  },
  {
    id: "preset:th-female-soft",
    label: "Thai High Tone — โมเดลโทนเสียงสูงนุ่มนวล",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 0.95,
    pitchOffset: 0.2,
    isSyntheticPreset: true,
  },
  {
    id: "preset:th-male-deep",
    label: "Thai Deep Tone — โมเดลโทนเสียงทุ้มลึก",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 0.95,
    pitchOffset: -0.25,
    isSyntheticPreset: true,
  },
];

const EN_MODEL_PRESETS: VoiceModelOption[] = [
  {
    id: "cloud:en-us",
    label: "English (US) Cloud AI (แนะนำ) — เสียง AI อเมริกันธรรมชาติ",
    voiceURI: "",
    lang: "en-US",
    rateMultiplier: 1.0,
    pitchOffset: 0,
    isSyntheticPreset: true,
    isCloudModel: true,
    cloudTl: "en",
  },
  {
    id: "cloud:en-uk",
    label: "English (UK) Cloud AI — เสียง AI สำเนียงบริติช",
    voiceURI: "",
    lang: "en-GB",
    rateMultiplier: 0.95,
    pitchOffset: 0,
    isSyntheticPreset: true,
    isCloudModel: true,
    cloudTl: "en-uk",
  },
  {
    id: "preset:en-us-standard",
    label: "English (US) System — โมเดลสำเนียงอเมริกันในเครื่อง",
    voiceURI: "",
    lang: "en-US",
    rateMultiplier: 1.0,
    pitchOffset: 0,
    isSyntheticPreset: true,
  },
  {
    id: "preset:en-gb-rp",
    label: "English (UK) British — โมเดลสำเนียงบริติชในเครื่อง",
    voiceURI: "",
    lang: "en-GB",
    rateMultiplier: 0.95,
    pitchOffset: 0.05,
    isSyntheticPreset: true,
  },
  {
    id: "preset:en-learner-clear",
    label: "English Clear Dictation — โมเดลฟังชัดสำหรับผู้เริ่มต้น",
    voiceURI: "",
    lang: "en-US",
    rateMultiplier: 0.85,
    pitchOffset: 0,
    isSyntheticPreset: true,
  },
  {
    id: "preset:en-deep-narrator",
    label: "English Narrator — โมเดลเสียงผู้บรรยายทุ้มชัด",
    voiceURI: "",
    lang: "en-US",
    rateMultiplier: 0.95,
    pitchOffset: -0.2,
    isSyntheticPreset: true,
  },
];

export function useTts(): UseTtsReturn {
  const { lang, ttsOn, voiceMap, rate, pitch, volume, setVoiceForLang } =
    useSettingsStore();
  const [supported, setSupported] = useState<boolean>(true);
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs to prevent Chrome V8 garbage collection of active utterances & audio elements
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadVoices = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    setSupported(true);
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAllVoices(voices);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    loadVoices();
    // Retry loading voices after a short delay for browsers that populate voices asynchronously
    const retryTimer = setTimeout(loadVoices, 300);

    const synth =
      "speechSynthesis" in window ? window.speechSynthesis : undefined;
    synth?.addEventListener("voiceschanged", loadVoices);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(retryTimer);
      synth?.removeEventListener("voiceschanged", loadVoices);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadVoices]);

  const langPrefix = lang === "th-TH" ? "th" : "en";
  const filteredVoices = useMemo(
    () =>
      allVoices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix)),
    [allVoices, langPrefix]
  );

  const hasAnyThaiVoice = allVoices.some((v) =>
    v.lang.toLowerCase().startsWith("th")
  );
  const missingThaiVoice =
    supported && allVoices.length > 0 && lang === "th-TH" && !hasAnyThaiVoice;

  // Combine Cloud AI models, native system voices, and tone presets
  const voiceModels = useMemo<VoiceModelOption[]>(() => {
    const nativeOptions: VoiceModelOption[] = filteredVoices.map((v) => ({
      id: v.voiceURI,
      label: `${v.name} (${v.lang})`,
      voiceURI: v.voiceURI,
      lang: v.lang,
      rateMultiplier: 1.0,
      pitchOffset: 0,
      isSyntheticPreset: false,
      isCloudModel: false,
    }));

    const presets = lang === "th-TH" ? THAI_MODEL_PRESETS : EN_MODEL_PRESETS;
    return [...presets, ...nativeOptions];
  }, [filteredVoices, lang]);

  // Auto-select default voice model for current language if not yet saved or invalid
  useEffect(() => {
    if (voiceModels.length === 0) return;
    const savedId = voiceMap[lang];
    const exists = voiceModels.some((m) => m.id === savedId);
    if (!savedId || !exists) {
      // If Thai and no local Thai voice is installed, default to Cloud AI so it works immediately
      if (lang === "th-TH" && filteredVoices.length === 0) {
        setVoiceForLang(lang, "cloud:th-standard");
        return;
      }

      const preferred =
        voiceModels.find(
          (m) =>
            !m.isSyntheticPreset &&
            (m.label.toLowerCase().includes("natural") ||
              m.label.toLowerCase().includes("google") ||
              m.label.toLowerCase().includes("premwadee") ||
              m.label.toLowerCase().includes("niwat"))
        ) ?? voiceModels[0];

      if (preferred) {
        setVoiceForLang(lang, preferred.id);
      }
    }
  }, [voiceModels, filteredVoices.length, lang, voiceMap, setVoiceForLang]);

  const cancelSpeech = useCallback(() => {
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const playCloudTts = useCallback(
    (text: string, tl: string, effectiveRate: number, vol: number) => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        const url = `/api/tts?text=${encodeURIComponent(
          text
        )}&tl=${encodeURIComponent(tl)}`;
        const audio = new Audio(url);
        audio.volume = Math.max(0.1, Math.min(1.0, vol));
        audio.playbackRate = Math.max(0.25, Math.min(2.0, effectiveRate));
        audioRef.current = audio;
        audio.play().catch(() => {
          // Ignore autoplay restrictions if user hasn't interacted yet
        });
      } catch {
        // Ignore audio errors
      }
    },
    []
  );

  const speak = useCallback(
    (
      text: string,
      forceLang?: Language,
      bypassToggle = false,
      overrideVoiceId?: string
    ) => {
      if (typeof window === "undefined") return;
      if (!ttsOn && !bypassToggle) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const targetLang = forceLang ?? lang;
      const prefix = targetLang === "th-TH" ? "th" : "en";
      const activeVoiceId = overrideVoiceId ?? voiceMap[targetLang] ?? "";

      const presets =
        targetLang === "th-TH" ? THAI_MODEL_PRESETS : EN_MODEL_PRESETS;
      const matchedPreset = presets.find((p) => p.id === activeVoiceId);

      const effectiveRate = Math.max(
        0.25,
        Math.min(2.0, rate * (matchedPreset?.rateMultiplier ?? 1.0))
      );
      const effectivePitch = Math.max(
        0.5,
        Math.min(1.5, pitch + (matchedPreset?.pitchOffset ?? 0))
      );

      // Stop any previous speech or audio first
      if (speakTimerRef.current) {
        clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const voices =
        "speechSynthesis" in window ? window.speechSynthesis.getVoices() : [];
      const langVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(prefix)
      );

      // Use Cloud AI TTS if explicitly selected OR if no local voice exists for this language
      const shouldUseCloud =
        matchedPreset?.isCloudModel || langVoices.length === 0;

      if (shouldUseCloud) {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        const tl =
          matchedPreset?.cloudTl || (targetLang === "th-TH" ? "th" : "en");
        playCloudTts(trimmed, tl, effectiveRate, volume);
        return;
      }

      // Otherwise use Web Speech API with Chrome cancel/GC workarounds
      if (!("speechSynthesis" in window)) {
        const tl = targetLang === "th-TH" ? "th" : "en";
        playCloudTts(trimmed, tl, effectiveRate, volume);
        return;
      }

      const synth = window.speechSynthesis;
      const wasBusy = synth.speaking || synth.pending;
      if (wasBusy) {
        synth.cancel();
      }

      const startWebSpeech = () => {
        try {
          if (synth.paused) {
            synth.resume();
          }

          const utterance = new SpeechSynthesisUtterance(trimmed);
          utteranceRef.current = utterance;

          let selectedVoice: SpeechSynthesisVoice | undefined;
          if (matchedPreset) {
            utterance.lang = matchedPreset.lang;
            selectedVoice =
              langVoices.find(
                (v) =>
                  v.lang.toLowerCase() === matchedPreset.lang.toLowerCase()
              ) ?? langVoices[0];
          } else {
            selectedVoice =
              langVoices.find((v) => v.voiceURI === activeVoiceId) ??
              langVoices[0];
            utterance.lang = selectedVoice?.lang || targetLang;
          }

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

          utterance.rate = effectiveRate;
          utterance.pitch = effectivePitch;
          utterance.volume = volume;

          // Fallback to Cloud TTS if local Web Speech synthesis fails
          utterance.onerror = (ev) => {
            if (ev.error !== "canceled" && ev.error !== "interrupted") {
              const tl = targetLang === "th-TH" ? "th" : "en";
              playCloudTts(trimmed, tl, effectiveRate, volume);
            }
          };

          synth.speak(utterance);
        } catch {
          const tl = targetLang === "th-TH" ? "th" : "en";
          playCloudTts(trimmed, tl, effectiveRate, volume);
        }
      };

      // Chrome on Windows drops utterances if speak() is called on the exact same tick as cancel()
      if (wasBusy) {
        speakTimerRef.current = setTimeout(startWebSpeech, 45);
      } else {
        startWebSpeech();
      }
    },
    [lang, ttsOn, rate, pitch, volume, voiceMap, playCloudTts]
  );

  return {
    supported,
    filteredVoices,
    voiceModels,
    missingThaiVoice,
    speak,
    cancelSpeech,
  };
}
