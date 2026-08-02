/**
 * POINTER INTENT — one reducer over pointer samples, four states, no clock read.
 *
 * Buxton's three-state model (*A three-state model of graphical input*, GI '90) is the
 * constraint this module exists to satisfy: a mouse has out-of-range, tracking and dragging;
 * a finger has only the last two. Press-and-hold-to-summon and press-and-drag-to-orbit are
 * therefore the SAME event at their first sample on touch, and the only signal that separates
 * them is movement.
 *
 * So the press enters `orbiting` immediately — the object tracks the pointer from the first
 * pixel — and the wheel is a PROMOTION of a press that stayed still. Travel past
 * `ORBIT_THRESHOLD_PX` locks `orbiting` for the rest of the press, which is what makes the
 * promotion safe: chrome never draws and then retracts, so an orbit cannot start with a flicker
 * of a wheel that was about to appear. Time alone never disambiguates the two.
 *
 * EVERY TIMESTAMP ARRIVES ON THE SAMPLE. The reducer reads no wall clock and no random source,
 * which is what lets a recorded gesture replay to the same states and, through `throw-to-edit`,
 * to a bit-identical authored track.
 */

/** A pointer position in viewport CSS pixels, stamped with its own event time. */
export interface PointerSample {
	x: number;
	y: number;
	/** Milliseconds from an arbitrary origin — the event's own stamp, never read at use. */
	t: number;
}

/**
 * `orbiting` is the live drag, `summoning` is the wheel, `throwing` is the single state a
 * release with velocity passes through so the consumer can hand the trail to `fromThrow`.
 */
export type PointerPhase = "idle" | "orbiting" | "summoning" | "throwing";

export type PointerIntentEvent =
	| { kind: "down"; sample: PointerSample }
	| { kind: "move"; sample: PointerSample }
	/** A frame with no pointer motion. A held mouse emits no `move`, so the hold needs a beat. */
	| { kind: "tick"; t: number }
	| { kind: "up"; sample: PointerSample }
	| { kind: "cancel" };

export interface PointerIntent {
	phase: PointerPhase;
	/** Where the press began; `null` between presses. */
	origin: PointerSample | null;
	/** Set once the press travelled past the orbit threshold. Never cleared before release. */
	locked: boolean;
	/** Bounded tail of the press path, oldest first. Release velocity and curvature read it. */
	trail: readonly PointerSample[];
}

/** Travel past this, in CSS pixels, and the press is an orbit that can never become a wheel. */
export const ORBIT_THRESHOLD_PX = 8;

/** A press still within the orbit threshold at this age has asked for the wheel. */
export const HOLD_THRESHOLD_MS = 400;

/** Release velocity is measured over this window, so a flick reads as its flick, not its drag. */
export const VELOCITY_WINDOW_MS = 80;

/**
 * Trail depth. At 120 Hz this is ~0.27 s — the span a throw actually occupies, and the reason
 * the reducer's memory is bounded no matter how long the drag before it ran.
 */
export const TRAIL_SAMPLES = 32;

export const IDLE_POINTER_INTENT: PointerIntent = {
	phase: "idle",
	origin: null,
	locked: false,
	trail: [],
};

/** Screen-axis velocity in CSS pixels per millisecond. `y` grows downward, as the DOM reports it. */
export interface PointerVelocity {
	x: number;
	y: number;
	speed: number;
}

export const ZERO_POINTER_VELOCITY: PointerVelocity = { x: 0, y: 0, speed: 0 };

/**
 * Velocity across the newest samples inside `VELOCITY_WINDOW_MS`.
 *
 * Measured over a window rather than the last pair, because one pair is one frame of hardware
 * jitter and a throw is a decision the hand made over several frames.
 */
export function pointerVelocity(trail: readonly PointerSample[]): PointerVelocity {
	const last = trail[trail.length - 1];
	if (last === undefined || trail.length < 2) return ZERO_POINTER_VELOCITY;
	let first = trail[trail.length - 2];
	for (let i = trail.length - 2; i >= 0; i--) {
		if (last.t - trail[i].t > VELOCITY_WINDOW_MS) break;
		first = trail[i];
	}
	const dt = last.t - first.t;
	if (dt <= 0) return ZERO_POINTER_VELOCITY;
	const x = (last.x - first.x) / dt;
	const y = (last.y - first.y) / dt;
	return { x, y, speed: Math.hypot(x, y) };
}

/** `orbiting` and `summoning` are the two phases with a finger or a button still down. */
function isPressed(phase: PointerPhase): boolean {
	return phase === "orbiting" || phase === "summoning";
}

function pushTrail(trail: readonly PointerSample[], sample: PointerSample): PointerSample[] {
	const next = [...trail, sample];
	return next.length > TRAIL_SAMPLES ? next.slice(next.length - TRAIL_SAMPLES) : next;
}

/**
 * A press that never travelled becomes a wheel once it outlives the hold threshold.
 *
 * One-way: `summoning` is terminal for the rest of the press, so moving the pointer to pick a
 * wedge cannot demote the wheel back into an orbit.
 */
function promote(phase: PointerPhase, locked: boolean, heldMs: number): PointerPhase {
	if (phase !== "orbiting") return phase;
	return !locked && heldMs >= HOLD_THRESHOLD_MS ? "summoning" : "orbiting";
}

export function reducePointerIntent(
	state: PointerIntent,
	event: PointerIntentEvent,
): PointerIntent {
	switch (event.kind) {
		case "down":
			return { phase: "orbiting", origin: event.sample, locked: false, trail: [event.sample] };

		case "move": {
			const origin = state.origin;
			if (origin === null || !isPressed(state.phase)) return state;
			const travelled =
				Math.hypot(event.sample.x - origin.x, event.sample.y - origin.y) > ORBIT_THRESHOLD_PX;
			const locked = state.locked || travelled;
			return {
				phase: promote(state.phase, locked, event.sample.t - origin.t),
				origin,
				locked,
				trail: pushTrail(state.trail, event.sample),
			};
		}

		case "tick": {
			const origin = state.origin;
			if (origin === null || !isPressed(state.phase)) return state;
			const phase = promote(state.phase, state.locked, event.t - origin.t);
			return phase === state.phase ? state : { ...state, phase };
		}

		case "up": {
			const origin = state.origin;
			if (origin === null || !isPressed(state.phase)) return IDLE_POINTER_INTENT;
			// A wheel commits its wedge; it never also throws.
			if (state.phase === "summoning") return IDLE_POINTER_INTENT;
			const trail = pushTrail(state.trail, event.sample);
			// Whether the throw is fast enough to AUTHOR is one threshold, and it lives in
			// `throw-to-edit`. This phase is kinematic: the hand was still moving, or it was not.
			if (pointerVelocity(trail).speed <= 0) return IDLE_POINTER_INTENT;
			return { phase: "throwing", origin, locked: state.locked, trail };
		}

		case "cancel":
			return IDLE_POINTER_INTENT;
	}
}

/** Fold a whole recorded gesture. The replay path every determinism test drives. */
export function replayPointerIntent(
	events: readonly PointerIntentEvent[],
	initial: PointerIntent = IDLE_POINTER_INTENT,
): PointerIntent {
	return events.reduce(reducePointerIntent, initial);
}
