export const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 1500, acceptable: 2500 },
  fcp: { good: 1000, acceptable: 1800 },
  cls: { good: 0, acceptable: 0.1 },
  inp: { good: 100, acceptable: 200 },
  ttfb: { good: 200, acceptable: 600 },
} as const;

export type WebVitalMetric = keyof typeof WEB_VITALS_THRESHOLDS;

/**
 * Assert a metric is within the acceptable threshold.
 * Returns a result object with pass/fail, actual value, and thresholds
 * for structured test assertions and debugging output.
 */
export function assertWithinBudget(
  metric: WebVitalMetric,
  value: number,
): { pass: boolean; actual: number; threshold: number; good: number } {
  const thresholds = WEB_VITALS_THRESHOLDS[metric];
  return {
    pass: value <= thresholds.acceptable,
    actual: value,
    threshold: thresholds.acceptable,
    good: thresholds.good,
  };
}

/**
 * Format a metric value for human-readable output.
 * CLS is unitless and shown to 4 decimal places;
 * all other metrics are in milliseconds.
 */
export function formatMetric(metric: WebVitalMetric, value: number): string {
  if (metric === "cls") return value.toFixed(4);
  return `${Math.round(value)}ms`;
}
