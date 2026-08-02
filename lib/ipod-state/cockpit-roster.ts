/**
 * THE COCKPIT ROSTER — the one declaration of which tool panels the /3d stage has, what
 * each is called, and what number it wears.
 *
 * WHY THE MODULE EXISTS. The nine cockpits were mounted as nine literals in the stage,
 * each passing its own `index={n}` and its own `title="…"` to the shared header. Position
 * and name therefore had two homes per panel and no home for the set: nothing could ask
 * "what tools are there", so nothing could offer them as a list. This module is that
 * answer, and the stage now reads it instead of restating it.
 *
 * VISIBILITY IS A VALUE, NOT A MODE. Each cockpit carries an on/off in the studio slice,
 * so PRODUCT_VIEW (every cockpit off — object, camera bar, nothing else) is a value of the
 * same type as the working view rather than a second code path. Nothing is deleted or
 * unmounted-behind-a-flag: the roster still lists a hidden cockpit, so every state is
 * reachable and reversible from the surface, including back to all-visible.
 *
 * THE ORDER IS THE READING. 01→05 on the left is the subject — how you interact with the
 * device, what it looks like, what is on its screen, its charge, your angle. 06→08 on the
 * right is the scene and the capture. 09 is the back room: it edits what survives the
 * shoot rather than the shoot itself.
 */

/** A cockpit's stable identity. Stored, so renaming a label never moves a stored value. */
export type CockpitId =
	| "studio"
	| "color"
	| "nowplaying"
	| "battery"
	| "camera"
	| "light"
	| "proof"
	| "export"
	| "workspace";

export interface CockpitEntry {
	readonly id: CockpitId;
	/** 1-based position, rendered as the zero-padded chip on the panel's header. */
	readonly index: number;
	/** The panel's single-job title — a noun, one word where one word will carry it. */
	readonly label: string;
	/** Which column the panel floats in at ≥lg. */
	readonly side: "left" | "right";
}

export const COCKPIT_ROSTER: readonly CockpitEntry[] = [
	{ id: "studio", index: 1, label: "Studio", side: "left" },
	{ id: "color", index: 2, label: "Color", side: "left" },
	{ id: "nowplaying", index: 3, label: "Now Playing", side: "left" },
	{ id: "battery", index: 4, label: "Battery", side: "left" },
	{ id: "camera", index: 5, label: "Camera", side: "left" },
	{ id: "light", index: 6, label: "Light", side: "right" },
	{ id: "proof", index: 7, label: "Proof", side: "right" },
	{ id: "export", index: 8, label: "Export", side: "right" },
	{ id: "workspace", index: 9, label: "Workspace", side: "right" },
];

const BY_ID = new Map<CockpitId, CockpitEntry>(COCKPIT_ROSTER.map((entry) => [entry.id, entry]));

/** The roster entry for an id. Total: every `CockpitId` is in `COCKPIT_ROSTER` by test. */
export function cockpitEntry(id: CockpitId): CockpitEntry {
	const entry = BY_ID.get(id);
	if (!entry) throw new Error(`Unknown cockpit: ${id}`);
	return entry;
}

/** Which cockpits are on screen. Every id is present — absence is not a third state. */
export type CockpitVisibility = Record<CockpitId, boolean>;

function fill(value: boolean): CockpitVisibility {
	return Object.fromEntries(
		COCKPIT_ROSTER.map((entry) => [entry.id, value]),
	) as CockpitVisibility;
}

/** The working view: every tool at hand. The factory value. */
export const ALL_COCKPITS_VISIBLE: CockpitVisibility = fill(true);

/** The product view: the object, the camera bar, and nothing else. */
export const PRODUCT_VIEW: CockpitVisibility = fill(false);

export function toggleCockpit(visibility: CockpitVisibility, id: CockpitId): CockpitVisibility {
	return { ...visibility, [id]: !visibility[id] };
}

/** True when no cockpit is on screen — the state the "Product view" command writes. */
export function isProductView(visibility: CockpitVisibility): boolean {
	return COCKPIT_ROSTER.every((entry) => !visibility[entry.id]);
}

/** How many cockpits are on screen, for the roster's own readout. */
export function visibleCockpitCount(visibility: CockpitVisibility): number {
	return COCKPIT_ROSTER.filter((entry) => visibility[entry.id]).length;
}

/**
 * Heal a stored or shared value into a total record. `healSlice` copies a slice's keys
 * whole, so without this a share payload could ride an arbitrary object in as the
 * visibility map and every read of a missing id would be `undefined` — falsy, which
 * silently hides a panel with no gesture that brings it back. Unknown keys are dropped,
 * non-booleans fall back to visible.
 */
export function sanitizeCockpitVisibility(candidate: unknown): CockpitVisibility {
	const source =
		typeof candidate === "object" && candidate !== null && !Array.isArray(candidate)
			? (candidate as Record<string, unknown>)
			: {};
	return Object.fromEntries(
		COCKPIT_ROSTER.map((entry) => [
			entry.id,
			typeof source[entry.id] === "boolean" ? (source[entry.id] as boolean) : true,
		]),
	) as CockpitVisibility;
}
