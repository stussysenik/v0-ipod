"use client";

import { useEffect, useRef } from "react";

// No lucide imports — all wheel icons are hand-crafted SVGs matching real iPod hardware
import { deriveWheelColors, getSurfaceToken } from "@/lib/color-manifest";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

const WHEEL_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

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
}

/**
 * Render the iPod click wheel as a self-contained hardware control assembly.
 */
export function IpodClickWheel({
	preset,
	skinColor,
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
}: IpodClickWheelProps) {
	const wheelRef = useRef<HTMLDivElement>(null);
	const derived = skinColor ? deriveWheelColors(skinColor) : null;

	// Unified top-left light source (~33% x, ~28% y) — all shadows and highlights
	// share this direction so the wheel reads as a single physical object.
	const wheelShadow = exportSafe
		? "0 0 0 1px rgba(92,96,104,0.12), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(0,0,0,0.05)"
		: "0 8px 18px -14px rgba(0,0,0,0.2), 0 4px 10px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(88,94,102,0.07), inset 0 1px 0 rgba(255,255,255,0.78), inset 1px 0 1px -0.5px rgba(255,255,255,0.15), inset -1px 0 1px -0.5px rgba(0,0,0,0.04), inset 0 -2px 2px -1px rgba(0,0,0,0.05)";

	const wheelBorder = derived?.border ?? getSurfaceToken("wheel.border");
	const wheelGradientFrom = derived?.gradient.from ?? getSurfaceToken("wheel.gradient.from");
	const wheelGradientVia = derived?.gradient.via ?? getSurfaceToken("wheel.gradient.via");
	const wheelGradientTo = derived?.gradient.to ?? getSurfaceToken("wheel.gradient.to");
	const wheelCenterBorder = derived?.centerBorder ?? getSurfaceToken("wheel.center.border");
	const wheelCenterFrom =
		derived?.centerGradient.from ?? getSurfaceToken("wheel.center.from");
	const wheelCenterVia = derived?.centerGradient.via ?? getSurfaceToken("wheel.center.via");
	const wheelCenterTo = derived?.centerGradient.to ?? getSurfaceToken("wheel.center.to");
	const wheelLabelColor = derived?.labelColor ?? getSurfaceToken("wheel.label");
	const wheelTokens = preset.wheel;

	// Wheel surface: same material as the case, just recessed.
	// Gradient goes from lighter top (catching ambient light) to darker bottom (shadow).
	const wheelSurfaceStyle = {
		backgroundImage: `linear-gradient(175deg, ${wheelGradientFrom} 0%, ${wheelGradientVia} 55%, ${wheelGradientTo} 100%)`,
	};

	// Directional: top-left catches light, bottom-right pools shadow
	const centerShadow = exportSafe
		? "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 1px rgba(0,0,0,0.05)"
		: "0 3px 8px -2px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08), inset 1px 1px 1px -0.5px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.07), inset 0 -1px 1px rgba(0,0,0,0.04)";

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

	return (
		<div
			ref={wheelRef}
			className={`relative touch-none rounded-full ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${className}`}
			style={{
				width: wheelTokens.size,
				height: wheelTokens.size,
				...style,
			}}
		>
			{/* Wheel surface, labels, and center button form one hardware subassembly. */}
			<div
				className="absolute inset-0 rounded-full border"
				style={{
					borderColor: wheelBorder,
					...wheelSurfaceStyle,
					boxShadow: wheelShadow,
				}}
				data-export-layer="wheel"
				data-testid="click-wheel"
			>
				{/* Directional rim light — top-left catches key light, bottom-right fades to shadow */}
				<div
					className="pointer-events-none absolute inset-0 rounded-full"
					style={{
						boxShadow:
							"inset 0 1px 0.5px rgba(255,255,255,0.55), inset 1px 0 1px -0.5px rgba(255,255,255,0.2), inset -0.5px -0.5px 1px rgba(0,0,0,0.06)",
					}}
					aria-hidden="true"
				/>

				{/* Subsurface micro-texture for tactile plastic feel */}
				<div
					className="pointer-events-none absolute inset-0 rounded-full opacity-[0.035] mix-blend-overlay"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
					}}
					aria-hidden="true"
				/>

				{/* Directional specular sheen — catches key light from top-left */}
				<div
					className="pointer-events-none absolute inset-[1px] rounded-full"
					style={{
						background: exportSafe
							? "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 45%)"
							: "radial-gradient(ellipse at 33% 28%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.04) 85%, rgba(0,0,0,0.1) 100%)",
					}}
					aria-hidden="true"
				/>

				{/* Center Button Cavity — directional recess, not a black disc.
				    Top-left catches light, bottom-right pools shadow. */}
				<div
					className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
					style={{
						width: wheelTokens.centerSize + 2,
						height: wheelTokens.centerSize + 2,
						background: "transparent",
						boxShadow:
							"inset 0 1px 2px -0.5px rgba(0,0,0,0.18), inset 1px 0 1px -0.5px rgba(0,0,0,0.1), inset -0.5px -0.5px 1.5px rgba(0,0,0,0.22), 1px 1px 1px -0.5px rgba(255,255,255,0.25)",
					}}
					aria-hidden="true"
				/>

				{/* Button Labels */}
				<button
					aria-label="Menu"
					className="absolute left-1/2 z-10 -translate-x-1/2 bg-transparent px-2 py-1 uppercase font-sans leading-none transition-opacity hover:opacity-80"
					data-testid="click-wheel-menu-button"
					disabled={disabled}
					style={{
						top: wheelTokens.menuTopInset,
						color: wheelLabelColor,
						fontSize: wheelTokens.labelFontSize,
						fontWeight: 700,
						letterSpacing: wheelTokens.labelTracking,
						fontFamily: WHEEL_FONT_FAMILY,
						textShadow:
							"0 -1px 0 rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.3)",
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
					className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center bg-transparent px-2 py-1 leading-none transition-opacity hover:opacity-80"
					style={{
						bottom: wheelTokens.bottomInset,
						color: wheelLabelColor,
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
					className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent px-1 py-2 leading-none transition-opacity hover:opacity-80"
					style={{
						left: wheelTokens.sideInset,
						color: wheelLabelColor,
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
					className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent px-1 py-2 leading-none transition-opacity hover:opacity-80"
					style={{
						right: wheelTokens.sideInset,
						color: wheelLabelColor,
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
				className={`absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-100 ${
					disabled
						? "cursor-default"
						: "cursor-pointer active:scale-[0.96] active:shadow-none"
				}`}
				style={{
					width: wheelTokens.centerSize,
					height: wheelTokens.centerSize,
					borderColor: wheelCenterBorder,
					backgroundImage: `linear-gradient(180deg, ${wheelCenterFrom}, ${wheelCenterVia}, ${wheelCenterTo})`,
					boxShadow: centerShadow,
				}}
				data-export-layer="wheel-center"
				data-testid="click-wheel-center"
				role="button"
				tabIndex={disabled ? -1 : 0}
				onPointerDown={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation();
					handleControlPress(onCenterClick);
				}}
			>
				<div
					className="pointer-events-none absolute inset-0 rounded-full"
					style={{
						background: exportSafe
							? "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 45%)"
							: "radial-gradient(ellipse at 33% 28%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0) 75%)",
					}}
					aria-hidden="true"
				/>
				<div
					className="pointer-events-none absolute inset-0 rounded-full"
					style={{
						background: exportSafe
							? "linear-gradient(0deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 45%)"
							: "radial-gradient(ellipse at 67% 72%, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.04) 40%, rgba(0,0,0,0) 65%)",
					}}
					aria-hidden="true"
				/>
			</div>
		</div>
	);
}
