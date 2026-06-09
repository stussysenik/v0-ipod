"use client";

import {
	ContactShadows,
	Html,
	PerspectiveCamera,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as htmlToImage from "html-to-image";
import React, {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import * as THREE from "three";

import { deriveWheelColors } from "@/lib/color-manifest";
import { ColorResolvePass } from "@/lib/three-color-resolve";
import {
	deriveIpod3DDimensions,
	type Ipod3DDimensions,
} from "@/lib/ipod-3d-dimensions";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";
import {
	type CameraMove,
	clampPose,
	cyclesForDuration,
	DEFAULT_TARGET,
	ELEVATION_RANGE,
	type LoopStyle,
	phaseForProgress,
	poseForMove,
	poseToPosition,
	positionToPose,
	REACH_RANGE,
	type StudioPose,
} from "@/lib/studio-camera";

import { StudioBackdrop, StudioLighting } from "./studio-lighting";
import {
	APPLE_PRODUCT_RIG,
	FLAT_TECHNICAL_RIG,
	type StudioLightingConfig,
} from "@/lib/studio-lighting-config";
import { STEEL_ROUGHNESS_FLOOR, deriveOwnedRig } from "@/lib/studio-owned-finish";

// ─── Technical-Flat ("Lights Off") material mode ───────────────────────────────────

/**
 * "Lights Off / Technical" flat view.
 *
 * The device's shells and wheel are real `meshPhysicalMaterial` *metal* (metalness ≈ 1.0).
 * A metal has no diffuse colour of its own — it only reflects the environment — so you cannot
 * make it read as a flat, lit-by-nothing spec-sheet colour just by dimming the lights: kill
 * the env and pure metal goes black. The honest flat view therefore *swaps the material*, not
 * the rig: every machined surface renders as an unlit `meshBasicMaterial` of its true finish
 * hex, `toneMapped={false}`, so every pixel is exactly the chosen colour — zero reflections,
 * zero shadows, fully deterministic and WYSIWYG with the export.
 *
 *   pseudocode  surface(flat):
 *       if flat:  return basic(colour)          // pixel == colour, no light term at all
 *       else:     return physical(colour, env)  // colour × reflected environment
 *
 * The flag rides a React context so the four geometry components (model, bezel, wheel, back)
 * each opt into the swap with one `useTechnicalFlat()` line — no boolean threaded through
 * every prop signature.
 */
const TechnicalFlatContext = createContext(false);
const useTechnicalFlat = () => useContext(TechnicalFlatContext);

/**
 * Unlit finish for the Technical view — renders the designer's hex VERBATIM.
 *
 * ┌─ EXCEPTION: colour fidelity is enforced over physical correctness ───────────────┐
 * │ Everywhere else the device is dyed metal, so the displayed colour is             │
 * │ `albedo × lighting` — a specified #000000 case reads as a lit dark-grey, which is │
 * │ physically right but is NOT the hex the designer typed. The Technical view is the │
 * │ one place where the chosen hex is SACRED: black must be black, white must be      │
 * │ white. We guarantee that by deliberately bypassing the whole light/colour         │
 * │ pipeline:                                                                         │
 * │   • `meshBasicMaterial`  → unlit; no light, no env reflection touches the colour. │
 * │   • `toneMapped={false}` → no filmic/tone curve lifts or rolls off the value.     │
 * │   • the canvas already runs `NoToneMapping` + sRGB output, so three's sRGB→linear │
 * │     →sRGB round-trip is loss-free: the exact hex survives to the pixel.           │
 * │   • NO luminance floor / saturation clamp is applied (those would drift #000000   │
 * │     toward grey) — the value is passed straight through.                          │
 * │ This intentionally opts out of the env-first material model; do not "fix" it to   │
 * │ react to lights, that would defeat the point of the Technical/color-true view.    │
 * └──────────────────────────────────────────────────────────────────────────────────┘
 */
function FlatFinish({
	color = "#ffffff",
	map = null,
	transparent = false,
	opacity = 1,
	depthWrite = true,
	attach,
}: {
	color?: THREE.ColorRepresentation;
	map?: THREE.Texture | null;
	transparent?: boolean;
	opacity?: number;
	depthWrite?: boolean;
	/** Slot for material arrays, e.g. "material-0" / "material-1". */
	attach?: string;
}) {
	return (
		<meshBasicMaterial
			attach={attach}
			color={color}
			map={map ?? undefined}
			// EXCEPTION (see block above): hold the exact specified hex — no tone mapping.
			toneMapped={false}
			transparent={transparent}
			opacity={opacity}
			depthWrite={depthWrite}
		/>
	);
}

// ─── Types ───────────────────────────────────────────────────────────────────────

/**
 * Which framing a still export uses.
 * - `front`: the dead-on telephoto fidelity shot (round wheel, square screen, zero keystone).
 * - `hero`:  the composed 3/4 angle (the user's locked/composed perspective), reframed to fill
 *   the 9:16 portrait — the dimensional "hero" shot the flat 2D export cannot show (design D13).
 */
export type ExportFraming = "front" | "hero";

/**
 * Live playhead state for the in-viewport move preview. When non-null the
 * OrbitRig drives the camera directly from `poseForMove` instead of easing
 * toward the composed goal — so what you scrub/play is EXACTLY what the clip
 * exports (same move, same cadence, same hero anchor). Null = free composition.
 */
export interface CameraPreviewState {
	/** Which move to fly. */
	move: CameraMove;
	/** True = advance the clock each frame; false = hold the scrubbed `t`. */
	playing: boolean;
	/** Scrub position over the FULL clip, t ∈ [0,1). Used while paused. */
	t: number;
	/** Clip length in seconds — sets the cadence (cycles) so preview === export. */
	durationSec: number;
	/** Cadence multiplier (1 = natural). Scales cycles identically in preview + export. */
	speed: number;
	/** loop / boomerang / hold — same time map the export uses, so preview === export. */
	loop: LoopStyle;
}

export interface ThreeDIpodHandle {
	captureHighRes: (width?: number, height?: number, framing?: ExportFraming, heroPose?: StudioPose | null) => Promise<Blob | null>;
	/** The live WebGL canvas — used by the clip recorder's captureStream(). */
	getCanvas: () => HTMLCanvasElement | null;
	/**
	 * Bake the live now-playing screen onto the in-scene LCD plane and snap the
	 * body to rest. Returns a restore() to revert. Used by the clip recorder so a
	 * captured video shows the real screen instead of the idle LCD shader.
	 */
	prepareForCapture: () => Promise<() => void>;
	/**
	 * Resize the live buffer to a vertical (e.g. 1080×1920) target for the clip
	 * recorder. Returns a restore() that reverts size + aspect.
	 */
	setCaptureViewport: (width: number, height: number) => () => void;
	/**
	 * Render a deterministic, frame-by-frame product clip. The device is snapped
	 * to rest with the screen baked on (same path as the still), the camera flies
	 * a gentle seamless-loop orbit, and each frame is rendered offline at a
	 * supersampled resolution then handed back downscaled — so the output matches
	 * the still's fidelity instead of a dropped-frame real-time grab. The consumer
	 * (the MP4 recorder) turns each canvas into a `VideoFrame` and encodes it.
	 */
	renderClipFrames: (
		opts: ClipRenderOptions,
		onFrame: (frame: HTMLCanvasElement, index: number, total: number) => Promise<void> | void,
	) => Promise<void>;
	/** Current composed camera pose in studio coordinates (null before the rig mounts). */
	getCameraPose: () => StudioPose | null;
	/** Ease the live camera toward a studio pose (partial — omitted dials hold). */
	setCameraGoal: (pose: Partial<Omit<StudioPose, "target">>) => void;
	/** Snap the live camera back to the current focus's default framing ("home"). */
	resetCamera: () => void;
}

export interface ClipRenderOptions {
	/** Output (encoded) width in px. */
	width: number;
	/** Output (encoded) height in px. */
	height: number;
	/** Supersample factor for the offline render before downscale (default 1; MSAA carries AA). */
	supersample?: number;
	durationMs: number;
	fps: number;
	/** Which camera move to fly. Defaults to the gentle orbit. */
	move?: CameraMove;
	/** Cadence multiplier (1 = natural). Must match the preview's speed. */
	speed?: number;
	/** loop / boomerang / hold. `hold` pins the hero pose for a motion-free clip. */
	loop?: LoopStyle;
	/** Hero framing the move is anchored on. Defaults to the still's hero angle. */
	anchor?: StudioPose;
	/**
	 * Called synchronously with the clip progress (0→1) immediately before each
	 * screen re-bake. It lets the app pin every looping element on the LCD (marquee,
	 * song clock, progress bar) to the deterministic clip timeline `i / total`,
	 * instead of wall-clock rAF or encoder progress — the two clocks that used to
	 * freeze mid-export. See lib/export-clock.ts.
	 */
	onClipProgress?: (progress: number) => void;
}

/** Swap the LCD shader for a baked screen texture during capture, then revert. */
interface CaptureHooks {
	prepare: () => Promise<void>;
	restore: () => void;
	/**
	 * Re-rasterize the live (already-animating) Now Playing screen onto the LCD
	 * plane mid-clip. The clip recorder calls this on a bounded cadence so the
	 * marquee/progress/time advance in the exported video without a per-frame bake.
	 */
	refreshScreen: () => Promise<void>;
}

export type IpodCameraFocus = "product" | "front" | "back";

export interface ThreeDIpodProps {
	preset: IpodClassicPresetDefinition;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	/** Mirror-polished stainless back shell. Defaults to factory steel. */
	backColor?: string;
	/** Side/rim band of the chassis. Defaults to `backColor` (edge == back). */
	edgeColor?: string;
	/** Matte mask framing the LCD aperture. Defaults to near-black. */
	bezelColor?: string;
	/** Engraved capacity on the back plate, e.g. "160GB". */
	capacityLabel?: string;
	/**
	 * The live studio lighting rig. Defaults to the Apple Product rig. When `technicalFlat`
	 * is on, this is bypassed for the flat technical rig and an unlit material swap.
	 */
	lighting?: StudioLightingConfig;
	/** "Lights Off / Technical": flat, unlit, deterministic CAD view of the device. */
	technicalFlat?: boolean;
	/**
	 * Controlled camera focus (orientation). When provided, the in-canvas
	 * Product/Front/Back pill is suppressed so the host can render its own bottom
	 * bar (e.g. alongside saved studio shots). Uncontrolled when omitted.
	 */
	focus?: IpodCameraFocus;
	/** Fired when the focus changes; pair with `focus` for a controlled bar. */
	onFocusChange?: (focus: IpodCameraFocus) => void;
	/**
	 * When true, the orbit rig ignores drag + wheel so the composed perspective
	 * can't be knocked off — the locked angle is what every Hero/clip export flies
	 * (design D13). Deliberate stepper/snap recompose still flows through setGoal.
	 */
	cameraLocked?: boolean;
	/**
	 * Live playhead. When non-null the camera flies the move (play/scrub) in the
	 * viewport instead of free orbit — WYSIWYG with the clip export. Null = compose.
	 */
	preview?: CameraPreviewState | null;
	/** Reports the playhead position (t ∈ [0,1)) back while a preview plays. */
	onPreviewTick?: (t: number) => void;
	/**
	 * Tailwind classes for the stage backdrop behind the transparent canvas.
	 * Defaults to a black studio sweep; pass e.g. "bg-white" for a light stage.
	 */
	stageClassName?: string;
	/** Solid background baked into exports (the live canvas stays transparent). */
	captureBackground?: string;
	/** Show a small origin gizmo (centre crosshair) to help compose against centre. */
	showOrigin?: boolean;
	/** Polished-back roughness (dev "Back finish" dial: mirror ↔ brushed). */
	backRoughness?: number;
	onReady?: () => void;
	/**
	 * Imperative handle as a plain prop. `next/dynamic` (used to lazy-load this
	 * canvas) does not forward React refs, so the stage passes a mutable ref here
	 * to reach captureHighRes / the clip recorder.
	 */
	apiRef?: React.MutableRefObject<ThreeDIpodHandle | null>;
}

interface IpodModelProps {
	preset: IpodClassicPresetDefinition;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	backColor?: string;
	edgeColor?: string;
	bezelColor?: string;
	capacityLabel: string;
	/** Polished-back GGX roughness (dev "Back finish" dial). Defaults to the crawl-safe floor. */
	backRoughness?: number;
	/** "Lights Off / Technical": render every metal surface as flat unlit albedo. */
	technicalFlat?: boolean;
	onRegisterCapture?: (hooks: CaptureHooks) => void;
}

// ─── CAD Profile Helpers ───────────────────────────────────────────────────────────

/**
 * Trace a rounded-rectangle outline into a Shape/Path at an absolute center.
 * This is the 2D sketch primitive every machined face is built from — the same
 * `roundedRect(...)` starting point a parametric CAD model would use before
 * extruding and cutting pockets.
 */
function drawRoundedRect(
	p: THREE.Shape | THREE.Path,
	cx: number,
	cy: number,
	w: number,
	h: number,
	r: number,
) {
	const x = cx - w / 2;
	const y = cy - h / 2;
	const rr = Math.min(r, w / 2, h / 2);
	p.moveTo(x + rr, y);
	p.lineTo(x + w - rr, y);
	p.quadraticCurveTo(x + w, y, x + w, y + rr);
	p.lineTo(x + w, y + h - rr);
	p.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
	p.lineTo(x + rr, y + h);
	p.quadraticCurveTo(x, y + h, x, y + h - rr);
	p.lineTo(x, y + rr);
	p.quadraticCurveTo(x, y, x + rr, y);
}

// ─── Mechanical Datum & Tolerance Reference ────────────────────────────────────────

/**
 * The device's machined form, named in the language of mechanical design so the geometry
 * reads like a drawing, not a pile of magic numbers. All values are in world units (the
 * scene's millimetre-analogue); see `ipod-3d-dimensions.ts` for the mm→world derivation.
 *
 * DATUMS (the reference planes every feature is measured from):
 *   • DATUM A — the front face plane, at z = +depth/2. Every Z offset in `zLayers()` is a
 *     signed distance from this datum: +out toward the lens, −in toward the back.
 *   • DATUM B — the wheel-bore axis (the z-axis through x=0, y=wheelCenterY). The touch
 *     ring, select button, and the bore cut in the face are all CONCENTRIC to it, so the
 *     wheel reads as one true disc with no eccentric moat.
 *   • The screen aperture is concentric to the LCD's own centre (y=screenCenterY); the
 *     bezel mask, glass, and lit plane share that axis.
 *
 * EDGE BREAKS (no real machined edge is a zero-radius knife — each gets a fillet or chamfer):
 *   • FILLET  — a rounded edge (the steel back's deep-drawn roll-over the sides).
 *   • CHAMFER — a flat angled cut (the crisp hairline break around the screen aperture and
 *     wheel bore in the anodized face).
 * Oversize these and the silhouette balloons into a fat chrome band that clips to white, or
 * the apertures soften into rubbery lips — so they're kept to a true fraction of body depth.
 *
 * FITS / CLEARANCE — a cut pocket is opened slightly larger than the part that seats into it
 * (the screen/wheel sit in their bores with a hairline gap), the mechanical-design equivalent
 * of a clearance fit rather than an interference fit.
 *
 * FINISH — the face is anodized aluminium: a DYED dielectric over metal (albedo-true colour
 * under a thin clearcoat), not a chromed mirror. See the face material for why that matters.
 *
 *   pseudocode  buildFace():
 *       sketch  = roundedRect(faceOutline) on DATUM A          // 2D profile
 *       sketch -= roundedRect(screenAperture + CLEARANCE)      // cut the screen pocket
 *       sketch -= circle(wheelBore + CLEARANCE) about DATUM B  // cut the wheel bore
 *       solid   = extrude(sketch, FACE_PLATE_DEPTH)
 *       solid   = chamfer(solid.edges, FACE_CHAMFER)           // break the aperture edges
 *       seat(solid, at = DATUM A − parting_seam)               // recess by the parting line
 */
const MECHANICAL = {
	/** Steel back roll-over: a forming fillet capped at this radius, else floors at body·ratio. */
	bodyFilletMax: 0.05,
	bodyFilletDepthRatio: 0.1,
	/** Lateral fillet size of the back's deep-drawn edge. */
	bodyFillet: 0.03,
	/** Crisp hairline chamfer that breaks the screen-aperture and wheel-bore edges of the face. */
	faceChamfer: { thickness: 0.006, size: 0.005 },
	/** Plate thickness of the extruded aluminium face. */
	facePlateDepth: 0.05,
	/** Edge break on the matte bezel mask. */
	bezelEdgeBreak: 0.004,
	/** Clearance fit: how much larger the cut aperture is than the part that seats in it. */
	screenApertureClearance: 0.05,
	wheelBoreClearance: 0.014,
} as const;

// ─── Z-Layer Stack (datum-referenced) ──────────────────────────────────────────────

/**
 * Front-to-back ordering of the device surfaces as signed offsets from DATUM A (the front
 * face plane, z = +depth/2). Absolute world-unit offsets — not depth-relative — so the stack
 * stays crisp regardless of the preset-derived body thickness. Think of each as a feature's
 * height above (+) or depth below (−) the face datum on the drawing.
 */
function zLayers(depth: number) {
	const f = depth / 2; // DATUM A — the front face plane
	return {
		front: f,
		frontFace: f + 0.012,
		screenBezel: f + 0.015,
		screenGlass: f + 0.05,
		wheelRecess: f - 0.008,
		wheelSurface: f + 0.002,
		wheelCenter: f + 0.008,
		wheelHtml: f + 0.014,
		screenHtml: f + 0.026,
		backPlate: -f - 0.001,
		backEngraving: -f - 0.003,
	} as const;
}

// ─── Procedural Brushed Metal Texture ─────────────────────────────────────────────

function createBrushedMetalTexture(): THREE.CanvasTexture {
	const size = 1024;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;

	ctx.fillStyle = "#7c7c7c";
	ctx.fillRect(0, 0, size, size);

	// Directional anodized grain
	for (let i = 0; i < 600; i++) {
		const y = Math.random() * size;
		const alpha = 0.03 + Math.random() * 0.08;
		ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
		ctx.lineWidth = 0.3 + Math.random() * 1.0;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(size, y + (Math.random() - 0.5) * 24);
		ctx.stroke();
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1.5, 1.5);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

// ─── Back-Plate Engraving Texture ─────────────────────────────────────────────────

/**
 * Renders the laser-etched markings of the polished steel back as a transparent
 * canvas decal: a carrot maker's-mark (in place of the Apple logo), the iPod
 * wordmark, capacity, and the personalized attribution. Etched glyphs are drawn
 * as soft dark marks with a 1px top highlight so they read as recessed once the
 * chrome reflects around them.
 */
function createBackEngravingTexture(capacity: string): THREE.CanvasTexture {
	const w = 768;
	const h = 1280;
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;
	ctx.clearRect(0, 0, w, h);

	const etch = (draw: () => void) => {
		// Recessed shadow
		ctx.save();
		ctx.fillStyle = "rgba(28,30,34,0.5)";
		draw();
		ctx.restore();
		// Bevel highlight, nudged up 1px
		ctx.save();
		ctx.translate(0, -1.5);
		ctx.fillStyle = "rgba(255,255,255,0.16)";
		draw();
		ctx.restore();
	};

	ctx.textAlign = "center";

	// Carrot maker's-mark (drawn vector, no emoji/font dependency) — a tapered root
	// on gentle S-curves to a clean point, crowned by five leafy fronds that fan from
	// the shoulder with the centre blade tallest. Etched as one dark silhouette like
	// every other mark; the fuller frond fan and smoother taper give it a more
	// expressive, deliberately-drawn shape than the old three-blade sketch.
	const cx = w / 2;
	const logoY = h * 0.31;
	const s = 66;
	const carrot = () => {
		const topY = logoY; // shoulder line
		const tipY = logoY + s * 1.12; // root tip
		const halfW = s * 0.34;
		// Root — broad rounded shoulders tapering on symmetric S-curves to a sharp tip.
		ctx.beginPath();
		ctx.moveTo(cx - halfW, topY);
		ctx.bezierCurveTo(cx - halfW * 0.92, topY + s * 0.42, cx - halfW * 0.32, topY + s * 0.82, cx, tipY);
		ctx.bezierCurveTo(cx + halfW * 0.32, topY + s * 0.82, cx + halfW * 0.92, topY + s * 0.42, cx + halfW, topY);
		ctx.quadraticCurveTo(cx, topY - s * 0.2, cx - halfW, topY);
		ctx.closePath();
		ctx.fill();
		// Fronds — leafy blades fanning from the shoulder, the centre one tallest.
		const blade = (angleDeg: number, len: number, baseHalf: number) => {
			const a = (angleDeg * Math.PI) / 180;
			const tipX = cx + Math.sin(a) * len;
			const tipDY = Math.cos(a) * len;
			const midX = cx + Math.sin(a) * len * 0.5;
			const midY = topY - Math.cos(a) * len * 0.5;
			ctx.beginPath();
			ctx.moveTo(cx - baseHalf, topY);
			ctx.quadraticCurveTo(midX - baseHalf, midY, tipX, topY - tipDY);
			ctx.quadraticCurveTo(midX + baseHalf, midY, cx + baseHalf, topY);
			ctx.closePath();
			ctx.fill();
		};
		blade(-36, s * 0.5, s * 0.085); // far left
		blade(-18, s * 0.64, s * 0.092); // left
		blade(0, s * 0.74, s * 0.098); // centre, tallest
		blade(18, s * 0.64, s * 0.092); // right
		blade(36, s * 0.5, s * 0.085); // far right
	};
	etch(carrot);

	// iPod wordmark — the real engraving is the iPod logotype: a tight, medium-weight
	// setting (lowercase i, cap P). SF Pro Display ≈ the shipped face; negative tracking
	// pulls the glyphs into the close-set logo lockup instead of loose body text.
	const sansDisplay = "-apple-system, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";
	const sansText = "-apple-system, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif";
	etch(() => {
		ctx.font = `590 98px ${sansDisplay}`;
		ctx.letterSpacing = "-4px";
		ctx.fillText("iPod", cx, h * 0.452);
		ctx.letterSpacing = "0px";
	});

	// Capacity — sits just under the wordmark, lighter and a touch tracked so it reads
	// as a spec line, not part of the logo.
	etch(() => {
		ctx.font = `380 30px ${sansText}`;
		ctx.letterSpacing = "0.5px";
		ctx.fillText(capacity, cx, h * 0.5);
		ctx.letterSpacing = "0px";
	});

	// Regulatory fine print near the base — the real back stacks a designed/assembled
	// line, a model/regulatory line, and a rating/copyright line in tiny tracked type.
	// Kept tight, evenly led, and centred to read as genuine laser etching.
	const fineLines = [
		"Designed by Stüssy Senik · Assembled in Czech Republic",
		"Model No. A1238   EMC No. 2151   IC: 579C-A1238",
		`⎓ Rated 5–30V · Capacity ${capacity} · © 2008 Stüssy Senik`,
	];
	etch(() => {
		ctx.font = `400 15px ${sansText}`;
		ctx.letterSpacing = "0.4px";
		const baseY = h * 0.85;
		fineLines.forEach((line, i) => {
			ctx.fillText(line, cx, baseY + i * 23);
		});
		ctx.letterSpacing = "0px";
	});

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 8;
	return texture;
}

// ─── LCD Screen Shader ───────────────────────────────────────────────────────────

function useLcdShader() {
	return useMemo(() => {
		return new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Color("#c8d4c0") },
				brightness: { value: 0.78 },
			},
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				}`,
			fragmentShader: /* glsl */ `
				uniform float time;
				uniform vec3 color;
				uniform float brightness;
				varying vec2 vUv;
				void main() {
					vec2 center = vUv - 0.5;
					float dist = length(center) / 0.7;
					float vignette = 1.0 - smoothstep(0.35, 0.82, dist) * 0.65;
					float scanline = sin(vUv.y * 320.0 + time * 2.0) * 0.015 + 0.985;
					vec3 lit = color * vignette * scanline * brightness;
					gl_FragColor = vec4(lit, 1.0);
				}`,
			transparent: false,
		});
	}, []);
}

// ─── Screen Bezel ────────────────────────────────────────────────────────────────

function ScreenBezel({ dims, z, color = "#0a0a0a" }: { dims: Ipod3DDimensions; z: ReturnType<typeof zLayers>; color?: string }) {
	const flat = useTechnicalFlat();
	const bezelGeo = useMemo(() => {
		const w = dims.screenW + 0.07;
		const h = dims.screenH + 0.07;
		const r = 0.03;
		const shape = new THREE.Shape();
		shape.moveTo(-w / 2 + r, -h / 2);
		shape.lineTo(w / 2 - r, -h / 2);
		shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
		shape.lineTo(w / 2, h / 2 - r);
		shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
		shape.lineTo(-w / 2 + r, h / 2);
		shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
		shape.lineTo(-w / 2, -h / 2 + r);
		shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
		return new THREE.ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: true, bevelThickness: MECHANICAL.bezelEdgeBreak, bevelSize: MECHANICAL.bezelEdgeBreak, bevelSegments: 2 });
	}, [dims.screenW, dims.screenH]);

	return (
		<group position={[0, dims.screenCenterY, z.screenBezel]}>
			{/* Single matte black mask framing the LCD — no concentric overlay
			   ring, so the screen reads as one clean inset aperture. */}
			<mesh geometry={bezelGeo}>
				{flat ? (
					<FlatFinish color={color} />
				) : (
					<meshStandardMaterial color={color} metalness={0.0} roughness={0.62} />
				)}
			</mesh>
		</group>
	);
}

// ─── Click Wheel material ──────────────────────────────────────────────────────────

// ─── Click Wheel 3D Assembly ─────────────────────────────────────────────────────

function ClickWheel3D({
	dims,
	z,
	skinColor,
	ringColor,
	centerColor,
	wheelHtml,
	bodyRef,
	domRef,
	glyphMeshRef,
}: {
	dims: Ipod3DDimensions;
	z: ReturnType<typeof zLayers>;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	wheelHtml: React.ReactNode;
	bodyRef: React.RefObject<THREE.Mesh>;
	domRef: React.RefObject<HTMLDivElement | null>;
	glyphMeshRef: React.RefObject<THREE.Mesh | null>;
}) {
	const flat = useTechnicalFlat();
	const wheelColors = useMemo(
		() => deriveWheelColors(ringColor || skinColor),
		[skinColor, ringColor],
	);

	// Faithful wheel colours — the picked hex is used EXACTLY (no luminance floor lifting
	// dark picks toward gray), so #000000 reads true black and #FFFFFF true white. An
	// explicit ring/center colour wins; otherwise we fall back to the derived wheel tone.
	const ringPlastic = useMemo(
		() => new THREE.Color(ringColor || wheelColors.gradient.via),
		[ringColor, wheelColors.gradient.via],
	);
	const centerPlastic = useMemo(
		() => new THREE.Color(centerColor || wheelColors.centerGradient.via),
		[centerColor, wheelColors.centerGradient.via],
	);

	return (
		<group position={[0, dims.wheelCenterY, 0]}>
			{/* Wheel well floor — backs the whole bore so the body never peeks
			   through. Tinted as a soft shadow of the wheel itself (not a dark
			   skin shade) so the thin moat around the select button reads as a
			   gentle groove on any finish — subtle on black, subtle on white —
			   instead of a hard black ring. */}
			<mesh position={[0, 0, z.wheelRecess]}>
				<circleGeometry args={[dims.wheelOuterR + 0.02, 96]} />
				{/* Well floor matches the ring EXACTLY — no 0.82 darkening. That tint drew a
				   dark groove ring that, on a light/white finish, read as a stark cartoon
				   outline; same colour keeps the wheel reading as one clean disc. */}
				{flat ? (
					<FlatFinish color={ringPlastic} />
				) : (
					<meshStandardMaterial color={ringPlastic} metalness={0.0} roughness={0.9} />
				)}
			</mesh>

			{/* Touch ring — a smooth molded panel, NOT a dead-matte pad. The real
			   wheel is one continuous polycarbonate surface with a faint, even sheen
			   that glides across it as the device tilts — slicker than the anodized
			   aluminum around it, never grainy. A thin clearcoat over a moderately
			   smooth base gives that single soft gradient; a little env keeps the
			   annulus reading as one seamless face instead of a flat sticker. */}
			<mesh position={[0, 0, z.wheelSurface]}>
				<ringGeometry args={[dims.wheelInnerR, dims.wheelOuterR, 96]} />
				{flat ? (
					<FlatFinish color={ringPlastic} />
				) : (
					<meshPhysicalMaterial
						clearcoat={0.15}
						clearcoatRoughness={0.7}
						color={ringPlastic}
						envMapIntensity={0.16}
						metalness={0.0}
						roughness={0.55}
					/>
				)}
			</mesh>

			{/* Select button — the same smooth molded surface as the ring, a hair
			   slicker so it reads as a discrete part seated in the center bore. */}
			<mesh position={[0, 0, z.wheelCenter]}>
				<circleGeometry args={[dims.centerR, 72]} />
				{flat ? (
					<FlatFinish color={centerPlastic} />
				) : (
					<meshPhysicalMaterial
						clearcoat={0.15}
						clearcoatRoughness={0.62}
						color={centerPlastic}
						envMapIntensity={0.16}
						metalness={0.0}
						roughness={0.52}
					/>
				)}
			</mesh>

			{/* Interactive HTML overlay — sized 1:1 with the 2D wheel, scaled by unit */}
			<Html
				transform
				className="select-none pointer-events-none"
				occlude={[bodyRef]}
				position={[0, 0, z.wheelHtml]}
				scale={dims.unit * 40}
				style={{
					width: `${dims.wheelHtmlPx.width}px`,
					height: `${dims.wheelHtmlPx.height}px`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				zIndexRange={[100, 0]}
			>
				<div ref={domRef} style={{ pointerEvents: "auto" }}>{wheelHtml}</div>
			</Html>

			{/* Capture-only glyph plane — the baked MENU + transport icons, sized
			   1:1 with the wheel diameter (wheelHtmlPx · unit = 2·wheelOuterR) so
			   they land exactly on the annulus. Hidden until a capture turns it on. */}
			<mesh ref={glyphMeshRef} position={[0, 0, z.wheelHtml]} visible={false}>
				<planeGeometry args={[dims.wheelOuterR * 2, dims.wheelOuterR * 2]} />
			</mesh>
		</group>
	);
}

// ─── Polished Steel Back ─────────────────────────────────────────────────────────

function IpodBack({ dims, z, capacityLabel }: { dims: Ipod3DDimensions; z: ReturnType<typeof zLayers>; capacityLabel: string }) {
	const flat = useTechnicalFlat();
	const engraving = useMemo(() => createBackEngravingTexture(capacityLabel), [capacityLabel]);

	useEffect(() => {
		return () => engraving.dispose();
	}, [engraving]);

	return (
		// Engraving plane faces -Z; rotate 180° about Y so the canvas reads correctly.
		<mesh position={[0, 0, z.backEngraving]} rotation={[0, Math.PI, 0]}>
			<planeGeometry args={[dims.width * 0.84, dims.height * 0.9]} />
			{flat ? (
				<FlatFinish map={engraving} transparent depthWrite={false} />
			) : (
				<meshStandardMaterial map={engraving} transparent depthWrite={false} metalness={0.2} roughness={0.5} />
			)}
		</mesh>
	);
}

// ─── Ipod Model ──────────────────────────────────────────────────────────────────

function IpodModel({ preset, screen, wheel, skinColor, ringColor, centerColor, backColor = "#cfd3d7", edgeColor, bezelColor = "#0a0a0a", capacityLabel, backRoughness = STEEL_ROUGHNESS_FLOOR, technicalFlat = false, onRegisterCapture }: IpodModelProps) {
	// Edge defaults to the back colour so an un-edited device is pixel-identical
	// to the single-material chassis (edge == back until the user sets it).
	const resolvedEdgeColor = edgeColor ?? backColor;
	const groupRef = useRef<THREE.Group>(null);
	// The steel body, used to occlude the live screen/wheel HTML portals so they
	// don't bleed through (mirrored) when the camera swings behind the device.
	const bodyRef = useRef<THREE.Mesh>(null!);
	// The in-scene LCD plane and the live screen DOM node. At capture time we
	// rasterize the DOM and paint it onto the plane, so the exported frame shows
	// the real now-playing screen with the iPod's true perspective — the drei
	// `Html` portal itself never reaches the WebGL framebuffer.
	const lcdMeshRef = useRef<THREE.Mesh>(null!);
	const screenDomRef = useRef<HTMLDivElement>(null);
	// The click-wheel glyph plane + its live DOM node. The wheel's MENU label and
	// transport icons live in a transparent drei `Html` portal, so — like the
	// screen — they never reach the WebGL framebuffer. At capture we bake them
	// onto this plane (transparent everywhere but the glyphs) so they overlay the
	// real 3D wheel geometry in the render.
	const wheelGlyphMeshRef = useRef<THREE.Mesh>(null);
	const wheelDomRef = useRef<HTMLDivElement>(null);
	// Materials/visibility to restore after a capture, one entry per baked plane.
	const captureRestores = useRef<
		Array<{ mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]; visible: boolean; tex: THREE.Texture; mat: THREE.MeshBasicMaterial }>
	>([]);
	const lcdMaterial = useLcdShader();

	// Assign the LCD shader imperatively and keep the mesh ref. Doing it here (not
	// via a <primitive> child) means React reconciliation never re-attaches the
	// shader, so the capture material swap survives a re-render mid-export.
	const attachLcdMesh = useCallback(
		(mesh: THREE.Mesh | null) => {
			lcdMeshRef.current = mesh!;
			if (mesh && mesh.material !== lcdMaterial) {
				mesh.material = lcdMaterial;
			}
		},
		[lcdMaterial],
	);
	const brushedTexture = useMemo(() => createBrushedMetalTexture(), []);
	const dims = useMemo(() => deriveIpod3DDimensions(preset), [preset]);
	const z = useMemo(() => zLayers(dims.depth), [dims.depth]);

	// ── Steel back shell: a thin rounded-rect slab, extruded with a generous
	//    bevel so the back/sides pillow over and the front cap stays flat. ──
	const bodyGeo = useMemo(() => {
		// Tight machined edge: the steel back rolls over the sides with a small
		// radius and meets the aluminum face at a crisp seam. A large bevel here
		// balloons the silhouette into a fat chrome band that clips to white —
		// the real chassis edge is a fraction of the body depth.
		const bevelT = Math.min(MECHANICAL.bodyFilletMax, dims.depth * MECHANICAL.bodyFilletDepthRatio);
		const bevelS = MECHANICAL.bodyFillet;
		const shape = new THREE.Shape();
		drawRoundedRect(shape, 0, 0, dims.width, dims.height, dims.radius);
		const geo = new THREE.ExtrudeGeometry(shape, {
			depth: dims.depth - bevelT * 2,
			bevelEnabled: true,
			bevelThickness: bevelT,
			bevelSize: bevelS,
			bevelSegments: 6,
			curveSegments: 32,
		});
		geo.translate(0, 0, -(dims.depth / 2 - bevelT));
		geo.computeVertexNormals();
		return geo;
	}, [dims]);

	// ── Aluminum front face: a flat machined panel inset by the parting seam,
	//    with the screen aperture and wheel bore cut clean through it. ──
	const faceGeo = useMemo(() => {
		const faceW = dims.width - dims.seam * 2;
		const faceH = dims.height - dims.seam * 2;
		const faceR = Math.max(dims.radius - dims.seam, 0.04);
		const shape = new THREE.Shape();
		drawRoundedRect(shape, 0, 0, faceW, faceH, faceR);

		// Cut the screen pocket with a clearance fit (aperture opened slightly larger than the LCD).
		const screenHole = new THREE.Path();
		drawRoundedRect(
			screenHole,
			0,
			dims.screenCenterY,
			dims.screenW + MECHANICAL.screenApertureClearance,
			dims.screenH + MECHANICAL.screenApertureClearance,
			dims.screenRadius + 0.01,
		);
		shape.holes.push(screenHole);

		// Cut the wheel bore concentric to DATUM B, with its own clearance fit.
		const wheelHole = new THREE.Path();
		wheelHole.absarc(0, dims.wheelCenterY, dims.wheelOuterR + MECHANICAL.wheelBoreClearance, 0, Math.PI * 2, false);
		shape.holes.push(wheelHole);

		// Hairline CHAMFER only. A fat bevel here rounds the screen aperture and
		// wheel bore into soft lips, stacking extra radii on top of the wheel's
		// own rings — the real machined edges are nearly crisp.
		const geo = new THREE.ExtrudeGeometry(shape, {
			depth: MECHANICAL.facePlateDepth,
			bevelEnabled: true,
			bevelThickness: MECHANICAL.faceChamfer.thickness,
			bevelSize: MECHANICAL.faceChamfer.size,
			bevelSegments: 2,
			curveSegments: 28,
		});
		geo.computeVertexNormals();
		return geo;
	}, [dims]);

	// ── Needle drop ──
	// A small under-damped spring whose value kicks to 1 and settles to 0. We map
	// that decay onto a slight tilt-back + lift, so the device "drops" into rest
	// like a tonearm settling onto a record — on first load and again on every
	// finish change, acknowledging the edit with a physical beat. Subtraction:
	// the motion is a few degrees and a hair of travel, never a showy swing.
	const settle = useRef({ value: 1, velocity: 0 });

	useEffect(() => {
		settle.current.value = 1;
		settle.current.velocity = 0;
	}, [skinColor, ringColor, centerColor, backColor, resolvedEdgeColor, bezelColor]);

	useEffect(() => {
		if (!onRegisterCapture) return;

		// Snap to rest so high-res/clip capture is deterministic.
		const snapToRest = () => {
			settle.current.value = 0;
			settle.current.velocity = 0;
			if (groupRef.current) {
				groupRef.current.rotation.set(0, 0, 0);
				groupRef.current.position.set(0, 0, 0);
			}
		};

		// Rasterize a live DOM node and paint it onto an in-scene plane as an
		// un-tonemapped basic material, so the HTML reads at full brightness in the
		// WebGL render. `transparent` keeps everything but the inked pixels see-
		// through (used for the wheel glyphs, which overlay the 3D wheel).
		const bakeNodeOnto = async (
			node: HTMLElement | null,
			mesh: THREE.Mesh | null,
			opts: { transparent?: boolean; showMesh?: boolean; width?: number; height?: number; cacheBust?: boolean } = {},
		) => {
			if (!node || !mesh) return;
			// drei `<Html occlude>` sets `display:none` on a wrapper whenever the
			// portal is occluded — e.g. the live camera is behind the device (a recalled
			// back-view studio shot). A hidden ancestor makes dimensions 0, so the bake
			// would silently skip and the export would keep the idle LCD shader. The
			// still always reframes to the FRONT, so force any hidden ancestor
			// measurable for the rasterize, then restore drei's value.
			const rehidden: Array<[HTMLElement, string]> = [];
			for (let a: HTMLElement | null = node, i = 0; a && i < 8; a = a.parentElement, i++) {
				if (a.style.display === "none") {
					rehidden.push([a, a.style.display]);
					a.style.display = "";
				}
			}
			try {
				// Use explicit dimensions if provided, else fall back to the node's
				// natural (untransformed) offset size. getBoundingClientRect() returns
				// the transformed/scaled size in the viewport, which makes the capture
				// non-deterministic and misaligned as the camera moves.
				const width = opts.width ?? node.offsetWidth;
				const height = opts.height ?? node.offsetHeight;
				if (width < 1 || height < 1) return;

				// Guarantee every glyph and the album art are present before we rasterize.
				// html-to-image snapshots synchronously, so a webfont still swapping in or an
				// artwork <img> mid-decode would bake a blank/fallback frame — the "screen not
				// fully shown" bug. Await fonts + decode every image (and any CSS background
				// image) under the node first.
				if (document.fonts?.ready) {
					try { await document.fonts.ready; } catch { /* fonts API best-effort */ }
				}
				await Promise.all(
					[...node.querySelectorAll("img")].map((img) =>
						img.decode().catch(() => undefined),
					),
				);
				const dataUrl = await htmlToImage.toPng(node, {
					pixelRatio: 3,
					// First bake busts the cache to guarantee fresh fonts/art; per-frame
					// re-bakes (animated screen) reuse the warm cache for speed.
					cacheBust: opts.cacheBust ?? true,
					width,
					height,
				});
				const img = new Image();
				img.src = dataUrl;
				await img.decode();
				const tex = new THREE.Texture(img);
				tex.colorSpace = THREE.SRGBColorSpace;
				tex.minFilter = THREE.LinearFilter;
				tex.magFilter = THREE.LinearFilter;
				tex.anisotropy = 8;
				tex.needsUpdate = true;
				const mat = new THREE.MeshBasicMaterial({
					map: tex,
					toneMapped: false,
					transparent: opts.transparent ?? false,
				});
				// Re-bake safety: a throttled clip export re-bakes the SAME mesh many times
				// to animate the screen. Reuse the mesh's existing restore entry (keeping the
				// ORIGINAL material/visible) and dispose the previous baked tex/mat, so repeat
				// bakes neither leak GPU resources nor capture a baked material as the "original".
				const existing = captureRestores.current.find((r) => r.mesh === mesh);
				if (existing) {
					existing.tex.dispose();
					existing.mat.dispose();
					existing.tex = tex;
					existing.mat = mat;
				} else {
					captureRestores.current.push({ mesh, material: mesh.material, visible: mesh.visible, tex, mat });
				}
				mesh.material = mat;
				if (opts.showMesh) mesh.visible = true;
			} finally {
				for (const [el, prev] of rehidden) el.style.display = prev;
			}
		};

		// Hide/show the live drei `Html` overlays. They float in the DOM above the
		// canvas; once the screen/wheel are baked onto in-scene planes, leaving the
		// overlays visible just produces ghost copies that reproject (and misalign)
		// the moment the capture buffer switches to a portrait aspect — the exact
		// duplicate-screen artifact seen mid-capture. Hide them for the duration.
		const setOverlaysHidden = (hidden: boolean) => {
			const v = hidden ? "hidden" : "";
			if (screenDomRef.current) screenDomRef.current.style.visibility = v;
			if (wheelDomRef.current) wheelDomRef.current.style.visibility = v;
		};

		const prepare = async () => {
			snapToRest();
			captureRestores.current = [];
			try {
				await bakeNodeOnto(screenDomRef.current, lcdMeshRef.current, {
					width: dims.screenHtmlPx.width,
					height: dims.screenHtmlPx.height,
				});
				await bakeNodeOnto(wheelDomRef.current, wheelGlyphMeshRef.current, {
					transparent: true,
					showMesh: true,
					width: dims.wheelHtmlPx.width,
					height: dims.wheelHtmlPx.height,
				});
				setOverlaysHidden(true);
			} catch (error) {
				console.warn("[3d-export] screen/wheel bake failed; capturing live materials", error);
			}
		};

		// Re-sample ONLY the LCD (the animated screen) mid-clip. The overlays are
		// hidden (visibility) for the live canvas during capture; html-to-image copies
		// computed style, so a hidden node bakes blank — momentarily un-hide the screen
		// for the rasterize, then restore. Reuses the warm cache (cacheBust:false).
		const refreshScreen = async () => {
			const node = screenDomRef.current;
			if (!node) return;
			const prevVisibility = node.style.visibility;
			node.style.visibility = "";
			try {
				await bakeNodeOnto(node, lcdMeshRef.current, {
					width: dims.screenHtmlPx.width,
					height: dims.screenHtmlPx.height,
					cacheBust: false,
				});
			} catch (error) {
				console.warn("[3d-export] screen re-bake failed; holding last frame", error);
			} finally {
				node.style.visibility = prevVisibility;
			}
		};

		const restore = () => {
			for (const r of captureRestores.current) {
				r.mesh.material = r.material;
				r.mesh.visible = r.visible;
				r.mat.dispose();
				r.tex.dispose();
			}
			captureRestores.current = [];
			setOverlaysHidden(false);
		};

		onRegisterCapture({ prepare, restore, refreshScreen });
	}, [onRegisterCapture, dims]);

	useFrame((state, delta) => {
		lcdMaterial.uniforms.time.value = state.clock.elapsedTime;

		const s = settle.current;
		const step = Math.min(delta, 0.05);
		// Spring toward 0: stiffness 90, damping 16 → just under critical, a soft
		// single overshoot before it rests.
		const accel = -90 * s.value - 16 * s.velocity;
		s.velocity += accel * step;
		s.value += s.velocity * step;

		const g = groupRef.current;
		if (g) {
			g.rotation.x = s.value * 0.16; // tilt the top back, ease to flat
			g.rotation.z = s.value * -0.04; // a whisper of roll
			g.position.y = s.value * 0.3; // dropped in from just above
		}
	});

	return (
		<TechnicalFlatContext.Provider value={technicalFlat}>
		<group ref={groupRef}>
			{/* No ambient <Float>: a continuous bob never lets the device rest, and during an
			   offline capture (frameloop "never") it freezes at a RANDOM phase — baking a stray
			   tilt that the live preview never shows, so the export never matched the preview.
			   The device rests dead still; the one-shot `settle` drop gives life on load/finish,
			   and the camera move supplies any intentional motion. Capture is now deterministic. */}
			<group>
					{/* ── BODY / BACK SHELL (Deep-drawn, mirror-polished stainless steel) ──
					   One subtractive part: flat front cap, pillowed back + sides. */}
					{/* ExtrudeGeometry emits two groups: index 0 = the flat front/back caps,
					    index 1 = the extruded side + bevel walls (the visible rim). We render
					    the mesh with a two-material array so the back cap keeps `backColor`
					    while the rolled-over rim takes its own `edgeColor`. The front cap is
					    hidden behind `faceGeo`, so painting it with the back material is moot.
					    Edge defaults to back, so an un-edited device looks exactly as before. */}
					<mesh ref={bodyRef} geometry={bodyGeo}>
						{technicalFlat ? (
							<>
								<FlatFinish attach="material-0" color={backColor} />
								<FlatFinish attach="material-1" color={resolvedEdgeColor} />
							</>
						) : (
							// Polished stainless, NOT chrome. A near-mirror back (roughness ~0.05)
							// strobes under a turntable — see STEEL_ROUGHNESS_FLOOR for the physics.
							// The floor widens the GGX lobe enough to melt the env's bright spots into
							// a smooth moving gradient; clearcoat 1.0 keeps the wet polish and
							// envMapIntensity 0.85 trims peak reflected contrast. Reads as satin-
							// polished steel — what a real stainless iPod back is. Both cap and rim
							// share this steel treatment; only the albedo colour differs.
							<>
								<meshPhysicalMaterial
									attach="material-0"
									clearcoat={1.0}
									clearcoatRoughness={0.18}
									color={backColor}
									envMapIntensity={0.85}
									metalness={1.0}
									reflectivity={1.0}
									roughness={backRoughness}
								/>
								<meshPhysicalMaterial
									attach="material-1"
									clearcoat={1.0}
									clearcoatRoughness={0.18}
									color={resolvedEdgeColor}
									envMapIntensity={0.85}
									metalness={1.0}
									reflectivity={1.0}
									roughness={backRoughness}
								/>
							</>
						)}
					</mesh>

					{/* ── BACK ENGRAVING ── */}
					<IpodBack dims={dims} z={z} capacityLabel={capacityLabel} />

					{/* ── FRONT FACE (Anodized aluminum, CNC-machined) ──
						 A flat panel inset by the parting seam, with the screen
						 aperture and wheel bore cut clean through it — the screen and
						 wheel seat into these pockets. */}
					<mesh geometry={faceGeo} position={[0, 0, dims.depth / 2 - 0.002]}>
						{/* Anodized aluminum is a DYED surface over metal — so the picked color
							must read TRUE (a designer who sets the case to #FFFFFF expects white,
							not the gray a fully-metallic face mirrors back from the studio env).
							We model it as a colored dielectric (albedo dominates) wearing a thin
							clearcoat: the diffuse term carries the chosen hex faithfully while the
							clearcoat + brushed roughness give the satin "machined metal" sheen.
							A whisper of metalness keeps a cool anodized glint without washing the
							albedo out. Rougher than the smooth wheel below, so the wheel still
							reads as the slicker part. */}
						{technicalFlat ? (
							<FlatFinish color={skinColor} />
						) : (
							<meshPhysicalMaterial
								clearcoat={0.08}
								clearcoatRoughness={0.55}
								color={skinColor}
								envMapIntensity={0.18}
								metalness={0.08}
								roughness={0.52}
								roughnessMap={brushedTexture}
							/>
						)}
					</mesh>

					{/* ── SCREEN BEZEL ── */}
					<ScreenBezel dims={dims} z={z} color={bezelColor} />

					{/* ── LCD BACKLIGHT ──
						 The live backlight shader; swapped for a baked screen texture
						 during capture (see the onRegisterCapture hook above). The
						 material is assigned imperatively (callback ref) rather than via
						 a <primitive> child, so a React re-render mid-capture can't
						 re-attach the shader and clobber the baked texture.

						 Seated just in front of the (solid) bezel plate and just behind
						 the glass, so the lit screen reads inside the bezel frame in the
						 WebGL render — not occluded by the bezel. In the live view the
						 DOM `Html` portal floats over the canvas and covers this plane. */}
					<mesh ref={attachLcdMesh} position={[0, dims.screenCenterY, z.screenGlass - 0.006]}>
						<planeGeometry args={[dims.screenW, dims.screenH]} />
					</mesh>

					{/* ── SCREEN HTML OVERLAY (1:1 with the 2D screen) ── */}
					<Html
						transform
						className="select-none pointer-events-none"
						occlude={[bodyRef]}
						position={[0, dims.screenCenterY, z.screenHtml]}
						scale={dims.unit * 40}
						style={{
							width: `${dims.screenHtmlPx.width}px`,
							height: `${dims.screenHtmlPx.height}px`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						zIndexRange={[100, 0]}
					>
						{/* pointerEvents:auto so the now-playing screen is editable in 3D
						   (tap title/artist/album/rating inline) — same pattern as the wheel
						   overlay below. The wrapper stays pointer-events-none so only the
						   screen itself, not its bounding box, intercepts the orbit drag. */}
						<div ref={screenDomRef} style={{ pointerEvents: "auto" }}>{screen}</div>
					</Html>

					{/* ── SCREEN GLASS ──
						 A thin, near-transparent glossy plane — just a clearcoat
						 sheen over the LCD. No transmission buffer (that pass re-renders
						 the whole scene every frame and tanks the framerate), and a
						 single flat plane instead of a rounded solid. */}
			<mesh position={[0, dims.screenCenterY, z.screenGlass]} visible={!technicalFlat}>
				<planeGeometry args={[dims.screenW, dims.screenH]} />
				<meshPhysicalMaterial
					clearcoat={0.38}
					clearcoatRoughness={0.18}
					color="#ffffff"
					envMapIntensity={0.12}
					metalness={0}
					opacity={0.05}
					roughness={0.1}
					transparent
				/>
					</mesh>

					{/* ── CLICK WHEEL ── */}
					<ClickWheel3D dims={dims} z={z} skinColor={skinColor} ringColor={ringColor} centerColor={centerColor} wheelHtml={wheel} bodyRef={bodyRef} domRef={wheelDomRef} glyphMeshRef={wheelGlyphMeshRef} />
				</group>
		</group>
		</TechnicalFlatContext.Provider>
	);
}

// ─── Cinematic Camera Rig ─────────────────────────────────────────────────────────

const CAMERA_FOCUS: Record<
	IpodCameraFocus,
	{ position: [number, number, number]; target: [number, number, number] }
> = {
	// Deliberate hero 3/4 angle that catches the chrome rim and depth.
	product: { position: [3.0, 1.1, 11.6], target: [0, 0, 0] },
	// Dead-on, square to the face.
	front: { position: [0, 0.05, 10.2], target: [0, 0.05, 0] },
	// Square to the engraved steel back.
	back: { position: [0.0, 0.0, -10.6], target: [0, 0, 0] },
};

interface Spherical {
	az: number;
	pol: number;
	rad: number;
}

function focusToSpherical(focus: IpodCameraFocus): { sph: Spherical; target: THREE.Vector3 } {
	const f = CAMERA_FOCUS[focus];
	const target = new THREE.Vector3(...f.target);
	const offset = new THREE.Vector3(...f.position).sub(target);
	const rad = offset.length();
	return {
		sph: {
			rad,
			pol: Math.acos(THREE.MathUtils.clamp(offset.y / rad, -1, 1)),
			az: Math.atan2(offset.x, offset.z),
		},
		target,
	};
}

/**
 * Self-contained orbit + dolly rig — the single owner of the camera.
 *
 * It keeps the camera on a spherical orbit (azimuth, polar, radius) around a
 * target and eases that orbit toward the active focus framing. Drag on the
 * canvas orbits, wheel zooms, and a focus button snaps back to a framing. There
 * is no OrbitControls and therefore no two-writers-per-frame fight: the rig
 * computes camera.position from its own state every frame, so the view is fully
 * deterministic and never flips off-axis on a React re-render.
 *
 * The live screen and click wheel are drei `Html` portals layered above the
 * canvas, so pointer events on them never reach the canvas drag handler — wheel
 * taps navigate, canvas drags orbit.
 */
interface OrbitCameraApi {
	getPose: () => StudioPose;
	setGoal: (pose: Partial<Omit<StudioPose, "target">>) => void;
	/** Ease the camera back to the current focus's default framing (the "home" angle). */
	resetCamera: () => void;
}

function OrbitRig({
	focus,
	capturingRef,
	locked = false,
	preview = null,
	onPreviewTick,
	onRegisterCamera,
}: {
	focus: IpodCameraFocus;
	capturingRef: React.MutableRefObject<boolean>;
	/** When true, drag + wheel are ignored so the locked perspective holds (design D13). */
	locked?: boolean;
	/**
	 * Live playhead. When non-null the rig flies the move directly (WYSIWYG with
	 * the export) instead of easing toward the composed goal. Null = free orbit.
	 */
	preview?: CameraPreviewState | null;
	/** Reports the live playhead position (t ∈ [0,1)) back while playing. */
	onPreviewTick?: (t: number) => void;
	onRegisterCamera?: (api: OrbitCameraApi) => void;
}) {
	const { camera, gl, size } = useThree();
	const initial = useMemo(() => focusToSpherical(focus), []); // eslint-disable-line react-hooks/exhaustive-deps
	const cur = useRef<Spherical>({ ...initial.sph, rad: initial.sph.rad + 5 });
	const goal = useRef<Spherical>({ ...initial.sph });
	const target = useRef(new THREE.Vector3().copy(initial.target));
	const dragging = useRef(false);
	const last = useRef({ x: 0, y: 0 });
	// Mirror `locked` into a ref so the persistent pointer/wheel listeners read the
	// current value without re-binding every toggle.
	const lockedRef = useRef(locked);
	useEffect(() => { lockedRef.current = locked; }, [locked]);
	// Mirror `focus` so resetCamera (registered once) always homes to the CURRENT framing.
	const focusRef = useRef(focus);
	useEffect(() => { focusRef.current = focus; }, [focus]);

	// ── Playhead preview state ──
	// `preview` flips the rig from "ease toward goal" to "fly the move directly".
	// We mirror it into a ref so the per-frame loop reads the live value without
	// re-subscribing. `previewPhase` tracks the full-clip t the rig owns while
	// PLAYING (parent only owns it while paused/scrubbing); `previewAnchor` is the
	// hero pose captured the instant preview activates, so the sway centers on the
	// angle the user composed. `previewVec` avoids per-frame allocation.
	const previewRef = useRef(preview);
	useEffect(() => { previewRef.current = preview; }, [preview]);
	const previewPhase = useRef(0);
	const previewAnchor = useRef<StudioPose | null>(null);
	const previewVec = useRef(new THREE.Vector3());
	const previewReport = useRef(0);

	// Responsive framing — the minimum reach that keeps the whole device on screen for
	// the current viewport aspect. On portrait/narrow viewports the horizontal field of
	// view shrinks, so a reach tuned for landscape crops the device; we back the camera
	// off just enough to fit its width (the binding constraint when tall-and-narrow).
	const fitReachRef = useRef(initial.sph.rad);
	useEffect(() => {
		const cam = camera as THREE.PerspectiveCamera;
		const tanHalf = Math.tan((cam.fov * Math.PI) / 360);
		const aspect = size.width / Math.max(1, size.height);
		const HALF_H = 3.6; // device half-height + headroom
		const HALF_W = 2.55; // device half-width + side margin (3/4 view widens the silhouette)
		const fit = Math.max(HALF_H / tanHalf, HALF_W / (tanHalf * aspect));
		fitReachRef.current = THREE.MathUtils.clamp(fit, 5.5, 22);
		if (goal.current.rad < fitReachRef.current) goal.current.rad = fitReachRef.current;
	}, [size.width, size.height, camera]);

	useEffect(() => {
		const next = focusToSpherical(focus);
		// Unwrap azimuth to the nearest equivalent angle so we never spin the
		// long way around when snapping back to a framing.
		const twoPi = Math.PI * 2;
		let az = next.sph.az;
		while (az - cur.current.az > Math.PI) az -= twoPi;
		while (az - cur.current.az < -Math.PI) az += twoPi;
		// Honor the responsive fit floor so a snap never crops the device on mobile.
		goal.current = { az, pol: next.sph.pol, rad: Math.max(next.sph.rad, fitReachRef.current) };
		target.current.copy(next.target);
	}, [focus]);

	useEffect(() => {
		const el = gl.domElement;
		const onDown = (e: PointerEvent) => {
			if (lockedRef.current) return; // perspective locked — don't start an orbit drag
			dragging.current = true;
			last.current = { x: e.clientX, y: e.clientY };
		};
		const onMove = (e: PointerEvent) => {
			if (!dragging.current) return;
			const dx = e.clientX - last.current.x;
			const dy = e.clientY - last.current.y;
			last.current = { x: e.clientX, y: e.clientY };
			goal.current.az -= dx * 0.006;
			goal.current.pol = THREE.MathUtils.clamp(goal.current.pol - dy * 0.006, 0.18, Math.PI - 0.18);
		};
		const onUp = () => { dragging.current = false; };
		const onWheel = (e: WheelEvent) => {
			if (lockedRef.current) return; // perspective locked — don't zoom-dolly
			e.preventDefault();
			goal.current.rad = THREE.MathUtils.clamp(goal.current.rad + e.deltaY * 0.012, 5.5, 22);
		};
		el.addEventListener("pointerdown", onDown);
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			el.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			el.removeEventListener("wheel", onWheel);
		};
	}, [gl]);

	// Surface the rig's pose to the HUD/export in studio coordinates. The rig stays
	// the sole owner of camera state — this just reads `cur` and nudges `goal`, so
	// there's still one writer per frame.
	useEffect(() => {
		if (!onRegisterCamera) return;
		const toStudio = (): StudioPose => ({
			azimuth: cur.current.az * THREE.MathUtils.RAD2DEG,
			elevation: (Math.PI / 2 - cur.current.pol) * THREE.MathUtils.RAD2DEG,
			reach: cur.current.rad,
			target: [target.current.x, target.current.y, target.current.z],
		});
		onRegisterCamera({
			getPose: toStudio,
			setGoal: (pose) => {
				if (pose.azimuth !== undefined) {
					let az = pose.azimuth * THREE.MathUtils.DEG2RAD;
					const twoPi = Math.PI * 2;
					while (az - cur.current.az > Math.PI) az -= twoPi;
					while (az - cur.current.az < -Math.PI) az += twoPi;
					goal.current.az = az;
				}
				if (pose.elevation !== undefined) {
					const el = THREE.MathUtils.clamp(pose.elevation, ELEVATION_RANGE[0], ELEVATION_RANGE[1]);
					goal.current.pol = THREE.MathUtils.clamp(
						Math.PI / 2 - el * THREE.MathUtils.DEG2RAD,
						0.18,
						Math.PI - 0.18,
					);
				}
				if (pose.reach !== undefined) {
					goal.current.rad = THREE.MathUtils.clamp(pose.reach, REACH_RANGE[0], REACH_RANGE[1]);
				}
			},
			resetCamera: () => {
				// Home = the current focus's default framing. Same path the focus buttons take:
				// unwrap azimuth to the nearest equivalent so we ease the short way, and honor the
				// responsive fit floor so home never crops the device on a narrow viewport.
				const next = focusToSpherical(focusRef.current);
				const twoPi = Math.PI * 2;
				let az = next.sph.az;
				while (az - cur.current.az > Math.PI) az -= twoPi;
				while (az - cur.current.az < -Math.PI) az += twoPi;
				goal.current = { az, pol: next.sph.pol, rad: Math.max(next.sph.rad, fitReachRef.current) };
				target.current.copy(next.target);
			},
		});
	}, [onRegisterCamera]);

	useFrame((_, delta) => {
		// During an offline clip render the recorder owns the camera frame-by-frame;
		// stepping the orbit here would fight those writes, so the rig stands down.
		if (capturingRef.current) return;

		// ── Playhead preview ──
		// Fly the move directly so what's on screen IS what the clip exports. Anchor
		// on the composed pose captured the moment preview turns on; advance the clock
		// while playing (and report t back for the scrubber), or hold the scrubbed t.
		const pv = previewRef.current;
		if (pv) {
			if (!previewAnchor.current) {
				previewAnchor.current = {
					azimuth: cur.current.az * THREE.MathUtils.RAD2DEG,
					elevation: (Math.PI / 2 - cur.current.pol) * THREE.MathUtils.RAD2DEG,
					reach: cur.current.rad,
					target: [target.current.x, target.current.y, target.current.z],
				};
				previewPhase.current = pv.t;
			}
			if (pv.playing) {
				const step = Math.min(delta, 0.05) / Math.max(0.1, pv.durationSec);
				previewPhase.current = (previewPhase.current + step) % 1;
				// Throttle the scrubber sync to ~15/s so a playing preview doesn't
				// thrash React with 60 setState calls a second.
				previewReport.current += delta;
				if (previewReport.current >= 1 / 15) {
					previewReport.current = 0;
					onPreviewTick?.(previewPhase.current);
				}
			} else {
				previewPhase.current = pv.t; // parent-controlled scrub
			}
			// `hold` is motion-free: rest on the composed hero for the whole clip (the
			// scrubber still advances so the transport reads, but the pose never moves).
			// Otherwise fly the move with the SAME cadence + time map the export uses.
			let pose: StudioPose;
			if (pv.loop === "hold") {
				pose = previewAnchor.current;
			} else {
				const cycles = cyclesForDuration(pv.move, pv.durationSec, pv.speed, pv.loop);
				const phase = phaseForProgress(previewPhase.current, cycles, pv.loop);
				pose = poseForMove(pv.move, phase, previewAnchor.current);
			}
			const p = poseToPosition(pose, previewVec.current);
			camera.position.copy(p);
			// Keep the orbit state synced to the live preview pose, so when preview
			// ends the camera is already on-orbit (no snap) and eases back to goal.
			cur.current.rad = pose.reach;
			cur.current.az = pose.azimuth * THREE.MathUtils.DEG2RAD;
			cur.current.pol = Math.PI / 2 - pose.elevation * THREE.MathUtils.DEG2RAD;
			camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
			return;
		}
		// Preview just ended — drop the anchor so the next engage re-captures the hero.
		if (previewAnchor.current) previewAnchor.current = null;

		const s = cur.current;
		const g = goal.current;
		const k = 0.1;
		s.az += (g.az - s.az) * k;
		s.pol += (g.pol - s.pol) * k;
		s.rad += (g.rad - s.rad) * k;
		const sinPol = Math.sin(s.pol);
		camera.position.set(
			target.current.x + s.rad * sinPol * Math.sin(s.az),
			target.current.y + s.rad * Math.cos(s.pol),
			target.current.z + s.rad * sinPol * Math.cos(s.az),
		);
		camera.lookAt(target.current);
	});

	return null;
}

// ─── Scene Capture ───────────────────────────────────────────────────────────────

function SceneCapture({
	onCapture,
	onReady,
	onRegisterCanvas,
	onRegisterViewport,
	onRegisterClip,
	captureHooksRef,
	capturingRef,
	captureBackground,
}: {
	onCapture: (fn: (w?: number, h?: number, framing?: ExportFraming, heroPose?: StudioPose | null) => Promise<Blob | null>) => void;
	onReady?: () => void;
	onRegisterCanvas?: (el: HTMLCanvasElement) => void;
	onRegisterViewport?: (fn: (w: number, h: number) => () => void) => void;
	onRegisterClip?: (
		fn: (
			opts: ClipRenderOptions,
			onFrame: (frame: HTMLCanvasElement, index: number, total: number) => Promise<void> | void,
		) => Promise<void>,
	) => void;
	captureHooksRef?: React.MutableRefObject<CaptureHooks | null>;
	capturingRef: React.MutableRefObject<boolean>;
	captureBackground?: string;
}) {
	const { gl, scene, camera } = useThree();
	const setFrameloop = useThree((s) => s.setFrameloop);

	// WYSIWYG resolve pass — reproduces the live composer's vignette + sRGB encode on the
	// offscreen export target, which three otherwise leaves as raw linear light (dark).
	const colorResolveRef = useRef<ColorResolvePass | null>(null);
	// Lazy-init with the `== null` check the react-hooks/refs rule requires (a bare
	// `!ref.current` reads as an illegal render-time ref access and fails `next build`).
	if (colorResolveRef.current == null) colorResolveRef.current = new ColorResolvePass();
	useEffect(() => () => { colorResolveRef.current?.dispose(); colorResolveRef.current = null; }, []);

	// Keep the export background current without re-registering the capture fns.
	// Written in an effect (not during render) so we never mutate a ref mid-render.
	const bgRef = useRef(captureBackground);
	useEffect(() => {
		bgRef.current = captureBackground;
	}, [captureBackground]);

	useEffect(() => {
		onRegisterCanvas?.(gl.domElement);

		const cam = camera as THREE.PerspectiveCamera;

		// Vertical hero framing for the still — a TELEPHOTO, near-dead-on shot.
		// A wide lens at a 3/4 angle keystones the body (converging edges, an
		// oval wheel, a trapezoid screen); a designer reads that as a stretch bug
		// even though the geometry is correct. A long lens (narrow FOV) shot from
		// far back is near-orthographic: parallel edges, a round wheel, a square
		// screen. The whisper of azimuth/elevation keeps a hint of chrome depth
		// without reintroducing perceptible keystone.
		const CAPTURE_FOV = 14;
		// Near-dead-on telephoto direction (a whisper of x/y for chrome depth). Distance is
		// computed from a fit formula so the device FILLS the frame at any aspect instead of
		// floating small with dead margins — tight HALF_H/HALF_W give it a real hero crop.
		const CAPTURE_DIR = new THREE.Vector3(1.5, 0.5, 36.6).normalize();
		const frameForCapture = (aspect: number) => {
			const tanHalf = Math.tan((CAPTURE_FOV * Math.PI) / 360);
			const HALF_H = 3.7; // device half-height + slim headroom
			const HALF_W = 2.05; // dead-on silhouette is narrow
			const reach = Math.max(HALF_H / tanHalf, HALF_W / (tanHalf * aspect));
			cam.fov = CAPTURE_FOV;
			cam.position.set(0, 0, 0).addScaledVector(CAPTURE_DIR, reach);
			cam.lookAt(0, 0, 0);
			cam.aspect = aspect;
			cam.updateProjectionMatrix();
		};

		// HERO framing — keep the angle the user composed (the live/locked perspective) but
		// reframe distance + lens to fill the 9:16 portrait, so the export is the dimensional
		// 3/4 product shot 2D cannot give (design D13). We reuse the OrbitRig's fit formula
		// (HALF_H/HALF_W against the portrait aspect) so the device fills the frame without
		// cropping, and a moderately long HERO_FOV keeps keystone gentle while still reading
		// as a real photographed product (a touch tighter than the live 32° preview).
		const HERO_FOV = 24;
		const frameForHero = (aspect: number, heroPose?: StudioPose | null) => {
			const target = new THREE.Vector3(0, 0, 0);
			// Prefer an explicit composed hero (so a still anchors on the angle you
			// composed even if the playhead is parked mid-move); otherwise read the
			// live camera direction.
			const dir = heroPose
				? poseToPosition(heroPose).sub(new THREE.Vector3(...heroPose.target))
				: camera.position.clone().sub(target);
			if (dir.lengthSq() < 1e-6) dir.set(0.26, 0.09, 1); // fallback ≈ a gentle 3/4
			dir.normalize();
			const tanHalf = Math.tan((HERO_FOV * Math.PI) / 360);
			const HALF_H = 3.25; // device half-height + slim headroom — fill the frame
			const HALF_W = 2.25; // device half-width + side margin (3/4 widens the silhouette)
			const reach = Math.max(HALF_H / tanHalf, HALF_W / (tanHalf * aspect));
			cam.fov = HERO_FOV;
			camera.position.copy(target).addScaledVector(dir, reach);
			cam.lookAt(target);
			cam.aspect = aspect;
			cam.updateProjectionMatrix();
		};

		// Paint a solid export background; returns a restore() back to the live
		// transparent canvas. We set scene.background (not the clear color) because
		// the post-processing EffectComposer runs with autoClear off — a Color
		// background is rendered by both the direct RT render and the composer, so
		// it bakes the stage color into the still and the clip alike, matching 2D.
		const applyBackground = () => {
			const prevBackground = scene.background;
			if (bgRef.current) {
				scene.background = new THREE.Color(bgRef.current);
			}
			return () => {
				scene.background = prevBackground;
			};
		};

		const captureHighRes = async (width = 2160, height = 3840, framing: ExportFraming = "front", heroPose?: StudioPose | null): Promise<Blob | null> => {
			// Snap to rest + bake the live screen onto the LCD plane.
			await captureHooksRef?.current?.prepare();

			const restoreBackground = applyBackground();
			const savedPosition = camera.position.clone();
			const savedQuaternion = camera.quaternion.clone();
			const savedAspect = cam.aspect;
			const savedFov = cam.fov;

			if (framing === "hero") frameForHero(width / height, heroPose);
			else frameForCapture(width / height);

			const renderTarget = new THREE.WebGLRenderTarget(width, height, {
				samples: 8,
				type: THREE.UnsignedByteType,
				format: THREE.RGBAFormat,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
			});

			try {
				gl.setRenderTarget(renderTarget);
				gl.render(scene, camera);
				gl.setRenderTarget(null);

				// Resolve linear scene → sRGB bytes matching the live composer (vignette +
				// sRGB encode). Reading the RT directly would return raw linear → dark export.
				const buffer = new Uint8Array(width * height * 4);
				colorResolveRef.current!.resolve(gl, renderTarget, width, height, buffer);

				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Failed to get canvas 2D context");

				const imageData = ctx.createImageData(width, height);
				for (let y = 0; y < height; y++) {
					for (let x = 0; x < width; x++) {
						const srcIdx = ((height - y - 1) * width + x) * 4;
						const dstIdx = (y * width + x) * 4;
						imageData.data[dstIdx] = buffer[srcIdx]!;
						imageData.data[dstIdx + 1] = buffer[srcIdx + 1]!;
						imageData.data[dstIdx + 2] = buffer[srcIdx + 2]!;
						imageData.data[dstIdx + 3] = buffer[srcIdx + 3]!;
					}
				}
				ctx.putImageData(imageData, 0, 0);

				return new Promise((resolve, reject) => {
					const timeoutId = setTimeout(() => reject(new Error("Canvas toBlob timed out")), 10000);
					canvas.toBlob(
						(blob) => { clearTimeout(timeoutId); resolve(blob); },
						"image/png",
						1.0,
					);
				});
			} finally {
				renderTarget.dispose();
				camera.position.copy(savedPosition);
				camera.quaternion.copy(savedQuaternion);
				cam.aspect = savedAspect;
				cam.fov = savedFov;
				camera.updateProjectionMatrix();
				restoreBackground();
				// Restore the live LCD shader.
				captureHooksRef?.current?.restore();
			}
		};

		// Resize the live drawing buffer to a vertical target (e.g. 1080×1920) so
		// the clip recorder streams a 9:16 buffer. Only size + aspect change —
		// OrbitRig keeps driving the camera, so the clip records whatever angle the
		// user has composed. CSS is untouched (the on-screen preview may look
		// squished for the few seconds it records); restore() reverts everything.
		const setCaptureViewport = (width: number, height: number) => {
			const originalSize = new THREE.Vector2();
			gl.getSize(originalSize);
			const savedAspect = cam.aspect;
			const savedPixelRatio = gl.getPixelRatio();
			const restoreBackground = applyBackground();

			gl.setPixelRatio(1);
			gl.setSize(width, height, false);
			cam.aspect = width / height;
			cam.updateProjectionMatrix();

			return () => {
				gl.setPixelRatio(savedPixelRatio);
				gl.setSize(originalSize.x, originalSize.y, false);
				cam.aspect = savedAspect;
				cam.updateProjectionMatrix();
				restoreBackground();
			};
		};
		onRegisterViewport?.(setCaptureViewport);

		// ── Deterministic offline clip render ──
		// Renders each frame to a multisampled WebGLRenderTarget — exactly the path
		// captureHighRes uses for the still — instead of grabbing the live canvas.
		// That's the fix for the base clip's stale-frame pop: the old path called
		// `gl.render` to the on-screen canvas while the post-processing EffectComposer
		// owned the real-time frameloop, so the first frames captured the composer's
		// pre-move render (a 7-frame stale opening, then a hard cut, and a loop seam
		// that never closed). Rendering offline to an RT touches neither the canvas
		// nor the composer, so every frame is exactly the pose we set and pose(total)
		// === pose(0) — a genuinely seamless loop. The camera flies a studio-coordinate
		// move (orbit or robo diagonal) anchored on the composed hero framing.
		const renderClipFrames = async (
			opts: ClipRenderOptions,
			onFrame: (frame: HTMLCanvasElement, index: number, total: number) => Promise<void> | void,
		) => {
			const { width, height, supersample = 1, durationMs, fps, move = "orbit", speed = 1, loop = "loop", anchor } = opts;
			const ssW = Math.round(width * supersample);
			const ssH = Math.round(height * supersample);
			const total = Math.max(1, Math.round((durationMs / 1000) * fps));

			// ── Phase 1 screen-refresh budget (animated Now Playing screen) ──
			// The live screen DOM keeps animating during the export (the marquee rAF and
			// the progress interval run while the loop awaits the encoder), but the LCD
			// texture is baked only once — freezing the screen. Re-sample it on a CAPPED
			// cadence so the marquee/progress/time advance, with rasterizations DECOUPLED
			// from frame count: at most ~15 screen bakes/sec and a hard total cap, holding
			// the texture between updates while the camera renders every frame. A 60s@30fps
			// clip thus costs ≤ SCREEN_BAKE_CAP bakes, never ~1800.
			const SCREEN_REFRESH_FPS_CAP = 15;
			const SCREEN_BAKE_CAP = 120;
			const canRefreshScreen = typeof captureHooksRef?.current?.refreshScreen === "function";
			const screenRefreshFps = Math.min(fps, SCREEN_REFRESH_FPS_CAP);
			// Stride = the WIDER of the cadence cap and "spread the bake budget across the
			// whole clip". Without the second term a flat ~15fps stride burns all
			// SCREEN_BAKE_CAP bakes in the first ~8s of a long clip, then the screen FREEZES
			// for the rest (the reported "stops updating on minute-long videos"). Widening
			// the stride to ⌈total / cap⌉ spreads ≤cap bakes end-to-end, so the marquee +
			// clock keep advancing for the full duration while rasterizations stay bounded.
			const screenStride = Math.max(
				Math.max(1, Math.round(fps / screenRefreshFps)),
				Math.ceil(total / SCREEN_BAKE_CAP),
			);
			let screenBakes = 0;
			if (canRefreshScreen) {
				console.info(
					`[3d-export] screen re-bake: ~${screenRefreshFps}fps, ` +
						`≤${SCREEN_BAKE_CAP} bakes over ${total} frames (stride ${screenStride})`,
				);
			}

			await captureHooksRef?.current?.prepare();
			capturingRef.current = true;
			// Stop the real-time frameloop: an offline deterministic render must be the
			// ONLY thing touching the GL context. Left running, the post-processing
			// composer's rAF render races our manual render-target reads and the first
			// frames come back stale (the old base clip's 7-frame frozen opening + pop).
			setFrameloop("never");

			// Hero framing the move orbits. Defaults to the still's hero angle so a
			// clip and a still read as the same product shot.
			const hero = clampPose(
				anchor ?? positionToPose(new THREE.Vector3(2.4, 0.6, 15.5), DEFAULT_TARGET),
			);

			const restoreBackground = applyBackground();
			const savedPosition = camera.position.clone();
			const savedQuaternion = camera.quaternion.clone();
			const savedAspect = cam.aspect;
			cam.aspect = width / height;
			cam.updateProjectionMatrix();

			const renderTarget = new THREE.WebGLRenderTarget(ssW, ssH, {
				samples: 8,
				type: THREE.UnsignedByteType,
				format: THREE.RGBAFormat,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
			});

			const out = document.createElement("canvas");
			out.width = width;
			out.height = height;
			const octx = out.getContext("2d");
			if (octx) {
				octx.imageSmoothingEnabled = true;
				octx.imageSmoothingQuality = "high";
			}
			// The RT pixels land here at full (supersampled) size, then get drawn down
			// into `out` flipped — WebGL's framebuffer origin is bottom-left.
			const raw = document.createElement("canvas");
			raw.width = ssW;
			raw.height = ssH;
			const rctx = raw.getContext("2d");
			const buffer = new Uint8ClampedArray(ssW * ssH * 4);
			const imageData = rctx ? new ImageData(buffer, ssW, ssH) : null;

			// Repeat the move's natural cycle a whole number of times across the clip
			// so a long clip keeps a crisp constant cadence (a 60s turntable spins ~10×,
			// not one sluggish rotation) while still closing seamlessly on the hero pose.
			// `speed`/`loop` enter here exactly as they do in the preview, so the encoded
			// clip flies the same cadence + boomerang the user dialed in live.
			const cycles = cyclesForDuration(move, durationMs / 1000, speed, loop);

			const camPos = new THREE.Vector3();
			const lookAt = new THREE.Vector3();

			try {
				for (let i = 0; i < total; i++) {
					// Re-sample the live (already-animating) screen onto the LCD on the capped
					// cadence. The previous frame's `await onFrame` yielded the event loop, so
					// the marquee rAF + progress interval have advanced the DOM since the last
					// bake; this re-rasterization carries that motion into the clip.
					if (canRefreshScreen && i > 0 && screenBakes < SCREEN_BAKE_CAP && i % screenStride === 0) {
						// Pin the screen's looping elements to clip-time BEFORE rasterizing, so
						// this bake captures the marquee + song position for exactly this frame.
						// `i / total` is the only deterministic clock here; driving the screen off
						// it (not wall-clock / encoder progress) is what keeps a 60s export
						// scrolling and playing continuously instead of freezing partway.
						opts.onClipProgress?.(i / total);
						await captureHooksRef!.current!.refreshScreen();
						screenBakes++;
					}

					// Global clip progress → per-cycle phase, repeating `cycles` whole loops
					// (fixed cadence at any length) yet still closing on the hero seam.
					// `hold` is motion-free: every frame pins the composed hero pose, so the
					// clip is a held angle (the studio-shot / locked perspective) as video.
					const pose =
						loop === "hold"
							? hero
							: poseForMove(move, phaseForProgress(i / total, cycles, loop), hero);
					poseToPosition(pose, camPos);
					camera.position.copy(camPos);
					camera.lookAt(lookAt.set(pose.target[0], pose.target[1], pose.target[2]));
					// Pin the portrait projection EVERY frame. R3F's resize observer /
					// drei's makeDefault camera otherwise reset cam.aspect back to the
					// landscape canvas on the first event-loop yield (encoder backpressure
					// at frame ~7), which silently re-framed the device mid-clip.
					if (cam.aspect !== width / height) {
						cam.aspect = width / height;
					}
					cam.updateProjectionMatrix();

					gl.setRenderTarget(renderTarget);
					gl.render(scene, camera);
					// Resolve linear scene → sRGB bytes that match the live composer
					// (vignette + sRGB encode), instead of reading the RT's raw linear
					// pixels (which made every export ~2.2 gamma darker than the preview).
					// The resolve binds its own target first, which also forces three to
					// resolve THIS frame's multisampled buffer — so we never read the
					// previous frame's pixels (the old frozen-opening / loop-seam bug).
					colorResolveRef.current!.resolve(gl, renderTarget, ssW, ssH, buffer);

					if (octx && rctx && imageData) {
						rctx.putImageData(imageData, 0, 0);
						octx.save();
						octx.translate(0, height);
						octx.scale(1, -1);
						octx.drawImage(raw, 0, 0, ssW, ssH, 0, 0, width, height);
						octx.restore();
					}

					await onFrame(out, i, total);
				}
			} finally {
				renderTarget.dispose();
				camera.position.copy(savedPosition);
				camera.quaternion.copy(savedQuaternion);
				cam.aspect = savedAspect;
				camera.updateProjectionMatrix();
				restoreBackground();
				await captureHooksRef?.current?.restore();
				// Resume the live loop and hand the camera back to the orbit rig.
				setFrameloop("always");
				capturingRef.current = false;
			}
		};
		onRegisterClip?.(renderClipFrames);

		onCapture(captureHighRes);
		onReady?.();
	}, [gl, scene, camera, setFrameloop, onCapture, onReady, onRegisterCanvas, onRegisterViewport, onRegisterClip, captureHooksRef, capturingRef]);

	return null;
}

// ─── Focus Controls UI ────────────────────────────────────────────────────────────

function FocusControls({ focus, onFocus }: { focus: IpodCameraFocus; onFocus: (f: IpodCameraFocus) => void }) {
	const items: { id: IpodCameraFocus; label: string }[] = [
		{ id: "product", label: "Product" },
		{ id: "front", label: "Front" },
		{ id: "back", label: "Back" },
	];
	return (
		<Html fullscreen style={{ pointerEvents: "none" }}>
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 rounded-full border border-white/15 bg-black/35 p-1 backdrop-blur-md" style={{ pointerEvents: "auto" }}>
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => onFocus(item.id)}
						className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
							focus === item.id
								? "bg-white/18 text-white shadow-[0_0_18px_rgba(255,255,255,0.12)]"
								: "text-white/55 hover:text-white/90"
						}`}
					>
						{item.label}
					</button>
				))}
			</div>
		</Html>
	);
}

