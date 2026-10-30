"use client";

import React from "react";
import { Keyboard, Volume2, Palette, Sparkles } from "lucide-react";
import { LangToggle } from "./LangToggle";
import { useSettingsStore } from "@/store/useSettingsStore";
import { THEMES } from "@/lib/constants";

export function TopBar() {
  const { theme, setTheme } = useSettingsStore();

  return (
    <header className="flex w-full flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Brand Logo & Badge */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mt-accent to-mt-accent2 text-mt-bg shadow-lg">
          <Keyboard className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-extrabold tracking-tight text-mt-text sm:text-3xl">
              Type<span className="text-mt-accent">Speak</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-mt-accent2/20 px-2.5 py-0.5 text-[11px] font-semibold text-mt-accent2 ring-1 ring-mt-accent2/40">
              <Sparkles className="h-3 w-3" />
              <span>Student Edition</span>
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-mt-muted">
            <Volume2 className="h-3.5 w-3.5 text-mt-accent" />
            <span>ระบบฝึกพิมพ์ดีดและออกเสียง 2 ภาษา สไตล์วัยรุ่นมัธยม</span>
          </p>
        </div>
      </div>

      {/* Right Controls: Theme Switcher + Language Toggle */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Theme Selector Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-mt-muted/20 bg-mt-panel p-1.5 shadow-sm">
          <span
            className="flex items-center gap-1 px-2 text-xs font-medium text-mt-muted"
            title="เปลี่ยนธีมสี"
          >
            <Palette className="h-3.5 w-3.5 text-mt-accent2" />
            <span className="hidden md:inline">ธีมสี:</span>
          </span>
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-mt-bg text-mt-text shadow-sm ring-1 ring-mt-accent"
                    : "text-mt-muted hover:text-mt-text"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/30"
                  style={{
                    background: `linear-gradient(135deg, ${t.previewAccent}, ${t.previewAccent2})`,
                  }}
                />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        <LangToggle />
      </div>
    </header>
  );
}
