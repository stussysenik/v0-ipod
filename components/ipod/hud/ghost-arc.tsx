"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { arcballDelta } from "@/lib/hud/arcball";
import {
	arcTouchAt,
	draggingBead,
	ghostArc,
	releaseGesture,
	removeKnot,
	ARC_SAMPLES,
	GHOST_ARC_FADE_MS,
	type ArcTouch,
	type ScreenPoint,
} from "@/lib/hud/ghost-arc";
import { applyPath, deformPath, insertKnot, type MotionPath } from "@/lib/hud/motion-path";
import {
	reducePointerIntent,
	IDLE_POINTER_INTENT,
	type PointerIntent,
} from "@/lib/hud/pointer-intent";
import type { MotionDoc } from "@/lib/motion/doc";
import { createClipPoseSampler, documentClip } from "@/lib/studio-clip";
import { positionToPose, type StudioPose } from "@/lib/studio-camera";

/**
 * THE GHOST ARC, DRAWN — one line and one point cloud in the scene that was already there.
 *
 * The algebra is `lib/hud/ghost-arc.ts` and is proven there; this file is the projection onto
 * WebGL and the pointer, and nothing else.
 *
 * COST RULING (`design.md` D3, D6). One `THREE.Line`, one `THREE.Points`, two materials built
 * once and mutated in place — no new render pass, no per-frame allocation, no geometry
 * rebuild except when the document changes. The beads share the line's vertices, so holding
 * the arc costs a polyline that was going to be drawn anyway, kept.
 *
 * PROJECTION IS PER GESTURE, NOT PER FRAME. Hit-testing needs the arc in screen space, and the
 * cheap-looking implementation projects every vertex each frame so the answer is always ready.
 * That spends `ARC_SAMPLES` matrix multiplies a frame on a machine whose frame budget has not
 * been read yet (§7.2). The projection therefore runs on pointer-down and on the moves of a
 * live pull, which is the only time the answer is asked for.
 *
 * THE RIG SEES NOTHING IT SHOULD NOT. Listeners are attached in the CAPTURE phase and stop
 * propagation only when the arc is actually under the pointer, so a press on the object still
 * orbits from its first pixel and a press on a bead does not orbit at all. That is the
 * disambiguation `pointer-intent.ts` already owns, spent rather than re-decided.
 *
 * NO WALL CLOCK. The fade advances on `useFrame`'s delta and restarts when `fadeToken`
 * changes, so the ghost is a function of frames elapsed since the throw rather than of the
 * time of day.
 */

const ARC_COLOR = 0xffffff;

/** The line reads as a hairline in space: present, never competing with the object. */
const ARC_OPACITY = 0.42;

/** Beads are the grabbable thing, so they carry the weight the line does not. */
const BEAD_OPACITY = 0.9;

/** Bead diameter in pixels. A 24px control is the row height; a grab point is half of one. */
const BEAD_SIZE_PX = 12;

/** The cycle mark, when the arc is a ghost rather than a held editor. */
const SEAM_SIZE_PX = 7;

export interface GhostArcProps {
	/** The move being drawn, or `null` for nothing. Also the base every edit derives from. */
	doc: MotionDoc | null;
	/**
	 * The framing the move is an offset from. Omitted, the arc anchors on the composed camera
	 * pose at the moment it appears — the same discipline the preview loop keeps with its own
	 * anchor, and for the same reason: an arc re-anchored every frame would swim under the
	 * hand that is pulling it.
	 */
	hero?: StudioPose | null;
	/**
	 * Motion → Shape is engaged: the arc is held instead of fading, its knots are beads, and
	 * the pointer edits it. Off, it is the post-throw ghost and nothing on it is grabbable.
	 */
	held?: boolean;
	/** Increment to restart the fade. A throw hands the arc back by changing this. */
	fadeToken?: number;
	/** Fired with the edited document. The host owns the store; this component owns no state. */
	onChange?: (doc: MotionDoc) => void;
}

