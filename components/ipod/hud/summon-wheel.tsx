"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
	clampWheelCenter,
	stepWedge,
	wedgeAtDirection,
	wedgeLabelOffset,
	wheelCommandFor,
	WHEEL_DEAD_ZONE_PX,
	WHEEL_RADIUS_PX,
	WHEEL_ROOT,
	type WheelItem,
} from "@/lib/hud/summon-wheel";

/**
 * THE SUMMONED WHEEL, DRAWN — DOM, at the cursor, gone when the hand opens.
 *
 * The geometry and the vocabulary are `lib/hud/summon-wheel.ts` and are proven there; this
 * file is the projection onto DOM and the keyboard.
 *
 * WHY DOM AND NOT WEBGL (`design.md` D3). Text stays crisp at any DPR, costs no shader, and
 * arrives at a screen reader as a listbox rather than as pixels. It reads as spatial because
 * it is POSITIONED by a projected 3D anchor and takes its shadow direction from the key light
 * — one projection per frame, done by the host that owns the camera, is the whole trick.
 *
 * THE ANCHOR ARRIVES IN PIXELS, ALREADY PROJECTED. Taking a world point here would put a
 * camera dependency in a DOM component and a second projection in the tree. The host has the
 * camera; it hands over the point.
 *
 * ONE COMMIT PATH. A release inside the wheel and a flick that never drew one both resolve
 * through `wheelCommandFor`, so practice on the slow gesture transfers to the fast one
 * exactly rather than approximately (Kurtenbach & Buxton, CHI '93).
 *
 * NOTHING HERE EXPLAINS ITSELF. Six nouns on a ring; the wedge under the hand states its own
 * name and no other text exists.
 */

/** Key light azimuth, degrees clockwise from twelve o'clock. The rig's default key. */
const DEFAULT_KEY_LIGHT_DEG = 315;

/** Shadow throw in pixels, cast away from the key. */
const SHADOW_DISTANCE_PX = 10;

export interface SummonWheelProps {
	open: boolean;
	/** Where the wheel was asked for, in viewport CSS pixels — the projected 3D anchor. */
	anchor: { x: number; y: number };
	viewport: { width: number; height: number };
	items?: readonly WheelItem[];
	/** Direction of the key light, so the wheel's shadow agrees with the object's. */
	keyLightDeg?: number;
	onCommand: (item: WheelItem) => void;
	onDismiss: () => void;
}

export function SummonWheel({
	open,
	anchor,
	viewport,
	items = WHEEL_ROOT,
	keyLightDeg = DEFAULT_KEY_LIGHT_DEG,
	onCommand,
	onDismiss,
}: SummonWheelProps) {
	const [active, setActive] = useState(-1);
	const root = useRef<HTMLDivElement>(null);
	const centre = clampWheelCenter(anchor, viewport);

	useEffect(() => {
		if (open) {
			setActive(-1);
			root.current?.focus();
		}
	}, [open]);

	/** The single release path: a direction in, a command or a dismissal out. */
	const commit = useCallback(
		(dx: number, dy: number, threshold: number) => {
			const item = wheelCommandFor(items, dx, dy, threshold);
			if (item === null) onDismiss();
			else onCommand(item);
		},
		[items, onCommand, onDismiss],
	);

	useEffect(() => {
		if (!open) return;
		const onMove = (event: PointerEvent) => {
			setActive(
				wedgeAtDirection(
					event.clientX - centre.x,
					event.clientY - centre.y,
					items.length,
					WHEEL_DEAD_ZONE_PX,
				),
			);
		};
		const onUp = (event: PointerEvent) => {
			commit(event.clientX - centre.x, event.clientY - centre.y, WHEEL_DEAD_ZONE_PX);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [open, centre.x, centre.y, items.length, commit]);

	if (!open) return null;

	const shadowAngle = ((keyLightDeg + 180) * Math.PI) / 180;
	const shadow = `${(Math.sin(shadowAngle) * SHADOW_DISTANCE_PX).toFixed(1)}px ${(
		-Math.cos(shadowAngle) * SHADOW_DISTANCE_PX
	).toFixed(1)}px 24px rgb(0 0 0 / 0.45)`;

	return (
		<div
			ref={root}
			role="listbox"
			aria-label="Customize"
			aria-activedescendant={active >= 0 ? `wedge-${items[active].id}` : undefined}
			tabIndex={-1}
			onKeyDown={(event) => {
				if (event.key === "Escape") return onDismiss();
				if (event.key === "ArrowRight" || event.key === "ArrowDown") {
					event.preventDefault();
					return setActive((i) => stepWedge(i, 1, items.length));
				}
				if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
					event.preventDefault();
					return setActive((i) => stepWedge(i, -1, items.length));
				}
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					if (active >= 0) onCommand(items[active]);
					else onDismiss();
				}
			}}
			className="fixed z-[200] outline-none"
			style={{
				left: centre.x - WHEEL_RADIUS_PX,
				top: centre.y - WHEEL_RADIUS_PX,
				width: WHEEL_RADIUS_PX * 2,
				height: WHEEL_RADIUS_PX * 2,
			}}
		>
			<div
				aria-hidden
				className="absolute inset-0 rounded-full border border-white/12 bg-black/55 backdrop-blur-md"
				style={{ boxShadow: shadow }}
			/>
			{/* The dead zone, drawn: a release here names no wedge, so it is a hole, not a target. */}
			<div
				aria-hidden
				className="absolute rounded-full border border-white/10"
				style={{
					left: WHEEL_RADIUS_PX - WHEEL_DEAD_ZONE_PX,
					top: WHEEL_RADIUS_PX - WHEEL_DEAD_ZONE_PX,
					width: WHEEL_DEAD_ZONE_PX * 2,
					height: WHEEL_DEAD_ZONE_PX * 2,
				}}
			/>
			{items.map((item, index) => {
				const offset = wedgeLabelOffset(index, items.length, WHEEL_RADIUS_PX * 0.66);
				const selected = index === active;
				return (
					<div
						key={item.id}
						id={`wedge-${item.id}`}
						role="option"
						aria-selected={selected}
						className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11px] leading-none tracking-tight ${
							selected ? "bg-white text-black" : "text-white/70"
						}`}
						style={{ left: WHEEL_RADIUS_PX + offset.x, top: WHEEL_RADIUS_PX + offset.y }}
					>
						{item.label}
					</div>
				);
			})}
		</div>
	);
}
