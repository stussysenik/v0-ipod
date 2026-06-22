"use client";

import { useEffect, useRef, useState } from "react";
import {
	getMarqueeCycleDurationMs,
	getMarqueeFrame,
	getMarqueeGapWidth,
	type MarqueeMode,
} from "@ipod/lib/marquee";
import { getCaptureElapsedMs, subscribeCaptureClock } from "@ipod/lib/capture-clock";

interface MarqueeTextProps {
	text: string;
	className?: string;
	dataTestId?: string;
	preview?: boolean;
	captureReady?: boolean;
	onOverflowChange?: (overflow: boolean) => void;
	staggerIndex?: number;
	mode?: MarqueeMode;
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
	staggerIndex = 0,
	mode = "reset",
}: MarqueeTextProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const measurementRef = useRef<HTMLSpanElement>(null);
	const animationFrameRef = useRef<number | null>(null);
	const [measurements, setMeasurements] = useState<MarqueeMeasurements>(EMPTY_MEASUREMENTS);
	// True while a clip export is driving the capture clock. We track it in state only
	// to *gate* the wall-clock rAF loop below — the actual frame-accurate positioning
	// happens imperatively in the subscription effect, with no render in the path.
	const [captureActive, setCaptureActive] = useState<boolean>(() => getCaptureElapsedMs() !== null);
	useEffect(
		() => subscribeCaptureClock((elapsedMs) => setCaptureActive(elapsedMs !== null)),
		[],
	);

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
	const edgeFadeWidth = 0.5;
	const marqueeMask = overflow
		? `linear-gradient(
			to right,
			rgba(0, 0, 0, 0.15) 0,
			black ${edgeFadeWidth}px,
			black calc(100% - ${edgeFadeWidth}px),
			rgba(0, 0, 0, 0.15) 100%
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

		// During an offline export the capture clock owns positioning (see effect
		// below). Don't also run the wall-clock rAF — it's non-deterministic and
		// stalls whenever the bake monopolizes the main thread, which is exactly the
		// "marquee freezes mid-clip" bug. Leave the transform alone for the capture
		// effect to set.
		if (captureActive) return;

		let startTime: number | null = null;

		const animate = (timestamp: number) => {
			startTime ??= timestamp;

			const elapsedMs = timestamp - startTime;
			const frame = getMarqueeFrame(measurements, elapsedMs, staggerIndex, mode);
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
	}, [measurements, shouldAnimate, mode, staggerIndex, captureActive]);

	// Capture-clock positioning: while a clip is baking, the export pushes the
	// deterministic clip-time (ms) into the capture clock right before each screen
	// rasterization. We set the track transform SYNCHRONOUSLY inside the callback so
	// the very next bake captures this exact scroll position — no React render, no
	// rAF, no drift. `null` means no export is in flight (live rAF stays in charge).
	useEffect(() => {
		const track = trackRef.current;
		const container = containerRef.current;
		if (!track || !container) return;

		const apply = (elapsedMs: number | null) => {
			if (elapsedMs === null || !shouldAnimate) return;
			const frame = getMarqueeFrame(measurements, elapsedMs, staggerIndex, mode);
			track.style.transform = `translateX(${frame.translateX}px)`;
			container.dataset.marqueeElapsedMs = String(Math.max(0, Math.round(elapsedMs)));
		};

		apply(getCaptureElapsedMs()); // position immediately if an export is already running
		return subscribeCaptureClock(apply);
	}, [measurements, shouldAnimate, mode, staggerIndex]);

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
				shouldAnimate ? getMarqueeCycleDurationMs(measurements, mode) : undefined
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
				{overflow && (
					<span
						className="inline-block whitespace-nowrap"
						aria-hidden="true"
						style={{ paddingLeft: `${getMarqueeGapWidth(measurements.contentWidth, text.length)}px` }}
					>
						{text}
					</span>
				)}
			</div>
		</div>
	);
}
