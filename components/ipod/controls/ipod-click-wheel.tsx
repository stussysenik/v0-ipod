"use client";

import { useEffect, useRef } from "react";

// No lucide imports — all wheel icons are hand-crafted SVGs matching real iPod hardware
import { deriveWheelColors, getSurfaceToken } from "@/lib/color-manifest";
import { wheelLabelSeatPx } from "@/lib/ipod-classic-presets";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { playMechanicalClick } from "@/lib/ipod-state/effects";
import { liveTheme, captureTheme, vars } from "@/lib/ipod-state/theme.css";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

const WHEEL_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * Symmetric hit padding around every label. Each label is anchored by its CENTRE
 * on the annulus midline (see `wheelLabelSeatPx`), so padding grows the touch
 * target evenly in all directions and can never shift the print off its seat —
 * the lopsided per-button paddings this replaces moved each optical centre to a
 * different radius (≈23 / 30 / 37px from the rim), an asymmetry perspective exposes.
 */
const LABEL_HIT_PADDING = "0.65rem 1rem";

/**
 * Screen-print presence. On the flat 2D ring the authentic print reads quiet
 * (~0.6 over an even plastic tone). Over the 3D-lit metal the same alpha sinks
 * into the material's shading range and the labels go murky on dark finishes —
 * chromeless mode lifts the ink toward solid: same print, more light.
 */
const LABEL_OPACITY = {
	flat: { menu: 0.6, transport: 0.55 },
	chromeless: { menu: 0.82, transport: 0.78 },
} as const;


/**
 * Interactive click wheel assembly.
 *
 * This is a physical control surface, not an application-level toolbar. It is
 * responsible for rotational input and discrete hardware button presses while
 * remaining visually tied to the active hardware preset.
 */
interface IpodClickWheelProps {
	preset: IpodClassicPresetDefinition;
	skinColor?: string;
	ringColor?: string;
	centerColor?: string;
	playClick: () => void;
	onSeek: (direction: number) => void;
	onCenterClick?: () => void;
	onMenuPress?: () => void;
	onPreviousPress?: () => void;
	onNextPress?: () => void;
	onPlayPausePress?: () => void;
	className?: string;
	style?: React.CSSProperties;
	disabled?: boolean;
	exportSafe?: boolean;
	/**
	 * Render only the interactive labels + hit areas, with no painted surface,
	 * materiality VFX, or center-button chrome. Used when the wheel is layered
	 * over a 3D model that already provides the real material — otherwise the
	 * flat 2D chrome (rings, sheen, center glow) fights the rendered geometry.
	 */
	chromeless?: boolean;
}

/**
 * Render the iPod click wheel as a self-contained hardware control assembly.
 */
