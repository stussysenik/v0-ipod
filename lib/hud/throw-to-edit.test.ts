import { describe, expect, it } from "vitest";

import { FINGERPRINT_VERSION, stableStringify } from "../export/export-fingerprint";
import { canonicalTrack, type MotionTrack } from "../motion/doc";
import { applyTrackEdit, MAX_TRACK_GAIN, readTrackEdit } from "../motion/track-edit";
import type { Viewport } from "./arcball";
import type { PointerSample } from "./pointer-intent";
import {
	AUTHORING_SPEED_SCREENS_PER_S,
	CURVE_DEADBAND,
	fromThrow,
	pathCurvature,
	throwCurve,
} from "./throw-to-edit";

const VIEWPORT: Viewport = { width: 1920, height: 1080 };

/** A quarter-keyframe sway — the catalogue's own shape, so the round trip is the shipped one. */
const BASE: MotionTrack = {
	keyframes: [
		{ at: 0, value: 0, easing: "easeOutSine" },
		{ at: 0.25, value: 17, easing: "easeInSine" },
		{ at: 0.5, value: 0, easing: "easeOutSine" },
		{ at: 0.75, value: -17, easing: "easeInSine" },
		{ at: 1, value: 0 },
	],
};

/**
 * A recorded gesture: `count` samples 8ms apart, released at `theta`, turning `turn` half-turns
 * across the path. Every value is computed from the arguments, so the same call replays the
 * same bytes — which is the property the determinism tests below rest on.
 */
function throwTrail(
	theta: number,
	opts: { speed?: number; turn?: number; count?: number } = {},
): PointerSample[] {
	const speed = opts.speed ?? 1.6; // px/ms
	const turn = opts.turn ?? 0;
	const count = opts.count ?? 12;
	const dt = 8;
	const samples: PointerSample[] = [];
	let x = 960;
	let y = 540;
	let heading = theta;
	for (let i = 0; i < count; i++) {
		samples.push({ x, y, t: i * dt });
		x += Math.cos(heading) * speed * dt;
		y -= Math.sin(heading) * speed * dt; // screen y grows downward
		heading += (turn * Math.PI) / (count - 1);
	}
	return samples;
}

describe("the authoring threshold", () => {
	it("writes no track when the release was a placement, not a throw", () => {
		expect(fromThrow(throwTrail(0.4, { speed: 0.2 }), VIEWPORT)).toBeNull();
	});

	it("writes a track once the release clears the threshold", () => {
		const edit = fromThrow(throwTrail(0.4, { speed: 0.35 }), VIEWPORT);
		expect(edit).not.toBeNull();
		expect(edit?.gain).toBeGreaterThan(0);
	});

	it("measures the threshold in screens, so one number holds at every viewport", () => {
		// The same physical fraction of the screen, on a phone and on a 1080p canvas.
		const phone: Viewport = { width: 390, height: 844 };
		const fraction = (AUTHORING_SPEED_SCREENS_PER_S * 1.5) / 1000; // screens per ms
		const desktop = fromThrow(
			throwTrail(0.4, { speed: fraction * Math.min(VIEWPORT.width, VIEWPORT.height) }),
			VIEWPORT,
		);
		const handheld = fromThrow(
			throwTrail(0.4, { speed: fraction * Math.min(phone.width, phone.height) }),
			phone,
		);
		expect(desktop?.gain).toBeCloseTo(handheld?.gain ?? -1, 6);
	});

	it("refuses a viewport with no area rather than dividing by zero", () => {
		expect(fromThrow(throwTrail(0.4), { width: 0, height: 0 })).toBeNull();
	});
});

