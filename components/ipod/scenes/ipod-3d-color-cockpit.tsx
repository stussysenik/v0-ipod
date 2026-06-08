"use client";

import { useMemo, type Dispatch } from "react";

import {
	CASE_CURATED_FAVORITES,
	deriveWheelColors,
	IPOD_6G_BLACK,
	IPOD_6G_SILVER,
} from "@/lib/color-manifest";
import {
	DEFAULT_BACK_COLOR,
	DEFAULT_BEZEL_COLOR,
	type IpodPresentationState,
} from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";

/**
 * The monochrome color cockpit for the /3d now-playing stage.
 *
 * Design language: principled subtraction. A single white card framed by one
 * hairline, black type, no shadow stack — an industrial control strip, not a
 * floating glass panel. Every body part is one thin row you can recolor; the
 * helper tools (preloaded Black/White, derive, shuffle, favorites) make
 * quick-swapping a one-tap gesture rather than a chat loop.
 *
 * The data drives the UI: parts, presets, and favorites are plain arrays routed
 * to the same reducer actions the workbench uses, so the 3D body and the 2D
 * authoring surface stay one source of truth.
 */

// ─── Preloaded finishes (the two assets that ship ready) ───────────────────────────
// Each is a coherent, physically-plausible look: an anodized face, derived wheel,
// the steel back, a near-black bezel, and a clean stage. Black & White only — the
// rest of the spectrum lives one native-picker tap away.

interface FinishAsset {
	id: "black" | "silver";
	label: string;
	swatch: string;
	skinColor: string;
	backColor: string;
	bezelColor: string;
	bgColor: string;
}

const PRELOADED_FINISHES: readonly FinishAsset[] = [
	{
		id: "black",
		label: "Black",
		swatch: IPOD_6G_BLACK,
		skinColor: IPOD_6G_BLACK, // black anodized aluminum face
		backColor: DEFAULT_BACK_COLOR, // mirror steel back
		bezelColor: DEFAULT_BEZEL_COLOR,
		bgColor: "#FFFFFF",
	},
	{
		id: "silver",
		label: "Silver",
		swatch: "#D6D8DA",
		// The 2008 Classic's light finish was silver anodized ALUMINUM, never
		// paper-white — a cool neutral gray whose brightness comes from the metal
		// reflecting the studio env, not a white albedo.
		skinColor: IPOD_6G_SILVER,
		backColor: DEFAULT_BACK_COLOR,
		bezelColor: DEFAULT_BEZEL_COLOR,
		bgColor: "#FFFFFF",
	},
] as const;

// ─── Body parts (one row each) ─────────────────────────────────────────────────────

type PartAction = Extract<
	IpodWorkbenchAction,
	{
		type:
			| "SET_SKIN_COLOR"
			| "SET_RING_COLOR"
			| "SET_CENTER_COLOR"
			| "SET_BACK_COLOR"
			| "SET_BEZEL_COLOR"
			| "SET_BG_COLOR";
	}
>["type"];

interface PartRow {
	id: string;
	label: string;
	action: PartAction;
	value: (p: IpodPresentationState, derived: ReturnType<typeof deriveWheelColors>) => string;
}

