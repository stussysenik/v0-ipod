"use client";

import {
	useCallback,
	useId,
	useRef,
	useState,
	type CSSProperties,
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
} from "react";

import {
	StudioButton,
	StudioControlScope,
	StudioField,
	StudioLabel,
	StudioSegment,
	CONTROL_RADIUS,
} from "@/components/ui/studio-controls";
import type { Ease, MotionDoc, MotionTrack, TimeMap } from "@/lib/motion/doc";
import { resolveEase } from "@/lib/motion/doc";
import { MAX_SAVED_MOTIONS, type SavedMotion } from "@/lib/motion/motion-shelf";
import { MAX_DURATION_SEC, MIN_DURATION_SEC } from "@/lib/motion/motion-state";
import {
	applyTrackEdit,
	curveLabel,
	isPristineTrack,
	MAX_TRACK_GAIN,
	orderedTrackKeys,
	readTrackEdit,
	trackCurveLabel,
	trackLabel,
	trackReadout,
	unifiedEase,
	type TrackEdit,
} from "@/lib/motion/track-edit";
import { motionReadout, turnaroundOf } from "@/lib/motion/transport";
import type { CubicBezierHandles } from "@/lib/theatre/easings";

/**
 * THE MOTION INSPECTOR — the surface where a camera move stops being a preset and becomes a
 * document you can open.
 *
 * A self-contained panel body owning NO layout: every input arrives as a prop, nothing is
 * assumed about the rail it hangs in, and it wraps itself in its own `StudioControlScope`
 * against the surface it is told it sits on. `refactor-3d-control-surface-to-inspector` will
 * re-parent it under the Camera part by deleting one mount, not by rewriting this file.
 *
 * WHAT IT EDITS, AND WHERE THE EDIT LIVES. Track rows read the FLOWN document (base plus
 * overrides) and write against the SHIPPED one — `lib/motion/track-edit.ts` owns that algebra
 * and is where the round trip is proven. An edit that lands back on the shipped values clears
 * its override rather than storing a copy of it, so a look keeps tracking later revisions of
 * the catalogue document; storing the copy is the defect `update-studio-theme-authoring`
 * measured on a saved theme's rig.
 *
 * WHY IT OWNS THE TRANSPORT TOO. It replaces the export dock's Preview section wholesale
 * (§3b.2 called that section a bridge, not a design). The scrubber is the last row on purpose:
 * §6.5's timeline proof strip aligns beneath it, and a full-width scrubber is the only version
 * of that alignment which is not arithmetic.
 *
 * The control tokens are read as bare `var(--studio-*)` with no fallback, which is safe
 * because this component emits them itself one element up. Restating the fallback table here
 * would be a second copy of a palette that already has an owner.
 */

const LABEL = "var(--studio-label)";
const HAIRLINE = "var(--studio-hairline)";
const SURFACE = "var(--studio-surface)";
const ACCENT = "var(--studio-accent)";

/** The authored cadences. `0` is the held angle — amplitude zero, not a third loop style. */
const REPEAT_STOPS = [0, 1, 2, 3, 4, 6] as const;

const LOOP_STYLES = [
	{ value: "loop" as const, label: "Loop" },
	{ value: "boomerang" as const, label: "Boomerang" },
];

/**
 * The shelf's data and its five commands, bundled because they move together: the panel that
 * lists saved motions is the panel that saves, renames, overwrites and deletes them, and
 * `refactor-3d-control-surface-to-inspector` re-parents all six by moving one prop rather
 * than six.
 */
export interface MotionShelfControls {
	/**
	 * The shelf, in storage order. It is a SUBSET of `documents` rather than a second list:
	 * the rows below the catalogue grid are the entries whose ids appear here, so the picker
	 * keeps one source of order (§4b.5) and nothing can list a motion twice.
	 */
	saved: readonly SavedMotion[];
	/** One tap: the entry's document AND the cadence it was saved at. */
	onOpen: (entry: SavedMotion) => void;
	/** Save what is flying as a new entry, named `Motion NN` until it is renamed. */
	onSave: () => void;
	onRename: (id: string, label: string) => void;
	onSaveOver: (id: string) => void;
	onDelete: (id: string) => void;
}

