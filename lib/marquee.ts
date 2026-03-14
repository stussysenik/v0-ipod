export const MARQUEE_DELAY_MS = 2000;
export const MARQUEE_SPEED_PX_PER_SECOND = 24;
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
  return Math.max(
    MARQUEE_MIN_GAP_PX,
    Math.round(averageCharWidth * MARQUEE_GAP_CHAR_WIDTH),
  );
}

export function getMarqueeCycleDistance(metrics: MarqueeMetrics): number {
  // Single-pass: container width (start position) + content width (exit distance)
  return Math.max(
    metrics.containerWidth + metrics.contentWidth,
    metrics.containerWidth,
  );
}

export function getMarqueeCycleDurationMs(metrics: MarqueeMetrics): number {
  return (
    MARQUEE_DELAY_MS +
    (getMarqueeCycleDistance(metrics) / MARQUEE_SPEED_PX_PER_SECOND) * 1000
  );
}

export function getMarqueeFrame(
  metrics: MarqueeMetrics,
  elapsedMs: number,
): MarqueeFrame {
  const overflow = hasMarqueeOverflow(metrics);
  const cycleDistance = getMarqueeCycleDistance(metrics);
  const cycleDurationMs = getMarqueeCycleDurationMs(metrics);

  // Initial delay - start off-screen right
  if (elapsedMs <= MARQUEE_DELAY_MS) {
    return {
      overflow,
      translateX: metrics.containerWidth,
      cycleDistance,
      cycleDurationMs,
    };
  }

  // Calculate offset and translate from right to left
  const travelPx =
    ((elapsedMs - MARQUEE_DELAY_MS) * MARQUEE_SPEED_PX_PER_SECOND) / 1000;
  const offsetInCycle = Math.floor(travelPx % cycleDistance);
  const translateX = metrics.containerWidth - offsetInCycle;

  return {
    overflow,
    translateX,
    cycleDistance,
    cycleDurationMs,
  };
}