export function GhostArc({ doc, hero, held = false, fadeToken = 0, onChange }: GhostArcProps) {
	const { camera, gl, size } = useThree();

	// Captured once per appearance, not per frame. `positionToPose` is the exact inverse of
	// the `poseToPosition` every vertex goes back through, so anchoring here costs no drift.
	const [anchored, setAnchored] = useState<StudioPose | null>(null);
	useEffect(() => {
		if (hero) return;
		setAnchored(positionToPose(camera.position.clone()));
	}, [hero, camera, fadeToken, held]);
	const framing = hero ?? anchored;

	// Built once. Geometry is resized only when the vertex count changes; the common case —
	// a deform, sixty times a second — writes into the existing buffer and flags it dirty.
	const line = useMemo(() => {
		const geometry = new THREE.BufferGeometry();
		const material = new THREE.LineBasicMaterial({
			color: ARC_COLOR,
			transparent: true,
			opacity: ARC_OPACITY,
			depthWrite: false,
		});
		const object = new THREE.Line(geometry, material);
		object.frustumCulled = false;
		object.renderOrder = 2;
		return object;
	}, []);

	const beads = useMemo(() => {
		const geometry = new THREE.BufferGeometry();
		const material = new THREE.PointsMaterial({
			color: ARC_COLOR,
			transparent: true,
			opacity: BEAD_OPACITY,
			sizeAttenuation: false,
			depthWrite: false,
		});
		const object = new THREE.Points(geometry, material);
		object.frustumCulled = false;
		object.renderOrder = 3;
		return object;
	}, []);

	useEffect(() => {
		return () => {
			line.geometry.dispose();
			(line.material as THREE.Material).dispose();
			beads.geometry.dispose();
			(beads.material as THREE.Material).dispose();
		};
	}, [line, beads]);

	// A live pull draws from a document this component holds, and the store hears once, on
	// release. Routing every pointer move through the workbench reducer would put six actions,
	// a persist and a full stage re-render inside the loop between the hand and the line —
	// which is the latency the gesture is judged on. `deformPath` derives from the grabbed
	// path either way, so the released document is identical to the one that was drawn.
	const [live, setLive] = useState<MotionDoc | null>(null);
	const source = live ?? doc;

	const arc = useMemo(() => {
		if (source === null || framing === null) return null;
		return ghostArc(source, createClipPoseSampler(documentClip(source), framing), ARC_SAMPLES);
	}, [source, framing]);

	useEffect(() => {
		if (arc === null) return;
		writePositions(line.geometry, arc.points.map((point) => point.position));
		const points = held && arc.beads.length > 0 ? arc.beads.map((bead) => bead.position) : [arc.seam];
		writePositions(beads.geometry, points);
		(beads.material as THREE.PointsMaterial).size = held ? BEAD_SIZE_PX : SEAM_SIZE_PX;
	}, [arc, held, line, beads]);

	// ── The gesture ────────────────────────────────────────────────────────────────
	// Everything the pointer touches lives in refs: a pull writes a document per move event,
	// and routing that through React state would re-render the whole stage per frame of a drag.
	const intent = useRef<PointerIntent>(IDLE_POINTER_INTENT);
	const touch = useRef<ArcTouch | null>(null);
	const grabbed = useRef<{ base: MotionDoc; path: MotionPath; knot: number } | null>(null);
	const screen = useRef<{ beads: ScreenPoint[]; line: ScreenPoint[] }>({ beads: [], line: [] });

	const arcRef = useRef(arc);
	arcRef.current = arc;
	const docRef = useRef(source);
	docRef.current = source;
	const changeRef = useRef(onChange);
	changeRef.current = onChange;
	const heldRef = useRef(held);
	heldRef.current = held;

	useEffect(() => {
		const element = gl.domElement;
		const viewport = () => ({ width: element.clientWidth, height: element.clientHeight });

		const at = (event: PointerEvent): ScreenPoint => {
			const rect = element.getBoundingClientRect();
			return { x: event.clientX - rect.left, y: event.clientY - rect.top };
		};

		const project = () => {
			const current = arcRef.current;
			const box = viewport();
			screen.current = {
				beads: current ? current.beads.map((bead) => toScreen(bead.position, camera, box)) : [],
				line: current ? current.points.map((point) => toScreen(point.position, camera, box)) : [],
			};
		};

		const onDown = (event: PointerEvent) => {
			intent.current = reducePointerIntent(intent.current, {
				kind: "down",
				sample: { ...at(event), t: event.timeStamp },
			});
			touch.current = null;
			grabbed.current = null;
			const current = arcRef.current;
			const base = docRef.current;
			if (!heldRef.current || current === null || base === null || current.path === null) return;
			project();
			const hit = arcTouchAt(screen.current.beads, screen.current.line, current.points, at(event));
			touch.current = hit;
			if (hit === null) return;
			// The arc took the press, so the orbit rig never sees it and the object holds still.
			event.stopPropagation();
			if (hit.bead >= 0) {
				grabbed.current = { base, path: current.path, knot: current.beads[hit.bead].knot };
			}
		};

		const onMove = (event: PointerEvent) => {
			const sample = { ...at(event), t: event.timeStamp };
			intent.current = reducePointerIntent(intent.current, { kind: "move", sample });
			const grab = grabbed.current;
			if (grab === null || touch.current === null) return;
			if (draggingBead(touch.current, intent.current) < 0) return;
			event.stopPropagation();
			const origin = intent.current.origin;
			if (origin === null) return;
			// One rotation, read as two angles — the same mapping the orbit rig uses, so a pull
			// on the arc and a drag on the object move the camera through the same geometry.
			const delta = arcballDelta(origin, sample, viewport());
			setLive(applyPath(grab.base, deformPath(grab.path, grab.knot, delta)));
		};

		const onUp = (event: PointerEvent) => {
			const hit = touch.current;
			const before = intent.current;
			const pulled = grabbed.current !== null ? docRef.current : null;
			intent.current = reducePointerIntent(before, {
				kind: "up",
				sample: { ...at(event), t: event.timeStamp },
			});
			touch.current = null;
			grabbed.current = null;
			const base = docRef.current;
			const path = arcRef.current?.path ?? null;
			if (hit === null || base === null || path === null) return;
			event.stopPropagation();
			if (pulled !== null) {
				// The pull is over: hand the store the document that was on screen, then stop
				// holding a second copy of it.
				setLive(null);
				changeRef.current?.(pulled);
				return;
			}
			const gesture = releaseGesture(hit, before);
			if (gesture.kind === "place") {
				const next = insertKnot(base, path, gesture.at);
				if (next !== path) changeRef.current?.(applyPath(base, next));
				return;
			}
			if (gesture.kind === "remove") {
				const bead = arcRef.current?.beads[gesture.bead];
				if (bead) changeRef.current?.(applyPath(base, removeKnot(path, bead.knot)));
			}
		};

		const onCancel = () => {
			intent.current = reducePointerIntent(intent.current, { kind: "cancel" });
			touch.current = null;
			grabbed.current = null;
			setLive(null);
		};

		element.addEventListener("pointerdown", onDown, true);
		element.addEventListener("pointermove", onMove, true);
		element.addEventListener("pointerup", onUp, true);
		element.addEventListener("pointercancel", onCancel, true);
		return () => {
			element.removeEventListener("pointerdown", onDown, true);
			element.removeEventListener("pointermove", onMove, true);
			element.removeEventListener("pointerup", onUp, true);
			element.removeEventListener("pointercancel", onCancel, true);
		};
	}, [camera, gl, size.width, size.height]);

	// ── The fade ───────────────────────────────────────────────────────────────────
	const elapsed = useRef(0);
	useEffect(() => {
		elapsed.current = 0;
	}, [fadeToken]);

	useFrame((_, delta) => {
		if (arc === null) {
			line.visible = false;
			beads.visible = false;
			return;
		}
		if (held) {
			elapsed.current = 0;
			line.visible = true;
			beads.visible = true;
			(line.material as THREE.LineBasicMaterial).opacity = ARC_OPACITY;
			(beads.material as THREE.PointsMaterial).opacity = BEAD_OPACITY;
			return;
		}
		elapsed.current += delta * 1000;
		// Squared, so the arc holds its weight for the first half of the fade and then leaves.
		// A linear ramp reads as a dimmer being turned down rather than as a thing departing.
		const remaining = Math.max(0, 1 - elapsed.current / GHOST_ARC_FADE_MS);
		const ramp = remaining * remaining;
		line.visible = ramp > 0;
		beads.visible = ramp > 0;
		(line.material as THREE.LineBasicMaterial).opacity = ARC_OPACITY * ramp;
		(beads.material as THREE.PointsMaterial).opacity = BEAD_OPACITY * ramp;
	});

	return (
		<>
			<primitive object={line} />
			<primitive object={beads} />
		</>
	);
}

/** Fill a geometry's position attribute, reallocating only when the vertex count changes. */
function writePositions(
	geometry: THREE.BufferGeometry,
	positions: readonly (readonly [number, number, number])[],
) {
	const existing = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
	const array =
		existing && existing.count === positions.length
			? (existing.array as Float32Array)
			: new Float32Array(positions.length * 3);
	positions.forEach((position, i) => {
		array[i * 3] = position[0];
		array[i * 3 + 1] = position[1];
		array[i * 3 + 2] = position[2];
	});
	if (!existing || existing.count !== positions.length) {
		geometry.setAttribute("position", new THREE.BufferAttribute(array, 3));
	} else {
		existing.needsUpdate = true;
	}
	geometry.computeBoundingSphere();
}

const PROJECTED = new THREE.Vector3();

/** World point → viewport CSS pixels, in the same frame the pointer events report. */
function toScreen(
	position: readonly [number, number, number],
	camera: THREE.Camera,
	viewport: { width: number; height: number },
): ScreenPoint {
	PROJECTED.set(position[0], position[1], position[2]).project(camera);
	return {
		x: ((PROJECTED.x + 1) / 2) * viewport.width,
		y: ((1 - PROJECTED.y) / 2) * viewport.height,
	};
}