export interface Ipod3DMotionInspectorProps {
	/** Every selectable document in picker order — catalogue, then the shelf. */
	documents: readonly MotionDoc[];
	docId: string;
	onDocChange: (id: string) => void;
	/** The document as flown: the base with any overrides laid over it. */
	doc: MotionDoc;
	/** The document as shipped — what an override is a diff against. */
	baseDoc: MotionDoc;
	onTrackChange: (trackKey: string, track: MotionTrack) => void;
	onTrackClear: (trackKey: string) => void;
	/** The shelf and its five commands, as one prop — see `MotionShelfControls`. */
	shelf: MotionShelfControls;
	repeat: number;
	onRepeatChange: (repeat: number) => void;
	durationSec: number;
	onDurationChange: (seconds: number) => void;
	timeMap: TimeMap;
	onTimeMapChange: (timeMap: TimeMap) => void;
	playing: boolean;
	onTogglePlay: () => void;
	/** Playhead over the whole clip, `[0,1)`. */
	playhead: number;
	onScrub: (t: number) => void;
	onResetPlayhead: () => void;
	disabled?: boolean;
	/** The surface this panel sits on; the control tokens solve against it. */
	surface?: string;
	/** Rendered beneath the scrubber, aligned to it (§6.5's timeline proof strip). */
	belowScrubber?: ReactNode;
}

