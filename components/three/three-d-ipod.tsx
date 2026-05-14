"use client";

import {
	ContactShadows,
	Environment,
	Float,
	Html,
	Lightformer,
	MeshTransmissionMaterial,
	OrbitControls,
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

import { PostProcessing } from "./post-processing";

// ─── Types ───────────────────────────────────────────────────────────────────────

export interface ThreeDIpodHandle {
	captureHighRes: (width?: number, height?: number) => Promise<Blob | null>;
}

export interface ThreeDIpodProps {
	screen: React.ReactNode;
	wheel: React.ReactNode;
	skinColor: string;
	ringColor?: string;
	centerColor?: string;
	onReady?: () => void;
}

interface IpodModelProps extends Omit<ThreeDIpodProps, "onReady"> {
	onRegisterReset?: (fn: () => void) => void;
}

// ─── Dimensions (scaled to real iPod Classic proportions) ─────────────────────────

const DIMS = {
	width: 3.75,
	height: 6.25,
	depth: 0.38,
	radius: 0.34,
	screenW: 3.15,
	screenH: 2.38,
	wheelOuterR: 1.18,
	wheelInnerR: 0.72,
	centerR: 0.69,
} as const;

const Z = {
	backFace: 0,
	frontFace: DIMS.depth / 2 + 0.012,
	screenBezel: DIMS.depth / 2 + 0.015,
	screenGlass: DIMS.depth / 2 + 0.044,
	wheelRecess: DIMS.depth / 2 - 0.008,
	wheelSurface: DIMS.depth / 2 + 0.002,
	wheelCenter: DIMS.depth / 2 + 0.006,
	wheelHtml: DIMS.depth / 2 + 0.012,
	screenHtml: DIMS.depth / 2 + 0.022,
} as const;

// ─── Procedural Brushed Metal Texture ─────────────────────────────────────────────

function createBrushedMetalTexture(): THREE.CanvasTexture {
	const size = 1024;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;

	ctx.fillStyle = "#484848";
	ctx.fillRect(0, 0, size, size);

	// Directional brushed lines
	for (let i = 0; i < 600; i++) {
		const y = Math.random() * size;
		const alpha = 0.04 + Math.random() * 0.12;
		ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
		ctx.lineWidth = 0.3 + Math.random() * 1.2;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(size, y + (Math.random() - 0.5) * 30);
		ctx.stroke();
	}

	// Micro-scratches
	for (let i = 0; i < 300; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
		ctx.fillRect(x, y, 0.5 + Math.random() * 1.5, 12 + Math.random() * 40);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1.5, 1.5);
	texture.colorSpace = THREE.SRGBColorSpace;
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

// ─── Physical Details ────────────────────────────────────────────────────────────

function PhysicalDetails({ caseColor }: { caseColor: string }) {
	const metalDark = new THREE.Color(caseColor).multiplyScalar(0.55);

	const switchGeo = useMemo(() => {
		const shape = new THREE.Shape();
		const w = 0.32, h = 0.13, r = 0.03;
		shape.moveTo(-w / 2 + r, -h / 2);
		shape.lineTo(w / 2 - r, -h / 2);
		shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
		shape.lineTo(w / 2, h / 2 - r);
		shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
		shape.lineTo(-w / 2 + r, h / 2);
		shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
		shape.lineTo(-w / 2, -h / 2 + r);
		shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
		return new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 });
	}, []);

	return (
		<group>
			{/* Hold Switch */}
			<group position={[-0.85, DIMS.height / 2 - 0.35, DIMS.depth / 2 + 0.08]}>
				<mesh geometry={switchGeo}>
					<meshStandardMaterial color={metalDark} metalness={0.7} roughness={0.35} />
				</mesh>
				<mesh position={[0.08, 0, 0.024]}>
					<boxGeometry args={[0.1, 0.05, 0.015]} />
					<meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
				</mesh>
			</group>

			{/* Headphone Jack */}
			<group position={[0.85, DIMS.height / 2 - 0.35, 0]}>
				<mesh rotation={[0, Math.PI / 2, 0]}>
					<torusGeometry args={[0.055, 0.015, 16, 32]} />
					<meshStandardMaterial color="#222" metalness={0.85} roughness={0.25} />
				</mesh>
			</group>

			{/* 30-pin Dock Connector */}
			<group position={[0, -DIMS.height / 2 + 0.28, 0]}>
				<mesh rotation={[-Math.PI / 2, 0, 0]}>
					<boxGeometry args={[0.65, 0.08, 0.012]} />
					<meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
				</mesh>
				{Array.from({ length: 15 }).map((_, i) => (
					<mesh
						key={i}
						position={[-0.28 + i * 0.04, 0, 0.01]}
						rotation={[-Math.PI / 2, 0, 0]}
					>
						<boxGeometry args={[0.016, 0.04, 0.004]} />
						<meshStandardMaterial color="#d4a84b" metalness={0.95} roughness={0.15} />
					</mesh>
				))}
			</group>
		</group>
	);
}

