import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDebouncer } from "./debounce";

describe("createDebouncer", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("fires once, with the latest args, on the trailing edge of a burst", () => {
		const fn = vi.fn();
		const d = createDebouncer(fn, 200);

		// Simulate a fast typist: five keystrokes inside the window.
		d.call("h");
		d.call("he");
		d.call("hel");
		d.call("hell");
		d.call("hello");

		// Nothing fires mid-burst — that's the whole point.
		expect(fn).not.toHaveBeenCalled();
		expect(d.pending).toBe(true);

		vi.advanceTimersByTime(200);

		// Exactly one commit, carrying only the final value.
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("hello");
		expect(d.pending).toBe(false);
	});

	it("restarts the timer on each call (true debounce, not throttle)", () => {
		const fn = vi.fn();
		const d = createDebouncer(fn, 100);

		d.call("a");
		vi.advanceTimersByTime(90); // almost there…
		d.call("b"); // …but a new keystroke resets the clock
		vi.advanceTimersByTime(90); // 180ms total elapsed, but only 90 since last call
		expect(fn).not.toHaveBeenCalled();

		vi.advanceTimersByTime(10); // now 100ms since "b"
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("b");
	});

	it("flush() commits the pending value immediately (blur/Enter)", () => {
		const fn = vi.fn();
		const d = createDebouncer(fn, 500);

		d.call("draft");
		d.flush();

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("draft");
		expect(d.pending).toBe(false);

		// The timer was cleared, so no second fire when the window would have elapsed.
		vi.advanceTimersByTime(500);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("flush() is a no-op when nothing is pending", () => {
		const fn = vi.fn();
		const d = createDebouncer(fn, 300);
		d.flush();
		expect(fn).not.toHaveBeenCalled();
	});

	it("cancel() discards the pending value (Escape)", () => {
		const fn = vi.fn();
		const d = createDebouncer(fn, 300);

		d.call("abandoned");
		d.cancel();
		expect(d.pending).toBe(false);

		vi.advanceTimersByTime(300);
		expect(fn).not.toHaveBeenCalled();
	});

	it("can be reused after firing", () => {
		const fn = vi.fn();
		const d = createDebouncer(fn, 100);

		d.call("first");
		vi.advanceTimersByTime(100);
		d.call("second");
		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledTimes(2);
		expect(fn).toHaveBeenNthCalledWith(1, "first");
		expect(fn).toHaveBeenNthCalledWith(2, "second");
	});
});
