"use client";

import { useEffect, useRef, useState } from "react";
import { getMarqueeCycleDurationMs, getMarqueeFrame, getMarqueeGapWidth } from "@/lib/marquee";

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

	useEffect(() => {
		onOverflowChange?.(overflow);
	}, [onOverflowChange, overflow]);

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;

		if (!shouldAnimate) {
			track.style.transform = "translateX(0px)";
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			return;
		}

		let startTime: number | null = null;

		const animate = (timestamp: number) => {
			startTime ??= timestamp;

			const frame = getMarqueeFrame(measurements, timestamp - startTime);
			track.style.transform = `translateX(${frame.translateX}px)`;
			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			track.style.transform = "translateX(0px)";
		};
	}, [measurements, shouldAnimate]);

	return (
		<div
			ref={containerRef}
			className={`relative block w-full overflow-hidden ${className}`}
			style={{
				maskImage: overflow
					? "linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)"
					: "none",
				WebkitMaskImage: overflow
					? "linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)"
					: "none",
			}}
			data-testid={dataTestId}
			data-marquee-container="true"
			data-marquee-active={shouldAnimate ? "true" : "false"}
			data-marquee-overflow={overflow ? "true" : "false"}
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