export function Ipod3DMotionInspector({
	documents,
	docId,
	onDocChange,
	doc,
	baseDoc,
	onTrackChange,
	onTrackClear,
	shelf,
	repeat,
	onRepeatChange,
	durationSec,
	onDurationChange,
	timeMap,
	onTimeMapChange,
	playing,
	onTogglePlay,
	playhead,
	onScrub,
	onResetPlayhead,
	disabled = false,
	surface = "#FFFFFF",
	belowScrubber,
}: Ipod3DMotionInspectorProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const [renaming, setRenaming] = useState<string | null>(null);
	const trackKeys = orderedTrackKeys(doc.tracks);
	const selectedKey = selected !== null && doc.tracks[selected] ? selected : null;
	const elapsed = playhead * durationSec;
	// The grid lists what the shelf does not: a saved motion is in `documents` (it is opened
	// and exported by the same path as a shipped one) but it gets a row, not a chip, because a
	// chip cannot carry a value or five commands.
	const savedIds = new Set(shelf.saved.map((entry) => entry.id));
	const catalogue = documents.filter((entry) => !savedIds.has(entry.id));

	/**
	 * Commit one track edit. The pristine branch is the whole reason this is a function and
	 * not an inline dispatch: an edit dragged back to the shipped values must remove the
	 * override, not store the base under a new object.
	 */
	const commit = useCallback(
		(trackKey: string, edit: TrackEdit) => {
			const base = baseDoc.tracks[trackKey];
			if (!base) return;
			const next = applyTrackEdit(base, edit);
			if (isPristineTrack(base, next)) onTrackClear(trackKey);
			else onTrackChange(trackKey, next);
		},
		[baseDoc, onTrackChange, onTrackClear],
	);

	return (
		<StudioControlScope
			stageBackground={surface}
			className="flex flex-col gap-2.5"
			style={{ color: LABEL }}
		>
			<div className="flex items-center justify-between gap-2">
				<StudioLabel>Motion</StudioLabel>
				<StudioField>{motionReadout(repeat, durationSec)}</StudioField>
			</div>

			<div className="grid grid-cols-2 gap-1.5">
				{catalogue.map((entry) => (
					<StudioButton
						key={entry.id}
						isActive={entry.id === docId}
						isDisabled={disabled}
						onPress={() => onDocChange(entry.id)}
						fullWidth
					>
						{entry.label}
					</StudioButton>
				))}
			</div>

			{/*
			 * The shelf. Rows rather than chips, for the same reason the Themes shelf settled on
			 * them: an entry carries a value and four commands, and each command has to read as
			 * a word. The three edit commands sit in an overlay that is transparent at rest, so
			 * the label keeps the full row width until the pointer or the keyboard arrives.
			 *
			 * An empty shelf is the label and the Save command with zero rows — the structure,
			 * not a sentence about what saving would do.
			 */}
			<div className="flex items-center justify-between gap-2">
				<StudioLabel>Shelf</StudioLabel>
				<RowCommand
					disabled={disabled || shelf.saved.length >= MAX_SAVED_MOTIONS}
					onClick={shelf.onSave}
				>
					+ Save
				</RowCommand>
			</div>
			{shelf.saved.length > 0 && (
				<div className="flex flex-col">
					{shelf.saved.map((entry) => (
						<ShelfRow
							key={entry.id}
							entry={entry}
							active={entry.id === docId}
							renaming={renaming === entry.id}
							disabled={disabled}
							onOpen={() => shelf.onOpen(entry)}
							onRenameStart={() => setRenaming(entry.id)}
							onRenameCommit={(label) => {
								shelf.onRename(entry.id, label);
								setRenaming(null);
							}}
							onRenameCancel={() => setRenaming(null)}
							onSaveOver={() => shelf.onSaveOver(entry.id)}
							onDelete={() => shelf.onDelete(entry.id)}
						/>
					))}
				</div>
			)}

			<Divider />
			<StudioLabel>Tracks</StudioLabel>
			<div className="flex flex-col">
				{trackKeys.map((key) => (
					<TrackRow
						key={key}
						name={trackLabel(key)}
						value={trackReadout(key, doc.tracks[key])}
						tuned={
							baseDoc.tracks[key] !== undefined &&
							!isPristineTrack(baseDoc.tracks[key], doc.tracks[key])
						}
						selected={key === selectedKey}
						disabled={disabled}
						onSelect={() => setSelected(key === selectedKey ? null : key)}
					/>
				))}
			</div>

			{selectedKey !== null && baseDoc.tracks[selectedKey] !== undefined && (
				<TrackDetail
					trackKey={selectedKey}
					base={baseDoc.tracks[selectedKey]}
					flown={doc.tracks[selectedKey]}
					disabled={disabled}
					onCommit={commit}
					onClear={() => onTrackClear(selectedKey)}
				/>
			)}

			<Divider />
			<Row label="Repeat">
				<Stops
					stops={REPEAT_STOPS}
					value={repeat}
					disabled={disabled}
					format={(n) => (n === 0 ? "Hold" : `${n}×`)}
					onChange={onRepeatChange}
				/>
			</Row>
			<Slider
				label="Length"
				value={durationSec}
				readout={`${durationSec}s`}
				min={MIN_DURATION_SEC}
				max={MAX_DURATION_SEC}
				step={1}
				disabled={disabled}
				testId="clip-length-slider"
				onChange={onDurationChange}
			/>
			<Row label="Style">
				<StudioSegment
					aria-label="Time map"
					options={LOOP_STYLES}
					value={timeMap.kind}
					onChange={(kind) =>
						onTimeMapChange(kind === "boomerang" ? { kind: "boomerang" } : { kind: "loop" })
					}
					className="w-[168px]"
				/>
			</Row>
			{timeMap.kind === "boomerang" && (
				<CurveField
					label="Turnaround"
					name={curveLabel(turnaroundOf(timeMap))}
					value={turnaroundOf(timeMap)}
					mixed={false}
					disabled={disabled}
					onChange={(handles) => onTimeMapChange({ kind: "boomerang", turnaround: handles })}
				/>
			)}

			<Divider />
			<div className="flex items-center justify-between gap-2">
				<div className="flex gap-1.5">
					<StudioButton isDisabled={disabled} onPress={onTogglePlay}>
						{playing ? <PauseGlyph /> : <PlayGlyph />}
						{playing ? "Pause" : "Play"}
					</StudioButton>
					<StudioButton isDisabled={disabled} onPress={onResetPlayhead}>
						<ResetGlyph />
						Reset
					</StudioButton>
				</div>
				<StudioField>
					{elapsed.toFixed(1)}s / {durationSec}s
				</StudioField>
			</div>
			<input
				type="range"
				min={0}
				max={1000}
				step={1}
				value={Math.round(playhead * 1000)}
				disabled={disabled}
				onChange={(event) => onScrub(Number(event.target.value) / 1000)}
				aria-label="Scrub preview"
				className="h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-40"
				style={{ accentColor: LABEL, background: HAIRLINE }}
			/>
			{belowScrubber}
		</StudioControlScope>
	);
}

