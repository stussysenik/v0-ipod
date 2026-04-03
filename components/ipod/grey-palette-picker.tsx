"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import {
  BACKGROUND_CURATED_FAVORITES,
  CASE_CURATED_FAVORITES,
  colorManifest,
} from "@/lib/color-manifest";

// --- Data Model ---

export type GreyFamilyId = "neutral" | "warm" | "cool" | "greige" | "sage" | "lavender";

interface GreyFamily {
  label: string;
  hue: number;
  chroma: number;
}

const GREY_FAMILIES: Record<GreyFamilyId, GreyFamily> = {
  neutral: {
    label: colorManifest.greyFamilies.neutral.label,
    hue: colorManifest.greyFamilies.neutral.oklchHue,
    chroma: colorManifest.greyFamilies.neutral.oklchChroma,
  },
  warm: {
    label: colorManifest.greyFamilies.warm.label,
    hue: colorManifest.greyFamilies.warm.oklchHue,
    chroma: colorManifest.greyFamilies.warm.oklchChroma,
  },
  cool: {
    label: colorManifest.greyFamilies.cool.label,
    hue: colorManifest.greyFamilies.cool.oklchHue,
    chroma: colorManifest.greyFamilies.cool.oklchChroma,
  },
  greige: {
    label: colorManifest.greyFamilies.greige.label,
    hue: colorManifest.greyFamilies.greige.oklchHue,
    chroma: colorManifest.greyFamilies.greige.oklchChroma,
  },
  sage: {
    label: colorManifest.greyFamilies.sage.label,
    hue: colorManifest.greyFamilies.sage.oklchHue,
    chroma: colorManifest.greyFamilies.sage.oklchChroma,
  },
  lavender: {
    label: colorManifest.greyFamilies.lavender.label,
    hue: colorManifest.greyFamilies.lavender.oklchHue,
    chroma: colorManifest.greyFamilies.lavender.oklchChroma,
  },
};

const FAMILY_IDS: GreyFamilyId[] = [
  "neutral",
  "warm",
  "cool",
  "greige",
  "sage",
  "lavender",
];

// 23 perceptually-spaced lightness stops: denser in the mid-range
const LIGHTNESS_STOPS = colorManifest.greyLightnessStops;

const GREY_FAMILY_STORAGE_KEY = "ipodSnapshotGreyFamily";

function isGreyFamilyId(value: unknown): value is GreyFamilyId {
  return typeof value === "string" && FAMILY_IDS.includes(value as GreyFamilyId);
}

function loadGreyFamily(): GreyFamilyId {
  try {
    const raw = localStorage.getItem(GREY_FAMILY_STORAGE_KEY);
    return isGreyFamilyId(raw) ? raw : "neutral";
  } catch {
    return "neutral";
  }
}

function saveGreyFamily(id: GreyFamilyId): void {
  try {
    localStorage.setItem(GREY_FAMILY_STORAGE_KEY, id);
  } catch {
    // Ignore quota errors
  }
}

// --- Ramp Builder ---

interface GreySwatch {
  label: string;
  hex: string;
  lightness: number;
}

function buildGreyRamp(
  familyId: GreyFamilyId,
  family: GreyFamily,
  oklchToHex: (l: number, c: number, h: number) => string | null,
  oklchReady: boolean,
): GreySwatch[] {
  const swatches: GreySwatch[] = [];
  const seenHex = new Set<string>();

  for (const l of LIGHTNESS_STOPS) {
    // At L=0 and L=1, all families converge — only include in neutral
    if ((l === 0 || l === 1) && familyId !== "neutral") continue;

    let hex: string | null = null;

    if (oklchReady && family.chroma > 0) {
      hex = oklchToHex(l, family.chroma, family.hue);
    }

    // Fallback: pure sRGB grey
    if (!hex) {
      const v = Math.round(l * 255);
      hex = `#${v.toString(16).padStart(2, "0").repeat(3)}`.toUpperCase();
    }

    // Deduplicate adjacent stops producing identical hex
    if (seenHex.has(hex)) continue;
    seenHex.add(hex);

    const pct = Math.round(l * 100);
    swatches.push({
      label: `${family.label} ${pct}`,
      hex,
      lightness: l,
    });
  }

  return swatches;
}

// --- Component ---

interface GreyPalettePickerProps {
  target: "case" | "bg";
  currentColor: string;
  onColorSelect: (hex: string) => void;
  onColorCommit: (hex: string) => void;
  oklchToHex: (l: number, c: number, h: number) => string | null;
  oklchReady: boolean;
}

