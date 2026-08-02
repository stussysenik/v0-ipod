import { describe, expect, it } from "vitest";

import {
	HOLD_THRESHOLD_MS,
	IDLE_POINTER_INTENT,
	ORBIT_THRESHOLD_PX,
	pointerVelocity,
	reducePointerIntent,
	replayPointerIntent,
	TRAIL_SAMPLES,
	type PointerIntentEvent,
	type PointerSample,
} from "./pointer-intent";

const ORIGIN: PointerSample = { x: 400, y: 300, t: 0 };

/**
 * The defect this file exists to catch: time-only disambiguation. A press that has already
 * committed to an orbit must never promote to a wheel, however long the button stays down,
 * because a wheel that appears mid-orbit is the flicker `3d-control-surface` forbids.
 */
describe("a travelling press is an orbit forever", () => {
	it("never reaches summoning after 9px at 40ms, at any hold duration", () => {
		let state = reducePointerIntent(IDLE_POINTER_INTENT, { kind: "down", sample: ORIGIN });
		state = reducePointerIntent(state, {
			kind: "move",
			sample: { x: ORIGIN.x + 9, y: ORIGIN.y, t: 40 },
		});
		expect(state.locked).toBe(true);

		for (let t = 40; t <= 5000; t += 20) {
			state = reducePointerIntent(state, { kind: "tick", t });
			expect(state.phase).toBe("orbiting");
		}
	});

	it("locks on travel in any direction, not only along an axis", () => {
		const diagonal = ORBIT_THRESHOLD_PX; // 8 along each axis is ~11.3 of travel
		let state = reducePointerIntent(IDLE_POINTER_INTENT, { kind: "down", sample: ORIGIN });
		state = reducePointerIntent(state, {
			kind: "move",
			sample: { x: ORIGIN.x + diagonal, y: ORIGIN.y + diagonal, t: 30 },
		});
		state = reducePointerIntent(state, { kind: "tick", t: HOLD_THRESHOLD_MS + 100 });
		expect(state.phase).toBe("orbiting");
	});
});

/**
 * Buxton's three-state model: a mouse reports a tracking state before the press and a finger
 * does not. Both streams must reach the same phase, or the wheel is a desktop-only control.
 */
describe("a still press summons on both input classes", () => {
	const held = (lead: PointerIntentEvent[], jitter: number): PointerIntentEvent[] => [
		...lead,
		{ kind: "down", sample: ORIGIN },
		{ kind: "move", sample: { x: ORIGIN.x + jitter, y: ORIGIN.y, t: 120 } },
		{ kind: "tick", t: HOLD_THRESHOLD_MS },
	];

	it("summons from a mouse stream that hovered before pressing", () => {
		const hover: PointerIntentEvent[] = [
			{ kind: "move", sample: { x: 100, y: 100, t: -200 } },
			{ kind: "move", sample: { x: 250, y: 200, t: -100 } },
		];
		expect(replayPointerIntent(held(hover, 3)).phase).toBe("summoning");
	});

	it("summons from a touch stream that begins at the press", () => {
		expect(replayPointerIntent(held([], 3)).phase).toBe("summoning");
	});

	it("summons at exactly the orbit threshold — 'within 8px' includes 8px", () => {
		expect(replayPointerIntent(held([], ORBIT_THRESHOLD_PX)).phase).toBe("summoning");
	});

	it("does not summon one millisecond early", () => {
		let state = reducePointerIntent(IDLE_POINTER_INTENT, { kind: "down", sample: ORIGIN });
		state = reducePointerIntent(state, { kind: "tick", t: HOLD_THRESHOLD_MS - 1 });
		expect(state.phase).toBe("orbiting");
	});

	it("keeps the wheel once summoned, however far the pointer then travels", () => {
		let state = replayPointerIntent(held([], 2));
		state = reducePointerIntent(state, {
			kind: "move",
			sample: { x: ORIGIN.x + 400, y: ORIGIN.y + 400, t: 600 },
		});
		expect(state.phase).toBe("summoning");
	});

	it("commits the wedge on release without throwing", () => {
		let state = replayPointerIntent(held([], 2));
		state = reducePointerIntent(state, {
			kind: "up",
			sample: { x: ORIGIN.x + 60, y: ORIGIN.y, t: 620 },
		});
		expect(state.phase).toBe("idle");
	});
});

describe("release", () => {
	const drag = (speed: number): PointerIntentEvent[] => {
		const events: PointerIntentEvent[] = [{ kind: "down", sample: ORIGIN }];
		for (let i = 1; i <= 10; i++) {
			events.push({
				kind: "move",
				sample: { x: ORIGIN.x + i * speed * 8, y: ORIGIN.y, t: i * 8 },
			});
		}
		return events;
	};

	it("enters throwing when the hand was still moving", () => {
		const state = replayPointerIntent([
			...drag(1.5),
			{ kind: "up", sample: { x: ORIGIN.x + 132, y: ORIGIN.y, t: 88 } },
		]);
		expect(state.phase).toBe("throwing");
		expect(state.trail.length).toBeGreaterThan(1);
	});

	it("returns to idle when the hand had stopped", () => {
		const settled: PointerIntentEvent[] = [
			{ kind: "down", sample: ORIGIN },
			{ kind: "move", sample: { x: 600, y: 300, t: 200 } },
			{ kind: "move", sample: { x: 600, y: 300, t: 280 } },
			{ kind: "up", sample: { x: 600, y: 300, t: 300 } },
		];
		expect(replayPointerIntent(settled).phase).toBe("idle");
	});

	it("drops everything on cancel", () => {
		const state = replayPointerIntent([...drag(1.5), { kind: "cancel" }]);
		expect(state).toEqual(IDLE_POINTER_INTENT);
	});
});

describe("the trail is bounded and windowed", () => {
	it("never grows past TRAIL_SAMPLES however long the drag", () => {
		const events: PointerIntentEvent[] = [{ kind: "down", sample: ORIGIN }];
		for (let i = 1; i <= 500; i++) {
			events.push({ kind: "move", sample: { x: 400 + i, y: 300, t: i * 8 } });
		}
		expect(replayPointerIntent(events).trail.length).toBe(TRAIL_SAMPLES);
	});

	it("reads the flick, not the slow drag that preceded it", () => {
		// 400ms of crawl at 0.05 px/ms, then 100ms of flick at 2 px/ms. The 80ms window sits
		// entirely inside the flick, so the crawl must not dilute the reading.
		const trail: PointerSample[] = [];
		for (let t = 0; t <= 400; t += 20) trail.push({ x: 400 + t * 0.05, y: 300, t });
		for (let t = 420; t <= 520; t += 10) trail.push({ x: 420 + (t - 400) * 2, y: 300, t });
		expect(pointerVelocity(trail).x).toBeCloseTo(2, 6);
	});

	it("reports zero for a single sample", () => {
		expect(pointerVelocity([ORIGIN]).speed).toBe(0);
	});
});
