/**
 * Haptics — a thin, SSR-safe confirmation buzz with two backends.
 *
 *   • Android / desktop-with-a-motor → the Web Vibration API (`navigator.vibrate`),
 *     which takes per-event patterns so each kind can feel distinct.
 *   • iOS Safari → Apple blocks `navigator.vibrate` entirely. The only way a website
 *     can fire the Taptic engine is the iOS 17.4+ `<input type="checkbox" switch>`
 *     trick: toggling that native control emits a real haptic. It gives ONE fixed
 *     buzz (intensity can't vary) and only fires reliably from inside a user gesture
 *     — so we wire it to discrete taps (snap / focus / recall), never mid-gesture.
 *
 * Everything degrades to a silent no-op where neither path exists.
 */

export type HapticKind = "tick" | "select" | "snap" | "limit";

// Vibration-API patterns (ms). Kept short and semantic so they read as confirmation.
const VIBRATE: Record<HapticKind, number | number[]> = {
	tick: 8, // light detent — orbiting onto a canonical view
	select: 12, // a focus / mode / recall change
	snap: [9, 28, 13], // a deliberate snap-to-view "thunk"
	limit: 22, // hit a clamp (zoom / elevation extent)
};

const canVibrate = (): boolean =>
	typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

// iPhone/iPad detection (iPadOS reports as Macintosh with a touch screen).
function isIos(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent;
	return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// A single hidden <label><input switch></label>, created lazily on first use. Activating
// the label toggles the switch, which is what makes iOS emit the Taptic.
let iosLabel: HTMLLabelElement | null = null;
function ensureIosControl(): HTMLLabelElement | null {
	if (typeof document === "undefined") return null;
	if (iosLabel) return iosLabel;
	const label = document.createElement("label");
	label.setAttribute("aria-hidden", "true");
	Object.assign(label.style, {
		position: "fixed",
		top: "-9999px",
		left: "-9999px",
		width: "0",
		height: "0",
		opacity: "0",
		pointerEvents: "none",
	});
	const input = document.createElement("input");
	input.type = "checkbox";
	input.setAttribute("switch", ""); // iOS 17.4+ Taptic switch control
	input.tabIndex = -1;
	label.appendChild(input);
	document.body.appendChild(label);
	iosLabel = label;
	return label;
}

/** Fire a confirmation haptic. Safe to call anywhere; a no-op where unsupported. */
export function haptic(kind: HapticKind = "tick"): void {
	if (canVibrate()) {
		try {
			navigator.vibrate(VIBRATE[kind]);
			return;
		} catch {
			// fall through to the iOS path
		}
	}
	if (isIos()) {
		ensureIosControl()?.click(); // toggling the switch emits the Taptic
	}
}
