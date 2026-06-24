/**
 * Self-discharging battery as a pure function of wall-clock time.
 *
 * The device is modelled as "always on": the charge level is derived from the
 * elapsed time since a persisted birth moment, never reconstructed from a stored
 * level. Two consequences fall out of that:
 *
 *  1. Gaps are free. While the tab is closed or hidden, real time still passes;
 *     because the level is evaluated against `now` on the next read, the cycle
 *     resumes exactly where wall-clock says it should — no catch-up arithmetic.
 *  2. No load flicker. There is no stored battery number to load-then-correct, so
 *     the classic "shows 100% then jumps to 61%" never happens. The function *is*
 *     the state; you evaluate it once on mount and it is already right.
 *
 * The cycle is an asymmetric sawtooth: a slow drain from full to the floor, then a
 * faster recharge back to full, repeating forever — a real iPod that someone keeps
 * topping up.
 */

/** Lowest the cell ever reads — matches the historical solar-drain floor. */
export const BATTERY_FLOOR = 0.08;

/** Slow discharge: full -> floor. */
const DRAIN_MS = 25 * 60 * 1000;
/** Faster recharge: floor -> full. */
const CHARGE_MS = 5 * 60 * 1000;

/** One full discharge + recharge. */
export const BATTERY_CYCLE_MS = DRAIN_MS + CHARGE_MS;

/**
 * Charge level (0.08–1.0) for a given elapsed time since the battery's birth.
 * Pure and total: any finite input maps to a valid level, negatives included.
 */
export function batteryLevelForElapsed(elapsedMs: number): number {
	const period = BATTERY_CYCLE_MS;
	// Positive modulo so a clock skew into the past can't produce a negative phase.
	const phase = ((elapsedMs % period) + period) % period;

	if (phase < DRAIN_MS) {
		const p = phase / DRAIN_MS; // 0 -> 1
		return 1 - (1 - BATTERY_FLOOR) * p; // 1.0 -> floor
	}
	const p = (phase - DRAIN_MS) / CHARGE_MS; // 0 -> 1
	return BATTERY_FLOOR + (1 - BATTERY_FLOOR) * p; // floor -> 1.0
}
