/**
 * Colour verdict — is this case colour helping, and by how much.
 *
 * The picker lets the shell be any hex. That freedom is only useful if the
 * consequences are visible at the moment of choosing, so this module grades a
 * candidate colour on the four axes that actually decide whether it works, and
 * reports the direction of travel against the colour it is replacing.
 *
 * Every axis is a measurement, not an opinion:
 *
 *   authenticity  does the manifest attest this as a shipped Apple finish
 *   headroom      how much key light the shell takes before the render clips
 *   undertone     does the derived wheel keep the shell's pigment
 *   legibility    do the wheel labels clear the contrast floor they need
 *
 * The grade is the worst axis, not an average. Averaging lets a colour that
 * fails legibility outright present as "good" because it happens to be
 * authentic, which is the specific way a summary score misleads.
 */

import { contrastRatio } from "./color-engine";
import { colorManifest, deriveWheelColors, type AuthenticFinish } from "./color-manifest";
import { deltaE00Undertone, deltaECIEDE2000, hexToLab } from "./color-proximity";
import { linearPeak, measureFidelity } from "./color-fidelity";
import { RESOLVE_TONE_MAPPING } from "./three-color-resolve";

/**
 * Four grades, because three collapses the distinction that matters most: the
 * gap between "this is a real Apple colour" and "this is a good colour". Both
 * are worth having; only one is a factual claim.
 */
export type Grade = "exact" | "strong" | "workable" | "poor";

const GRADE_ORDER: Record<Grade, number> = { exact: 3, strong: 2, workable: 1, poor: 0 };

export type AxisId = "authenticity" | "headroom" | "undertone" | "legibility";

export interface VerdictAxis {
	id: AxisId;
	/** Noun. What the axis is. */
	label: string;
	/** The value that is true now, already formatted. */
	value: string;
	/** The raw measurement, for sorting and for direction-of-travel. */
	measure: number;
	grade: Grade;
	/** One factual clause naming the mechanism. Never advice, never second person. */
	detail: string;
}

/** Provenance is only ever copied from the manifest, never inferred or invented. */
export interface FinishProvenance {
	id: string;
	label: string;
	generation: string;
	year: number;
	notes: string;
}

export interface NearestFinish {
	finish: FinishProvenance;
	hex: string;
	deltaE: number;
}

export type DirectionWord = "improved" | "unchanged" | "degraded";

export interface Direction {
	overall: DirectionWord;
	/** Signed change per axis, in the axis's own units, previous → current. */
	byAxis: Record<AxisId, { delta: number; direction: DirectionWord }>;
}

export interface CaseColorVerdict {
	hex: string;
	grade: Grade;
	axes: VerdictAxis[];
	/** Non-null only when the hex IS a manifest finish. Never a near-match. */
	provenance: FinishProvenance | null;
	/** Always present: the closest attested finish, and how far away it is. */
	nearest: NearestFinish;
	/** Exported-pixel deviation under the shipped display transform. */
	exportDeltaE: number;
	direction: Direction | null;
}

const provenanceOf = (f: AuthenticFinish): FinishProvenance => ({
	id: f.id,
	label: f.label,
	generation: f.generation,
	year: f.year,
	notes: f.notes,
});

const normalize = (hex: string) => hex.trim().toUpperCase();

/**
 * ── Authenticity ──────────────────────────────────────────────────────────────
 *
 * A colour is authentic when the manifest attests it, and not otherwise. There
 * is deliberately no "close enough" tier that reports as authentic: the whole
 * value of the claim is that it is checkable against shipped hardware, and a
 * near-match dressed as a match destroys that. Proximity is still reported — as
 * proximity.
 */
export function findAuthenticFinish(hex: string): FinishProvenance | null {
	const target = normalize(hex);
	const match = colorManifest.authenticFinishes.find((f) => normalize(f.hex) === target);
	return match ? provenanceOf(match) : null;
}

