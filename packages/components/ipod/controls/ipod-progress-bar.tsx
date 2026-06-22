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
}: IpodProgressBarProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [activePointerId, setActivePointerId] = useState<number | null>(null);
	const progressRef = useRef<HTMLDivElement>(null);

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
					borderColor: "rgba(0,0,0,0.1)",
					background: "#f1f1f1",
					touchAction: "none",
					padding: "0 1px",
				}}
			>
				<div
					data-testid="progress-fill"
					className="absolute inset-y-0 left-0"
					style={{
						width: `${visibleProgress}%`,
						background: "linear-gradient(to bottom, #72B9F4 0%, #3D9CF4 48%, #1680E0 52%, #4C9EEB 100%)",
						maxWidth: "100%",
						borderRadius: "1px 0 0 1px",
					}}
				/>
			</div>
		</div>
	);
}
