"use client";

import { type Dispatch } from "react";

import type { IpodStudioState } from "@/lib/ipod-state/model";
import type { IpodWorkbenchAction } from "@/lib/ipod-state/update";
import {
	ENVIRONMENT_PRESETS,
	RIG_PRESETS,
	cloneLightingConfig,
	type EnvironmentPreset,
	type SpotRole,
	type SpotSpec,
} from "@/lib/studio-lighting-config";

/**
 * The lighting cockpit for the /3d studio — the "Phase 3 dev panel" the rig was always
 * designed to grow into. Same control-strip design language as the colour cockpit: one
 * white card, a single hairline, black type, tabular-nums readouts. Every dial drives the
 * reducer (`PATCH_LIGHT` / `PATCH_AMBIENT` / `PATCH_ENV`) so the live canvas, the persisted
 * model, and the WYSIWYG export all read the exact same numbers — deterministic by value.
 *
 * Header carries the one-tap **Lights Off / Technical** switch (a flat, unlit CAD view).
 * While it's on, the shaping dials are dimmed: the device is rendered as flat albedo, so
 * the rig has nothing to do until you turn the lights back on.
 *
 *   pseudocode  onDial(role, field, value):
 *       dispatch PATCH_LIGHT { role, patch: { [field]: value } }
 *       → reducer immutably swaps that one sub-record
 *       → <StudioLighting config> re-renders that light
 *       → saveWorkbenchModel persists; refresh restores it
 */

interface Ipod3DLightingCockpitProps {
	studio: IpodStudioState;
	dispatch: Dispatch<IpodWorkbenchAction>;
}

const SPOTS: readonly { role: SpotRole; label: string; hint: string }[] = [
	{ role: "key", label: "Key", hint: "Warm soft top-right" },
	{ role: "fill", label: "Fill", hint: "Cool, opens the shadows" },
	{ role: "rim", label: "Rim", hint: "Separation edge from behind" },
] as const;

export function Ipod3DLightingCockpit({ studio, dispatch }: Ipod3DLightingCockpitProps) {
	const { lighting, technicalFlat } = studio;
	const dimmed = technicalFlat;

	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			{/* Header — title + the one-tap Lights Off / Technical switch */}
			<div className="flex items-center justify-between border-b border-black/[0.06] px-3.5 pb-3 pt-3">
				<Label>Light</Label>
				<button
					type="button"
					onClick={() => dispatch({ type: "TOGGLE_TECHNICAL_FLAT" })}
					aria-pressed={technicalFlat}
					title="Flat, unlit technical view — no reflections or shadows"
					className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 active:scale-[0.96] ${
						technicalFlat
							? "border-black/80 bg-black text-white"
							: "border-black/10 text-black/55 hover:border-black/30 hover:text-black/80"
					}`}
				>
					<span
						className={`h-1.5 w-1.5 rounded-full transition-colors ${
							technicalFlat ? "bg-white/90" : "bg-amber-400"
						}`}
					/>
					{technicalFlat ? "Lights Off" : "Lights On"}
				</button>
			</div>

			{/* Body — dimmed while flat/technical, since the rig is bypassed there */}
			<div
				className={`transition-opacity duration-300 ${dimmed ? "pointer-events-none opacity-40" : "opacity-100"}`}
				aria-hidden={dimmed}
			>
				{/* Rig presets — the named ends of the range, from clean Apple to Designer Dark */}
				<div className="border-b border-black/[0.06] px-3.5 py-2.5">
					<Label>Rig</Label>
					<div className="mt-2 flex gap-1">
						{RIG_PRESETS.map((preset) => {
							const active = lighting.name === preset.config.name;
							return (
								<button
									key={preset.id}
									type="button"
									onClick={() => {
										dispatch({ type: "SET_LIGHTING", payload: cloneLightingConfig(preset.config) });
										if (preset.stage) dispatch({ type: "SET_BG_COLOR", payload: preset.stage });
									}}
									aria-pressed={active}
									className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
										active
											? "border-black/80 text-black"
											: "border-black/10 text-black/55 hover:border-black/25 hover:text-black/80"
									}`}
								>
									{preset.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Environment — the master brightness the metal mirrors */}
				<Section title="Environment" hint="The wall the metal reflects — master brightness">
					<PresetRow
						value={lighting.env.preset}
						onChange={(preset) => dispatch({ type: "PATCH_ENV", payload: { preset } })}
					/>
					<Slider
						label="Intensity"
						value={lighting.env.intensity}
						min={0}
						max={5}
						step={0.05}
						onChange={(intensity) => dispatch({ type: "PATCH_ENV", payload: { intensity } })}
					/>
					<Slider
						label="Blur"
						value={lighting.env.blur}
						min={0}
						max={1}
						step={0.01}
						onChange={(blur) => dispatch({ type: "PATCH_ENV", payload: { blur } })}
					/>
				</Section>

				{/* Ambient — the flat floor of light */}
				<Section title="Ambient" hint="Flat base fill">
					<ColorRow
						label="Colour"
						value={lighting.ambient.color}
						onChange={(color) => dispatch({ type: "PATCH_AMBIENT", payload: { color } })}
					/>
					<Slider
						label="Intensity"
						value={lighting.ambient.intensity}
						min={0}
						max={3}
						step={0.01}
						onChange={(intensity) => dispatch({ type: "PATCH_AMBIENT", payload: { intensity } })}
					/>
				</Section>

				{/* The three shaping spots */}
				{SPOTS.map(({ role, label, hint }) => (
					<LightSection
						key={role}
						label={label}
						hint={hint}
						spot={lighting[role]}
						onPatch={(patch) => dispatch({ type: "PATCH_LIGHT", payload: { role, patch } })}
					/>
				))}
			</div>

			{/* Reset to the named default rig */}
			<div className="flex items-center justify-between border-t border-black/[0.06] px-3.5 py-2.5">
				<span className="text-[10px] font-medium text-black/35">{lighting.name}</span>
				<button
					type="button"
					onClick={() => dispatch({ type: "RESET_LIGHTING" })}
					className="text-[11px] font-medium text-black/55 transition-colors hover:text-black"
				>
					Reset rig
				</button>
			</div>
		</div>
	);
}