// ─── Screen Bezel Geometry ───────────────────────────────────────────────────────

function ScreenBezel() {
	const bezelGeo = useMemo(() => {
		const w = DIMS.screenW + 0.14;
		const h = DIMS.screenH + 0.14;
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
	}, []);

	return (
		<group position={[0, 1.25, Z.screenBezel]}>
			<mesh geometry={bezelGeo}>
				<meshStandardMaterial color="#0d0d0d" metalness={0.1} roughness={0.55} />
			</mesh>

			{/* Inner shadow ring */}
			<mesh position={[0, 0, 0.008]}>
				<ringGeometry args={[DIMS.screenW / 2 - 0.03, DIMS.screenW / 2 + 0.03, 64]} />
				<meshStandardMaterial
					color="#000"
					roughness={0.9}
					side={THREE.DoubleSide}
					transparent
					opacity={0.6}
				/>
			</mesh>
		</group>
	);
}

// ─── Click Wheel 3D Assembly ─────────────────────────────────────────────────────

function ClickWheel3D({ skinColor, ringColor, centerColor, wheelHtml }: { skinColor: string; ringColor?: string; centerColor?: string; wheelHtml: React.ReactNode }) {
	const wheelColors = useMemo(
		() => deriveWheelColors(ringColor || skinColor),
		[skinColor, ringColor],
	);

	return (
		<group position={[0, -1.5, 0]}>
			{/* Wheel cavity — the recessed depression */}
			<mesh position={[0, 0, Z.wheelRecess]}>
				<ringGeometry args={[DIMS.wheelInnerR - 0.04, DIMS.wheelOuterR + 0.04, 80]} />
				<meshStandardMaterial
					color={new THREE.Color(skinColor).multiplyScalar(0.82)}
					metalness={0.15}
					roughness={0.45}
				/>
			</mesh>

			{/* Wheel ring — polycarbonate touch surface */}
			<mesh position={[0, 0, Z.wheelSurface]}>
				<ringGeometry args={[DIMS.wheelInnerR, DIMS.wheelOuterR, 80]} />
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
			<mesh position={[0, 0, Z.wheelRecess + 0.001]}>
				<ringGeometry args={[DIMS.centerR - 0.02, DIMS.centerR + 0.05, 60]} />
				<meshStandardMaterial
					color={new THREE.Color(skinColor).multiplyScalar(0.7)}
					metalness={0.1}
					roughness={0.5}
				/>
			</mesh>

			{/* Center button */}
			<mesh position={[0, 0, Z.wheelCenter]}>
				<circleGeometry args={[DIMS.centerR, 60]} />
				<meshPhysicalMaterial
					clearcoat={0.4}
					color={centerColor || wheelColors.centerGradient.via}
					envMapIntensity={1.1}
					metalness={0.55}
					roughness={0.22}
				/>
			</mesh>

			{/* Interactive HTML overlay for wheel controls */}
			<Html
				transform
				className="select-none pointer-events-none"
				occlude={false}
				position={[0, 0, Z.wheelHtml]}
				scale={0.01}
				style={{
					width: "280px",
					height: "280px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				zIndexRange={[100, 0]}
			>
				<div style={{ pointerEvents: "auto", transform: "scale(0.86)", transformOrigin: "center center" }}>
					{wheelHtml}
				</div>
			</Html>
		</group>
	);
}

// ─── Ipod Model ──────────────────────────────────────────────────────────────────

function IpodModel({ screen, wheel, skinColor, ringColor, centerColor, onRegisterReset }: IpodModelProps) {
	const groupRef = useRef<THREE.Group>(null);
	const lcdMaterial = useLcdShader();
	const brushedTexture = useMemo(() => createBrushedMetalTexture(), []);

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
			<Float
				floatIntensity={0.1}
				floatingRange={[-0.025, 0.025]}
				rotationIntensity={0.04}
				speed={1.6}
			>
				<group>
					{/* ── BACK CASE (Brushed Stainless Steel) ── */}
					<RoundedBox
						args={[DIMS.width, DIMS.height, DIMS.depth]}
						radius={DIMS.radius}
						smoothness={12}
					>
						<meshPhysicalMaterial
							anisotropy={0.85}
							anisotropyRotation={Math.PI / 2}
							clearcoat={0.15}
							clearcoatRoughness={0.1}
							color="#dcdcdc"
							envMapIntensity={1.65}
							metalness={1.0}
							reflectivity={0.95}
							roughness={0.18}
							roughnessMap={brushedTexture}
						/>
					</RoundedBox>

					{/* ── FRONT FACE (Polycarbonate) ── */}
					<group position={[0, 0, Z.frontFace]}>
						<RoundedBox
							args={[DIMS.width, DIMS.height, 0.025]}
							radius={DIMS.radius}
							smoothness={12}
						>
							<meshPhysicalMaterial
								clearcoat={0.92}
								clearcoatRoughness={0.07}
								color={skinColor}
								envMapIntensity={0.88}
								metalness={0.0}
								roughness={0.22}
								sheen={0.18}
								sheenColor={new THREE.Color(skinColor).multiplyScalar(1.08)}
								sheenRoughness={0.55}
								thickness={0.22}
								transmission={0.04}
							/>
						</RoundedBox>
					</group>

					{/* ── SCREEN BEZEL ── */}
					<ScreenBezel />

					{/* ── LCD BACKLIGHT ── */}
					<mesh position={[0, 1.25, Z.screenBezel + 0.008]}>
						<planeGeometry args={[DIMS.screenW, DIMS.screenH]} />
						<primitive attach="material" object={lcdMaterial} />
					</mesh>

					{/* ── SCREEN HTML OVERLAY ── */}
					<Html
						transform
						className="select-none pointer-events-none"
						occlude={false}
						position={[0, 1.25, Z.screenHtml]}
						scale={0.01}
						style={{
							width: "320px",
							height: "242px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						zIndexRange={[100, 0]}
					>
						<div style={{ transform: "scale(0.975)", transformOrigin: "center center" }}>
							{screen}
						</div>
					</Html>

					{/* ── SCREEN GLASS ── */}
					<group position={[0, 1.25, Z.screenGlass]}>
						<RoundedBox
							args={[DIMS.screenW, DIMS.screenH, 0.018]}
							radius={0.045}
							smoothness={6}
						>
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
					<ClickWheel3D skinColor={skinColor} ringColor={ringColor} centerColor={centerColor} wheelHtml={wheel} />

					{/* ── PHYSICAL DETAILS ── */}
					<PhysicalDetails caseColor={skinColor} />
				</group>
			</Float>
		</group>
	);
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
		const captureHighRes = async (width = 4096, height = 4096): Promise<Blob | null> => {
			const originalSize = new THREE.Vector2();
			gl.getSize(originalSize);

			if (modelResetRef?.current) modelResetRef.current();

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
			}
		};

		onCapture(captureHighRes);
		onReady?.();
	}, [gl, scene, camera, onCapture, onReady, modelResetRef]);

	return null;
}

