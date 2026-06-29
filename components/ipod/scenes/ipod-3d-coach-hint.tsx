"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "ipod-3d-gesture-coached";

/**
 * First-run coach for the /3d camera model on touch devices. The native gesture —
 * two fingers to orbit/zoom the camera, one finger to use the iPod — is invisible,
 * so we surface it once. Dismisses on the first two-finger gesture (you've learned
 * it), or after a few seconds; never shown again (localStorage).
 */
export function Ipod3DCoachHint() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		if (!window.matchMedia("(pointer: coarse)").matches) return;
		try {
			if (localStorage.getItem(SEEN_KEY)) return;
		} catch {
			// ignore storage failures — worst case the hint shows again
		}
		setShow(true);
	}, []);

	useEffect(() => {
		if (!show) return;
		const dismiss = () => {
			setShow(false);
			try {
				localStorage.setItem(SEEN_KEY, "1");
			} catch {
				// ignore
			}
		};
		const onTouch = (e: TouchEvent) => {
			if (e.touches.length >= 2) dismiss();
		};
		window.addEventListener("touchstart", onTouch, { passive: true });
		const t = window.setTimeout(dismiss, 6000);
		return () => {
			window.removeEventListener("touchstart", onTouch);
			window.clearTimeout(t);
		};
	}, [show]);

	if (!show) return null;

	return (
		<div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4 lg:hidden">
			<div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-[13px] font-medium text-white/90 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-500">
				<span aria-hidden className="text-base leading-none">✌︎</span>
				Two fingers to move the camera · tap a view to snap
			</div>
		</div>
	);
}