export function nearestAuthenticFinish(hex: string): NearestFinish {
	let best: NearestFinish | null = null;
	for (const f of colorManifest.authenticFinishes) {
		const deltaE = deltaECIEDE2000(hex, f.hex);
		if (!best || deltaE < best.deltaE) {
			best = { finish: provenanceOf(f), hex: f.hex, deltaE };
		}
	}
	if (!best) throw new Error("color-verdict: manifest has no authentic finishes");
	return best;
}

/**
 * ── Highlight headroom ────────────────────────────────────────────────────────
 *
 * How much the key light can be raised before the brightest channel of this
 * albedo clips. Under the shipped `NoToneMapping` there is no roll-off, so a
 * channel at linear 1.0 is gone — the surface renders as a flat plateau with no
 * form. This is the axis that explains why a pure-white shell photographs badly
 * and a silver one does not, and it is a property of the colour alone, which is
 * why it can be reported at pick time.
 *
 * Reported as a multiplier: 1.0 means the shell clips at unit exposure.
 */
export function highlightHeadroom(hex: string): number {
	const peak = linearPeak(hex);
	return peak <= 0 ? Number.POSITIVE_INFINITY : 1 / peak;
}

function headroomGrade(headroom: number): Grade {
	// A studio key at 1.5-2x base exposure is ordinary; below that the shell
	// cannot be lit without blowing out, which no material setting recovers.
	if (headroom >= 2) return "exact";
	if (headroom >= 1.5) return "strong";
	if (headroom >= 1.15) return "workable";
	return "poor";
}

function undertoneGrade(drift: number): Grade {
	// ~1.0 is the just-noticeable difference; the wheel should sit under it.
	if (drift <= 0.3) return "exact";
	if (drift <= 1) return "strong";
	if (drift <= 2.5) return "workable";
	return "poor";
}

/** WCAG AA-large, the floor the manifest already sets for the wheel label. */
export const WHEEL_LABEL_CONTRAST_FLOOR = 3;

function legibilityGrade(ratio: number): Grade {
	if (ratio >= 4.5) return "exact";
	if (ratio >= WHEEL_LABEL_CONTRAST_FLOOR) return "strong";
	if (ratio >= 2.5) return "workable";
	return "poor";
}

const worst = (grades: Grade[]): Grade =>
	grades.reduce((a, b) => (GRADE_ORDER[b] < GRADE_ORDER[a] ? b : a), "exact" as Grade);

/**
 * Grade one candidate case colour, optionally against the colour it replaces.
 *
 * Pure: same input, same verdict. No clock, no randomness, no I/O — so a control
 * surface can call it on every keystroke and a test can pin every number.
 */
export function judgeCaseColor(hex: string, previous?: string): CaseColorVerdict {
	const wheel = deriveWheelColors(hex);
	const provenance = findAuthenticFinish(hex);
	const nearest = nearestAuthenticFinish(hex);

	const headroom = highlightHeadroom(hex);
	const undertone = deltaE00Undertone(hex, wheel.gradient.via);
	const legibility = contrastRatio(wheel.labelColor, wheel.gradient.via);
	const fidelity = measureFidelity(hex, RESOLVE_TONE_MAPPING);

	const axes: VerdictAxis[] = [
		{
			id: "authenticity",
			label: "Authenticity",
			value: provenance ? `${provenance.label} · ${provenance.generation}` : "Custom",
			measure: provenance ? 0 : nearest.deltaE,
			grade: provenance ? "exact" : nearest.deltaE <= 2 ? "strong" : "workable",
			detail: provenance
				? `Shipped finish, ${provenance.year}. ${provenance.notes}`
				: `Not a shipped finish. Nearest is ${nearest.finish.label} (${nearest.hex}) at ΔE00 ${nearest.deltaE.toFixed(1)}.`,
		},
		{
			id: "headroom",
			label: "Highlight headroom",
			value: Number.isFinite(headroom) ? `${headroom.toFixed(2)}×` : "unbounded",
			measure: headroom,
			grade: headroomGrade(headroom),
			detail:
				RESOLVE_TONE_MAPPING === "none"
					? `Peak linear channel ${linearPeak(hex).toFixed(3)}. No roll-off is configured, so light above this multiple clips flat.`
					: `Peak linear channel ${linearPeak(hex).toFixed(3)}. Above this multiple the operator compresses rather than clips.`,
		},
		{
			id: "undertone",
			label: "Wheel undertone",
			value: `ΔE00 ${undertone.toFixed(2)}`,
			measure: undertone,
			grade: undertoneGrade(undertone),
			detail: `Derived wheel ${wheel.gradient.via} carries the shell's pigment at a recessed lightness.`,
		},
		{
			id: "legibility",
			label: "Wheel labels",
			value: `${legibility.toFixed(1)}:1`,
			measure: legibility,
			grade: legibilityGrade(legibility),
			detail: `${wheel.labelColor} on ${wheel.gradient.via}. Floor is ${WHEEL_LABEL_CONTRAST_FLOOR}:1 for large text.`,
		},
	];

	const verdict: CaseColorVerdict = {
		hex: normalize(hex),
		grade: worst(axes.map((a) => a.grade)),
		axes,
		provenance,
		nearest,
		exportDeltaE: fidelity.deltaE,
		direction: null,
	};

	if (previous === undefined) return verdict;
	return { ...verdict, direction: compareTo(judgeCaseColor(previous), verdict) };
}