// ─── Turntable Toggle Button ─────────────────────────────────────────────────────

function TurntableToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
	return (
		<Html fullscreen style={{ pointerEvents: "none" }}>
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2" style={{ pointerEvents: "auto" }}>
				<button
					type="button"
					onClick={onToggle}
					className={`rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur-md transition-all ${
						active
							? "border-white/30 bg-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
							: "border-white/15 bg-black/30 text-white/60 hover:text-white/90 hover:bg-black/40"
					}`}
				>
					{active ? "⟳ Turntable On" : "↻ Turntable Off"}
				</button>
			</div>
		</Html>
	);
}

// ─── Main Export ─────────────────────────────────────────────────────────────────

export const ThreeDIpod = forwardRef<ThreeDIpodHandle, ThreeDIpodProps>(
	(props, ref) => {
		const { onReady, ...modelProps } = props;
		const captureRef = useRef<((w?: number, h?: number) => Promise<Blob | null>) | null>(null);
		const modelResetRef = useRef<(() => void) | null>(null);
		const [turntable, setTurntable] = useState(false);

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
						toneMappingExposure: 1.05,
						preserveDrawingBuffer: true,
						outputColorSpace: THREE.SRGBColorSpace,
					}}
				>
					<PerspectiveCamera makeDefault fov={32} position={[0, 0.2, 10.5]} />

					<OrbitControls
						autoRotate={turntable}
						autoRotateSpeed={0.25}
						enableDamping
						dampingFactor={0.08}
						enablePan={false}
						enableZoom
						maxDistance={18}
						maxPolarAngle={Math.PI}
						minDistance={4}
						minPolarAngle={0}
						target={[0, 0.2, 0]}
					/>

					{/* Ambient */}
					<ambientLight color="#eef1f5" intensity={0.28} />

					{/* Key Light — warm, from top-right */}
					<spotLight
						castShadow
						angle={0.32}
						color="#FFF5E0"
						intensity={520}
						penumbra={0.9}
						position={[9, 13, 11]}
						shadow-bias={-0.0001}
						shadow-mapSize={[2048, 2048]}
					/>

					{/* Fill Light — cool, from left */}
					<spotLight
						angle={0.55}
						color="#d8e8ff"
						intensity={140}
						penumbra={0.9}
						position={[-11, 5, 9]}
					/>

					{/* Rim Light — separates from background */}
					<spotLight
						angle={0.65}
						color="#D8E8FF"
						intensity={400}
						penumbra={0.9}
						position={[0, 1.5, -9]}
					/>

					{/* Edge Kicker — right side metallic sheen */}
					<rectAreaLight
						color="#FFE0C0"
						height={10}
						intensity={160}
						position={[5.5, 0, 0.5]}
						width={1.5}
					/>

					{/* Screen illumination — subtle LCD glow */}
					<rectAreaLight
						color="#c8d8c0"
						height={3}
						intensity={2.4}
						position={[0, 1.2, 6]}
						width={4}
					/>

					{/* HDRI Studio Environment */}
					<Environment
						background={false}
						blur={0.4}
						environmentIntensity={0.68}
						preset="studio"
					>
						<Lightformer
							color="white"
							intensity={1.3}
							position={[0, 9, 0]}
							scale={[18, 0.4, 1]}
						/>
						<Lightformer
							color="white"
							intensity={0.95}
							position={[6, 5, -5]}
							scale={[9, 3, 1]}
						/>
						<Lightformer
							color="#d8e8ff"
							intensity={0.75}
							position={[-5, 3, -5]}
							scale={[9, 3, 1]}
						/>
						<Lightformer
							color="#f0f0f0"
							intensity={0.35}
							position={[0, -5, 0]}
							scale={[14, 1.5, 1]}
						/>
					</Environment>

				<IpodModel
					{...modelProps}
					onRegisterReset={handleRegisterReset}
				/>

					<ContactShadows
						blur={1.5}
						color="#000000"
						far={9}
						opacity={0.4}
						position={[0, -3.5, 0]}
						resolution={2048}
						scale={22}
					/>

					<PostProcessing />

					<TurntableToggle
						active={turntable}
						onToggle={() => setTurntable((v) => !v)}
					/>

					<SceneCapture
						modelResetRef={modelResetRef}
						onCapture={handleCapture}
						onReady={onReady}
					/>
				</Canvas>
			</div>
		);
	},
);

ThreeDIpod.displayName = "ThreeDIpod";