// ─── Rows ───────────────────────────────────────────────────────────────────

function Divider() {
	return <div className="h-px w-full" style={{ background: HAIRLINE }} />;
}

/** 24px label / control line. The one inspector row shape this panel repeats. */
function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex min-h-6 items-center justify-between gap-3">
			<span className="text-[11px] font-semibold opacity-80">{label}</span>
			{children}
		</div>
	);
}

/**
 * A track: its name AND the value it holds. A row that read `Azimuth` alone would make the
 * amplitude something you learn by dragging.
 */
function TrackRow({
	name,
	value,
	tuned,
	selected,
	disabled,
	onSelect,
}: {
	name: string;
	value: string;
	tuned: boolean;
	selected: boolean;
	disabled: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onSelect}
			aria-pressed={selected}
			className="flex h-6 w-full items-center justify-between gap-3 px-1.5 text-left outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40"
			style={{
				borderRadius: CONTROL_RADIUS,
				background: selected ? HAIRLINE : "transparent",
			}}
		>
			<span className="flex items-center gap-1.5 text-[11px] font-semibold">
				{name}
				{/* Tuned marker: a dot, because a second word in an 11px row is a paragraph. */}
				{tuned && (
					<span
						aria-label="tuned"
						className="inline-block h-1 w-1 rounded-full"
						style={{ background: ACCENT }}
					/>
				)}
			</span>
			<span className="font-mono text-[11px] tabular-nums opacity-70">{value}</span>
		</button>
	);
}

/**
 * A saved motion: its name AND the cadence it holds (`3× · 1.7s · seamless`), plus the four
 * commands that make it yours to keep.
 *
 * The row states the cycle length as well as the count, which the ledger's sketch of it did
 * not: the entry stores its whole cadence, so the seconds are a value it holds rather than a
 * derivation from whatever the transport is set to right now.
 */
function ShelfRow({
	entry,
	active,
	renaming,
	disabled,
	onOpen,
	onRenameStart,
	onRenameCommit,
	onRenameCancel,
	onSaveOver,
	onDelete,
}: {
	entry: SavedMotion;
	active: boolean;
	renaming: boolean;
	disabled: boolean;
	onOpen: () => void;
	onRenameStart: () => void;
	onRenameCommit: (label: string) => void;
	onRenameCancel: () => void;
	onSaveOver: () => void;
	onDelete: () => void;
}) {
	if (renaming) {
		return (
			<div className="flex h-6 items-center">
				<input
					// Focused imperatively rather than with `autoFocus`: this input mounts in
					// response to the Rename command, so taking focus finishes that gesture
					// instead of seizing it on mount.
					ref={(el) => {
						el?.focus();
						el?.select();
					}}
					defaultValue={entry.label}
					aria-label={`Rename ${entry.label}`}
					onBlur={(event) => onRenameCommit(event.currentTarget.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") onRenameCommit(event.currentTarget.value);
						if (event.key === "Escape") onRenameCancel();
					}}
					className="h-5 w-full px-1 text-[11px] font-semibold outline-none"
					style={{
						borderRadius: CONTROL_RADIUS,
						border: `1px solid ${LABEL}`,
						background: SURFACE,
						color: LABEL,
					}}
				/>
			</div>
		);
	}
	return (
		<div className="group/motion relative flex h-6 items-center">
			<button
				type="button"
				disabled={disabled}
				onClick={onOpen}
				aria-pressed={active}
				aria-label={`Open ${entry.label}`}
				className="flex h-6 w-full items-center justify-between gap-3 px-1.5 text-left outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40"
				style={{
					borderRadius: CONTROL_RADIUS,
					background: active ? HAIRLINE : "transparent",
				}}
			>
				<span className="truncate text-[11px] font-semibold">{entry.label}</span>
				<span className="shrink-0 font-mono text-[11px] tabular-nums opacity-70">
					{motionReadout(entry.cadence.repeat, entry.cadence.durationSec)}
				</span>
			</button>
			<span
				className="absolute right-0 top-0 flex h-6 items-center gap-0.5 pl-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover/motion:opacity-100"
				style={{ background: active ? HAIRLINE : SURFACE }}
			>
				<RowCommand disabled={disabled} onClick={onRenameStart}>
					Rename
				</RowCommand>
				<RowCommand disabled={disabled} onClick={onSaveOver}>
					Save over
				</RowCommand>
				<RowCommand disabled={disabled} onClick={onDelete} aria-label={`Delete ${entry.label}`}>
					Delete
				</RowCommand>
			</span>
		</div>
	);
}

