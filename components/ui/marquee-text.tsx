"use client";

import { useEffect, useRef, useState } from "react";
import {
	getMarqueeCycleDurationMs,
	getMarqueeFrame,
	getMarqueeGapWidth,
} from "@/lib/marquee";

interface MarqueeTextProps {
	text: string;
	className?: string;
	dataTestId?: string;
	preview?: boolean;
	captureReady?: boolean;
	onOverflowChange?: (overflow: boolean) => void;
}

interface MarqueeMeasurements {
	containerWidth: number;
	contentWidth: number;
	gapWidth: number;
}

const EMPTY_MEASUREMENTS: MarqueeMeasurements = {
	containerWidth: 0,
	contentWidth: 0,
	gapWidth: 0,
};

export function MarqueeText({
	text,
	className = "",
	dataTestId,
	preview = false,
	captureReady = false,
	onOverflowChange,
}: MarqueeTextProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const measurementRef = useRef<HTMLSpanElement>(null);
	const animationFrameRef = useRef<number | null>(null);
	const [measurements, setMeasurements] = useState<MarqueeMeasurements>(EMPTY_MEASUREMENTS);

	useEffect(() => {
		const container = containerRef.current;
		const measurementCopy = measurementRef.current;
		if (!container || !measurementCopy) return;

		const measure = () => {
			const containerWidth = Math.ceil(container.clientWidth);
			const contentWidth = Math.ceil(measurementCopy.scrollWidth);
			const gapWidth = getMarqueeGapWidth(contentWidth, text.length);
			setMeasurements({ containerWidth, contentWidth, gapWidth });
		};

		measure();

		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => measure())
				: null;

		resizeObserver?.observe(container);
		resizeObserver?.observe(measurementCopy);
		window.addEventListener("resize", measure);

		return () => {
			resizeObserver?.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [text, preview, captureReady]);

	const overflow = measurements.contentWidth > measurements.containerWidth + 1;
	const shouldAnimate = (preview || captureReady) && overflow;
	const edgeFadeWidth = Math.max(
		8,
		Math.min(20, Math.round(measurements.containerWidth * 0.08)),
	);
	const edgeFadeShoulder = Math.max(6, Math.round(edgeFadeWidth * 0.68));
	const marqueeMask = overflow
		? `linear-gradient(
			to right,
			transparent 0,
			rgba(0, 0, 0, 0.14) ${Math.max(1, Math.round(edgeFadeWidth * 0.22))}px,
			rgba(0, 0, 0, 0.46) ${Math.max(2, Math.round(edgeFadeWidth * 0.46))}px,
			rgba(0, 0, 0, 0.8) ${edgeFadeShoulder}px,
			black ${edgeFadeWidth}px,
			black calc(100% - ${edgeFadeWidth}px),
			rgba(0, 0, 0, 0.8) calc(100% - ${edgeFadeShoulder}px),
			rgba(0, 0, 0, 0.46) calc(100% - ${Math.max(2, Math.round(edgeFadeWidth * 0.46))}px),
			rgba(0, 0, 0, 0.14) calc(100% - ${Math.max(1, Math.round(edgeFadeWidth * 0.22))}px),
			transparent 100%
		)`
		: "none";

	useEffect(() => {
		onOverflowChange?.(overflow);
	}, [onOverflowChange, overflow]);

	useEffect(() => {
		const track = trackRef.current;
		const container = containerRef.current;
		if (!track) return;
		if (!container) return;

		if (!shouldAnimate) {
			track.style.transform = "translateX(0px)";
			delete container.dataset.marqueeElapsedMs;
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			return;
		}

		let startTime: number | null = null;

		const animate = (timestamp: number) => {
			startTime ??= timestamp;

			const elapsedMs = timestamp - startTime;
			const frame = getMarqueeFrame(measurements, elapsedMs);
			track.style.transform = `translateX(${frame.translateX}px)`;
			container.dataset.marqueeElapsedMs = String(
				Math.max(0, Math.round(elapsedMs)),
			);
			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			delete container.dataset.marqueeElapsedMs;
			track.style.transform = "translateX(0px)";
		};
	}, [measurements, shouldAnimate]);

	return (
		<div
			ref={containerRef}
			className={`relative block w-full overflow-hidden ${className}`}
			style={{
				maskImage: marqueeMask,
				WebkitMaskImage: marqueeMask,
			}}
			data-testid={dataTestId}
			data-marquee-container="true"
			data-marquee-active={shouldAnimate ? "true" : "false"}
			data-marquee-overflow={overflow ? "true" : "false"}
			data-marquee-mode={shouldAnimate ? "overflow" : undefined}
			data-marquee-viewport-width={measurements.containerWidth || undefined}
			data-marquee-content-width={measurements.contentWidth || undefined}
			data-marquee-cycle-duration-ms={
				shouldAnimate ? getMarqueeCycleDurationMs(measurements) : undefined
			}
		>
			<span
				ref={measurementRef}
				className="invisible absolute left-0 top-0 inline-block whitespace-nowrap"
				aria-hidden="true"
			>
				{text}
			</span>
			<div
				ref={trackRef}
				className={`flex w-max items-center whitespace-nowrap will-change-transform ${
					!overflow ? "w-full" : ""
				}`}
				style={{ transform: "translateX(0px)" }}
				data-marquee-track="true"
			>
				<span
					className={`inline-block whitespace-nowrap ${
						!overflow && !shouldAnimate
							? "w-full min-w-0 max-w-full truncate"
							: ""
					}`}
				>
					{text}
				</span>
			</div>
		</div>
	);
}
