export const MARQUEE_SPEED_PX_PER_SECOND = 35; // Authentic iPod Classic speed
export const MARQUEE_LOOP_GAP_PX = 80;
export const MARQUEE_START_DELAY_MS = 2500; // 2.5s initial pause
export const MARQUEE_END_PAUSE_MS = 1500; // 1.5s pause at the end before reset
export const MARQUEE_STAGGER_MS = 600;

export type MarqueeMode = "loop" | "reset";

export interface MarqueeMetrics {
	containerWidth: number;
	contentWidth: number;
	gapWidth: number;
}

export interface MarqueeFrame {
	overflow: boolean;
	translateX: number;
	cycleDistance: number;
	cycleDurationMs: number;
}

export function hasMarqueeOverflow(metrics: MarqueeMetrics): boolean {
	return metrics.contentWidth > metrics.containerWidth + 1;
}

export function getMarqueeGapWidth(_contentWidth: number, _textLength: number): number {
	return MARQUEE_LOOP_GAP_PX;
}

export function getMarqueeScrollDistance(metrics: MarqueeMetrics, mode: MarqueeMode = "loop"): number {
	if (mode === "reset") {
		// In reset mode, we only scroll until the end of the text is visible
		return Math.max(0, metrics.contentWidth - metrics.containerWidth);
	}
	// In a side-by-side loop, we scroll exactly one full "content + gap" cycle
	return metrics.contentWidth + MARQUEE_LOOP_GAP_PX;
}

export function getMarqueeCycleDurationMs(metrics: MarqueeMetrics, mode: MarqueeMode = "loop"): number {
	const scrollDistance = getMarqueeScrollDistance(metrics, mode);
	if (scrollDistance <= 0) return 0;

	const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
	
	if (mode === "reset") {
		// Reset cycle: Pause -> Scroll -> Pause -> Snap
		return MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_END_PAUSE_MS;
	}
	
	// Loop cycle: Pause -> Scroll -> (Seamless Transition)
	return MARQUEE_START_DELAY_MS + scrollTime;
}

export function getMarqueeFrame(
	metrics: MarqueeMetrics,
	elapsedMs: number,
	staggerIndex = 0,
	mode: MarqueeMode = "loop",
): MarqueeFrame {
	const overflow = hasMarqueeOverflow(metrics);
	const scrollDistance = getMarqueeScrollDistance(metrics, mode);

	if (!overflow || scrollDistance <= 0) {
		return {
			overflow,
			translateX: 0,
			cycleDistance: 0,
			cycleDurationMs: 0,
		};
	}

	const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
	const cycleDurationMs = getMarqueeCycleDurationMs(metrics, mode);

	// Apply field-level stagger
	const adjustedElapsed = Math.max(0, elapsedMs - staggerIndex * MARQUEE_STAGGER_MS);
	const phase = ((adjustedElapsed % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;

	let translateX = 0;

	if (phase <= MARQUEE_START_DELAY_MS) {
		// Initial Pause
		translateX = 0;
	} else if (mode === "reset" && phase > MARQUEE_START_DELAY_MS + scrollTime) {
		// Terminal Pause for reset mode
		translateX = -scrollDistance;
	} else {
		// Scroll phase
		const t = (phase - MARQUEE_START_DELAY_MS) / scrollTime;
		// Use linear for authentic feel
		translateX = -scrollDistance * t;
	}

	return {
		overflow,
		translateX,
		cycleDistance: scrollDistance,
		cycleDurationMs,
	};
}