/**
 * A row-level text command. Local to this panel rather than shared with the colour cockpit's:
 * that one is hard-coded to black on a white card, this one solves against the control tokens
 * the surrounding `StudioControlScope` emits, and a shared component would have to be handed a
 * palette by both callers to say the same thing.
 */
function RowCommand({
	onClick,
	disabled,
	children,
	...rest
}: {
	onClick: () => void;
	disabled?: boolean;
	children: ReactNode;
	"aria-label"?: string;
}) {
	return (
		<button
			{...rest}
			type="button"
			disabled={disabled}
			onClick={onClick}
			className="px-1 py-0.5 text-[10px] font-semibold opacity-60 outline-none transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
			style={{ borderRadius: CONTROL_RADIUS, color: LABEL }}
		>
			{children}
		</button>
	);
}

/** The three scalars a track edit is, each showing the value it holds. */
function TrackDetail({
	trackKey,
	base,
	flown,
	disabled,
	onCommit,
	onClear,
}: {
	trackKey: string;
	base: MotionTrack;
	flown: MotionTrack;
	disabled: boolean;
	onCommit: (trackKey: string, edit: TrackEdit) => void;
	onClear: () => void;
}) {
	const edit = readTrackEdit(base, flown);
	const tuned = !isPristineTrack(base, flown);
	// A mixed track has no one curve to show, so the pad opens on the first segment's shape
	// and says so: dragging is what unifies the track, and the label reads `Mixed` until it
	// does. Opening on the default curve instead would draw a shape the track is not flying.
	const padValue: Ease = unifiedEase(flown) ?? flown.keyframes[0]?.easing ?? "easeInOutSine";
	const mixed = unifiedEase(flown) === null;

	return (
		<div
			className="flex flex-col gap-2 p-2"
			style={{ borderRadius: CONTROL_RADIUS, border: `1px solid ${HAIRLINE}` }}
		>
			<Slider
				label="Amount"
				value={edit.gain}
				readout={`${Math.round(edit.gain * 100)}%`}
				min={0}
				max={MAX_TRACK_GAIN}
				step={0.05}
				disabled={disabled}
				onChange={(gain) => onCommit(trackKey, { ...edit, gain })}
			/>
			<Slider
				label="Phase"
				value={edit.phase}
				readout={edit.phase.toFixed(2)}
				min={0}
				max={0.95}
				step={0.05}
				disabled={disabled}
				onChange={(phase) => onCommit(trackKey, { ...edit, phase })}
			/>
			<CurveField
				label="Curve"
				name={trackCurveLabel(flown)}
				value={padValue}
				mixed={mixed}
				disabled={disabled}
				onChange={(handles) => onCommit(trackKey, { ...edit, curve: handles })}
			/>
			{tuned && (
				<StudioButton isDisabled={disabled} onPress={onClear} fullWidth>
					Reset track
				</StudioButton>
			)}
		</div>
	);
}

