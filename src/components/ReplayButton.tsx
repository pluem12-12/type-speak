"use client";

import React from "react";
import { Volume2 } from "lucide-react";

interface ReplayButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function ReplayButton({
  onClick,
  disabled = false,
  label = "ฟังซ้ำ",
}: ReplayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="เล่นเสียงคำหรือประโยคปัจจุบันซ้ำ"
      className="flex items-center gap-1.5 rounded-md bg-mt-bg/60 px-2.5 py-1 text-xs font-medium text-mt-text transition-colors hover:bg-mt-accent hover:text-mt-bg disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Volume2 className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

