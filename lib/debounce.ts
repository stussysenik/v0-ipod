/**
 * A trailing-edge debouncer — the timing primitive behind responsive typing.
 *
 * WHY THIS EXISTS
 * Typing into a controlled input is a tug-of-war between two goals that pull in
 * opposite directions:
 *
 *   1. The on-screen value must update on EVERY keystroke, or typing feels laggy.
 *   2. The expensive side-effect of a change — here, dispatching into the iPod
 *      reducer, which re-renders the 3D scene AND writes three JSON blobs to
 *      localStorage on every model change — must NOT run on every keystroke, or a
 *      fast typist generates a storm of synchronous storage writes and re-renders.
 *
 * Debouncing resolves the tension: the cheap update (local state) stays instant,
 * while the expensive one is deferred until the user pauses for `delayMs`. Only
 * the LAST call in a burst actually fires ("trailing edge") — type "hello" quickly
 * and the reducer sees one commit of "hello", not five of "h","he","hel",…
 *
 * It is intentionally framework-free (no React) so the timing logic is unit-testable
 * in a plain Node environment with fake timers. The React ergonomics live in the
 * `useDebouncedCallback` hook, which is a thin wrapper over this.
 *
 * Edge controls the caller needs:
 *   • flush()  — fire the pending call NOW (e.g. on blur/Enter: commit immediately,
 *                don't make the user wait out the debounce window).
 *   • cancel() — drop the pending call (e.g. on Escape: the edit was abandoned).
 */
export interface Debouncer<Args extends unknown[]> {
	/** Schedule `fn` to run with these args once `delayMs` elapses with no newer call. */
	call: (...args: Args) => void;
	/** Run any pending call immediately and clear the timer. No-op if nothing is pending. */
	flush: () => void;
	/** Discard any pending call without running it. */
	cancel: () => void;
	/** True while a call is scheduled but not yet fired — useful for tests/assertions. */
	readonly pending: boolean;
}

export function createDebouncer<Args extends unknown[]>(
	fn: (...args: Args) => void,
	delayMs: number,
): Debouncer<Args> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	// The args of the most recent call are held so flush() can replay them.
	let lastArgs: Args | null = null;

	const clear = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	};

	return {
		call(...args: Args) {
			lastArgs = args;
			clear();
			timer = setTimeout(() => {
				timer = null;
				const argsToFire = lastArgs as Args;
				lastArgs = null;
				fn(...argsToFire);
			}, delayMs);
		},
		flush() {
			if (timer === null) return;
			clear();
			const argsToFire = lastArgs as Args;
			lastArgs = null;
			fn(...argsToFire);
		},
		cancel() {
			clear();
			lastArgs = null;
		},
		get pending() {
			return timer !== null;
		},
	};
}