export function GreyPalettePicker({
  target,
  currentColor,
  onColorSelect,
  onColorCommit,
  oklchToHex,
  oklchReady,
}: GreyPalettePickerProps) {
  const [activeFamily, setActiveFamily] = useState<GreyFamilyId>("neutral");

  // Restore persisted family on mount
  useEffect(() => {
    setActiveFamily(loadGreyFamily());
  }, []);

  const handleFamilyChange = useCallback((id: GreyFamilyId) => {
    setActiveFamily(id);
    saveGreyFamily(id);
  }, []);

  const family = GREY_FAMILIES[activeFamily];

  const ramp = useMemo(
    () => buildGreyRamp(activeFamily, family, oklchToHex, oklchReady),
    [activeFamily, family, oklchToHex, oklchReady],
  );

  // Build gradient CSS from ramp hex values
  const gradientCss = useMemo(
    () => `linear-gradient(to right, ${ramp.map((s) => s.hex).join(", ")})`,
    [ramp],
  );

  const curated =
    target === "case" ? CASE_CURATED_FAVORITES : BACKGROUND_CURATED_FAVORITES;
  const isCase = target === "case";
  const swatchSize = isCase ? "w-7 h-7" : "w-6 h-6";
  const curatedSize = "w-5 h-5";

  const currentUpper = currentColor.toUpperCase();

  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
        Studio Palette
      </h4>

      {/* A. Undertone Tab Bar */}
      <div
        className="flex gap-1 mb-2 px-0.5"
        role="tablist"
        aria-label="Grey undertone families"
      >
        {FAMILY_IDS.map((id) => {
          const f = GREY_FAMILIES[id];
          const isActive = id === activeFamily;
          // Mid-grey dot at L=0.50 for visual reference
          const dotHex =
            oklchReady && f.chroma > 0
              ? (oklchToHex(0.5, f.chroma, f.hue) ?? "#808080")
              : "#808080";

          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleFamilyChange(id)}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-full text-[9px] font-semibold leading-none transition-colors duration-200 ${
                isActive
                  ? "bg-[#111827] text-white"
                  : "bg-white/80 text-[#6B7280] hover:bg-white hover:text-[#374151]"
              }`}
              title={f.label}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: dotHex }}
              />
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* B. Gradient Preview Bar */}
      <div
        className="h-2.5 rounded-full mb-2 mx-0.5 border border-black/5"
        style={{ background: gradientCss }}
        aria-hidden="true"
      />

      {/* C. Swatch Grid */}
      <div
        key={activeFamily}
        className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
      >
        <div
          className={`grid ${isCase ? "grid-cols-7 sm:grid-cols-8" : "grid-cols-7 sm:grid-cols-8"} gap-1.5 mb-2`}
        >
          {ramp.map((swatch) => {
            const isSelected = swatch.hex === currentUpper;
            return (
              <button
                key={swatch.hex}
                onClick={() => {
                  onColorSelect(swatch.hex);
                  onColorCommit(swatch.hex);
                }}
                title={swatch.label}
                className={`${swatchSize} rounded-full border transition-all duration-150 ease-out hover:scale-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${
                  isSelected
                    ? "border-[#111827] scale-105 ring-2 ring-[#CDD1D6]"
                    : "border-[#B5BBC3]"
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            );
          })}
          {/* System Color Picker — native input, tap-friendly */}
          <div
            className={`relative ${swatchSize} rounded-full border border-dashed border-[#7A838E] flex items-center justify-center hover:border-[#111827] cursor-pointer overflow-hidden transition-colors`}
          >
            <Plus
              className={`${isCase ? "w-4 h-4" : "w-3 h-3"} text-[#4B5563] pointer-events-none`}
            />
            <input
              type="color"
              data-testid={isCase ? "custom-case-color-button" : "custom-bg-color-button"}
              value={currentColor}
              onInput={(e) => onColorSelect((e.target as HTMLInputElement).value)}
              onChange={(e) => {
                onColorSelect(e.target.value);
                onColorCommit(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title={`Custom ${target} color`}
              aria-label={`Open custom ${target} color picker`}
            />
          </div>
        </div>
      </div>

      {/* D. Curated Favorites Row */}
      <div className="flex flex-wrap gap-1.5 px-0.5">
        {curated.map((c) => {
          const isSelected = c.value.toUpperCase() === currentUpper;
          return (
            <button
              key={c.value}
              onClick={() => {
                onColorSelect(c.value);
                onColorCommit(c.value);
              }}
              title={c.label}
              className={`${curatedSize} rounded-full border transition-all duration-150 ease-out hover:scale-110 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${
                isSelected ? "border-[#111827] ring-2 ring-[#CDD1D6]" : "border-[#B5BBC3]"
              }`}
              style={{ backgroundColor: c.value }}
            />
          );
        })}
      </div>
    </div>
  );
}
