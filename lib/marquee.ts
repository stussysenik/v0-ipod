export const MARQUEE_SPEED_PX_PER_SECOND = 12;
export const MARQUEE_MIN_GAP_PX = 40;
export const MARQUEE_GAP_CHAR_WIDTH = 4.5;
export const MARQUEE_START_DELAY_MS = 1200;
export const MARQUEE_EDGE_PAUSE_MS = 900;

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

export function getMarqueeGapWidth(contentWidth: number, textLength: number): number {
	const averageCharWidth = contentWidth / Math.max(textLength, 1);
	return Math.max(MARQUEE_MIN_GAP_PX, Math.round(averageCharWidth * MARQUEE_GAP_CHAR_WIDTH));
}

export function getMarqueeScrollDistance(metrics: MarqueeMetrics): number {
	return Math.max(0, metrics.contentWidth - metrics.containerWidth);
}

export function getMarqueeCycleDurationMs(metrics: MarqueeMetrics): number {
	const scrollDistance = getMarqueeScrollDistance(metrics);
	if (scrollDistance <= 0) return 0;

	const scrollTime = (scrollDistance / MARQUEE_SPEED_PX_PER_SECOND) * 1000;
	return MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_EDGE_PAUSE_MS + scrollTime;
}

export function getMarqueeFrame(metrics: MarqueeMetrics, elapsedMs: number): MarqueeFrame {
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
	const cycleDurationMs =
		MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_EDGE_PAUSE_MS + scrollTime;
	const phase = ((elapsedMs % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;

	let translateX = 0;

	if (phase <= MARQUEE_START_DELAY_MS) {
		translateX = 0;
	} else if (phase <= MARQUEE_START_DELAY_MS + scrollTime) {
		const progress = (phase - MARQUEE_START_DELAY_MS) / scrollTime;
		translateX = -scrollDistance * progress;
	} else if (
		phase <=
		MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_EDGE_PAUSE_MS
	) {
		translateX = -scrollDistance;
	} else {
		const returnElapsedMs =
			phase - (MARQUEE_START_DELAY_MS + scrollTime + MARQUEE_EDGE_PAUSE_MS);
		const progress = returnElapsedMs / scrollTime;
		translateX = -scrollDistance * (1 - progress);
	}

	return {
		overflow,
		translateX,
		cycleDistance: scrollDistance,
		cycleDurationMs,
	};
}
