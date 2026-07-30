import { describe, expect, it } from "vitest";

import type { MotionTrack } from "@/lib/motion/doc";
import { resolveFlownDoc } from "@/lib/motion/motion-shelf";
import { DEFAULT_MOTION_STATE } from "@/lib/motion/motion-state";
import { createClipPoseSampler, documentClip } from "@/lib/studio-clip-presets";
import type { StudioPose } from "@/lib/studio-camera";

import { createInitialIpodWorkbenchModel, type IpodWorkbenchModel } from "./model";
import {
	PORTABLE_STATE_VERSION,
	decodePortableState,
	decodePortableStateJson,
	encodePortableState,
	encodePortableStateJson,
} from "./portable-state";
import { normalizeModel } from "./update";

/**
 * The portable codec is the whole share/export/import contract (spec:
 * portable-customizer-state): a look encoded on one device must decode to the
 * identical normalized model on another, and a corrupted or hostile `?s=` payload
 * must degrade to null — never an exception — so the surface silently falls back
 * to persisted state. These tests pin both halves plus the URL-safety of the
 * string itself.
 */

/** Wrong-shape payloads are hand-built here; the unit project runs on node. */
function encodeRaw(value: unknown): string {
	return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

/** A look that touches every travelling slice, including non-ASCII engraving text. */
function customizedModel(): IpodWorkbenchModel {
	const model = createInitialIpodWorkbenchModel();
	return {
		...model,
		metadata: {
			...model.metadata,
			title: "夜のドライブ — Nächte ✨",
			artist: "Füji Kaze",
			album: "空 (Sora)",
		},
		presentation: {
			...model.presentation,
			skinColor: "#3366CC",
			bgColor: "#F0EAD6",
			ringColor: "#202020",
			centerColor: "#303030",
			hardwarePreset: "classic-2008-silver",
		},
		studio: {
			...model.studio,
			marquee: false,
			showPorts: true,
			lighting: {
				...model.studio.lighting,
				ambient: { ...model.studio.lighting.ambient, intensity: 0.42 },
				key: { ...model.studio.lighting.key, intensity: 3.5, color: "#FFEEDD" },
				env: { ...model.studio.lighting.env, intensity: 1.25, blur: 0.6 },
			},
		},
		savedColors: { ...model.savedColors, case: ["#123456", "#ABCDEF"] },
	};
}

describe("portable state round trip", () => {
	it("decode(encode(default model)) equals the normalized default", () => {
		const model = createInitialIpodWorkbenchModel();
		expect(decodePortableState(encodePortableState(model))).toEqual(normalizeModel(model));
	});

	it("a customized look — colors, preset, lighting, unicode text — is lossless", () => {
		const model = customizedModel();
		const decoded = decodePortableState(encodePortableState(model));

		expect(decoded).toEqual(normalizeModel(model));
		// Pin the fields most likely to be dropped by a marshalling regression.
		expect(decoded?.presentation.hardwarePreset).toBe("classic-2008-silver");
		expect(decoded?.metadata.title).toBe("夜のドライブ — Nächte ✨");
		expect(decoded?.studio.lighting.key.intensity).toBe(3.5);
		expect(decoded?.studio.lighting.env.blur).toBe(0.6);
		expect(decoded?.savedColors.case).toEqual(["#123456", "#ABCDEF"]);
	});

	it("panel layout never travels — it is device-local window chrome", () => {
		const model = {
			...customizedModel(),
			panelLayout: { flat: { colors: { x: 40, y: 40, visible: true } } },
		};
		expect(decodePortableState(encodePortableState(model))?.panelLayout).toEqual({});
	});
});

describe("portable state malformed input", () => {
	it.each([
		["empty string", ""],
		["garbage", "not base64 %%% at all!"],
		["truncated payload", encodePortableState(createInitialIpodWorkbenchModel()).slice(0, 24)],
		["valid base64 of a non-object", encodeRaw("hello")],
		["valid base64 of the wrong shape", encodeRaw([1, 2, 3])],
		["payload without a model", encodeRaw({ v: PORTABLE_STATE_VERSION })],
		["array where the model should be", encodeRaw({ v: PORTABLE_STATE_VERSION, model: [] })],
		["wrong version", encodeRaw({ v: PORTABLE_STATE_VERSION + 1, model: {} })],
	])("returns null and never throws for %s", (_label, input) => {
		expect(() => decodePortableState(input)).not.toThrow();
		expect(decodePortableState(input)).toBeNull();
	});

	it("heals a valid envelope with junk slices back to safe defaults", () => {
		const decoded = decodePortableState(
			encodeRaw({
				v: PORTABLE_STATE_VERSION,
				model: {
					presentation: { hardwarePreset: "classic-9999" },
					studio: { lighting: { key: { intensity: Number.NaN } } },
					savedColors: { case: ["#123456", "nope", 7] },
				},
			}),
		);
		const base = normalizeModel(createInitialIpodWorkbenchModel());

		expect(decoded?.presentation.hardwarePreset).toBe(base.presentation.hardwarePreset);
		expect(decoded?.studio.lighting.key.intensity).toBe(base.studio.lighting.key.intensity);
		expect(decoded?.savedColors.case).toEqual(["#123456"]);
	});
});

describe("portable state string shape", () => {
	it("is URL-safe (no +, /, =) and compact enough for a query param", () => {
		const encoded = encodePortableState(customizedModel());
		expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
		// The full model (lighting rig included) should stay well under common
		// practical URL ceilings (~8K); a blowup here means double-encoding.
		expect(encoded.length).toBeLessThan(6000);
	});
});

describe("portable state config file (JSON twin)", () => {
	it("round-trips a customized look through the pretty JSON body", () => {
		const source = customizedModel();
		const decoded = decodePortableStateJson(encodePortableStateJson(source));
		const { panelLayout: _panelLayout, ...portable } = normalizeModel(source);
		expect(decoded).toEqual(
			normalizeModel({ ...portable, panelLayout: createInitialIpodWorkbenchModel().panelLayout }),
		);
	});

	it("returns null (never throws) on non-JSON and wrong-shape text", () => {
		expect(decodePortableStateJson("not json at all")).toBeNull();
		expect(decodePortableStateJson(JSON.stringify({ v: 99, model: {} }))).toBeNull();
		expect(decodePortableStateJson(JSON.stringify([1, 2, 3]))).toBeNull();
	});

	it("carries the same envelope as the URL codec", () => {
		const model = customizedModel();
		const viaJson = decodePortableStateJson(encodePortableStateJson(model));
		const viaUrl = decodePortableState(encodePortableState(model));
		expect(viaJson).toEqual(viaUrl);
	});
});

/**
 * MOTION TRAVELS AS A DOCUMENT, NOT AS A NAME.
 *
 * A share link that carried only `docId` would open a tuned look playing the untuned move —
 * the same defect the export identity closes with a hash. So the sparse override rides the
 * payload, and the only definition of "it survived" is that the decoded look SAMPLES the
 * same poses. Names and structural equality are both weaker claims than that.
 *
 * The transport does not travel: a link copied at 40% opens composed, and encodes to the
 * same string whether or not the preview happened to be running.
 */

const MOTION_HERO: StudioPose = { azimuth: 24, elevation: -8, reach: 2.6, target: [0, 0.05, 0] };
const MOTION_PHASES = Array.from({ length: 33 }, (_, i) => i / 32);

/** A curve only a document can express — a hand-dragged tuple and a shifted phase. */
const TUNED_AZIMUTH: MotionTrack = {
	keyframes: [
		{ at: 0, value: 0, easing: [0.12, 0.83, 0.4, 0.97] },
		{ at: 0.5, value: -9.5, easing: "easeInOutCubic" },
		{ at: 1, value: 0 },
	],
	phase: 0.37,
};

function motionCycle(docId: string, overrides: unknown): StudioPose[] {
	const doc = resolveFlownDoc(docId, overrides as never);
	const sample = createClipPoseSampler(documentClip(doc), MOTION_HERO);
	return MOTION_PHASES.map(sample);
}

function tunedModel(): IpodWorkbenchModel {
	const model = createInitialIpodWorkbenchModel();
	return {
		...model,
		studio: {
			...model.studio,
			motion: {
				docId: "crane",
				overrides: { tracks: { azimuth: TUNED_AZIMUTH }, naturalCycleSeconds: 9 },
				repeat: 3,
				durationSec: 12,
				timeMap: { kind: "boomerang", turnaround: [0.2, 0, 0.8, 1] },
				playhead: 0.4,
				playing: true,
			},
		},
	};
}

describe("motion round trip", () => {
	it("a hand-authored curve decodes to the identical flown poses", () => {
		const model = tunedModel();
		const decoded = decodePortableState(encodePortableState(model));
		const motion = decoded!.studio.motion;

		expect(motion.docId).toBe("crane");
		expect(motion.overrides?.tracks?.azimuth).toEqual(TUNED_AZIMUTH);
		expect(motionCycle(motion.docId, motion.overrides)).toEqual(
			motionCycle("crane", model.studio.motion.overrides),
		);
		// And the tuning is not decoration: it changes what flies.
		expect(motionCycle(motion.docId, motion.overrides)).not.toEqual(
			motionCycle("crane", undefined),
		);
	});

	it("carries the transport SETTINGS and drops the transport POSITION", () => {
		const decoded = decodePortableState(encodePortableState(tunedModel()))!;
		expect(decoded.studio.motion.repeat).toBe(3);
		expect(decoded.studio.motion.durationSec).toBe(12);
		expect(decoded.studio.motion.timeMap).toEqual({ kind: "boomerang", turnaround: [0.2, 0, 0.8, 1] });
		expect(decoded.studio.motion.playhead).toBe(0);
		expect(decoded.studio.motion.playing).toBe(false);
	});

	it("encodes to the same string whether or not the preview was running", () => {
		const composed = tunedModel();
		const midFlight = {
			...composed,
			studio: { ...composed.studio, motion: { ...composed.studio.motion, playhead: 0.83, playing: true } },
		};
		expect(encodePortableState(midFlight)).toBe(encodePortableState(composed));
	});
});

describe("motion decoded from a pre-motion payload", () => {
	/** Everything a v1 look carried, with no `studio.motion` at all. */
	function v1Envelope(studioMotion?: unknown): string {
		const model = createInitialIpodWorkbenchModel();
		const { motion: _motion, ...studio } = model.studio;
		return encodeRaw({
			v: PORTABLE_STATE_VERSION,
			model: {
				...normalizeModel(model),
				studio: studioMotion === undefined ? studio : { ...studio, motion: studioMotion },
			},
		});
	}

	it("heals to the default document rather than refusing the link", () => {
		const decoded = decodePortableState(v1Envelope());
		expect(decoded).not.toBeNull();
		expect(decoded!.studio.motion).toEqual(DEFAULT_MOTION_STATE);
	});

	it("converts a legacy speed into the repeat it was actually flying", () => {
		// Turntable's natural cycle is 6s; a 12s clip at speed 1 was flying two cycles.
		const decoded = decodePortableState(
			v1Envelope({ move: "turntable", loop: "loop", speed: 1, durationSec: 12 }),
		)!;
		expect(decoded.studio.motion.docId).toBe("turntable");
		expect(decoded.studio.motion.repeat).toBe(2);
		expect(decoded.studio.motion.timeMap).toEqual({ kind: "loop" });
	});

	it("halves a boomerang once — an authored repeat counts round-trips", () => {
		const decoded = decodePortableState(
			v1Envelope({ move: "crane", loop: "boomerang", speed: 1, durationSec: 32 }),
		)!;
		// Crane's cycle is 8s: 4 cycles derived, 2 authored round-trips.
		expect(decoded.studio.motion.repeat).toBe(2);
		expect(decoded.studio.motion.timeMap).toEqual({ kind: "boomerang" });
	});

	it("reads a v1 hold as amplitude zero, however fast it claimed to be going", () => {
		const decoded = decodePortableState(
			v1Envelope({ move: "orbit", loop: "hold", speed: 2, durationSec: 10 }),
		)!;
		expect(decoded.studio.motion.repeat).toBe(0);
		expect(decoded.studio.motion.timeMap).toEqual({ kind: "loop" });
	});

	it("never throws on hostile motion values — it heals every field", () => {
		const decoded = decodePortableState(
			v1Envelope({
				docId: 42,
				repeat: Number.NaN,
				durationSec: "forever",
				timeMap: { kind: "spiral" },
				overrides: { tracks: { azimuth: { keyframes: [{ at: "x", value: null }] } } },
				playhead: 99,
			}),
		)!;
		expect(decoded.studio.motion.docId).toBe(DEFAULT_MOTION_STATE.docId);
		expect(decoded.studio.motion.durationSec).toBe(DEFAULT_MOTION_STATE.durationSec);
		expect(decoded.studio.motion.timeMap).toEqual({ kind: "loop" });
		expect(decoded.studio.motion.overrides).toBeUndefined();
		expect(decoded.studio.motion.playhead).toBe(0);
	});

	it("clamps a clip length to the range the dock can author", () => {
		expect(decodePortableState(v1Envelope({ docId: "orbit", durationSec: 9999 }))!.studio.motion.durationSec).toBe(60);
		expect(decodePortableState(v1Envelope({ docId: "orbit", durationSec: 0.1 }))!.studio.motion.durationSec).toBe(2);
	});
});
