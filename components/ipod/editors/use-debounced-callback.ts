"use client";

import { useEffect, useMemo, useRef } from "react";

import { createDebouncer, type Debouncer } from "@/lib/debounce";

/**
 * React ergonomics over `createDebouncer`.
 *
 * Two subtleties this hook handles so callers don't have to:
 *
 *  1. STABLE IDENTITY, FRESH CLOSURE. The returned debouncer is created once (per
 *     `delayMs`) so it can be safely listed in effect deps and isn't torn down on
 *     every render. But `fn` usually closes over props/state that change each
 *     render (e.g. an `onChange` bound to the current row). We keep the latest `fn`
 *     in a ref and have the debouncer call THROUGH that ref — so a deferred commit
 *     always runs the newest handler, never a stale one captured when the timer
 *     was first armed.
 *
 *  2. CLEANUP ON UNMOUNT. If the component unmounts (or delay changes) with a call
 *     still pending, the timer is cancelled so it can't fire into a dead tree.
 *     Callers that need the pending value preserved should `flush()` first (e.g. an
 *     input flushing on blur before it disappears).
 *
 * @param fn      the side-effect to debounce (latest version always used)
 * @param delayMs trailing-edge quiet period before `fn` fires
 */
export function useDebouncedCallback<Args extends unknown[]>(
	fn: (...args: Args) => void,
	delayMs: number,
): Debouncer<Args> {
	const fnRef = useRef(fn);
	// Update synchronously on render so a flush() in the same tick sees the newest fn.
	fnRef.current = fn;

	const debouncer = useMemo(
		() => createDebouncer<Args>((...args) => fnRef.current(...args), delayMs),
		[delayMs],
	);

	useEffect(() => {
		return () => {
			debouncer.cancel();
		};
	}, [debouncer]);

	return debouncer;
}