const PARTS: readonly PartRow[] = [
	{ id: "case", label: "Case", action: "SET_SKIN_COLOR", value: (p) => p.skinColor },
	{
		id: "ring",
		label: "Wheel",
		action: "SET_RING_COLOR",
		value: (p, d) => p.ringColor || d.gradient.via,
	},
	{
		id: "center",
		label: "Center",
		action: "SET_CENTER_COLOR",
		value: (p, d) => p.centerColor || d.centerGradient.via,
	},
	{ id: "back", label: "Back", action: "SET_BACK_COLOR", value: (p) => p.backColor },
	{ id: "bezel", label: "Bezel", action: "SET_BEZEL_COLOR", value: (p) => p.bezelColor },
	{ id: "bg", label: "Stage", action: "SET_BG_COLOR", value: (p) => p.bgColor },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────────

function normalizeHex(hex: string): string {
	return hex.trim().toLowerCase();
}

function randomCaseHex(): string {
	// Bias toward saturated-but-legible cases so a shuffle lands somewhere usable.
	const h = Math.floor(Math.random() * 360);
	const s = 45 + Math.floor(Math.random() * 40);
	const l = 38 + Math.floor(Math.random() * 30);
	return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
	const sN = s / 100;
	const lN = l / 100;
	const c = (1 - Math.abs(2 * lN - 1)) * sN;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = lN - c / 2;
	let r = 0;
	let g = 0;
	let b = 0;
	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	const to = (v: number) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${to(r)}${to(g)}${to(b)}`;
}

/** A complete coordinated look: every exterior surface + the stage behind it. */
interface DeviceLook {
	id: string;
	label: string;
	skinColor: string;
	backColor: string;
	bezelColor: string;
	bgColor: string;
}

/**
 * My curated /3d looks — full coordinated combinations, not just a case colour. Each pairs an
 * anodized case with a bezel that's a deep shade of the SAME hue, the factory steel back, and a
 * stage chosen to separate the silhouette (light case → dark-ish stage and vice-versa). Picking
 * one sets the whole device in a tap; the wheel re-derives from the case.
 */
const CURATED_LOOKS: readonly DeviceLook[] = [
	{ id: "graphite", label: "Graphite", skinColor: "#2A2D31", backColor: DEFAULT_BACK_COLOR, bezelColor: "#070809", bgColor: "#0B0D12" },
	{ id: "bondi", label: "Bondi", skinColor: "#0E7C9B", backColor: DEFAULT_BACK_COLOR, bezelColor: "#06171D", bgColor: "#F2F6F7" },
	{ id: "crimson", label: "Crimson", skinColor: "#B5121B", backColor: DEFAULT_BACK_COLOR, bezelColor: "#1A0606", bgColor: "#FBEDED" },
	{ id: "gold", label: "Gold", skinColor: "#C9A86A", backColor: DEFAULT_BACK_COLOR, bezelColor: "#1A1408", bgColor: "#FAF6EE" },
	{ id: "cobalt", label: "Cobalt", skinColor: "#2B4C8C", backColor: DEFAULT_BACK_COLOR, bezelColor: "#070B16", bgColor: "#EEF1F8" },
	{ id: "sage", label: "Sage", skinColor: "#7E8C6A", backColor: DEFAULT_BACK_COLOR, bezelColor: "#10130C", bgColor: "#F2F4ED" },
] as const;

/**
 * A random but *compatible* combination — "compatibility shades". One base hue drives the case
 * and (as a deep low-light shade) the bezel; the stage takes an analogous hue at the OPPOSITE
 * lightness so the device always separates from its backdrop. Coherent by construction, so a
 * shuffle never lands on a clashing or invisible combo.
 */
function randomCompatibleLook(): DeviceLook {
	const baseH = Math.floor(Math.random() * 360);
	const s = 45 + Math.floor(Math.random() * 35);
	const l = 38 + Math.floor(Math.random() * 26);
	const skinColor = hslToHex(baseH, s, l);
	const accentH = (baseH + (Math.random() < 0.5 ? 32 : -32) + 360) % 360;
	const lightStage = l < 50;
	const bgColor = lightStage ? hslToHex(accentH, 10, 94) : hslToHex(accentH, 16, 10);
	const bezelColor = hslToHex(baseH, 18, 8);
	return { id: "random", label: "Random", skinColor, backColor: DEFAULT_BACK_COLOR, bezelColor, bgColor };
}

// ─── Component ─────────────────────────────────────────────────────────────────────

interface Ipod3DColorCockpitProps {
	presentation: IpodPresentationState;
	dispatch: Dispatch<IpodWorkbenchAction>;
}

export function Ipod3DColorCockpit({ presentation, dispatch }: Ipod3DColorCockpitProps) {
	const derived = useMemo(
		() => deriveWheelColors(presentation.skinColor),
		[presentation.skinColor],
	);

	const activeFinish = PRELOADED_FINISHES.find(
		(f) => normalizeHex(f.skinColor) === normalizeHex(presentation.skinColor),
	)?.id;

	const applyFinish = (f: FinishAsset) => {
		dispatch({ type: "SET_SKIN_COLOR", payload: f.skinColor });
		dispatch({ type: "SET_BACK_COLOR", payload: f.backColor });
		dispatch({ type: "SET_BEZEL_COLOR", payload: f.bezelColor });
		dispatch({ type: "SET_BG_COLOR", payload: f.bgColor });
		// Re-derive the wheel from the new case so the look stays coherent.
		const d = deriveWheelColors(f.skinColor);
		dispatch({ type: "SET_RING_COLOR", payload: d.gradient.via });
		dispatch({ type: "SET_CENTER_COLOR", payload: d.centerGradient.via });
	};

	// Apply a complete coordinated look (curated or random): every surface + stage + a wheel
	// re-derived from the new case, so the device stays one coherent object.
	const applyLook = (look: DeviceLook) => {
		dispatch({ type: "SET_SKIN_COLOR", payload: look.skinColor });
		dispatch({ type: "SET_BACK_COLOR", payload: look.backColor });
		dispatch({ type: "SET_BEZEL_COLOR", payload: look.bezelColor });
		dispatch({ type: "SET_BG_COLOR", payload: look.bgColor });
		const d = deriveWheelColors(look.skinColor);
		dispatch({ type: "SET_RING_COLOR", payload: d.gradient.via });
		dispatch({ type: "SET_CENTER_COLOR", payload: d.centerGradient.via });
	};

	const deriveWheelFromCase = () => {
		dispatch({ type: "SET_RING_COLOR", payload: derived.gradient.via });
		dispatch({ type: "SET_CENTER_COLOR", payload: derived.centerGradient.via });
	};

	const shuffle = () => {
		const next = randomCaseHex();
		dispatch({ type: "SET_SKIN_COLOR", payload: next });
		const d = deriveWheelColors(next);
		dispatch({ type: "SET_RING_COLOR", payload: d.gradient.via });
		dispatch({ type: "SET_CENTER_COLOR", payload: d.centerGradient.via });
	};

	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			{/* Finish — the preloaded assets */}
			<div className="border-b border-black/[0.06] px-3.5 pb-3 pt-3">
				<Label>Finish</Label>
				<div className="mt-2 flex gap-1.5">
					{PRELOADED_FINISHES.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={() => applyFinish(f)}
							className={`flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
								activeFinish === f.id
									? "border-black/80 text-black"
									: "border-black/10 text-black/55 hover:border-black/25 hover:text-black/80"
							}`}
						>
							<span
								className="h-3 w-3 rounded-full border border-black/15"
								style={{ backgroundColor: f.swatch }}
							/>
							{f.label}
						</button>
					))}
				</div>
			</div>

			{/* Per-part color rows */}
			<div className="px-3.5 py-2">
				{PARTS.map((part) => {
					const value = part.value(presentation, derived);
					return (
						<label
							key={part.id}
							className="group flex h-8 cursor-pointer items-center justify-between"
						>
							<span className="text-[11px] font-medium text-black/55 group-hover:text-black/80">
								{part.label}
							</span>
							<span className="flex items-center gap-2">
								<span className="font-mono text-[10px] uppercase tracking-tight text-black/35 group-hover:text-black/55">
									{value}
								</span>
								<span
									className="relative h-5 w-5 rounded-md border border-black/15 transition-transform group-hover:scale-105"
									style={{ backgroundColor: value }}
								>
									<input
										type="color"
										value={value}
										onChange={(e) =>
											dispatch({ type: part.action, payload: e.target.value })
										}
										className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
										aria-label={`${part.label} color`}
									/>
								</span>
							</span>
						</label>
					);
				})}
			</div>

			{/* Looks — my curated full-device combinations (case + bezel + back + stage) */}
			<div className="border-t border-black/[0.06] px-3.5 py-2.5">
				<Label>Looks</Label>
				<div className="mt-2 grid grid-cols-3 gap-1.5">
					{CURATED_LOOKS.map((look) => {
						const active = normalizeHex(look.skinColor) === normalizeHex(presentation.skinColor);
						return (
							<button
								key={look.id}
								type="button"
								onClick={() => applyLook(look)}
								aria-pressed={active}
								className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
									active ? "border-black/80 text-black" : "border-black/10 text-black/55 hover:border-black/25 hover:text-black/80"
								}`}
							>
								<span
									className="h-3 w-3 shrink-0 rounded-full border border-black/15"
									style={{ backgroundColor: look.skinColor }}
								/>
								{look.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Quick favorites — one-tap case swaps */}
			<div className="border-t border-black/[0.06] px-3.5 py-2.5">
				<Label>Quick</Label>
				<div className="mt-2 flex flex-wrap gap-1.5">
					{CASE_CURATED_FAVORITES.slice(0, 8).map((fav) => (
						<button
							key={fav.value}
							type="button"
							title={fav.label}
							aria-label={`Case ${fav.label}`}
							onClick={() => {
								dispatch({ type: "SET_SKIN_COLOR", payload: fav.value });
								const d = deriveWheelColors(fav.value);
								dispatch({ type: "SET_RING_COLOR", payload: d.gradient.via });
								dispatch({ type: "SET_CENTER_COLOR", payload: d.centerGradient.via });
							}}
							className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
								normalizeHex(fav.value) === normalizeHex(presentation.skinColor)
									? "border-black/70"
									: "border-black/15"
							}`}
							style={{ backgroundColor: fav.value }}
						/>
					))}
				</div>
			</div>

			{/* Helper actions */}
			<div className="flex items-center gap-3 border-t border-black/[0.06] px-3.5 py-2.5">
				<HelperButton onClick={deriveWheelFromCase}>Derive wheel</HelperButton>
				<span className="h-3 w-px bg-black/10" />
				<HelperButton onClick={shuffle}>Shuffle case</HelperButton>
				<span className="h-3 w-px bg-black/10" />
				<HelperButton onClick={() => applyLook(randomCompatibleLook())}>Random look</HelperButton>
			</div>
		</div>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
			{children}
		</span>
	);
}

function HelperButton({
	onClick,
	children,
}: {
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="text-[11px] font-medium text-black/55 transition-colors hover:text-black"
		>
			{children}
		</button>
	);
}
