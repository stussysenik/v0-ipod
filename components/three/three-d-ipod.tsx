"use client";

import {
	ContactShadows,
	Environment,
	Float,
	Html,
	Lightformer,
	MeshTransmissionMaterial,
	PerspectiveCamera,
	RoundedBox,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import * as THREE from "three";

import { deriveWheelColors } from "@/lib/color-manifest";
import {
	deriveIpod3DDimensions,
	type Ipod3DDimensions,
} from "@/lib/ipod-3d-dimensions";
import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

import { PostProcessing } from "./post-processing";

// ─── Types ───────────────────────────────────────────────────────────────────────

export interface ThreeDIpodHandle {
	captureHighRes: (width?: number, height?: number) => Promise<Blob | null>;
}

export type IpodCameraFocus = "product" | "front" | "back";

export interface ThreeDIpodProps {
	preset: IpodClassicPresetDefinition;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	/** Engraved capacity on the back plate, e.g. "160GB". */
	capacityLabel?: string;
	onReady?: () => void;
}

interface IpodModelProps {
	preset: IpodClassicPresetDefinition;
	screen: React.ReactNode;
	wheel: React.ReactNode;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	capacityLabel: string;
	onRegisterReset?: (fn: () => void) => void;
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

// ─── Z-Layer Stack (derived from real depth) ──────────────────────────────────────

/**
 * Front-to-back ordering of the device surfaces. Offsets are absolute (in world
 * units) measured from the front face so they stay crisp regardless of the
 * preset-derived body thickness.
 */
function zLayers(depth: number) {
	const f = depth / 2;
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
 * canvas decal: Apple logo, the iPod wordmark, capacity, and the regulatory
 * fine print. Etched glyphs are drawn as soft dark marks with a 1px top
 * highlight so they read as recessed once the chrome reflects around them.
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

	// Apple logo silhouette (drawn vector, no font dependency)
	const cx = w / 2;
	const logoY = h * 0.34;
	const s = 56;
	const apple = () => {
		ctx.beginPath();
		// body — two lobes
		ctx.moveTo(cx, logoY - s * 0.18);
		ctx.bezierCurveTo(cx - s * 0.1, logoY - s * 0.55, cx - s * 0.95, logoY - s * 0.5, cx - s * 0.95, logoY + s * 0.12);
		ctx.bezierCurveTo(cx - s * 0.95, logoY + s * 0.7, cx - s * 0.5, logoY + s * 1.15, cx - s * 0.15, logoY + s * 1.15);
		ctx.bezierCurveTo(cx - s * 0.02, logoY + s * 1.15, cx + s * 0.02, logoY + s * 1.05, cx, logoY + s * 1.05);
		ctx.bezierCurveTo(cx - s * 0.02, logoY + s * 1.05, cx + s * 0.02, logoY + s * 1.15, cx + s * 0.15, logoY + s * 1.15);
		ctx.bezierCurveTo(cx + s * 0.5, logoY + s * 1.15, cx + s * 0.95, logoY + s * 0.7, cx + s * 0.95, logoY + s * 0.12);
		ctx.bezierCurveTo(cx + s * 0.95, logoY - s * 0.5, cx + s * 0.1, logoY - s * 0.55, cx, logoY - s * 0.18);
		ctx.closePath();
		ctx.fill();
		// bite
		ctx.globalCompositeOperation = "destination-out";
		ctx.beginPath();
		ctx.arc(cx + s * 0.78, logoY + s * 0.34, s * 0.34, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalCompositeOperation = "source-over";
		// leaf
		ctx.beginPath();
		ctx.ellipse(cx + s * 0.18, logoY - s * 0.5, s * 0.14, s * 0.28, Math.PI / 4, 0, Math.PI * 2);
		ctx.fill();
	};
	etch(apple);

	// iPod wordmark
	etch(() => {
		ctx.font = "600 92px -apple-system, 'SF Pro Display', Helvetica, Arial, sans-serif";
		ctx.fillText("iPod", cx, h * 0.46);
	});

	// Capacity
	etch(() => {
		ctx.font = "400 38px -apple-system, 'SF Pro Text', Helvetica, Arial, sans-serif";
		ctx.fillText(capacity, cx, h * 0.51);
	});

	// Regulatory fine print near the base
	const fineLines = [
		"Designed by Apple in California   Assembled in China",
		"Model No. A1238   EMC No. 2151",
		"Rated 5-30V ⏚  Capacity " + capacity,
		"FCC ID: BCG-E2151   IC: 579C-E2151",
	];
	etch(() => {
		ctx.font = "400 17px -apple-system, 'SF Pro Text', Helvetica, Arial, sans-serif";
		fineLines.forEach((line, i) => {
			ctx.fillText(line, cx, h * 0.86 + i * 26);
		});
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

// ─── Physical Details (Hold switch, headphone jack, dock) ──────────────────────────

function PhysicalDetails({ dims, caseColor }: { dims: Ipod3DDimensions; caseColor: string }) {
	const metalDark = new THREE.Color(caseColor).multiplyScalar(0.55);
	const f = dims.depth / 2;

	const switchGeo = useMemo(() => {
		const shape = new THREE.Shape();
		const w = 0.32, hgt = 0.13, r = 0.03;
		shape.moveTo(-w / 2 + r, -hgt / 2);
		shape.lineTo(w / 2 - r, -hgt / 2);
		shape.quadraticCurveTo(w / 2, -hgt / 2, w / 2, -hgt / 2 + r);
		shape.lineTo(w / 2, hgt / 2 - r);
		shape.quadraticCurveTo(w / 2, hgt / 2, w / 2 - r, hgt / 2);
		shape.lineTo(-w / 2 + r, hgt / 2);
		shape.quadraticCurveTo(-w / 2, hgt / 2, -w / 2, hgt / 2 - r);
		shape.lineTo(-w / 2, -hgt / 2 + r);
		shape.quadraticCurveTo(-w / 2, -hgt / 2, -w / 2 + r, -hgt / 2);
		return new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 });
	}, []);

	return (
		<group>
			{/* Hold Switch — top edge */}
			<group position={[-0.85, dims.height / 2 - 0.18, f - 0.03]}>
				<mesh geometry={switchGeo} rotation={[Math.PI / 2, 0, 0]}>
					<meshStandardMaterial color={metalDark} metalness={0.7} roughness={0.35} />
				</mesh>
			</group>

			{/* Headphone Jack — top edge */}
			<group position={[0.7, dims.height / 2 - 0.02, f - 0.03]}>
				<mesh rotation={[0, 0, 0]}>
					<torusGeometry args={[0.058, 0.016, 16, 32]} />
					<meshStandardMaterial color="#222" metalness={0.85} roughness={0.25} />
				</mesh>
			</group>

			{/* 30-pin Dock Connector — bottom edge */}
			<group position={[0, -dims.height / 2 + 0.02, 0]}>
				<mesh rotation={[Math.PI / 2, 0, 0]}>
					<boxGeometry args={[0.85, 0.09, 0.05]} />
					<meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
				</mesh>
				{Array.from({ length: 15 }).map((_, i) => (
					<mesh key={i} position={[-0.36 + i * 0.052, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<boxGeometry args={[0.02, 0.05, 0.01]} />
						<meshStandardMaterial color="#d4a84b" metalness={0.95} roughness={0.15} />
					</mesh>
				))}
			</group>
		</group>
	);
}

// ─── Screen Bezel ────────────────────────────────────────────────────────────────

function ScreenBezel({ dims, z }: { dims: Ipod3DDimensions; z: ReturnType<typeof zLayers> }) {
	const bezelGeo = useMemo(() => {
		const w = dims.screenW + 0.14;
		const h = dims.screenH + 0.14;
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
		return new THREE.ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
	}, [dims.screenW, dims.screenH]);

	return (
		<group position={[0, dims.screenCenterY, z.screenBezel]}>
			<mesh geometry={bezelGeo}>
				<meshStandardMaterial color="#0d0d0d" metalness={0.1} roughness={0.55} />
			</mesh>
			<mesh position={[0, 0, 0.008]}>
				<ringGeometry args={[dims.screenW / 2 - 0.03, dims.screenW / 2 + 0.03, 64]} />
				<meshStandardMaterial color="#000" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.6} />
			</mesh>
		</group>
	);
}

// ─── Click Wheel 3D Assembly ─────────────────────────────────────────────────────

function ClickWheel3D({
	dims,
	z,
	skinColor,
	ringColor,
	centerColor,
	wheelHtml,
}: {
	dims: Ipod3DDimensions;
	z: ReturnType<typeof zLayers>;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	wheelHtml: React.ReactNode;
}) {
	const wheelColors = useMemo(
		() => deriveWheelColors(ringColor || skinColor),
		[skinColor, ringColor],
	);

	return (
		<group position={[0, dims.wheelCenterY, 0]}>
			{/* Wheel cavity — recessed depression */}
			<mesh position={[0, 0, z.wheelRecess]}>
				<ringGeometry args={[dims.wheelInnerR - 0.04, dims.wheelOuterR + 0.05, 96]} />
				<meshStandardMaterial color={new THREE.Color(skinColor).multiplyScalar(0.82)} metalness={0.15} roughness={0.45} />
			</mesh>

			{/* Touch ring — polycarbonate surface */}
			<mesh position={[0, 0, z.wheelSurface]}>
				<ringGeometry args={[dims.wheelInnerR, dims.wheelOuterR, 96]} />
				<meshPhysicalMaterial
					clearcoat={0.85}
					clearcoatRoughness={0.08}
					color={wheelColors.gradient.via}
					envMapIntensity={0.9}
					metalness={0.0}
					roughness={0.16}
					sheen={0.28}
					sheenColor={wheelColors.gradient.from}
					sheenRoughness={0.38}
				/>
			</mesh>

			{/* Center button cavity */}
			<mesh position={[0, 0, z.wheelRecess + 0.001]}>
				<ringGeometry args={[dims.centerR - 0.02, dims.centerR + 0.05, 72]} />
				<meshStandardMaterial color={new THREE.Color(skinColor).multiplyScalar(0.7)} metalness={0.1} roughness={0.5} />
			</mesh>

			{/* Center button */}
			<mesh position={[0, 0, z.wheelCenter]}>
				<circleGeometry args={[dims.centerR, 72]} />
				<meshPhysicalMaterial
					clearcoat={0.4}
					color={centerColor || wheelColors.centerGradient.via}
					envMapIntensity={1.1}
					metalness={0.55}
					roughness={0.22}
				/>
			</mesh>

			{/* Interactive HTML overlay — sized 1:1 with the 2D wheel, scaled by unit */}
			<Html
				transform
				className="select-none pointer-events-none"
				occlude={false}
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
				<div style={{ pointerEvents: "auto" }}>{wheelHtml}</div>
			</Html>
		</group>
	);
}

// ─── Polished Steel Back ─────────────────────────────────────────────────────────

function IpodBack({ dims, z, capacityLabel }: { dims: Ipod3DDimensions; z: ReturnType<typeof zLayers>; capacityLabel: string }) {
	const engraving = useMemo(() => createBackEngravingTexture(capacityLabel), [capacityLabel]);

	useEffect(() => {
		return () => engraving.dispose();
	}, [engraving]);

	return (
		// Engraving plane faces -Z; rotate 180° about Y so the canvas reads correctly.
		<mesh position={[0, 0, z.backEngraving]} rotation={[0, Math.PI, 0]}>
			<planeGeometry args={[dims.width * 0.84, dims.height * 0.9]} />
			<meshStandardMaterial map={engraving} transparent depthWrite={false} metalness={0.2} roughness={0.5} />
		</mesh>
	);
}

// ─── Ipod Model ──────────────────────────────────────────────────────────────────

function IpodModel({ preset, screen, wheel, skinColor, ringColor, centerColor, capacityLabel, onRegisterReset }: IpodModelProps) {
	const groupRef = useRef<THREE.Group>(null);
	const lcdMaterial = useLcdShader();
	const brushedTexture = useMemo(() => createBrushedMetalTexture(), []);
	const dims = useMemo(() => deriveIpod3DDimensions(preset), [preset]);
	const z = useMemo(() => zLayers(dims.depth), [dims.depth]);

	// ── Steel back shell: a thin rounded-rect slab, extruded with a generous
	//    bevel so the back/sides pillow over and the front cap stays flat. ──
	const bodyGeo = useMemo(() => {
		const bevelT = Math.min(0.16, dims.depth * 0.32);
		const bevelS = 0.13;
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

		const screenHole = new THREE.Path();
		drawRoundedRect(
			screenHole,
			0,
			dims.screenCenterY,
			dims.screenW + 0.12,
			dims.screenH + 0.12,
			dims.screenRadius + 0.02,
		);
		shape.holes.push(screenHole);

		const wheelHole = new THREE.Path();
		wheelHole.absarc(0, dims.wheelCenterY, dims.wheelOuterR + 0.045, 0, Math.PI * 2, false);
		shape.holes.push(wheelHole);

		const geo = new THREE.ExtrudeGeometry(shape, {
			depth: 0.05,
			bevelEnabled: true,
			bevelThickness: 0.012,
			bevelSize: 0.012,
			bevelSegments: 3,
			curveSegments: 28,
		});
		geo.computeVertexNormals();
		return geo;
	}, [dims]);

	useEffect(() => {
		if (onRegisterReset) {
			onRegisterReset(() => {
				if (groupRef.current) groupRef.current.rotation.set(0, 0, 0);
			});
		}
	}, [onRegisterReset]);

	useFrame((state) => {
		lcdMaterial.uniforms.time.value = state.clock.elapsedTime;
	});

	return (
		<group ref={groupRef}>
			<Float floatIntensity={0.05} floatingRange={[-0.015, 0.015]} rotationIntensity={0.015} speed={1.2}>
				<group>
					{/* ── BODY / BACK SHELL (Deep-drawn, mirror-polished stainless steel) ──
					   One subtractive part: flat front cap, pillowed back + sides. */}
					<mesh geometry={bodyGeo}>
						<meshPhysicalMaterial
							clearcoat={0.5}
							clearcoatRoughness={0.06}
							color="#d9dde1"
							envMapIntensity={1.25}
							metalness={1.0}
							reflectivity={0.9}
							roughness={0.1}
						/>
					</mesh>

					{/* ── BACK ENGRAVING ── */}
					<IpodBack dims={dims} z={z} capacityLabel={capacityLabel} />

					{/* ── FRONT FACE (Anodized aluminum, CNC-machined) ──
						 A flat panel inset by the parting seam, with the screen
						 aperture and wheel bore cut clean through it — the screen and
						 wheel seat into these pockets. */}
					<mesh geometry={faceGeo} position={[0, 0, dims.depth / 2 - 0.002]}>
						<meshPhysicalMaterial
							clearcoat={0.18}
							clearcoatRoughness={0.35}
							color={skinColor}
							envMapIntensity={0.7}
							metalness={0.45}
							roughness={0.52}
							roughnessMap={brushedTexture}
						/>
					</mesh>

					{/* ── SCREEN BEZEL ── */}
					<ScreenBezel dims={dims} z={z} />

					{/* ── LCD BACKLIGHT ── */}
					<mesh position={[0, dims.screenCenterY, z.screenBezel + 0.008]}>
						<planeGeometry args={[dims.screenW, dims.screenH]} />
						<primitive attach="material" object={lcdMaterial} />
					</mesh>

					{/* ── SCREEN HTML OVERLAY (1:1 with the 2D screen) ── */}
					<Html
						transform
						className="select-none pointer-events-none"
						occlude={false}
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
						<div>{screen}</div>
					</Html>

					{/* ── SCREEN GLASS ── */}
					<group position={[0, dims.screenCenterY, z.screenGlass]}>
						<RoundedBox args={[dims.screenW, dims.screenH, 0.018]} radius={0.045} smoothness={6}>
							<MeshTransmissionMaterial
								anisotropicBlur={0.01}
								backside
								backsideThickness={0.025}
								chromaticAberration={0.001}
								color="#ffffff"
								distortion={0.006}
								ior={1.49}
								iridescence={0}
								roughness={0.015}
								temporalDistortion={0}
								thickness={0.04}
								transmission={0.97}
							/>
						</RoundedBox>
					</group>

					{/* ── CLICK WHEEL ── */}
					<ClickWheel3D dims={dims} z={z} skinColor={skinColor} ringColor={ringColor} centerColor={centerColor} wheelHtml={wheel} />

					{/* ── PHYSICAL DETAILS ── */}
					<PhysicalDetails dims={dims} caseColor={skinColor} />
				</group>
			</Float>
		</group>
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
function OrbitRig({ focus }: { focus: IpodCameraFocus }) {
	const { camera, gl } = useThree();
	const initial = useMemo(() => focusToSpherical(focus), []); // eslint-disable-line react-hooks/exhaustive-deps
	const cur = useRef<Spherical>({ ...initial.sph, rad: initial.sph.rad + 5 });
	const goal = useRef<Spherical>({ ...initial.sph });
	const target = useRef(new THREE.Vector3().copy(initial.target));
	const dragging = useRef(false);
	const last = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const next = focusToSpherical(focus);
		// Unwrap azimuth to the nearest equivalent angle so we never spin the
		// long way around when snapping back to a framing.
		const twoPi = Math.PI * 2;
		let az = next.sph.az;
		while (az - cur.current.az > Math.PI) az -= twoPi;
		while (az - cur.current.az < -Math.PI) az += twoPi;
		goal.current = { az, pol: next.sph.pol, rad: next.sph.rad };
		target.current.copy(next.target);
	}, [focus]);

	useEffect(() => {
		const el = gl.domElement;
		const onDown = (e: PointerEvent) => {
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
			e.preventDefault();
			goal.current.rad = THREE.MathUtils.clamp(goal.current.rad + e.deltaY * 0.012, 5.5, 19);
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

	useFrame(() => {
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
	modelResetRef,
}: {
	onCapture: (fn: (w?: number, h?: number) => Promise<Blob | null>) => void;
	onReady?: () => void;
	modelResetRef?: React.MutableRefObject<(() => void) | null>;
}) {
	const { gl, scene, camera } = useThree();

	useEffect(() => {
		const PRODUCT_ANGLE = {
			position: [0, 3.0, 8.0] as const,
			lookAt: [0, 0.2, 0] as const,
		};

		const captureHighRes = async (width = 4096, height = 4096): Promise<Blob | null> => {
			const originalSize = new THREE.Vector2();
			gl.getSize(originalSize);

			if (modelResetRef?.current) modelResetRef.current();

			const savedPosition = camera.position.clone();
			const savedQuaternion = camera.quaternion.clone();

			camera.position.set(...PRODUCT_ANGLE.position);
			camera.lookAt(...PRODUCT_ANGLE.lookAt);
			camera.updateProjectionMatrix();

			const renderTarget = new THREE.WebGLRenderTarget(width, height, {
				samples: 4,
				type: THREE.UnsignedByteType,
				format: THREE.RGBAFormat,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
			});

			try {
				gl.setRenderTarget(renderTarget);
				gl.render(scene, camera);

				const buffer = new Uint8Array(width * height * 4);
				gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
				gl.setRenderTarget(null);

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
				camera.updateProjectionMatrix();
			}
		};

		onCapture(captureHighRes);
		onReady?.();
	}, [gl, scene, camera, onCapture, onReady, modelResetRef]);

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

export const ThreeDIpod = forwardRef<ThreeDIpodHandle, ThreeDIpodProps>(
	(props, ref) => {
		const { onReady, preset, capacityLabel = "160GB", ...modelProps } = props;
		const captureRef = useRef<((w?: number, h?: number) => Promise<Blob | null>) | null>(null);
		const modelResetRef = useRef<(() => void) | null>(null);
		const [focus, setFocus] = useState<IpodCameraFocus>("product");

		useImperativeHandle(ref, () => ({
			captureHighRes: async (width?: number, height?: number) => {
				if (captureRef.current) return captureRef.current(width, height);
				return null;
			},
		}));

		const handleCapture = useCallback(
			(fn: (w?: number, h?: number) => Promise<Blob | null>) => { captureRef.current = fn; },
			[],
		);

		const handleRegisterReset = useCallback(
			(fn: () => void) => { modelResetRef.current = fn; },
			[],
		);

		return (
			<div className="w-full h-full min-h-screen absolute inset-0 bg-black">
				<Canvas
					shadows
					dpr={[1, 2]}
					gl={{
						antialias: true,
						toneMapping: THREE.ACESFilmicToneMapping,
						toneMappingExposure: 0.92,
						preserveDrawingBuffer: true,
						outputColorSpace: THREE.SRGBColorSpace,
					}}
				>
					{/* OrbitRig is the sole camera owner — intro dolly, drag-orbit, zoom. */}
					<PerspectiveCamera makeDefault fov={32} position={[3, 1.1, 16.6]} />

					<OrbitRig focus={focus} />

					{/* Ambient */}
					<ambientLight color="#eef1f5" intensity={0.22} />

					{/* Key Light — warm, top-right */}
					<spotLight castShadow angle={0.32} color="#FFF5E0" intensity={300} penumbra={0.95} position={[9, 13, 11]} shadow-bias={-0.0001} shadow-mapSize={[2048, 2048]} />

					{/* Fill Light — cool, left */}
					<spotLight angle={0.55} color="#d8e8ff" intensity={80} penumbra={0.95} position={[-11, 5, 9]} />

					{/* Rim Light — separates from background */}
					<spotLight angle={0.65} color="#D8E8FF" intensity={220} penumbra={0.95} position={[0, 1.5, -9]} />

					{/* Edge Kickers — soft metallic sheen on the chrome sides */}
					<rectAreaLight color="#FFE8D0" height={9} intensity={70} position={[5.5, 0, 0.8]} width={1.2} />
					<rectAreaLight color="#E8F0FF" height={9} intensity={70} position={[-5.5, 0, 0.8]} width={1.2} />

					{/* Screen illumination — subtle LCD glow */}
					<rectAreaLight color="#c8d8c0" height={3} intensity={1.8} position={[0, 1.2, 6]} width={4} />

					{/* HDRI Studio Environment — softbox reflections without blowing highlights */}
					<Environment background={false} blur={0.5} environmentIntensity={0.42} preset="studio">
						<Lightformer color="white" intensity={0.9} position={[0, 9, 1]} scale={[14, 0.5, 1]} />
						<Lightformer color="#fff4e6" intensity={0.6} position={[6, 4, 4]} scale={[7, 4, 1]} />
						<Lightformer color="#e6f0ff" intensity={0.5} position={[-6, 2, 4]} scale={[7, 4, 1]} />
						<Lightformer color="#f0f0f0" intensity={0.25} position={[0, -5, 2]} scale={[12, 1.5, 1]} />
					</Environment>

					<IpodModel
						preset={preset}
						capacityLabel={capacityLabel}
						{...modelProps}
						onRegisterReset={handleRegisterReset}
					/>

					<ContactShadows blur={1.5} color="#000000" far={9} opacity={0.4} position={[0, -3.5, 0]} resolution={2048} scale={22} />

					<PostProcessing />

					<FocusControls focus={focus} onFocus={setFocus} />

					<SceneCapture modelResetRef={modelResetRef} onCapture={handleCapture} onReady={onReady} />
				</Canvas>
			</div>
		);
	},
);

ThreeDIpod.displayName = "ThreeDIpod";