// ─── A shaping spot: colour + intensity always visible, geometry in a disclosure ──────

function LightSection({
	label,
	hint,
	spot,
	onPatch,
}: {
	label: string;
	hint: string;
	spot: SpotSpec;
	onPatch: (patch: Partial<SpotSpec>) => void;
}) {
	const [x, y, z] = spot.position;
	const setAxis = (axis: 0 | 1 | 2, v: number) => {
		const next: [number, number, number] = [...spot.position];
		next[axis] = v;
		onPatch({ position: next });
	};

	return (
		<Section title={label} hint={hint}>
			<div className="flex items-center justify-between">
				<ColorRow label="Colour" value={spot.color} onChange={(color) => onPatch({ color })} inline />
			</div>
			<Slider
				label="Intensity"
				value={spot.intensity}
				min={0}
				max={600}
				step={1}
				onChange={(intensity) => onPatch({ intensity })}
			/>
			<details className="group mt-0.5">
				<summary className="flex cursor-pointer list-none items-center gap-1 py-1 text-[10px] font-medium text-black/35 hover:text-black/60">
					<span className="transition-transform group-open:rotate-90">›</span>
					Shape · position
				</summary>
				<div className="pl-2">
					<Slider label="X" value={x} min={-30} max={30} step={0.1} onChange={(v) => setAxis(0, v)} />
					<Slider label="Y" value={y} min={-30} max={30} step={0.1} onChange={(v) => setAxis(1, v)} />
					<Slider label="Z" value={z} min={-30} max={30} step={0.1} onChange={(v) => setAxis(2, v)} />
					<Slider
						label="Cone"
						value={spot.angle}
						min={0}
						max={1.57}
						step={0.01}
						onChange={(angle) => onPatch({ angle })}
					/>
					<Slider
						label="Softness"
						value={spot.penumbra}
						min={0}
						max={1}
						step={0.01}
						onChange={(penumbra) => onPatch({ penumbra })}
					/>
				</div>
			</details>
		</Section>
	);
}

// ─── Primitives — match the colour cockpit's control-strip idiom ──────────────────────

function Section({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="border-b border-black/[0.05] px-3.5 py-2.5 last:border-b-0">
			<div className="flex items-baseline justify-between">
				<Label>{title}</Label>
				{hint ? <span className="text-[9px] text-black/25">{hint}</span> : null}
			</div>
			<div className="mt-1.5">{children}</div>
		</div>
	);
}

function Slider({
	label,
	value,
	min,
	max,
	step,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
}) {
	return (
		<label className="group flex h-7 items-center gap-2">
			<span className="w-14 shrink-0 text-[11px] font-medium text-black/55 group-hover:text-black/80">
				{label}
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="ipod-light-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-black/10 accent-black"
				aria-label={label}
			/>
			<span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-black/40 group-hover:text-black/65">
				{formatValue(value, step)}
			</span>
		</label>
	);
}

function ColorRow({
	label,
	value,
	onChange,
	inline = false,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	inline?: boolean;
}) {
	return (
		<label className={`group flex ${inline ? "h-7" : "h-8"} cursor-pointer items-center justify-between`}>
			<span className="text-[11px] font-medium text-black/55 group-hover:text-black/80">{label}</span>
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
						onChange={(e) => onChange(e.target.value)}
						className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						aria-label={`${label} color`}
					/>
				</span>
			</span>
		</label>
	);
}

function PresetRow({
	value,
	onChange,
}: {
	value: EnvironmentPreset;
	onChange: (value: EnvironmentPreset) => void;
}) {
	return (
		<label className="group flex h-8 items-center justify-between">
			<span className="text-[11px] font-medium text-black/55 group-hover:text-black/80">Preset</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value as EnvironmentPreset)}
				className="rounded-md border border-black/15 bg-white px-2 py-0.5 text-[11px] font-medium capitalize text-black/70 outline-none hover:border-black/30"
				aria-label="Environment preset"
			>
				{ENVIRONMENT_PRESETS.map((preset) => (
					<option key={preset} value={preset} className="capitalize">
						{preset}
					</option>
				))}
			</select>
		</label>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
			{children}
		</span>
	);
}

/** Whole-number dials read as integers; fine dials keep just enough decimals to be legible. */
function formatValue(value: number, step: number): string {
	if (step >= 1) return Math.round(value).toString();
	if (step >= 0.1) return value.toFixed(1);
	return value.toFixed(2);
}
