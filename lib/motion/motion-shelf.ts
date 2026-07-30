import { documentClip, findStudioClip, type StudioClip } from "../studio-clip-presets";
import { CATALOGUE_DOCS, MOMENT_DOCS } from "./catalogue";
import { resolveMotionDoc, type MotionDoc, type MotionOverrides } from "./doc";
import {
	sanitizeMotionOverrides,
	sanitizeMotionState,
	type MotionCadence,
	type MotionState,
} from "./motion-state";
import { MOTION_SHELF_STORAGE_KEY } from "@/lib/workspace-storage";

/**
 * THE MOTION SHELF — a tuned motion becomes yours.
 *
 * Mirrors `lib/studio-themes.ts` deliberately rather than inventing a second registry
 * shape: load / persist / save-as / rename / overwrite / delete / `nextMotionLabel`, one
 * storage key, the same total-and-never-throws healing at the boundary. A user who has
 * learned the Themes shelf has learned this one.
 *
 * ONE PLACE THE THEME RULING IS INVERTED, and the inversion is the point. A theme stores
 * its rig by NAME plus a sparse override, so a later revision of the preset still reaches
 * it. A shelf entry stores the document WHOLE. The two are not inconsistent: a theme's rig
 * is a REFERENCE to a definition that lives elsewhere, while a shelf entry IS the
 * definition. "Orbit — slow" must not silently change because Orbit changed; that is the
 * whole meaning of having saved it. The sparse-override ruling (design D7) still governs
 * `MotionState.overrides`, which is a reference to a catalogue document.
 *
 * DELIBERATELY NO DEFAULT-MOTION POINTER. `IpodStudioState.motion` already persists the
 * selected document, so the boot needs no second pointer, and `add-workspace-storage-registry`
 * is open on 21 keys across three naming conventions already.
 */

export interface SavedMotion {
	id: string;
	label: string;
	/** The document, stored whole — independent of whatever it was derived from. */
	doc: MotionDoc;
	/**
	 * The cadence it was flying when it was saved, so the shelf row can state a value and the
	 * one-tap recall restores what was authored rather than the tracks at whatever speed the
	 * transport happens to be set to.
	 */
	cadence: MotionCadence;
}

/** Keep the shelf a shelf: past this it is a file browser, and it needs a different surface. */
export const MAX_SAVED_MOTIONS = 50;

// ─── The one list ───────────────────────────────────────────────────────────

/**
 * Every document that can be selected, in picker order: the five shipped moves, then the
 * saved ones, then (behind the dev toggle) the moment cards.
 *
 * One list is the point of §4b.5 — a saved motion is opened, applied and exported by the
 * same code path as a shipped one, so there is no "custom motion" mode to discover and
 * nothing that works for a preset but not for a save.
 */
export function motionCatalogue(
	saved: readonly SavedMotion[] = [],
	options: { includeMoments?: boolean } = {},
): MotionDoc[] {
	return [
		...Object.values(CATALOGUE_DOCS),
		...saved.map((entry) => ({ ...entry.doc, id: entry.id, label: entry.label })),
		...(options.includeMoments ? Object.values(MOMENT_DOCS) : []),
	];
}

/** Resolve a document id across the catalogue and the shelf. */
export function findMotionDoc(
	id: string,
	saved: readonly SavedMotion[] = [],
): MotionDoc | undefined {
	return motionCatalogue(saved, { includeMoments: true }).find((doc) => doc.id === id);
}

/**
 * The document an id names, healed to Orbit when it names nothing that exists.
 *
 * Deleting a saved motion deliberately leaves `MotionState.docId` dangling rather than
 * rewriting it, so healing happens in exactly one place — here. Two places that heal are
 * two places that can disagree about what the motion became.
 */
export function resolveMotionDocById(
	id: string,
	saved: readonly SavedMotion[] = [],
): MotionDoc {
	return findMotionDoc(id, saved) ?? CATALOGUE_DOCS.orbit;
}

/** The document that will actually fly: the named one with the look's sparse edits laid over. */
export function resolveFlownDoc(
	docId: string,
	overrides: MotionOverrides | undefined,
	saved: readonly SavedMotion[] = [],
): MotionDoc {
	return resolveMotionDoc(resolveMotionDocById(docId, saved), overrides);
}

