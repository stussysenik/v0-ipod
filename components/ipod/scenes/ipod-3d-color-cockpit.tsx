"use client";

import { useEffect, useMemo, useState, type Dispatch } from "react";

import {
	CASE_CURATED_FAVORITES,
	deriveWheelColors,
	IPOD_6G_BLACK,
	IPOD_6G_SILVER,
} from "@/lib/color-manifest";
import { parseColor } from "@/lib/color-format";
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
			| "SET_EDGE_COLOR"
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
	{ id: "edge", label: "Edges", action: "SET_EDGE_COLOR", value: (p) => p.edgeColor || p.backColor },
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

// ─── Harmony suggestions (deterministic) ────────────────────────────────────────────
//
// Both the inline per-part shade strips and the full-device Combinations strip draw from
// one shared, *pure* harmony logic so they feel like a single tool: identical input palette
// always yields identical suggestions (no per-render Math.random in the inline UI). Wheel and
// centre route through the case's recession ladder (`deriveWheelColors`); the painted shells
// route through a hue-holding lightness ladder plus one analogous sibling — the same shared/
// analogous-hue idea `randomCompatibleLook` uses, made deterministic.

/** The full resolved device palette (wheel/centre fall back to the case-derived values). */
interface PartPalette {
	case: string;
	ring: string;
	center: string;
	back: string;
	edge: string;
	bezel: string;
	stage: string;
}

function paletteOf(
	p: IpodPresentationState,
	d: ReturnType<typeof deriveWheelColors>,
): PartPalette {
	return {
		case: p.skinColor,
		ring: p.ringColor || d.gradient.via,
		center: p.centerColor || d.centerGradient.via,
		back: p.backColor,
		edge: p.edgeColor || p.backColor,
		bezel: p.bezelColor,
		stage: p.bgColor,
	};
}

function hexToHsl(hex: string): [number, number, number] {
	const c = parseColor(hex) ?? "#000000";
	const r = Number.parseInt(c.slice(1, 3), 16) / 255;
	const g = Number.parseInt(c.slice(3, 5), 16) / 255;
	const b = Number.parseInt(c.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l * 100];
	const dd = max - min;
	const s = l > 0.5 ? dd / (2 - max - min) : dd / (max + min);
	let h = 0;
	if (max === r) h = (g - b) / dd + (g < b ? 6 : 0);
	else if (max === g) h = (b - r) / dd + 2;
	else h = (r - g) / dd + 4;
	return [(h * 60 + 360) % 360, s * 100, l * 100];
}

const clampL = (l: number) => Math.max(6, Math.min(95, l));

function dedupeShades(shades: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const s of shades) {
		const key = normalizeHex(s);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(s);
	}
	return out;
}

