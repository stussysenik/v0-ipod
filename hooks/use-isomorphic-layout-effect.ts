"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * Persisted state lives in `localStorage`, which only exists on the client. We hydrate it
 * by dispatching a whole-model RESTORE on mount — but a *post-paint* `useEffect` leaves a
 * window where the device is painted with defaults AND interactive: a tap on a swatch or a
 * slider drag in that window is overwritten when RESTORE finally lands (the "UI state vs.
 * user input desync"). That window widens on slow CPUs / low networks, where the effect
 * flush is delayed behind bundle parse.
 *
 * Running the restore in a *layout* effect closes the window: it commits before the browser
 * paints, so the first interactive frame already carries persisted state — nothing to flash,
 * nothing to clobber. We fall back to `useEffect` during SSR only to silence React's
 * "useLayoutEffect does nothing on the server" warning; neither effect runs on the server.
 */
export const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;
