import { describe, expect, it } from "vitest";

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
