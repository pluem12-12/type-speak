"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Language } from "@/lib/constants";

export function LangToggle() {
  const { lang, setLang } = useSettingsStore();

  const handleSelect = (nextLang: Language) => {
    if (nextLang === lang) return;
    setLang(nextLang);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg bg-mt-panel p-1 text-sm">
      <Globe className="ml-2 mr-1 h-4 w-4 text-mt-muted" />
      <button
        type="button"
        onClick={() => handleSelect("en-US")}
        className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
          lang === "en-US"
            ? "bg-mt-accent text-mt-bg font-semibold"
            : "text-mt-muted hover:text-mt-text"
        }`}
      >
        EN (English)
      </button>
      <button
        type="button"
        onClick={() => handleSelect("th-TH")}
        className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
          lang === "th-TH"
            ? "bg-mt-accent text-mt-bg font-semibold"
            : "text-mt-muted hover:text-mt-text"
        }`}
      >
        TH (ภาษาไทย)
      </button>
    </div>
  );
}