// ─── Main Export ─────────────────────────────────────────────────────────────────

/**
 * Origin gizmo — a compose-time aid that marks world centre (the camera's look-at
 * target / turntable pivot). Rendered as a drei `<Html>` crosshair, NOT scene geometry,
 * so it's a constant-size screen overlay that tracks the origin as the camera orbits and
 * — because exports read the WebGL canvas, never the DOM — can never bake into a still or
 * clip. Purely informational: pointer-events off so it never steals a drag.
 */
function OriginMarker() {
	return (
		<Html position={[0, 0, 0]} center zIndexRange={[15, 0]} pointerEvents="none" style={{ pointerEvents: "none" }}>
			<div className="relative grid h-5 w-5 place-items-center" aria-hidden>
				<span className="absolute h-5 w-px bg-black/45" />
				<span className="absolute h-px w-5 bg-black/45" />
				<span className="h-1.5 w-1.5 rounded-full bg-black/70 ring-1 ring-white/70" />
				<span className="absolute -bottom-3.5 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.14em] text-black/40">
					origin
				</span>
			</div>
		</Html>
	);
}

export const ThreeDIpod = forwardRef<ThreeDIpodHandle, ThreeDIpodProps>(
	(props, ref) => {
		const { onReady, preset, capacityLabel = "160GB", stageClassName = "bg-black", apiRef, captureBackground, showOrigin = false, focus: focusProp, onFocusChange, cameraLocked = false, preview = null, onPreviewTick, lighting, technicalFlat = false, ...modelProps } = props;
		// In the flat technical view the device is rendered as unlit albedo (a material swap),
		// so the rig is a neutral one that only keeps the LCD legible — see FlatFinish.
		// The render OWNS the finish: reshape the curated rig to the chosen colours so any
		// colour × motion exports cleanly (separation, no crush/wash). Skipped for the flat
		// spec-sheet view, which wants the neutral rig untouched. One derived rig drives both
		// the live preview and the offline export → WYSIWYG. See studio-owned-finish.
		const baseLighting = technicalFlat ? FLAT_TECHNICAL_RIG : (lighting ?? APPLE_PRODUCT_RIG);
		const activeLighting = useMemo(
			() =>
				technicalFlat
					? baseLighting
					: deriveOwnedRig(baseLighting, {
							skin: modelProps.skinColor,
							back: modelProps.backColor,
							stage: captureBackground ?? "#ffffff",
						}),
			[baseLighting, technicalFlat, modelProps.skinColor, modelProps.backColor, captureBackground],
		);
		const captureRef = useRef<((w?: number, h?: number, framing?: ExportFraming, heroPose?: StudioPose | null) => Promise<Blob | null>) | null>(null);
		const canvasRef = useRef<HTMLCanvasElement | null>(null);
		const captureHooksRef = useRef<CaptureHooks | null>(null);
		const viewportRef = useRef<((w: number, h: number) => () => void) | null>(null);
		const clipRef = useRef<
			| ((
					opts: ClipRenderOptions,
					onFrame: (frame: HTMLCanvasElement, index: number, total: number) => Promise<void> | void,
			  ) => Promise<void>)
			| null
		>(null);
		// True while an offline clip render owns the camera — read by OrbitRig.
		const capturingRef = useRef(false);
		// The live orbit rig's pose get/set, surfaced to the HUD + export.
		const cameraApiRef = useRef<OrbitCameraApi | null>(null);
		// Focus (orientation) is controllable: the /3d stage drives it from a unified
		// bottom bar; standalone consumers fall back to the in-canvas pill.
		const [focusState, setFocusState] = useState<IpodCameraFocus>("product");
		const focus = focusProp ?? focusState;
		const setFocus = onFocusChange ?? setFocusState;
		const isFocusControlled = focusProp !== undefined;

		const buildHandle = useCallback(
			(): ThreeDIpodHandle => ({
				captureHighRes: async (width?: number, height?: number, framing?: ExportFraming, heroPose?: StudioPose | null) => {
					if (captureRef.current) return captureRef.current(width, height, framing, heroPose);
					return null;
				},
				getCanvas: () => canvasRef.current,
				prepareForCapture: async () => {
					await captureHooksRef.current?.prepare();
					return () => captureHooksRef.current?.restore();
				},
				setCaptureViewport: (width: number, height: number) =>
					viewportRef.current ? viewportRef.current(width, height) : () => {},
				renderClipFrames: async (opts, onFrame) => {
					if (clipRef.current) return clipRef.current(opts, onFrame);
				},
				getCameraPose: () => cameraApiRef.current?.getPose() ?? null,
				setCameraGoal: (pose) => cameraApiRef.current?.setGoal(pose),
				resetCamera: () => cameraApiRef.current?.resetCamera(),
			}),
			[],
		);

		useImperativeHandle(ref, buildHandle, [buildHandle]);

		// Mirror the handle onto the plain-prop ref for the dynamically-imported case.
		useEffect(() => {
			if (!apiRef) return;
			apiRef.current = buildHandle();
			return () => {
				apiRef.current = null;
			};
		}, [apiRef, buildHandle]);

		const handleCapture = useCallback(
			(fn: (w?: number, h?: number, framing?: ExportFraming, heroPose?: StudioPose | null) => Promise<Blob | null>) => { captureRef.current = fn; },
			[],
		);

		const handleRegisterCapture = useCallback(
			(hooks: CaptureHooks) => { captureHooksRef.current = hooks; },
			[],
		);

		const handleRegisterCanvas = useCallback(
			(el: HTMLCanvasElement) => { canvasRef.current = el; },
			[],
		);

		const handleRegisterViewport = useCallback(
			(fn: (w: number, h: number) => () => void) => { viewportRef.current = fn; },
			[],
		);

		const handleRegisterCamera = useCallback(
			(api: OrbitCameraApi) => { cameraApiRef.current = api; },
			[],
		);

		const handleRegisterClip = useCallback(
			(
				fn: (
					opts: ClipRenderOptions,
					onFrame: (frame: HTMLCanvasElement, index: number, total: number) => Promise<void> | void,
				) => Promise<void>,
			) => { clipRef.current = fn; },
			[],
		);

		// `z-0` (not z-auto) makes the wrapper its OWN stacking context, so the device's
		// drei <Html> screen/wheel portals (zIndexRange up to 100) stay TRAPPED beneath it.
		// The control surface lives in the page's root stacking context at z-10+, so the
		// controls always take focus over the iPod — a panel overlapping the device covers
		// it and receives the clicks, never the reverse.
		return (
			<div className={`w-full h-full min-h-screen absolute inset-0 z-0 ${stageClassName}`}>
				<Canvas
					shadows
					dpr={[1, 1.5]}
					gl={{
						antialias: true,
						// No tonemapping operator: a filmic curve rolls off highlights and
						// desaturates, so a designer who picks #FFFFFF / #000000 never gets true
						// white or black. NoToneMapping keeps the render literal, so the chosen
						// hex survives to the pixel — the highest-fidelity path. (The export's
						// ColorResolvePass matches this: linear → sRGB, no tone curve.)
						toneMapping: THREE.NoToneMapping,
						preserveDrawingBuffer: true,
						outputColorSpace: THREE.SRGBColorSpace,
					}}
				>
					{/* OrbitRig is the sole camera owner — intro dolly, drag-orbit, zoom. */}
					<PerspectiveCamera makeDefault fov={32} position={[3, 1.1, 16.6]} />

					<OrbitRig capturingRef={capturingRef} focus={focus} locked={cameraLocked} preview={preview} onPreviewTick={onPreviewTick} onRegisterCamera={handleRegisterCamera} />

					{/* Live, controllable studio rig (Lighting Cockpit). Env-first brightness so
					   the dyed metal reads true (the big front-fill softbox is what lifts Silver
					   out of black); spots add soft shaping only. In Technical/Lights-Off mode
					   this collapses to a neutral rig while the device renders as flat albedo. */}
					<StudioLighting config={activeLighting} />

					{/* Seamless studio sweep tinted by the Stage colour — grounds the device
					   in a real cove instead of floating it on flat colour (design D13). */}
					<StudioBackdrop stageColor={captureBackground} />

					{/* Origin gizmo — a designer aid to see world centre while composing. Not
					   captured: suppressed during export/preview so it never bakes into a frame. */}
					{showOrigin && !preview && <OriginMarker />}

					<IpodModel
						preset={preset}
						capacityLabel={capacityLabel}
						technicalFlat={technicalFlat}
						{...modelProps}
						onRegisterCapture={handleRegisterCapture}
					/>

					{/* Grounding contact shadow — suppressed in the Technical view, which is a
					   shadowless spec-sheet render. */}
					{!technicalFlat && (
						<ContactShadows
							blur={2.4}
							color="#000000"
							far={10}
							frames={1}
							opacity={0.65}
							position={[0, -3.52, 0]}
							resolution={1024}
							scale={24}
						/>
					)}

					{!isFocusControlled && <FocusControls focus={focus} onFocus={setFocus} />}

					<SceneCapture capturingRef={capturingRef} captureBackground={captureBackground} captureHooksRef={captureHooksRef} onCapture={handleCapture} onRegisterCanvas={handleRegisterCanvas} onRegisterClip={handleRegisterClip} onRegisterViewport={handleRegisterViewport} onReady={onReady} />
				</Canvas>
			</div>
		);
	},
);

ThreeDIpod.displayName = "ThreeDIpod";
