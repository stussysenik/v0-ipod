export const MARQUEE_SPEED_PX_PER_SECOND = 28;
export const MARQUEE_LOOP_GAP_PX = 80;
export const MARQUEE_START_DELAY_MS = 2200;
export const MARQUEE_STAGGER_MS = 600;

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

/**
 * Custom easing function that is linear in the middle but has soft entry/exit.
 * This provides an "organic" feel without making the text too fast to read.
 */
function organicLinear(t: number): number {
	// Simple ease-in-out quint for the first/last 15% of the movement
	const shoulder = 0.15;
	if (t < shoulder) {
		return (1 / shoulder) * (t * t * (3 - 2 * (t / shoulder))) * shoulder * 0.5;
	}
	if (t > 1 - shoulder) {
		const t2 = (t - (1 - shoulder)) / shoulder;
		return (1 - shoulder) + (t2 * t2 * (3 - 2 * t2)) * shoulder;
	}
	// This is slightly complex, let's just use a high-quality ease-in-out-sine
	// for simplicity and better "breathing" feel.
	return 0.5 - Math.cos(t * Math.PI) / 2;
}

export function hasMarqueeOverflow(metrics: MarqueeMetrics): boolean {
	return metrics.contentWidth > metrics.containerWidth + 1;
}

export function getMarqueeGapWidth(contentWidth: number, textLength: number): number {
	return MARQUEE_LOOP_GAP_PX;
}

export function getMarqueeScrollDistance(metrics: MarqueeMetrics): number {
	// In a side-by-side loop, we scroll exactly one full "content + gap" cycle
	return metrics.contentWidth + MARQUEE_LOOP_GAP_PX;
}

export function getMarqueeCycleDurationMs(metrics: MarqueeMetrics): number {
	const scrollDistance = getMarqueeScrollDistance(metrics);
	if (scrollDistance <= 0) return 0;

	const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
	// Loop cycle: Pause -> Organic Scroll -> (Seamless Transition)
	return MARQUEE_START_DELAY_MS + scrollTime;
}

export function getMarqueeFrame(
	metrics: MarqueeMetrics,
	elapsedMs: number,
	staggerIndex = 0,
): MarqueeFrame {
	const overflow = hasMarqueeOverflow(metrics);
	const scrollDistance = getMarqueeScrollDistance(metrics);

	if (!overflow || scrollDistance <= 0) {
		return {
			overflow,
			translateX: 0,
			cycleDistance: 0,
			cycleDurationMs: 0,
		};
	}

	const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
	const cycleDurationMs = MARQUEE_START_DELAY_MS + scrollTime;

	// Apply field-level stagger
	const adjustedElapsed = Math.max(0, elapsedMs - staggerIndex * MARQUEE_STAGGER_MS);
	const phase = ((adjustedElapsed % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;

	let translateX = 0;

	if (phase <= MARQUEE_START_DELAY_MS) {
		// Registration phase: Text is anchored at the start
		translateX = 0;
	} else {
		// Content-first scroll phase: Seamlessly move to the next instance
		const t = (phase - MARQUEE_START_DELAY_MS) / scrollTime;
		const easedT = organicLinear(t);
		translateX = -scrollDistance * easedT;
	}

	return {
		overflow,
		translateX,
		cycleDistance: scrollDistance,
		cycleDurationMs,
	};
}