function Slider({
	label,
	value,
	readout,
	min,
	max,
	step,
	disabled,
	testId,
	onChange,
}: {
	label: string;
	value: number;
	readout: string;
	min: number;
	max: number;
	step: number;
	disabled: boolean;
	testId?: string;
	onChange: (value: number) => void;
}) {
	const id = useId();
	return (
		<div className="flex flex-col gap-1">
			<div className="flex min-h-6 items-center justify-between gap-3">
				<label htmlFor={id} className="text-[11px] font-semibold opacity-80">
					{label}
				</label>
				<span className="font-mono text-[11px] tabular-nums opacity-70">{readout}</span>
			</div>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				disabled={disabled}
				data-testid={testId}
				onChange={(event) => onChange(Number(event.target.value))}
				className="h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-40"
				style={{ accentColor: LABEL, background: HAIRLINE }}
			/>
		</div>
	);
}

/** A short list of authored stops — a cadence is picked, not scrubbed. */
function Stops<T extends number>({
	stops,
	value,
	disabled,
	format,
	onChange,
}: {
	stops: readonly T[];
	value: number;
	disabled: boolean;
	format: (stop: T) => string;
	onChange: (stop: T) => void;
}) {
	return (
		<div className="flex gap-1">
			{stops.map((stop) => {
				const active = stop === value;
				return (
					<button
						key={stop}
						type="button"
						disabled={disabled}
						onClick={() => onChange(stop)}
						aria-pressed={active}
						className="h-6 px-1.5 font-mono text-[10px] tabular-nums outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							borderRadius: CONTROL_RADIUS,
							border: "1px solid",
							borderColor: active ? LABEL : HAIRLINE,
							background: active ? LABEL : SURFACE,
							color: active ? SURFACE : LABEL,
						}}
					>
						{format(stop)}
					</button>
				);
			})}
		</div>
	);
}

// ─── The curve editor ───────────────────────────────────────────────────────

/*
 * Pad geometry, in SVG user units on a square viewBox. The unit square is inset so the
 * handles at x = 0 and x = 1 sit inside the frame, and the vertical inset is deliberately
 * generous: Y is NOT clamped by the format (overshoot is expression on a value track), so
 * the pad has to be able to draw `easeInOutBack`'s −0.6 … 1.6 without the handle leaving it.
 */
const PAD_X0 = 8;
const PAD_X1 = 92;
const PAD_Y1 = 28; // curve y = 1
const PAD_Y0 = 72; // curve y = 0
const Y_HEADROOM = (PAD_Y0 - 0) / (PAD_Y0 - PAD_Y1) - 1; // ≈ 0.64 of the unit, each way
/** Rendered size of the pad. Square, so the 0–100 viewBox maps to pixels by one factor. */
const PAD_PX = 112;

const toX = (x: number) => PAD_X0 + x * (PAD_X1 - PAD_X0);
const toY = (y: number) => PAD_Y0 + y * (PAD_Y1 - PAD_Y0);
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function CurveField({
	label,
	name,
	value,
	mixed,
	disabled,
	onChange,
}: {
	label: string;
	name: string;
	value: Ease;
	mixed: boolean;
	disabled: boolean;
	onChange: (handles: CubicBezierHandles) => void;
}) {
	const handles = resolveEase(value);
	return (
		<div className="flex items-start gap-2">
			<CurvePad handles={handles} mixed={mixed} disabled={disabled} onChange={onChange} />
			<div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
				<span className="text-[11px] font-semibold opacity-80">{label}</span>
				<span className="truncate font-mono text-[11px] tabular-nums opacity-70">{name}</span>
				<span className="font-mono text-[10px] tabular-nums opacity-50">
					{handles[0].toFixed(2)}, {handles[1].toFixed(2)}
					<br />
					{handles[2].toFixed(2)}, {handles[3].toFixed(2)}
				</span>
			</div>
		</div>
	);
}