describe("the throw is the track edit", () => {
	it("round-trips gain, phase and curve at 64 release angles", () => {
		const phases = new Set<number>();
		for (let k = 0; k < 64; k++) {
			const edit = fromThrow(throwTrail((k * 2 * Math.PI) / 64, { turn: 0.4 }), VIEWPORT);
			expect(edit).not.toBeNull();
			if (edit === null) continue;

			const stored = applyTrackEdit(BASE, edit);
			const recovered = readTrackEdit(BASE, stored);
			expect(recovered.gain).toBeCloseTo(edit.gain, 9);
			expect(recovered.phase).toBe(edit.phase);
			expect(recovered.curve).toEqual(edit.curve);
			phases.add(edit.phase);
		}
		// A round trip that passes because every throw wrote the same phase proves nothing.
		expect(phases.size).toBe(64);
	});

	it("stays inside the gain ceiling however hard the throw", () => {
		const edit = fromThrow(throwTrail(1.1, { speed: 40 }), VIEWPORT);
		expect(edit?.gain).toBe(MAX_TRACK_GAIN);
	});

	it("replays a recorded gesture to byte-identical bytes", () => {
		const trail = throwTrail(0.7, { turn: 0.3 });
		const once = fromThrow(trail, VIEWPORT);
		const twice = fromThrow(structuredClone(trail), VIEWPORT);
		expect(once).not.toBeNull();
		if (once === null || twice === null) return;
		expect(stableStringify(canonicalTrack(applyTrackEdit(BASE, once)))).toBe(
			stableStringify(canonicalTrack(applyTrackEdit(BASE, twice))),
		);
	});

	it("derives from the base, so applying the same edit twice does not drift", () => {
		const edit = fromThrow(throwTrail(2.4, { turn: -0.5 }), VIEWPORT);
		expect(edit).not.toBeNull();
		if (edit === null) return;
		const first = applyTrackEdit(BASE, edit);
		const second = applyTrackEdit(BASE, readTrackEdit(BASE, first));
		expect(stableStringify(second)).toBe(stableStringify(first));
	});
});

/**
 * The claim that lets this change ship with no migration: a throw writes only fields the format
 * already had. If this test goes red, the change owes a `FINGERPRINT_VERSION` bump and a
 * migration with an asserted converted value.
 */
describe("no format change", () => {
	const TRACK_FIELDS = ["keyframes", "phase"];
	const KEYFRAME_FIELDS = ["at", "value", "easing", "hold"];

	const stored = (() => {
		const edit = fromThrow(throwTrail(1, { turn: 0.4 }), VIEWPORT);
		if (edit === null) throw new Error("fixture throw did not clear the authoring threshold");
		return applyTrackEdit(BASE, edit);
	})();

	it("leaves FINGERPRINT_VERSION where it is", () => {
		expect(FINGERPRINT_VERSION).toBe(2);
	});

	it("writes only fields MotionTrack already had", () => {
		for (const key of Object.keys(stored)) expect(TRACK_FIELDS).toContain(key);
		for (const keyframe of stored.keyframes) {
			for (const key of Object.keys(keyframe)) expect(KEYFRAME_FIELDS).toContain(key);
		}
	});

	it("feeds the same canonical shape the doc hash already reads", () => {
		expect(stableStringify(canonicalTrack(stored))).toBe(stableStringify(canonicalTrack(stored)));
		expect(stableStringify(canonicalTrack(stored))).not.toBe(
			stableStringify(canonicalTrack(BASE)),
		);
	});
});

describe("path curvature", () => {
	it("reads zero for a straight drag, so the document keeps its authored curves", () => {
		expect(pathCurvature(throwTrail(0.9))).toBeCloseTo(0, 12);
		expect(fromThrow(throwTrail(0.9), VIEWPORT)?.curve).toBeNull();
	});

	it("mirrors sign with the direction of the turn", () => {
		const clockwise = pathCurvature(throwTrail(0.9, { turn: -0.4 }));
		const counter = pathCurvature(throwTrail(0.9, { turn: 0.4 }));
		expect(counter).toBeGreaterThan(CURVE_DEADBAND);
		expect(clockwise).toBeCloseTo(-counter, 12);
	});

	it("does not read a spin from a path that crosses the ±π heading seam", () => {
		// Heading passes through π while turning by a small amount either side of it.
		const seam: PointerSample[] = [
			{ x: 500, y: 300, t: 0 },
			{ x: 460, y: 296, t: 8 },
			{ x: 420, y: 300, t: 16 },
			{ x: 380, y: 308, t: 24 },
		];
		expect(Math.abs(pathCurvature(seam))).toBeLessThan(0.2);
	});

	it("keeps every X control point inside the time domain across the whole range", () => {
		for (let c = -1; c <= 1.0001; c += 0.05) {
			const handles = throwCurve(c);
			if (handles === null) continue;
			expect(handles[0]).toBeGreaterThanOrEqual(0);
			expect(handles[0]).toBeLessThanOrEqual(1);
			expect(handles[2]).toBeGreaterThanOrEqual(0);
			expect(handles[2]).toBeLessThanOrEqual(1);
		}
	});

	it("is null inside the deadband — an absent curve is not a value", () => {
		expect(throwCurve(0)).toBeNull();
		expect(throwCurve(CURVE_DEADBAND / 2)).toBeNull();
		expect(throwCurve(CURVE_DEADBAND)).not.toBeNull();
	});
});