/**
 * ONE decision about which engine flies a motion — and it must have exactly one home,
 * because the live preview, the offline export and the timeline proof all have to make it
 * identically or the proof stops being a proof.
 *
 * A shipped move with no edits keeps its generator: the ported document reproduces it only
 * to within the measured port floor (worst 0.2116°, sweep elevation), and swapping engines
 * under an untouched preset is the pixel move §2.9 exists to gate on the owner.
 *
 * A TUNED move is necessarily a document — there is no generator for "Orbit, but the
 * azimuth curve dragged" — so the moment an override exists the document engine takes over.
 * That is not a silent substitution: the user asked for motion that only a document can
 * express. A saved motion is a document for the same reason.
 *
 * When §2.9 is ruled on, this collapses to always returning `documentClip`, and it is the
 * only line that has to change.
 */
export function motionClipFor(
	docId: string,
	overrides: MotionOverrides | undefined,
	saved: readonly SavedMotion[] = [],
): StudioClip {
	if (!overrides) {
		const shipped = findStudioClip(docId);
		if (shipped) return shipped;
	}
	return documentClip(resolveFlownDoc(docId, overrides, saved));
}

/**
 * The document a decided clip flies, or `undefined` when the generator won.
 *
 * The live rig and the offline render take `doc?: MotionDoc` rather than a whole
 * `StudioClip`, so this is where "a document is present IFF the document engine flies it"
 * is written down. Calling `resolveFlownDoc` at those boundaries instead would swap the
 * engine under an untouched preset — §2.9's gated 0.2116° move — because every preset
 * resolves to a document whether or not anything was tuned.
 */
export function flownMotionDoc(clip: StudioClip): MotionDoc | undefined {
	return clip.kind === "document" ? clip.doc : undefined;
}

// ─── Persistence ────────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

/**
 * Heal a stored entry. The document rides through `sanitizeMotionOverrides` — a whole
 * document and a sparse override have the same track shape, so healing them twice would be
 * two implementations of one rule. An entry whose tracks all fail to heal is dropped rather
 * than kept as an empty document that would silently fly nothing.
 *
 * The cadence rides through `sanitizeMotionState` for the same reason: the clamps
 * (`MIN/MAX_DURATION_SEC`, `MAX_REPEAT`, the time map's turnaround tuple) already have an
 * owner, and a second set here would be a second opinion about what a legal cadence is. It
 * is handed `naturalCycleSeconds` because a shelf document's cycle is not in the catalogue —
 * exactly the case `SanitizeMotionOptions` documents and no caller had yet.
 */
function sanitizeSavedMotion(value: unknown): SavedMotion | null {
	const entry = asRecord(value);
	if (!entry) return null;
	if (typeof entry.id !== "string" || entry.id.length === 0) return null;
	if (typeof entry.label !== "string" || entry.label.length === 0) return null;
	const doc = asRecord(entry.doc);
	if (!doc) return null;
	const healed = sanitizeMotionOverrides({
		tracks: doc.tracks,
		naturalCycleSeconds: doc.naturalCycleSeconds,
	});
	if (!healed?.tracks) return null;
	const naturalCycleSeconds = healed.naturalCycleSeconds ?? 5;
	const cadence = sanitizeMotionState(
		{ ...asRecord(entry.cadence), docId: entry.id },
		{ naturalCycleSeconds },
	);
	return {
		id: entry.id,
		label: entry.label,
		cadence: {
			repeat: cadence.repeat,
			durationSec: cadence.durationSec,
			timeMap: cadence.timeMap,
		},
		doc: {
			id: entry.id,
			label: entry.label,
			hint: typeof doc.hint === "string" ? doc.hint : undefined,
			tracks: healed.tracks,
			loopable: doc.loopable !== false,
			naturalCycleSeconds,
			...(Array.isArray(doc.proofPositions)
				? { proofPositions: doc.proofPositions.filter((p): p is number => typeof p === "number") }
				: {}),
		},
	};
}

export function loadSavedMotions(): SavedMotion[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(MOTION_SHELF_STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map(sanitizeSavedMotion)
			.filter((m): m is SavedMotion => m !== null)
			.slice(0, MAX_SAVED_MOTIONS);
	} catch {
		return [];
	}
}

