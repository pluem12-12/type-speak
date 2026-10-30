"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
}

export interface UseTtsReturn {
  supported: boolean;
  filteredVoices: SpeechSynthesisVoice[];
  voiceModels: VoiceModelOption[];
  missingThaiVoice: boolean;
  speak: (text: string, forceLang?: Language, bypassToggle?: boolean) => void;
  cancelSpeech: () => void;
}

const THAI_MODEL_PRESETS: VoiceModelOption[] = [
  {
    id: "preset:th-standard",
    label: "Thai Standard — โมเดลเสียงมาตรฐาน (ชัดเจน)",
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
    pitchOffset: 0.15,
    isSyntheticPreset: true,
  },
  {
    id: "preset:th-male-deep",
    label: "Thai Deep Tone — โมเดลโทนเสียงทุ้มลึก",
    voiceURI: "",
    lang: "th-TH",
    rateMultiplier: 0.95,
    pitchOffset: -0.2,
    isSyntheticPreset: true,
  },
];

const EN_MODEL_PRESETS: VoiceModelOption[] = [
  {
    id: "preset:en-us-standard",
    label: "English (US) Standard — โมเดลสำเนียงอเมริกันมาตรฐาน",
    voiceURI: "",
    lang: "en-US",
    rateMultiplier: 1.0,
    pitchOffset: 0,
    isSyntheticPreset: true,
  },
  {
    id: "preset:en-gb-rp",
    label: "English (UK) British — โมเดลสำเนียงบริติช",
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
    pitchOffset: -0.15,
    isSyntheticPreset: true,
  },
];

export function useTts(): UseTtsReturn {
  const { lang, ttsOn, voiceMap, rate, pitch, volume, setVoiceForLang } =
    useSettingsStore();
  const [supported, setSupported] = useState<boolean>(true);
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);

  const loadVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAllVoices(voices);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    loadVoices();

    const synth = window.speechSynthesis;
    synth.addEventListener("voiceschanged", loadVoices);

    const handleVisibilityChange = () => {
      if (document.hidden && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
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

  // Combine real browser voices with curated language model presets so user always has rich choices
  const voiceModels = useMemo<VoiceModelOption[]>(() => {
    const nativeOptions: VoiceModelOption[] = filteredVoices.map((v) => ({
      id: v.voiceURI,
      label: `${v.name} (${v.lang})`,
      voiceURI: v.voiceURI,
      lang: v.lang,
      rateMultiplier: 1.0,
      pitchOffset: 0,
      isSyntheticPreset: false,
    }));

    const presets = lang === "th-TH" ? THAI_MODEL_PRESETS : EN_MODEL_PRESETS;
    return [...nativeOptions, ...presets];
  }, [filteredVoices, lang]);

  // Auto-select default voice model for current language if not yet saved or invalid
  useEffect(() => {
    if (voiceModels.length === 0) return;
    const savedId = voiceMap[lang];
    const exists = voiceModels.some((m) => m.id === savedId);
    if (!savedId || !exists) {
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
  }, [voiceModels, lang, voiceMap, setVoiceForLang]);

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (text: string, forceLang?: Language, bypassToggle = false) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      if (!ttsOn && !bypassToggle) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const targetLang = forceLang ?? lang;
      const prefix = targetLang === "th-TH" ? "th" : "en";

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(trimmed);
        const voices = window.speechSynthesis.getVoices();
        const langVoices = voices.filter((v) =>
          v.lang.toLowerCase().startsWith(prefix)
        );

        const savedId = voiceMap[targetLang];
        const presets =
          targetLang === "th-TH" ? THAI_MODEL_PRESETS : EN_MODEL_PRESETS;
        const matchedPreset = presets.find((p) => p.id === savedId);

        let effectiveRate = rate;
        let effectivePitch = pitch;
        let selectedVoice: SpeechSynthesisVoice | undefined;

        if (matchedPreset) {
          utterance.lang = matchedPreset.lang;
          effectiveRate = Math.max(
            0.25,
            Math.min(2.0, rate * matchedPreset.rateMultiplier)
          );
          effectivePitch = Math.max(
            0.5,
            Math.min(1.5, pitch + matchedPreset.pitchOffset)
          );
          // Match a voice with the preset's specific locale if available (e.g. en-GB vs en-US)
          selectedVoice =
            langVoices.find(
              (v) =>
                v.lang.toLowerCase() === matchedPreset.lang.toLowerCase()
            ) ?? langVoices[0];
        } else {
          utterance.lang = targetLang;
          selectedVoice =
            langVoices.find((v) => v.voiceURI === savedId) ?? langVoices[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = effectiveRate;
        utterance.pitch = effectivePitch;
        utterance.volume = volume;

        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore browser speech synthesis edge-case errors
      }
    },
    [lang, ttsOn, rate, pitch, volume, voiceMap]
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
