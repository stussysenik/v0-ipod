import { stableStringify } from "@/lib/export/export-fingerprint";
import { sanitizeMotionState, withoutTransport } from "@/lib/motion/motion-state";
import { sanitizeLightingConfig } from "@/lib/studio-lighting-config";
import { sanitizeCockpitVisibility } from "./cockpit-roster";
import {
	COLOR_TARGETS,
	MAX_SAVED_COLORS,
	createInitialIpodWorkbenchModel,
	type IpodWorkbenchModel,
	type SavedColorHistory,
} from "./model";
import { isHardwarePreset, isHexColor } from "./storage";
import { normalizeModel } from "./update";

/**
 * Portable customizer state — the marshalling layer behind share links and config
 * files (spec: portable-customizer-state). One versioned codec:
 *
 *   `encodePortableState(model)` → base64url(canonical JSON), compact enough for a
 *   `?s=` URL param and byte-stable (stableStringify) so the same look always
 *   encodes to the same string.
 *
 *   `decodePortableState(input)` → a normalized model, or null on ANY malformed
 *   input — it never throws, so a corrupted link silently falls back to the
 *   locally persisted state.
 *
 * The payload is the COMPLETE look — metadata, playback, presentation, interaction,
 * studio (including the lighting rig) and saved colors — because a SongSnapshot
 * alone omits the studio slice. `panelLayout` is deliberately EXCLUDED: floating
 * panel frames are device-local window chrome (positions/sizes tuned to one
 * screen), not part of the look, so a link opened on a phone must not import
 * desktop panel geometry.
 *
 * This module never reads or writes localStorage — the live multi-key persistence
 * layout is untouched; callers restore a decoded model through the normal
 * RESTORE_MODEL path.
 */

export const PORTABLE_STATE_VERSION = 1 as const;
/** URL query parameter carrying an encoded payload on `/` and `/3d`. */
export const PORTABLE_STATE_PARAM = "s";

/** UTF-8 → base64url (no `+`, `/`, or padding). TextEncoder + btoa exist in every
 *  target runtime — browsers and Node ≥16, where the `unit` vitest project runs —
 *  and the byte round through TextEncoder keeps non-ASCII engraving text safe. */
function toBase64Url(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
	const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
	const binary = atob(padded);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	// fatal: decoding garbage bytes must throw (caught by decodePortableState),
	// not silently yield U+FFFD soup that could still parse as JSON.
	return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

/** Copy only the keys the default slice declares, so absent fields heal to the
 *  default and unknown keys can never ride a payload into the model. */
function healSlice<T extends object>(base: T, candidate: unknown): T {
	const source = asRecord(candidate);
	if (!source) return base;
	const healed = { ...base } as Record<string, unknown>;
	for (const key of Object.keys(healed)) {
		if (source[key] !== undefined) healed[key] = source[key];
	}
	return healed as T;
}

/** Same shape discipline as `loadSavedColors`: hex-only entries, capped per target. */
function healSavedColors(candidate: unknown): SavedColorHistory {
	const healed: SavedColorHistory = { case: [], bg: [], ring: [], center: [] };
	const source = asRecord(candidate);
	if (!source) return healed;
	for (const target of COLOR_TARGETS) {
		const list = source[target];
		if (!Array.isArray(list)) continue;
		healed[target] = list.filter(isHexColor).slice(0, MAX_SAVED_COLORS);
	}
	return healed;
}

/**
 * Canonical, portable projection of a model: normalized, minus the device-local panel
 * layout, minus the motion transport position.
 *
 * The playhead is EXCLUDED here rather than kept out of the model (design D7). A link
 * copied while the preview is at 40% must open composed, not mid-flight — and it must
 * encode to the same string whether or not the transport happened to be running, so that
 * "the same look always encodes to the same string" stays true.
 */
function toPortable(model: IpodWorkbenchModel) {
	const { panelLayout: _panelLayout, ...portable } = normalizeModel(model);
	return {
		...portable,
		studio: { ...portable.studio, motion: withoutTransport(portable.studio.motion) },
	};
}

export function encodePortableState(model: IpodWorkbenchModel): string {
	return toBase64Url(stableStringify({ v: PORTABLE_STATE_VERSION, model: toPortable(model) }));
}

export function decodePortableState(input: string): IpodWorkbenchModel | null {
	try {
		return decodeEnvelope(JSON.parse(fromBase64Url(input)));
	} catch {
		return null;
	}
}

/** File-import twin of `decodePortableState`: same envelope, same heal pipeline,
 *  raw JSON text (an `ipod-config.json`) instead of a base64url URL payload. */
export function decodePortableStateJson(text: string): IpodWorkbenchModel | null {
	try {
		return decodeEnvelope(JSON.parse(text));
	} catch {
		return null;
	}
}

/** Human-readable config-file body — the same canonical envelope, pretty-printed. */
export function encodePortableStateJson(model: IpodWorkbenchModel): string {
	return JSON.stringify(
		JSON.parse(stableStringify({ v: PORTABLE_STATE_VERSION, model: toPortable(model) })),
		null,
		"\t",
	);
}

function decodeEnvelope(parsed: unknown): IpodWorkbenchModel | null {
	try {
		const payload = asRecord(parsed);
		if (!payload || payload.v !== PORTABLE_STATE_VERSION) return null;
		const candidate = asRecord(payload.model);
		if (!candidate) return null;

		const base = createInitialIpodWorkbenchModel();
		const presentation = { ...healSlice(base.presentation, candidate.presentation) };
		if (!isHardwarePreset(presentation.hardwarePreset)) {
			presentation.hardwarePreset = base.presentation.hardwarePreset;
		}
		const studio = asRecord(candidate.studio);

		return normalizeModel({
			metadata: healSlice(base.metadata, candidate.metadata),
			playback: healSlice(base.playback, candidate.playback),
			presentation,
			interaction: {
				...healSlice(base.interaction, candidate.interaction),
				// Transient editing flag — never restored, same as every storage boundary.
				isNowPlayingEditable: false,
			},
			studio: {
				...healSlice(base.studio, studio),
				// The rig feeds WebGL directly; heal it field-by-field like storage does.
				lighting: sanitizeLightingConfig(studio?.lighting),
				// Motion heals the same way and converts a legacy `speed` on the way in.
				// `playhead`/`playing` are reset by the sanitizer, matching the
				// `isNowPlayingEditable: false` rule two lines up: a shared link opens
				// composed, never mid-playback.
				motion: withoutTransport(sanitizeMotionState(studio?.motion)),
				// The roster is a total record; `healSlice` would copy a partial object
				// whole, and a missing id reads falsy — a panel hidden by a payload rather
				// than by a gesture. Every unlisted id heals to visible.
				cockpits: sanitizeCockpitVisibility(studio?.cockpits),
			},
			// Device-local window chrome never travels (see module note).
			panelLayout: base.panelLayout,
			savedColors: healSavedColors(candidate.savedColors),
		});
	} catch {
		return null;
	}
}
