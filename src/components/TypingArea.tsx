"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MousePointerClick, RotateCcw, Sparkles } from "lucide-react";
import { useTypingStore, hasWordError } from "@/store/useTypingStore";
import { useSettingsStore } from "@/store/useSettingsStore";

interface TypingAreaProps {
  hiddenInputRef: React.RefObject<HTMLInputElement>;
  onSpeakWord: (word: string) => void;
  onRestart: () => void;
}

export function TypingArea({
  hiddenInputRef,
  onSpeakWord,
  onRestart,
}: TypingAreaProps) {
  const { words, wi, ci, status, isFocused, restartVersion, setFocused } =
    useTypingStore();
  const { lang, mode, sentenceLength } = useSettingsStore();

  const wordsWrapperRef = useRef<HTMLDivElement | null>(null);
  const wordElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [caretPos, setCaretPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 4,
  });
  const [translateY, setTranslateY] = useState<number>(0);
  const [lineHeightPx, setLineHeightPx] = useState<number>(48);

  const updateCaretAndScroll = useCallback(() => {
    const wrapper = wordsWrapperRef.current;
    const activeWordEl = wordElementsRef.current[wi];
    if (!wrapper || !activeWordEl) return;

    const firstWordEl = wordElementsRef.current[0];
    const firstCharEl = firstWordEl?.querySelector<HTMLSpanElement>(".char");
    const baseTop =
      firstWordEl && firstCharEl
        ? firstWordEl.offsetTop + firstCharEl.offsetTop
        : firstWordEl
        ? firstWordEl.offsetTop
        : 0;

    // Detect single row height accurately by scanning characters until the first line wrap
    let detectedRowHeight = 48;
    const allChars = wrapper.querySelectorAll<HTMLSpanElement>(".char");
    for (let i = 1; i < allChars.length; i++) {
      const ch = allChars[i];
      const parentWord = ch.parentElement as HTMLElement | null;
      if (!parentWord) continue;
      const chTop = parentWord.offsetTop + ch.offsetTop;
      if (chTop > baseTop + 10) {
        detectedRowHeight = chTop - baseTop;
        break;
      }
    }
    setLineHeightPx(detectedRowHeight);

    const charSpans = activeWordEl.querySelectorAll<HTMLSpanElement>(".char");
    let x = activeWordEl.offsetLeft;
    let y = activeWordEl.offsetTop;

    if (charSpans.length > 0) {
      if (ci < charSpans.length) {
        const targetSpan = charSpans[ci];
        x = activeWordEl.offsetLeft + targetSpan.offsetLeft;
        y = activeWordEl.offsetTop + targetSpan.offsetTop;
      } else {
        const lastSpan = charSpans[charSpans.length - 1];
        x =
          activeWordEl.offsetLeft +
          lastSpan.offsetLeft +
          lastSpan.offsetWidth;
        y = activeWordEl.offsetTop + lastSpan.offsetTop;
      }
    }

    const charTopRelativeToFirstLine = Math.max(0, y - baseTop);
    const currentLineIndex = Math.round(
      charTopRelativeToFirstLine / detectedRowHeight
    );
    // Keep active line on middle row (row index 1 of 0, 1, 2)
    const scrollLines = Math.max(0, currentLineIndex - 1);
    setTranslateY(-scrollLines * detectedRowHeight);

    setCaretPos({ x, y });
  }, [wi, ci]);

  useEffect(() => {
    updateCaretAndScroll();
  }, [
    wi,
    ci,
    words,
    restartVersion,
    lang,
    mode,
    sentenceLength,
    updateCaretAndScroll,
  ]);

  useEffect(() => {
    const handleResize = () => updateCaretAndScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCaretAndScroll]);

  const handleContainerClick = () => {
    setFocused(true);
    hiddenInputRef.current?.focus();
  };

  const handleWordClick = (e: React.MouseEvent, targetWord: string) => {
    e.stopPropagation();
    onSpeakWord(targetWord);
    setFocused(true);
    hiddenInputRef.current?.focus();
  };

  const viewportHeight = lineHeightPx * 3;

  return (
    <div className="relative flex flex-col gap-4">
      {/* Hidden input for mobile virtual keyboard and focus tracking */}
      <input
        ref={hiddenInputRef}
        type="text"
        value=""
        onChange={() => {
          // Handled via document keydown listener & onInput fallback for mobile
        }}
        onInput={(e) => {
          const inputEl = e.currentTarget;
          const val = inputEl.value;
          if (val && val.length > 0) {
            const lastChar = val[val.length - 1];
            const store = useTypingStore.getState();
            const settings = useSettingsStore.getState();
            if (lastChar === " ") {
              const { wordChanged } = store.nextWord(settings.mode, settings.lang);
              if (wordChanged && settings.mode !== "sentence") {
                const updated = useTypingStore.getState();
                const nextW = updated.words[updated.wi]?.target;
                if (nextW) onSpeakWord(nextW);
              }
            } else {
              store.typeChar(lastChar, settings.mode, settings.lang);
            }
            inputEl.value = "";
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="พื้นที่รับการพิมพ์"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="pointer-events-none fixed left-0 top-0 h-0 w-0 opacity-0"
      />

      {/* Colorful Framed Card for Typing Area */}
      <div className="panel-glow relative rounded-2xl border-2 border-mt-accent/30 bg-mt-panel/75 p-5 sm:p-7">
        {/* Unfocused Hint Overlay */}
        {!isFocused && status !== "finished" && (
          <div
            onClick={handleContainerClick}
            className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center rounded-2xl bg-mt-bg/85 backdrop-blur-sm transition-opacity"
          >
            <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-mt-accent to-mt-accent2 px-5 py-3 text-sm font-bold text-mt-bg shadow-xl transition-transform hover:scale-105">
              <MousePointerClick className="h-5 w-5" />
              <span>คลิกที่นี่เพื่อเริ่มพิมพ์และฟังเสียง</span>
            </div>
          </div>
        )}

        {/* 3-line Viewport Container */}
        <div
          onClick={handleContainerClick}
          style={{ height: `${viewportHeight}px` }}
          className="relative w-full cursor-text select-none overflow-hidden py-1"
        >
          {/* Words Scrolling Wrapper */}
          <div
            ref={wordsWrapperRef}
            style={{
              transform: `translateY(${translateY}px)`,
            }}
            className={`relative flex flex-wrap content-start font-mono text-xl leading-9 transition-transform duration-150 ease-out sm:text-2xl sm:leading-10 ${
              mode === "sentence" ? "gap-x-2.5 gap-y-3" : "gap-x-3.5 gap-y-3"
            }`}
          >
            {/* Glowing Smooth Caret */}
            <div
              style={{
                transform: `translate3d(${caretPos.x}px, ${caretPos.y + 4}px, 0)`,
              }}
              className={`caret-glow pointer-events-none absolute left-0 top-0 z-10 h-7 w-[3px] rounded-full bg-gradient-to-b from-mt-accent to-mt-accent2 transition-transform duration-75 ease-out sm:h-8 ${
                status === "idle" && isFocused ? "caret-blink" : ""
              }`}
            />

            {words.map((wordItem, wIndex) => {
              const isPastWord = wIndex < wi;
              const isCurrentWord = wIndex === wi;
              const wordError = hasWordError(wordItem, isPastWord);
              const extraTyped =
                wordItem.typed.length > wordItem.target.length
                  ? wordItem.typed.slice(wordItem.target.length)
                  : "";
              const waitingForSpaceAtClauseEnd =
                mode === "sentence" &&
                isCurrentWord &&
                ci >= wordItem.target.length &&
                wIndex < words.length - 1;

              return (
                <div
                  key={wIndex}
                  ref={(el) => {
                    wordElementsRef.current[wIndex] = el;
                  }}
                  onClick={(e) => handleWordClick(e, wordItem.target)}
                  title="คลิกเพื่อฟังเสียงอ่านส่วนนี้"
                  className={`word relative inline-block rounded-lg px-1.5 py-0.5 transition-all hover:bg-mt-accent/15 ${
                    wordError
                      ? "underline decoration-mt-error decoration-2 underline-offset-4"
                      : ""
                  } ${
                    isCurrentWord
                      ? "active bg-mt-accent/15 ring-1 ring-mt-accent/40"
                      : ""
                  }`}
                >
                  {wordItem.target.split("").map((targetChar, cIndex) => {
                    const hasTypedChar = cIndex < wordItem.typed.length;
                    const typedChar = wordItem.typed[cIndex];
                    let colorClass = isCurrentWord
                      ? "text-mt-text/80"
                      : "text-mt-muted";

                    if (hasTypedChar) {
                      colorClass =
                        typedChar === targetChar
                          ? "text-mt-accent font-semibold"
                          : "text-mt-error font-semibold";
                    } else if (isPastWord && wordItem.skippedWithMissed > 0) {
                      colorClass = "text-mt-muted/40";
                    }

                    return (
                      <span key={cIndex} className={`char ${colorClass}`}>
                        {targetChar}
                      </span>
                    );
                  })}

                  {/* Extra characters typed beyond word length */}
                  {extraTyped.split("").map((extraChar, eIndex) => (
                    <span
                      key={`extra-${eIndex}`}
                      className="char font-semibold text-mt-errorExtra"
                    >
                      {extraChar}
                    </span>
                  ))}

                  {/* Subtle Spacebar hint when reaching grammatical space between clauses in sentence mode */}
                  {waitingForSpaceAtClauseEnd && (
                    <span className="ml-1 inline-block rounded bg-mt-accent2/25 px-1 font-sans text-xs font-bold text-mt-accent2 ring-1 ring-mt-accent2/50">
                      Space ␣
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Quick Restart Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-mt-muted">
          <Sparkles className="h-3.5 w-3.5 text-mt-accent2" />
          <span>
            {mode === "sentence"
              ? "โหมดประโยค: พิมพ์ข้อความติดกันในแต่ละวรรค แล้วกด Spacebar เพื่อเว้นวรรคไปยังวรรคถัดไป"
              : "เคล็ดลับ: คลิกที่คำใดก็ได้บนหน้าจอเพื่อฟังการออกเสียงซ้ำทีละคำ"}
          </span>
        </div>

        <button
          type="button"
          onClick={onRestart}
          title="เริ่มรอบใหม่ (Tab + Enter)"
          className="flex items-center gap-2 rounded-xl border border-mt-accent/30 bg-mt-panel px-4 py-2 text-sm font-medium text-mt-text shadow-sm transition-all hover:border-mt-accent hover:bg-mt-accent hover:text-mt-bg"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{mode === "sentence" ? "สุ่มประโยคใหม่" : "สุ่มคำ / เริ่มรอบใหม่"}</span>
          <kbd className="ml-1 rounded bg-mt-bg/40 px-1.5 py-0.5 font-mono text-[11px] ring-1 ring-current/20">
            Tab + Enter
          </kbd>
        </button>
      </div>
    </div>
  );
}
