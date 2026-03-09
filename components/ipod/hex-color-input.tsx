"use client";

import { useState, useCallback, useRef } from "react";
import { isHexColor } from "@/lib/storage";

interface HexColorInputProps {
  value: string;
  onChange: (color: string) => void;
}

function normalize3to6(hex: string): string {
  if (hex.length === 4) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return hex.toUpperCase();
}

export function HexColorInput({ value, onChange }: HexColorInputProps) {
  const [draft, setDraft] = useState(value.replace("#", "").toUpperCase());
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCommitted = useRef(value.toUpperCase());

  const commit = useCallback(
    (raw: string) => {
      const candidate = `#${raw}`;
      if (isHexColor(candidate)) {
        const normalized = normalize3to6(candidate);
        lastCommitted.current = normalized;
        setDraft(normalized.replace("#", ""));
        onChange(normalized);
      } else {
        setDraft(lastCommitted.current.replace("#", ""));
      }
    },
    [onChange],
  );

  // Sync when parent value changes externally
  if (value.toUpperCase() !== lastCommitted.current) {
    lastCommitted.current = value.toUpperCase();
    setDraft(value.replace("#", "").toUpperCase());
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 px-1">
      <div
        className="w-5 h-5 rounded-full border border-[#B5BBC3] shrink-0"
        style={{ backgroundColor: isHexColor(`#${draft}`) ? `#${draft}` : value }}
      />
      <span className="text-[11px] font-mono text-[#6B7280] select-none">#</span>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={6}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        className="w-[4.5rem] text-[11px] font-mono bg-white/80 border border-[#CDD1D6] rounded px-1.5 py-0.5 text-[#111827] outline-none focus:border-[#9CA3AF] uppercase tracking-wider"
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
          setDraft(cleaned);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(draft);
            inputRef.current?.blur();
          }
        }}
        onBlur={() => commit(draft)}
      />
    </div>
  );
}
