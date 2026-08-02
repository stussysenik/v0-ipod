"use client";

import { useEffect, useRef, useState } from "react";

import {
	reducePointerIntent,
	IDLE_POINTER_INTENT,
	type PointerIntent,
	type PointerSample,
} from "@/lib/hud/pointer-intent";

/**
 * THE SUMMON, AS REACT STATE — one subscription to the reducer that already decides this.
 *
 * `lib/hud/pointer-intent.ts` owns the decision and is proven there. This hook is the
 * plumbing: DOM events in, a phase change out, and nothing in between.
 *
 * IT RE-RENDERS ON A PHASE CHANGE, NEVER ON A MOVE. The wheel appears once per press and
 * disappears once per release, so publishing every pointer sample as state would spend sixty
 * renders of the whole stage to deliver two facts. The live samples stay in a ref, which is
 * the same call `ghost-arc.tsx` makes for the same reason.
 *
 * A HELD MOUSE EMITS NO EVENTS, so the hold is advanced by a `tick` on `requestAnimationFrame`
 * while a press is open — the event the reducer already accepts, with the frame's own
 * timestamp rather than a clock read.
 */
export interface SummonIntent {
	phase: PointerIntent["phase"];
	/** Where the press began, in viewport CSS pixels. `null` between presses. */
	origin: PointerSample | null;
}

const IDLE: SummonIntent = { phase: "idle", origin: null };

export function useSummonIntent(enabled = true): SummonIntent {
	const [summon, setSummon] = useState<SummonIntent>(IDLE);
	const intent = useRef<PointerIntent>(IDLE_POINTER_INTENT);

	useEffect(() => {
		if (!enabled) return;

		let frame = 0;

		const publish = () => {
			const next = intent.current;
			setSummon((previous) =>
				previous.phase === next.phase && previous.origin === next.origin
					? previous
					: { phase: next.phase, origin: next.origin },
			);
		};

		const sampleOf = (event: PointerEvent): PointerSample => ({
			x: event.clientX,
			y: event.clientY,
			t: event.timeStamp,
		});

		const tick = (t: number) => {
			intent.current = reducePointerIntent(intent.current, { kind: "tick", t });
			publish();
			frame = requestAnimationFrame(tick);
		};

		const onDown = (event: PointerEvent) => {
			intent.current = reducePointerIntent(intent.current, { kind: "down", sample: sampleOf(event) });
			publish();
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(tick);
		};

		const onMove = (event: PointerEvent) => {
			intent.current = reducePointerIntent(intent.current, { kind: "move", sample: sampleOf(event) });
			publish();
		};

		const onUp = (event: PointerEvent) => {
			cancelAnimationFrame(frame);
			intent.current = reducePointerIntent(intent.current, { kind: "up", sample: sampleOf(event) });
			// `throwing` is a state the release passes through, not one anything rests in; the
			// wheel only ever asks whether a press is open, so it is folded to idle here.
			if (intent.current.phase === "throwing") intent.current = IDLE_POINTER_INTENT;
			publish();
		};

		const onCancel = () => {
			cancelAnimationFrame(frame);
			intent.current = reducePointerIntent(intent.current, { kind: "cancel" });
			publish();
		};

		window.addEventListener("pointerdown", onDown);
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onCancel);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onCancel);
		};
	}, [enabled]);

	return summon;
}
