export const MARQUEE_DELAY_MS = 2500;
export const MARQUEE_SPEED_PX_PER_SECOND = 28;
export const MARQUEE_MIN_GAP_PX = 40;
export const MARQUEE_GAP_CHAR_WIDTH = 4.5;

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
  // Cycle: Delay(Start) -> Scroll Left -> Delay(End) -> Scroll Right
  return 2 * MARQUEE_DELAY_MS + 2 * scrollTime;
}

export function getMarqueeFrame(
  metrics: MarqueeMetrics,
  elapsedMs: number,
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
  const cycleDurationMs = 2 * MARQUEE_DELAY_MS + 2 * scrollTime;
  const timeInCycle = elapsedMs % cycleDurationMs;

  let translateX = 0;

  if (timeInCycle <= MARQUEE_DELAY_MS) {
    // Phase 1: Hold at start
    translateX = 0;
  } else if (timeInCycle <= MARQUEE_DELAY_MS + scrollTime) {
    // Phase 2: Scroll Left
    const progress = (timeInCycle - MARQUEE_DELAY_MS) / scrollTime;
    translateX = -scrollDistance * progress;
  } else if (timeInCycle <= 2 * MARQUEE_DELAY_MS + scrollTime) {
    // Phase 3: Hold at end
    translateX = -scrollDistance;
  } else {
    // Phase 4: Scroll Right
    const progress = (timeInCycle - (2 * MARQUEE_DELAY_MS + scrollTime)) / scrollTime;
    translateX = -scrollDistance * (1 - progress);
  }

  return {
    overflow,
    translateX,
    cycleDistance: scrollDistance,
    cycleDurationMs,
  };
}
