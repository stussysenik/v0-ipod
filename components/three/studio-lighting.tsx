"use client";

import { Backdrop, Environment, Lightformer } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * The named default studio rig for `/3d` — "Apple Product".
 *
 * Design intent (ratified in the 3d-product-fidelity spec): brightness comes FIRST from a
 * filled studio environment, and the direct spots only add soft shaping — never clipping.
 * The front face and wheel are dyed *metal* (metalness 1.0), so their look is almost
 * entirely the environment they reflect: a metal reflects `albedo × env`. That is why a
 * sparse env makes the Silver finish read near-black — silver has nothing bright to tint.
 *
 * The cure is the large soft `frontFill` softbox sitting between the device and the camera
 * (+Z). The hero/front views reflect the +Z hemisphere straight back at the lens, so this
 * panel is what the silver face actually mirrors — it lifts Silver into an even brushed
 * satin while Black (albedo ~0.1) still tints that same panel down to a rich graphite. One
 * panel, two finishes, both correct.
 *
 * This is data so the Phase 3 dev panel can live-tune it and bake winners back here.
 */

type EnvironmentPreset = React.ComponentProps<typeof Environment>["preset"];

interface SpotSpec {
	color: string;
	intensity: number;
	position: [number, number, number];
	angle: number;
	penumbra: number;
	castShadow?: boolean;
}

interface SoftboxSpec {
	color: string;
	intensity: number;
	position: [number, number, number];
	scale: [number, number, number];
}

export interface StudioLightingConfig {
	name: string;
	ambient: { color: string; intensity: number };
	key: SpotSpec;
	fill: SpotSpec;
	rim: SpotSpec;
	env: {
		preset: EnvironmentPreset;
		intensity: number;
		blur: number;
		softboxes: SoftboxSpec[];
	};
}

export const APPLE_PRODUCT_RIG: StudioLightingConfig = {
	name: "Apple Product",
	ambient: { color: "#eef1f5", intensity: 0.28 },
	// Warm soft key, top-right. Gentle: the metal draws its brightness from the env, so a
	// punchy key would only clip the matte aluminum to flat white.
	key: {
		color: "#FFF5E0",
		intensity: 86,
		position: [9, 13, 11],
		angle: 0.32,
		penumbra: 0.95,
		castShadow: true,
	},
	// Cool fill, left.
	fill: { color: "#d8e8ff", intensity: 64, position: [-11, 5, 9], angle: 0.55, penumbra: 0.95 },
	// Cool separation rim — raked from the upper-back-LEFT so it draws a thin bright edge down
	// the device's left/top silhouette, the side that otherwise melts into the sweep at a 3/4
	// hero angle. Tighter angle = a directional kicker, not a wash; cool so it reads as a
	// studio rim rather than a second key (design D13 separation).
	rim: { color: "#D8E8FF", intensity: 70, position: [-6, 7, -8], angle: 0.5, penumbra: 0.98 },
	env: {
		preset: "studio",
		// Lifted from 0.6 → 1.0: the env IS the metal's brightness, so this is the master
		// dial for how light the Silver finish reads.
		intensity: 1.0,
		blur: 0.5,
		softboxes: [
			// The big soft front fill — the panel the front face mirrors back to the lens.
			// This is what rescues Silver from reading black. Wide + tall so it fills the
			// front reflection hemisphere as an even wash rather than a streak.
			{ color: "#f1f5f9", intensity: 0.62, position: [0, 1.5, 9.5], scale: [30, 38, 1] },
			// Top edge — a crisp horizon highlight raked across the chrome.
			{ color: "white", intensity: 0.55, position: [0, 9, 1], scale: [14, 0.5, 1] },
			// Warm shoulder, top-right.
			{ color: "#fff4e6", intensity: 0.5, position: [6, 4, 4], scale: [7, 4, 1] },
			// Cool shoulder, left.
			{ color: "#e6f0ff", intensity: 0.45, position: [-6, 2, 4], scale: [7, 4, 1] },
			// Soft floor bounce.
			{ color: "#f0f0f0", intensity: 0.22, position: [0, -5, 2], scale: [12, 1.5, 1] },
		],
	},
};

/**
 * Studio sweep — a seamless cyclorama backdrop behind the device.
 *
 * Why this exists (3d-export "pop", design D13): the baseline export floated the device on a
 * flat `scene.background` colour, so it read as a render, not a hero product photograph. Real
 * product studios shoot against a seamless sweep (paper curving from floor to back wall), lit
 * so it is brightest behind the subject and falls off to the frame edges — that falloff is what
 * gives depth and pushes the subject forward.
 *
 * We build that with drei's `<Backdrop>` cove geometry carrying an UNLIT radial-gradient texture
 * (`toneMapped={false}`) so the sweep is exactly predictable and WYSIWYG between the live canvas
 * and the export — it does NOT depend on the env-first rig, which would otherwise blow a white
 * sweep out to flat white and erase the gradient. The contact shadow (a separate shadow-catcher)
 * grounds the device on the cove floor. The gradient is tinted from the user's Stage colour so
 * the colour cockpit still drives the backdrop.
 */
function makeSweepTexture(stageColor: string): THREE.CanvasTexture | null {
	if (typeof document === "undefined") return null;
	const size = 512;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;

	const base = new THREE.Color(stageColor);
	const edge = base.clone().multiplyScalar(0.76); // falloff toward the frame edge — separates the silhouette
	const toHex = (c: THREE.Color) => `#${c.getHexString()}`;

	// Hotspot sits slightly above centre — where the device body meets the cove.
	const grad = ctx.createRadialGradient(
		size * 0.5, size * 0.6, size * 0.05,
		size * 0.5, size * 0.6, size * 0.72,
	);
	grad.addColorStop(0, toHex(base));
	grad.addColorStop(1, toHex(edge));
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, size, size);

	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.needsUpdate = true;
	return tex;
}

export function StudioBackdrop({ stageColor = "#ffffff" }: { stageColor?: string }) {
	const texture = useMemo(() => makeSweepTexture(stageColor), [stageColor]);
	if (!texture) return null;
	return (
		<Backdrop floor={1.5} position={[0, -3.55, -7]} receiveShadow={false} scale={[46, 26, 14]} segments={24}>
			<meshBasicMaterial map={texture} toneMapped={false} />
		</Backdrop>
	);
}

/**
 * Render a studio lighting rig from its config. Defaults to the named Apple Product rig;
 * pass an overridden config (Phase 3 dev panel) to live-tune material/lighting.
 */
export function StudioLighting({ config = APPLE_PRODUCT_RIG }: { config?: StudioLightingConfig }) {
	const { ambient, key, fill, rim, env } = config;
	return (
		<>
			<ambientLight color={ambient.color} intensity={ambient.intensity} />
			<spotLight
				castShadow={key.castShadow}
				angle={key.angle}
				color={key.color}
				intensity={key.intensity}
				penumbra={key.penumbra}
				position={key.position}
				shadow-bias={-0.0001}
				shadow-mapSize={[1024, 1024]}
			/>
			<spotLight angle={fill.angle} color={fill.color} intensity={fill.intensity} penumbra={fill.penumbra} position={fill.position} />
			<spotLight angle={rim.angle} color={rim.color} intensity={rim.intensity} penumbra={rim.penumbra} position={rim.position} />
			<Environment background={false} blur={env.blur} environmentIntensity={env.intensity} frames={1} preset={env.preset}>
				{env.softboxes.map((s, i) => (
					<Lightformer key={i} color={s.color} intensity={s.intensity} position={s.position} scale={s.scale} />
				))}
			</Environment>
		</>
	);
}