/**
 * Two draggable control handles over the unit square, with the tuple updating during the
 * drag. X is clamped to `[0,1]` because a time map must stay monotonic; Y is free, which is
 * the same asymmetry `resolveEase` enforces at the format boundary.
 */
function CurvePad({
	handles,
	mixed,
	disabled,
	onChange,
}: {
	handles: CubicBezierHandles;
	mixed: boolean;
	disabled: boolean;
	onChange: (handles: CubicBezierHandles) => void;
}) {
	const boxRef = useRef<HTMLDivElement | null>(null);
	const dragging = useRef<0 | 1 | null>(null);
	const [c1x, c1y, c2x, c2y] = handles;

	const moveHandle = useCallback(
		(which: 0 | 1, x: number, y: number) => {
			const nx = clamp(x, 0, 1);
			const ny = clamp(y, -Y_HEADROOM, 1 + Y_HEADROOM);
			onChange(
				which === 0
					? [round2(nx), round2(ny), c2x, c2y]
					: [c1x, c1y, round2(nx), round2(ny)],
			);
		},
		[c1x, c1y, c2x, c2y, onChange],
	);

	const fromClient = useCallback((clientX: number, clientY: number) => {
		const rect = boxRef.current?.getBoundingClientRect();
		if (!rect || rect.width === 0 || rect.height === 0) return null;
		// The viewBox is square and the element is rendered square, so the mapping is uniform.
		const ux = ((clientX - rect.left) / rect.width) * 100;
		const uy = ((clientY - rect.top) / rect.height) * 100;
		return {
			x: (ux - PAD_X0) / (PAD_X1 - PAD_X0),
			y: (uy - PAD_Y0) / (PAD_Y1 - PAD_Y0),
		};
	}, []);

	const onPointerMove = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (dragging.current === null || disabled) return;
			const point = fromClient(event.clientX, event.clientY);
			if (point) moveHandle(dragging.current, point.x, point.y);
		},
		[disabled, fromClient, moveHandle],
	);

	// Capture on the CONTAINER, not the handle: the pointer leaves a 20px target within a
	// few pixels of movement, and a drag that stops tracking when the cursor outruns the dot
	// is the difference between a control and a toy.
	const grab = (which: 0 | 1) => (event: ReactPointerEvent<HTMLButtonElement>) => {
		if (disabled) return;
		dragging.current = which;
		boxRef.current?.setPointerCapture(event.pointerId);
	};

	const release = (event: ReactPointerEvent<HTMLDivElement>) => {
		dragging.current = null;
		if (boxRef.current?.hasPointerCapture(event.pointerId)) {
			boxRef.current.releasePointerCapture(event.pointerId);
		}
	};

	const nudge = (which: 0 | 1) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
		const step = event.shiftKey ? 0.1 : 0.01;
		const [x, y] = which === 0 ? [c1x, c1y] : [c2x, c2y];
		const delta =
			event.key === "ArrowLeft"
				? [-step, 0]
				: event.key === "ArrowRight"
					? [step, 0]
					: event.key === "ArrowUp"
						? [0, step]
						: event.key === "ArrowDown"
							? [0, -step]
							: null;
		if (!delta || disabled) return;
		event.preventDefault();
		moveHandle(which, x + delta[0], y + delta[1]);
	};

	const path = `M ${toX(0)} ${toY(0)} C ${toX(c1x)} ${toY(c1y)}, ${toX(c2x)} ${toY(c2y)}, ${toX(1)} ${toY(1)}`;

	return (
		<div
			ref={boxRef}
			className="relative shrink-0 touch-none"
			style={{
				width: PAD_PX,
				height: PAD_PX,
				borderRadius: CONTROL_RADIUS,
				border: `1px solid ${HAIRLINE}`,
				background: SURFACE,
				opacity: disabled ? 0.4 : 1,
			}}
			onPointerMove={onPointerMove}
			onPointerUp={release}
			onPointerCancel={release}
		>
			{/*
			 * The drawing is inert — every hit target below is a real `<button>`, positioned
			 * over it. A `role="button"` on an SVG node would be a control the platform does
			 * not know about: no focus ring, no Enter, and a lint warning that is telling the
			 * truth.
			 */}
			<svg
				viewBox="0 0 100 100"
				width={PAD_PX}
				height={PAD_PX}
				className="pointer-events-none block"
				aria-hidden
			>
				{/* The unit square — where the curve starts and ends, so overshoot is legible. */}
				<rect
					x={toX(0)}
					y={toY(1)}
					width={toX(1) - toX(0)}
					height={toY(0) - toY(1)}
					fill="none"
					stroke={HAIRLINE}
					strokeWidth={1}
				/>
				<line
					x1={toX(0)}
					y1={toY(0)}
					x2={toX(1)}
					y2={toY(1)}
					stroke={HAIRLINE}
					strokeWidth={1}
					strokeDasharray="2 3"
				/>
				<Leash from={[toX(0), toY(0)]} to={[toX(c1x), toY(c1y)]} />
				<Leash from={[toX(1), toY(1)]} to={[toX(c2x), toY(c2y)]} />
				<path
					d={path}
					fill="none"
					stroke={LABEL}
					strokeWidth={1.5}
					strokeDasharray={mixed ? "3 3" : undefined}
					opacity={mixed ? 0.45 : 1}
				/>
			</svg>
			<Handle
				x={toX(c1x)}
				y={toY(c1y)}
				label={`Control point 1, x ${c1x.toFixed(2)}, y ${c1y.toFixed(2)}`}
				disabled={disabled}
				onPointerDown={grab(0)}
				onKeyDown={nudge(0)}
			/>
			<Handle
				x={toX(c2x)}
				y={toY(c2y)}
				label={`Control point 2, x ${c2x.toFixed(2)}, y ${c2y.toFixed(2)}`}
				disabled={disabled}
				onPointerDown={grab(1)}
				onKeyDown={nudge(1)}
			/>
		</div>
	);
}