export function IpodClickWheel({
	preset,
	skinColor,
	ringColor,
	centerColor,
	playClick,
	onSeek,
	onCenterClick,
	onMenuPress,
	onPreviousPress,
	onNextPress,
	onPlayPausePress,
	className,
	style,
	disabled = false,
	exportSafe = false,
	chromeless = false,
}: IpodClickWheelProps) {
	const wheelRef = useRef<HTMLDivElement>(null);
	const derived = skinColor ? deriveWheelColors(skinColor) : null;

	const effectiveRingColor = ringColor || derived?.gradient?.via || "#CACACC";
	const effectiveLabelColor = ringColor
		? deriveWheelColors(ringColor).labelColor
		: (derived?.labelColor ?? getSurfaceToken("wheel.label"));

	const wheelLabelColor = effectiveLabelColor;
	const wheelTokens = preset.wheel;
	// One derived radial seat for all four labels — symmetry by construction.
	const labelSeat = wheelLabelSeatPx(wheelTokens);
	const labelOpacity = chromeless ? LABEL_OPACITY.chromeless : LABEL_OPACITY.flat;

	// Wheel surface: the ring color (transparent when the 3D geometry paints it)
	const wheelSurfaceStyle = {
		background: chromeless ? "transparent" : effectiveRingColor,
	};

	useEffect(() => {
		const wheel = wheelRef.current;
		if (!wheel || disabled) return;

		let activePointerId: number | null = null;
		let lastAngle = 0;

		// Rotation is derived from pointer angle around the wheel center so the
		// interaction reads like a physical scrub gesture rather than a slider.
		const calculateAngle = (clientX: number, clientY: number) => {
			const rect = wheel.getBoundingClientRect();
			const center = {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2,
			};
			return Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI);
		};

		const handlePointerDown = (event: PointerEvent) => {
			if (event.pointerType === "mouse" && event.button !== 0) return;
			const target = event.target as HTMLElement;
			if (
				target.closest('[data-testid="click-wheel-center"]') ||
				target.closest("button")
			)
				return;
			activePointerId = event.pointerId;
			lastAngle = calculateAngle(event.clientX, event.clientY);
			wheel.setPointerCapture?.(event.pointerId);
			event.preventDefault();
		};

		const handlePointerMove = (event: PointerEvent) => {
			if (activePointerId !== event.pointerId) return;
			event.preventDefault();

			const currentAngle = calculateAngle(event.clientX, event.clientY);
			let delta = currentAngle - lastAngle;

			if (delta > 180) delta -= 360;
			if (delta < -180) delta += 360;

			if (Math.abs(delta) > 15) {
				const direction = delta > 0 ? 1 : -1;
				onSeek(direction);
				playClick();
				lastAngle = currentAngle;
			}
		};

		const handlePointerEnd = (event: PointerEvent) => {
			if (activePointerId !== event.pointerId) return;
			activePointerId = null;
			wheel.releasePointerCapture?.(event.pointerId);
		};

		wheel.addEventListener("pointerdown", handlePointerDown, { passive: false });
		wheel.addEventListener("pointermove", handlePointerMove, { passive: false });
		wheel.addEventListener("pointerup", handlePointerEnd);
		wheel.addEventListener("pointercancel", handlePointerEnd);
		wheel.addEventListener("lostpointercapture", handlePointerEnd);

		return () => {
			wheel.removeEventListener("pointerdown", handlePointerDown);
			wheel.removeEventListener("pointermove", handlePointerMove);
			wheel.removeEventListener("pointerup", handlePointerEnd);
			wheel.removeEventListener("pointercancel", handlePointerEnd);
			wheel.removeEventListener("lostpointercapture", handlePointerEnd);
		};
	}, [onSeek, playClick, disabled]);

	const handleControlPress = (callback?: () => void) => {
		if (disabled) return;
		playClick();
		callback?.();
	};

	const activeTheme = exportSafe ? captureTheme : liveTheme;

	return (
		<div
			ref={wheelRef}
			className={`relative touch-none rounded-full ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${activeTheme} ${className}`}
			style={{
				// Rendered 1:1 with the machined token (Ø38.0 projected to px). An earlier
				// scale(0.8) here compensated the old hand-tuned 272px token (0.8 × 272 ≈
				// today's derived 212.9); left in place it double-shrank the wheel to a
				// Ø30.4mm equivalent and crowded the labels into the hub.
				width: wheelTokens.size,
				height: wheelTokens.size,
				...style,
			}}
		>
			{/* Wheel surface, labels, and center button form one hardware subassembly. */}
			<div
				className="absolute inset-0 rounded-full"
				style={{
					...wheelSurfaceStyle,
				}}
				data-export-layer="wheel"
				data-testid="click-wheel"
			>
				{!chromeless && FEATURE_FLAGS.ENABLE_MATERIALITY && (
					<>
						{/* VFX 1: Directional rim light — top-left catches key light, bottom-right fades to shadow */}
						<div
							className="pointer-events-none absolute inset-0 rounded-full"
							style={{
								boxShadow:
									"inset 0 1px 0.5px rgba(255,255,255,0.55), inset 1px 0 1px -0.5px rgba(255,255,255,0.2), inset -0.5px -0.5px 1px rgba(0,0,0,0.06)",
							}}
							aria-hidden="true"
						/>

						{/* VFX 2: Subsurface micro-texture for tactile plastic feel */}
						<div
							className="pointer-events-none absolute inset-0 rounded-full opacity-[0.035] mix-blend-overlay"
							style={{
								backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
							}}
							aria-hidden="true"
						/>

						{/* VFX 3: Directional specular sheen — catches key light from top-left */}
						<div
							className="pointer-events-none absolute inset-[1px] rounded-full"
							style={{
								background: exportSafe
									? "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 45%)"
									: "radial-gradient(ellipse at 33% 28%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.04) 85%, rgba(0,0,0,0.1) 100%)",
							}}
							aria-hidden="true"
						/>

						{/* VFX 4: Center Button Cavity — directional recess, not a black disc.
						    Top-left catches light, bottom-right pools shadow. */}
						<div
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
							style={{
								width: wheelTokens.centerSize + 2,
								height: wheelTokens.centerSize + 2,
								background: "transparent",
								boxShadow: vars.material.middleButtonDepth,
							}}
							aria-hidden="true"
						/>
					</>
				)}

				{/* Button Labels — each anchored by its centre on the annulus midline. */}
				<button
					aria-label="Menu"
			className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-transparent uppercase font-sans leading-none transition-opacity"
			data-testid="click-wheel-menu-button"
			disabled={disabled}
			style={{
				top: labelSeat,
				color: wheelLabelColor,
				fontSize: wheelTokens.labelFontSize,
				fontWeight: 700,
				letterSpacing: wheelTokens.labelTracking,
				fontFamily: WHEEL_FONT_FAMILY,
				opacity: labelOpacity.menu,
				padding: LABEL_HIT_PADDING,
				textShadow: FEATURE_FLAGS.ENABLE_MATERIALITY
							? "0 -1px 0 rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.3)"
							: "0 1px 1px rgba(255,255,255,0.4), 0 -0.5px 1px rgba(0,0,0,0.35)",
					}}
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onMenuPress);
					}}
					onPointerDown={(event) => event.stopPropagation()}
				>
					Menu
				</button>

				<button
					type="button"
					data-testid="click-wheel-playpause-button"
				className="absolute left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center bg-transparent leading-none transition-opacity"
				style={{
					bottom: labelSeat,
					color: wheelLabelColor,
					opacity: labelOpacity.transport,
					padding: LABEL_HIT_PADDING,
				}}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onPlayPausePress);
					}}
					disabled={disabled}
					aria-label="Play or pause"
				>
					<svg
						viewBox="0 0 24 16"
						fill="currentColor"
						style={{
							width: wheelTokens.playPauseIconSize * 1.5,
							height: wheelTokens.playPauseIconSize,
							filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.35)) drop-shadow(0 -0.5px 1px rgba(0,0,0,0.3))",
						}}
					>
						<polygon points="1,1 10,8 1,15" />
						<rect
							x="13"
							y="1"
							width="3.5"
							height="14"
							rx="0.5"
						/>
						<rect
							x="19"
							y="1"
							width="3.5"
							height="14"
							rx="0.5"
						/>
					</svg>
				</button>

				<button
					type="button"
					data-testid="click-wheel-prev-button"
			className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 bg-transparent leading-none transition-opacity"
			style={{
				left: labelSeat,
				color: wheelLabelColor,
				opacity: labelOpacity.transport,
				padding: LABEL_HIT_PADDING,
			}}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onPreviousPress);
					}}
					disabled={disabled}
					aria-label="Previous"
				>
					<svg
						viewBox="0 0 24 16"
						fill="currentColor"
						style={{
							width: wheelTokens.sideIconSize * 1.4,
							height: wheelTokens.sideIconSize,
							filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.35)) drop-shadow(0 -0.5px 1px rgba(0,0,0,0.3))",
						}}
					>
						<rect
							x="1"
							y="1"
							width="2.5"
							height="14"
							rx="0.5"
						/>
						<polygon points="14,1 5,8 14,15" />
						<polygon points="23,1 14,8 23,15" />
					</svg>
				</button>
				<button
					type="button"
					data-testid="click-wheel-next-button"
			className="absolute top-1/2 z-10 translate-x-1/2 -translate-y-1/2 bg-transparent leading-none transition-opacity"
			style={{
				right: labelSeat,
				color: wheelLabelColor,
				opacity: labelOpacity.transport,
				padding: LABEL_HIT_PADDING,
			}}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onNextPress);
					}}
					disabled={disabled}
					aria-label="Next"
				>
					<svg
						viewBox="0 0 24 16"
						fill="currentColor"
						style={{
							width: wheelTokens.sideIconSize * 1.4,
							height: wheelTokens.sideIconSize,
							filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.35)) drop-shadow(0 -0.5px 1px rgba(0,0,0,0.3))",
						}}
					>
						<polygon points="1,1 10,8 1,15" />
						<polygon points="10,1 19,8 10,15" />
						<rect
							x="20.5"
							y="1"
							width="2.5"
							height="14"
							rx="0.5"
						/>
					</svg>
				</button>
			</div>

			<div
				className={`group absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full ${
					FEATURE_FLAGS.ENABLE_MECHANICAL_CENTER_CLICK
						? "transition-[transform,box-shadow] duration-[80ms] ease-out"
						: "transition-all duration-100"
				} ${
					disabled
						? "cursor-default"
						: FEATURE_FLAGS.ENABLE_MECHANICAL_CENTER_CLICK
							? "cursor-pointer active:scale-[0.91]"
							: `cursor-pointer active:scale-[0.96]${FEATURE_FLAGS.ENABLE_MATERIALITY ? " active:shadow-none" : ""}`
				}`}
				style={{
					width: wheelTokens.centerSize,
					height: wheelTokens.centerSize,
					...(chromeless
						? {
								// 3D geometry paints the center button; HTML is just the hit area.
								background: "transparent",
								border: "none",
								outline: "none",
								boxShadow: "none",
							}
						: FEATURE_FLAGS.ENABLE_MATERIALITY
						? {
								background: centerColor
									? centerColor
									: "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F5F5F7 50%, #E8E8EB 100%)",
								border: "none",
								outline: "none",
								boxShadow:
									"inset 0 8px 12px -4px rgba(0,0,0,0.18), inset 0 2px 3px rgba(0,0,0,0.08), inset 0 -1px 2px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.7), 0 0 0 0.5px rgba(0,0,0,0.06)",
							}
						: {
								background: centerColor || "#ffffff",
								border: "none",
								outline: "none",
								boxShadow: `inset 0 0 ${(wheelTokens.centerSize * 0.022).toFixed(1)}px rgba(0, 0, 0, 0.12), inset 0 0 ${(wheelTokens.centerSize * 0.065).toFixed(1)}px rgba(0, 0, 0, 0.07)`,
							}),
				}}
				data-export-layer="wheel-center"
				data-testid="click-wheel-center"
				role="button"
				tabIndex={disabled ? -1 : 0}
				onPointerDown={(e) => {
					e.stopPropagation();
					if (FEATURE_FLAGS.ENABLE_MECHANICAL_CENTER_CLICK && !disabled) {
						playMechanicalClick();
						playClick();
						onCenterClick?.();
					}
				}}
				onClick={(e) => {
					e.stopPropagation();
					if (FEATURE_FLAGS.ENABLE_MECHANICAL_CENTER_CLICK) return;
					handleControlPress(onCenterClick);
				}}
			>
				{/* Press-depress feedback for the 3D view. In chromeless mode the hit-area is
					transparent (the 3D mesh paints the button), so the 2D's visible depress was
					lost — leaving the click feeling dead even though the sound + action fire. This
					overlay flashes a quick inset shadow on :active so the button visibly pushes IN
					over the 3D mesh, restoring the satisfying mechanical press. */}
				{chromeless && FEATURE_FLAGS.ENABLE_MECHANICAL_CENTER_CLICK && !disabled ? (
					<span
						className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-75 ease-out group-active:opacity-100"
						style={{
							boxShadow: "inset 0 6px 12px -3px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.18)",
							background: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0.14), rgba(0,0,0,0) 72%)",
						}}
					/>
				) : null}
			</div>
		</div>
	);
}
