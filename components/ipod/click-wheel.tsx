"use client";

import { useEffect, useRef } from "react";

// No lucide imports — all wheel icons are hand-crafted SVGs matching real iPod hardware
import { deriveWheelColors, getSurfaceToken } from "@/lib/color-manifest";

import type { IpodClassicPresetDefinition } from "@/lib/ipod-classic-presets";

const WHEEL_FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface ClickWheelProps {
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

export function ClickWheel({
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
}: ClickWheelProps) {
	const wheelRef = useRef<HTMLDivElement>(null);
	const derived = skinColor ? deriveWheelColors(skinColor) : null;
	const wheelShadow = exportSafe
		? "0 0 0 1px rgba(92,96,104,0.1), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(0,0,0,0.05)"
		: "0 14px 18px -18px rgba(0,0,0,0.24), 0 8px 14px -18px rgba(0,0,0,0.14), 0 0 0 1px rgba(92,96,104,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)";
	const _centerShadow = exportSafe
		? "0 0 0 1px rgba(92,96,104,0.05), inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.03)"
		: "0 4px 10px -12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(92,96,104,0.04), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(0,0,0,0.03)";
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

	useEffect(() => {
		const wheel = wheelRef.current;
		if (!wheel || disabled) return;

		let activePointerId: number | null = null;
		let lastAngle = 0;

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
			{/* Wheel Surface */}
			<div
				className="absolute inset-0 rounded-full border"
				data-export-layer="wheel"
				data-testid="click-wheel"
				style={{
					borderColor: wheelBorder,
					backgroundImage: `linear-gradient(180deg, ${wheelGradientFrom}, ${wheelGradientVia}, ${wheelGradientTo})`,
					boxShadow: wheelShadow,
				}}
			>
				<div
					className="pointer-events-none absolute inset-[2px] rounded-full"
					style={{
						background: "radial-gradient(circle at 38% 26%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 36%, rgba(255,255,255,0) 58%)",
					}}
				/>

				{/* Button Labels */}
				<button
					aria-label="Menu"
					className="absolute left-1/2 z-10 -translate-x-1/2 bg-transparent px-2 py-1 uppercase font-sans leading-none"
					data-testid="click-wheel-menu-button"
					disabled={disabled}
					style={{
						top: wheelTokens.menuTopInset,
						color: wheelLabelColor,
						fontSize: wheelTokens.labelFontSize,
						fontWeight: 700,
						letterSpacing: wheelTokens.labelTracking,
						fontFamily: WHEEL_FONT_FAMILY,
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
					aria-label="Play or pause"
					className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center bg-transparent px-2 py-1 leading-none"
					data-testid="click-wheel-playpause-button"
					disabled={disabled}
					style={{
						bottom: wheelTokens.bottomInset,
						color: wheelLabelColor,
					}}
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onPlayPausePress);
					}}
					onPointerDown={(event) => event.stopPropagation()}
				>
					<svg
						fill="currentColor"
						style={{
							width: wheelTokens.playPauseIconSize * 1.5,
							height: wheelTokens.playPauseIconSize,
						}}
						viewBox="0 0 24 16"
					>
						<polygon points="1,1 10,8 1,15" />
						<rect
							height="14"
							rx="0.5"
							width="3.5"
							x="13"
							y="1"
						/>
						<rect
							height="14"
							rx="0.5"
							width="3.5"
							x="19"
							y="1"
						/>
					</svg>
				</button>

				<button
					aria-label="Previous"
					className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent px-1 py-2 leading-none"
					data-testid="click-wheel-prev-button"
					disabled={disabled}
					style={{
						left: wheelTokens.sideInset,
						color: wheelLabelColor,
					}}
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onPreviousPress);
					}}
					onPointerDown={(event) => event.stopPropagation()}
				>
					<svg
						fill="currentColor"
						style={{
							width: wheelTokens.sideIconSize * 1.4,
							height: wheelTokens.sideIconSize,
						}}
						viewBox="0 0 24 16"
					>
						<rect
							height="14"
							rx="0.5"
							width="2.5"
							x="1"
							y="1"
						/>
						<polygon points="14,1 5,8 14,15" />
						<polygon points="23,1 14,8 23,15" />
					</svg>
				</button>
				<button
					aria-label="Next"
					className="absolute top-1/2 z-10 -translate-y-1/2 bg-transparent px-1 py-2 leading-none"
					data-testid="click-wheel-next-button"
					disabled={disabled}
					style={{
						right: wheelTokens.sideInset,
						color: wheelLabelColor,
					}}
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						handleControlPress(onNextPress);
					}}
					onPointerDown={(event) => event.stopPropagation()}
				>
					<svg
						fill="currentColor"
						style={{
							width: wheelTokens.sideIconSize * 1.4,
							height: wheelTokens.sideIconSize,
						}}
						viewBox="0 0 24 16"
					>
						<polygon points="1,1 10,8 1,15" />
						<polygon points="10,1 19,8 10,15" />
						<rect
							height="14"
							rx="0.5"
							width="2.5"
							x="20.5"
							y="1"
						/>
					</svg>
				</button>
			</div>

			<div
				className={`absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-100 ${
					disabled
						? "cursor-default"
						: "cursor-pointer active:scale-[0.96] active:shadow-none"
				}`}
				data-export-layer="wheel-center"
				data-testid="click-wheel-center"
				role="button"
				style={{
					width: wheelTokens.centerSize,
					height: wheelTokens.centerSize,
					borderColor: wheelCenterBorder,
					backgroundImage: `linear-gradient(180deg, ${wheelCenterFrom}, ${wheelCenterVia}, ${wheelCenterTo})`,
					boxShadow: exportSafe
						? "0 0 0 1px rgba(92,96,104,0.05), inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.03)"
						: "0 2px 6px -2px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(92,96,104,0.06), inset 0 1px 0 rgba(255,255,255,0.92), inset 0 -2px 4px rgba(0,0,0,0.04)",
				}}
				tabIndex={disabled ? -1 : 0}
				onClick={(e) => {
					e.stopPropagation();
					handleControlPress(onCenterClick);
				}}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-[3px] rounded-full"
					style={{
						background: "radial-gradient(ellipse 70% 50% at 50% 34%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 44%, rgba(255,255,255,0) 72%)",
					}}
				/>
			</div>
		</div>
	);
}