function Leash({ from, to }: { from: [number, number]; to: [number, number] }) {
	return (
		<line
			x1={from[0]}
			y1={from[1]}
			x2={to[0]}
			y2={to[1]}
			stroke={LABEL}
			strokeWidth={1}
			opacity={0.35}
		/>
	);
}

/** A control point: an 8px dot with a 20px target, placed in the pad's own user units. */
function Handle({
	x,
	y,
	label,
	disabled,
	onPointerDown,
	onKeyDown,
}: {
	x: number;
	y: number;
	label: string;
	disabled: boolean;
	onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
	onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
}) {
	const size = 20;
	return (
		<button
			type="button"
			disabled={disabled}
			aria-label={label}
			onPointerDown={onPointerDown}
			onKeyDown={onKeyDown}
			className="absolute grid place-items-center rounded-full outline-none"
			style={{
				width: size,
				height: size,
				left: (x / 100) * PAD_PX - size / 2,
				top: (y / 100) * PAD_PX - size / 2,
				cursor: disabled ? "not-allowed" : "grab",
			}}
		>
			<span
				className="block h-2 w-2 rounded-full"
				style={{ background: ACCENT, boxShadow: `0 0 0 1.5px ${SURFACE}` }}
			/>
		</button>
	);
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

// ─── Glyphs ─────────────────────────────────────────────────────────────────

const glyph: CSSProperties = { width: 10, height: 10 };

function PlayGlyph() {
	return (
		<svg viewBox="0 0 10 10" style={glyph} fill="currentColor" aria-hidden>
			<path d="M2 1l7 4-7 4z" />
		</svg>
	);
}

function PauseGlyph() {
	return (
		<svg viewBox="0 0 10 10" style={glyph} fill="currentColor" aria-hidden>
			<path d="M2 1h2.2v8H2zM5.8 1H8v8H5.8z" />
		</svg>
	);
}

function ResetGlyph() {
	return (
		<svg viewBox="0 0 10 10" style={glyph} fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
			<path d="M8.5 5a3.5 3.5 0 1 1-1.1-2.5" />
			<path d="M8.6 1v2.1H6.5" />
		</svg>
	);
}
