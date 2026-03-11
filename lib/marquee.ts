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
  return Math.max(
    metrics.contentWidth + metrics.gapWidth + metrics.containerWidth,
    metrics.containerWidth,
  );
}

export function getMarqueeCycleDurationMs(metrics: MarqueeMetrics): number {
  if (!hasMarqueeOverflow(metrics)) {
    return MARQUEE_DELAY_MS;
  }

  return (
    MARQUEE_DELAY_MS +
    (getMarqueeCycleDistance(metrics) / MARQUEE_SPEED_PX_PER_SECOND) * 1000
  );
}

export function getMarqueeFrame(
  metrics: MarqueeMetrics,
  elapsedMs: number,
): MarqueeFrame {
  if (!hasMarqueeOverflow(metrics)) {
    return {
      overflow: false,
      translateX: 0,
      cycleDistance: 0,
      cycleDurationMs: MARQUEE_DELAY_MS,
    };
  }

  const cycleDistance = getMarqueeCycleDistance(metrics);
  const cycleDurationMs = getMarqueeCycleDurationMs(metrics);

  if (elapsedMs <= MARQUEE_DELAY_MS) {
    return {
      overflow: true,
      translateX: 0,
      cycleDistance,
      cycleDurationMs,
    };
  }

  const travelPx =
    ((elapsedMs - MARQUEE_DELAY_MS) * MARQUEE_SPEED_PX_PER_SECOND) / 1000;
  const offset = Math.floor(travelPx % cycleDistance);

  return {
    overflow: true,
    translateX: -offset,
    cycleDistance,
    cycleDurationMs,
  };
}