/**
 * Direction of travel, per axis and overall.
 *
 * Each axis states which way is better once, here, rather than leaving callers
 * to remember that headroom rises and undertone falls. Ties inside a small
 * deadband report `unchanged`, so a rounding-level move does not read as
 * progress.
 */
const HIGHER_IS_BETTER: Record<AxisId, boolean> = {
	authenticity: false, // distance to the nearest shipped finish
	headroom: true,
	undertone: false,
	legibility: true,
};

const DEADBAND: Record<AxisId, number> = {
	authenticity: 0.1,
	headroom: 0.05,
	undertone: 0.05,
	legibility: 0.05,
};

export function compareTo(before: CaseColorVerdict, after: CaseColorVerdict): Direction {
	const byAxis = {} as Direction["byAxis"];
	for (const axis of after.axes) {
		const prior = before.axes.find((a) => a.id === axis.id);
		const delta = axis.measure - (prior?.measure ?? axis.measure);
		let direction: DirectionWord = "unchanged";
		if (Math.abs(delta) > DEADBAND[axis.id] && Number.isFinite(delta)) {
			const better = HIGHER_IS_BETTER[axis.id] ? delta > 0 : delta < 0;
			direction = better ? "improved" : "degraded";
		}
		byAxis[axis.id] = { delta, direction };
	}

	// Overall follows the grade, which is the worst axis — a change that fixes
	// the binding constraint is progress even if it costs something elsewhere.
	const beforeRank = GRADE_ORDER[before.grade];
	const afterRank = GRADE_ORDER[after.grade];
	let overall: DirectionWord =
		afterRank > beforeRank ? "improved" : afterRank < beforeRank ? "degraded" : "unchanged";

	// Same grade band: fall back to the net of the axes that moved, so a change
	// inside a band still reports a direction instead of a shrug.
	if (overall === "unchanged") {
		const moved = Object.values(byAxis).filter((a) => a.direction !== "unchanged");
		const up = moved.filter((a) => a.direction === "improved").length;
		const down = moved.filter((a) => a.direction === "degraded").length;
		if (up > down) overall = "improved";
		else if (down > up) overall = "degraded";
	}

	return { overall, byAxis };
}

/**
 * The single line a control surface shows: what changed, in the value that
 * changed. A noun and a number, no second person, no instruction.
 */
export function verdictHeadline(verdict: CaseColorVerdict): string {
	const binding = [...verdict.axes].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade])[0];
	if (verdict.provenance) {
		return `${verdict.provenance.label} · ${verdict.provenance.generation} · ${verdict.provenance.year}`;
	}
	return `Custom · nearest ${verdict.nearest.finish.label} ΔE00 ${verdict.nearest.deltaE.toFixed(1)} · ${binding.label} ${binding.value}`;
}

/** Lab lightness, exposed so a surface can order swatches by it without a second model. */
export function lightnessOf(hex: string): number {
	return hexToLab(hex).l;
}