/** A small ordered set of harmonious shades for `partId`, given the current palette. */
function deriveRelatedShades(partId: string, palette: PartPalette): string[] {
	if (partId === "ring" || partId === "center") {
		const w = deriveWheelColors(palette.case);
		const ladder =
			partId === "ring"
				? [w.gradient.from, w.gradient.via, w.gradient.to]
				: [w.centerGradient.from, w.centerGradient.via, w.centerGradient.to];
		return dedupeShades(ladder);
	}
	const base =
		partId === "back"
			? palette.back
			: partId === "edge"
				? palette.edge
				: partId === "bezel"
					? palette.bezel
					: partId === "bg"
						? palette.stage
						: palette.case;
	const [h, s, l] = hexToHsl(base);
	const shades = [-22, -11, 11, 22].map((dl) => hslToHex(h, s, clampL(l + dl)));
	shades.push(hslToHex((h + 24) % 360, s, clampL(l))); // one analogous sibling
	return dedupeShades(shades);
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

	// The full resolved palette feeds the deterministic shade strips below each row.
	const palette = useMemo(() => paletteOf(presentation, derived), [presentation, derived]);

	const activeFinish = PRELOADED_FINISHES.find(
		(f) => normalizeHex(f.skinColor) === normalizeHex(presentation.skinColor),
	)?.id;

	const applyFinish = (f: FinishAsset) => {
		dispatch({ type: "SET_SKIN_COLOR", payload: f.skinColor });
		dispatch({ type: "SET_BACK_COLOR", payload: f.backColor });
		// Keep the rim matched to the back until the user sets it apart.
		dispatch({ type: "SET_EDGE_COLOR", payload: f.backColor });
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
		dispatch({ type: "SET_EDGE_COLOR", payload: look.backColor });
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

			{/* Per-part color rows — label, an editable hex/rgb/hsl field, and the native
			    swatch each keep their own air; a strip of harmonious shades for that part
			    sits directly beneath, attached to its owning row. */}
			<div className="px-4 py-3">
				{PARTS.map((part) => {
					const value = part.value(presentation, derived);
					const swatchHex = (parseColor(value) ?? "#000000").toLowerCase();
					const shades = deriveRelatedShades(part.id, palette);
					return (
						<div key={part.id} className="group py-1.5">
							<div className="flex h-7 items-center justify-between gap-3">
								<span className="text-xs font-medium text-black/60 group-hover:text-black/85">
									{part.label}
								</span>
								<div className="flex items-center gap-3">
									<ColorField
										value={value}
										label={part.label}
										onCommit={(hex) => dispatch({ type: part.action, payload: hex })}
									/>
									<label
										className="relative h-6 w-6 cursor-pointer rounded-md border border-black/15 shadow-sm transition-transform hover:scale-105"
										style={{ backgroundColor: swatchHex }}
									>
										<input
											type="color"
											value={swatchHex}
											onChange={(e) =>
												dispatch({ type: part.action, payload: e.target.value })
											}
											className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
											aria-label={`${part.label} color`}
										/>
									</label>
								</div>
							</div>
							<ShadeStrip
								shades={shades}
								current={value}
								label={part.label}
								onPick={(hex) => dispatch({ type: part.action, payload: hex })}
							/>
						</div>
					);
				})}
			</div>

			{/* Combinations — full-device palettes. Each chip previews the whole device
			    (case + wheel + centre + back + bezel) as mini-dots; one tap applies them
			    all coherently (the wheel re-derives from the case), so the device stays one
			    object. Coherent by construction from the curated looks + harmony logic. */}
			<div className="border-t border-black/[0.06] px-3.5 py-2.5">
				<Label>Combinations</Label>
				<div className="mt-2 grid grid-cols-3 gap-1.5">
					{CURATED_LOOKS.map((look) => {
						const d = deriveWheelColors(look.skinColor);
						const dots = [
							look.skinColor,
							d.gradient.via,
							d.centerGradient.via,
							look.backColor,
							look.bezelColor,
						];
						const active =
							normalizeHex(look.skinColor) === normalizeHex(palette.case) &&
							normalizeHex(look.bezelColor) === normalizeHex(palette.bezel) &&
							normalizeHex(look.bgColor) === normalizeHex(palette.stage);
						return (
							<button
								key={look.id}
								type="button"
								onClick={() => applyLook(look)}
								aria-pressed={active}
								aria-label={`Apply ${look.label} combination`}
								className={`flex flex-col gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
									active ? "border-black/80 text-black" : "border-black/10 text-black/55 hover:border-black/25 hover:text-black/80"
								}`}
							>
								<span className="flex">
									{dots.map((c, i) => (
										<span
											key={`${look.id}-${i}`}
											className="-ml-0.5 h-2.5 w-2.5 rounded-full border border-black/15 first:ml-0"
											style={{ backgroundColor: c }}
										/>
									))}
								</span>
								<span className="text-left">{look.label}</span>
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

/**
 * Editable colour field accepting hex (`#rgb`/`#rrggbb`), `rgb()`/`rgba()`, or
 * `hsl()`/`hsla()`. Commits on blur/Enter via `parseColor`; invalid input is
 * rejected non-destructively (the field flashes red and reverts to the last
 * valid value). Stays in sync when the value changes elsewhere (swatch/preset).
 */
function ColorField({
	value,
	label,
	onCommit,
}: {
	value: string;
	label: string;
	onCommit: (hex: string) => void;
}) {
	const [draft, setDraft] = useState(value);
	const [invalid, setInvalid] = useState(false);

	// Resync when the stored value changes from outside (picker, preset, shade strip).
	useEffect(() => {
		setDraft(value);
		setInvalid(false);
	}, [value]);

	const commit = () => {
		const parsed = parseColor(draft);
		if (!parsed) {
			setInvalid(true);
			setDraft(value); // revert — never mutate state on bad input
			return;
		}
		setInvalid(false);
		setDraft(parsed);
		if (normalizeHex(parsed) !== normalizeHex(value)) onCommit(parsed);
	};

	return (
		<input
			type="text"
			spellCheck={false}
			value={draft}
			onChange={(e) => {
				setDraft(e.target.value);
				if (invalid) setInvalid(false);
			}}
			onBlur={commit}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					e.currentTarget.blur();
				} else if (e.key === "Escape") {
					setDraft(value);
					setInvalid(false);
					e.currentTarget.blur();
				}
			}}
			aria-label={`${label} colour value — accepts hex, rgb(), or hsl()`}
			aria-invalid={invalid}
			className={`w-[120px] bg-transparent text-right font-mono text-[11px] uppercase tracking-tight tabular-nums outline-none transition-colors ${
				invalid
					? "text-red-500"
					: "text-black/40 focus:text-black/80 group-hover:text-black/65"
			}`}
		/>
	);
}

/** A row of deterministic harmonious shades for one part. Tapping sets only that part. */
function ShadeStrip({
	shades,
	current,
	label,
	onPick,
}: {
	shades: string[];
	current: string;
	label: string;
	onPick: (hex: string) => void;
}) {
	if (shades.length === 0) return null;
	return (
		<div className="mt-1.5 flex gap-1" role="group" aria-label={`${label} related shades`}>
			{shades.map((shade) => {
				const active = normalizeHex(shade) === normalizeHex(current);
				return (
					<button
						key={shade}
						type="button"
						title={`${label} related shade ${shade}`}
						aria-label={`${label} related shade ${shade}`}
						aria-pressed={active}
						onClick={() => onPick(shade)}
						className={`h-3.5 flex-1 rounded-[3px] border transition-transform hover:scale-y-150 ${
							active ? "border-black/70 ring-1 ring-black/25" : "border-black/10"
						}`}
						style={{ backgroundColor: shade }}
					/>
				);
			})}
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