export function persistSavedMotions(motions: readonly SavedMotion[]): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(
			MOTION_SHELF_STORAGE_KEY,
			JSON.stringify(motions.slice(0, MAX_SAVED_MOTIONS)),
		);
	} catch {
		// Quota/private-mode failures are non-fatal: the motion still flies live.
	}
}

/** Next free "Motion NN" label, so saving never demands a naming dialog first. */
export function nextMotionLabel(existing: readonly SavedMotion[]): string {
	const taken = new Set(existing.map((m) => m.label));
	for (let i = 1; i < 100; i++) {
		const label = `Motion ${String(i).padStart(2, "0")}`;
		if (!taken.has(label)) return label;
	}
	return `Motion ${existing.length + 1}`;
}

// ─── Editing the shelf ──────────────────────────────────────────────────────

/**
 * Save the flown document, at the cadence it is flying, as a new entry.
 *
 * The document is COPIED at save time — resolved against the catalogue, overrides folded
 * in, then re-identified under the new entry's id. What is saved is what was flying, and it
 * stops tracking whatever it was derived from at that instant. `structuredClone` is not
 * used: the copy is built field-by-field so a future field on `MotionDoc` has to be
 * considered rather than silently inherited.
 */
export function saveMotionAs(
	existing: readonly SavedMotion[],
	doc: MotionDoc,
	cadence: MotionCadence,
	id: string,
	label: string = nextMotionLabel(existing),
): SavedMotion[] {
	const entry: SavedMotion = {
		id,
		label,
		cadence: { ...cadence, timeMap: { ...cadence.timeMap } },
		doc: {
			...doc,
			id,
			label,
			tracks: Object.fromEntries(
				Object.entries(doc.tracks).map(([key, track]) => [
					key,
					{ ...track, keyframes: track.keyframes.map((kf) => ({ ...kf })) },
				]),
			),
		},
	};
	return [...existing, entry].slice(0, MAX_SAVED_MOTIONS);
}

/**
 * Rename in place, preserving identity and position — a saved motion that a look references
 * by id must stay referenced across a rename, and `motionDocHash` excludes labels precisely
 * so a rename cannot invalidate a cached proof frame.
 */
export function renameMotion(
	motions: readonly SavedMotion[],
	id: string,
	label: string,
): SavedMotion[] {
	const next = label.trim();
	if (next.length === 0) return [...motions];
	return motions.map((m) =>
		m.id === id ? { ...m, label: next, doc: { ...m.doc, label: next } } : m,
	);
}

/**
 * Replace a saved motion's document while keeping its id, label and position — the
 * "change one curve in a motion I already like" path, which otherwise costs
 * apply → tweak → save-new → delete-old and leaves the survivor named "Motion 04".
 */
export function overwriteMotion(
	motions: readonly SavedMotion[],
	id: string,
	doc: MotionDoc,
	cadence: MotionCadence,
): SavedMotion[] {
	return motions.map((m) =>
		m.id === id ? saveMotionAs([], doc, cadence, id, m.label)[0] : m,
	);
}

export function deleteMotion(motions: readonly SavedMotion[], id: string): SavedMotion[] {
	return motions.filter((m) => m.id !== id);
}

/**
 * The motion slice a shelf row's one tap applies — `APPLY_MOTION`'s payload.
 *
 * TWO THINGS IT DOES NOT CARRY, both of them the point:
 *
 * `overrides` is absent, and absent is a CLEAR (`sanitizeMotionState` builds the slice from
 * this record alone). An override is a diff against a specific base, so keeping the outgoing
 * document's edits would apply a curve authored for Orbit to a saved Crane and call the
 * result the saved motion — the defect `SET_MOTION_DOC` already rules on for the catalogue.
 * A shelf entry needs no override of its own: it stores its document whole.
 *
 * The playhead position and whether the transport is running arrive from the CALLER, not from
 * the entry. Opening a saved motion mid-playback keeps playing, exactly as picking a
 * catalogue move does; a shelf that paused the preview would be a second transport.
 */
export function openSavedMotion(
	entry: SavedMotion,
	transport: { playhead: number; playing: boolean },
): MotionState {
	return {
		docId: entry.id,
		repeat: entry.cadence.repeat,
		durationSec: entry.cadence.durationSec,
		timeMap: entry.cadence.timeMap,
		playhead: transport.playhead,
		playing: transport.playing,
	};
}
