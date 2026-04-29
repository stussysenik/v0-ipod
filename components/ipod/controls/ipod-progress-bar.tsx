"use client";

import { useCallback, useRef, useState } from "react";

import type React from "react";

interface IpodProgressBarProps {
	currentTime: number;
	duration: number;
	onSeek: (time: number) => void;
	disabled?: boolean;
	trackHeight?: number;
	variant?: "experimental" | "classic";
}

export function IpodProgressBar({
	currentTime,
	duration,
	onSeek,
	disabled = false,
	trackHeight = 7,
	variant = "classic",
}: IpodProgressBarProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [activePointerId, setActivePointerId] = useState<number | null>(null);
	const progressRef = useRef<HTMLDivElement>(null);

	const isClassic = variant === "classic";

	const handleDrag = useCallback(
		(clientX: number) => {
			if (progressRef.current) {
				const rect = progressRef.current.getBoundingClientRect();
				const x = clientX - rect.left;
				const percentage = Math.min(Math.max(x / rect.width, 0), 1);
				onSeek(percentage * duration);
			}
		},
		[duration, onSeek],
	);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		setIsDragging(true);
		setActivePointerId(e.pointerId);
		e.currentTarget.setPointerCapture?.(e.pointerId);
		handleDrag(e.clientX);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		if (!isDragging || activePointerId !== e.pointerId) return;
		handleDrag(e.clientX);
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		if (activePointerId !== e.pointerId) return;
		setIsDragging(false);
		setActivePointerId(null);
		e.currentTarget.releasePointerCapture?.(e.pointerId);
	};

	const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		if (activePointerId !== e.pointerId) return;
		setIsDragging(false);
		setActivePointerId(null);
		e.currentTarget.releasePointerCapture?.(e.pointerId);
	};

	const safeDuration = Math.max(duration, 1);
	const progress = Math.min(Math.max((currentTime / safeDuration) * 100, 0), 100);
	const visibleProgress = progress > 0 ? Math.max(progress, 1.9) : 0;
	const visualTrackHeight = Math.max(trackHeight, 8);

	return (
		<div className="w-full flex items-center h-full">
			<div
				ref={progressRef}
				data-testid="progress-track"
				data-export-duration={duration}
				className={`relative w-full border ${
					disabled ? "cursor-default" : "cursor-pointer"
				}`}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				style={{
					height: visualTrackHeight,
					borderRadius: 2,
					borderColor: "#b8b8b8",
					borderTopColor: "#9e9e9e",
					background: "linear-gradient(to bottom, #fdfdfd, #f1f1f1 40%, #e5e5e5)",
					boxShadow: "inset 0 1px 1px rgba(0,0,0,.15)",
					touchAction: "none",
				}}
			>
				<div
					data-testid="progress-fill"
					className="absolute inset-y-0 left-0"
					style={{
						width: `${visibleProgress}%`,
						background: "linear-gradient(to bottom, #72B9F4 0%, #3D9CF4 48%, #1680E0 52%, #4C9EEB 100%)",
						boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
						maxWidth: "100%",
						borderRadius: "1px 0 0 1px",
					}}
				/>
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[5px]"
					style={{
						background: "linear-gradient(to bottom, rgba(255,255,255,0.75), rgba(255,255,255,0.15))",
						borderRadius: "1px 1px 0 0",
						mixBlendMode: "screen",
					}}
				/>
				{isClassic && (
					<div
						className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] z-10"
						style={{
							left: `${progress}%`,
							backgroundColor: "#f0f0f0",
							border: "1px solid #999",
							transform: "translateY(-50%) rotate(45deg)",
							boxShadow: "-1px 1px 3px rgba(0,0,0,0.3)",
							marginTop: "-1px",
						}}
					/>
				)}
			</div>
		</div>
	);
}
