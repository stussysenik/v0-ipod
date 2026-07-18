import { getSurfaceToken } from "./color-manifest";

/**
 * Device-chrome surface colors for the 3D render, resolved from the color manifest (§0.3).
 *
 * These are the fixed hardware details that are NOT the user's finish — the machined port
 * recess, the hold-switch slider, the screen bezel, the LCD glass tint, and the brushed-metal
 * base grey. Before this module they were magic hex scattered through `three-d-ipod.tsx`;
 * centralizing them here gives the device-render color path a single auditable source (the
 * manifest, per `dcal_integration`), the same way user finishes flow through the manifest and
 * `resolveFinishMaterial`.
 *
 * Deliberately NOT tokenized: the true-`#000000` / true-`#ffffff` WYSIWYG sentinels in
 * `three-d-ipod.tsx` that MUST stay literal so a designer who sets the case to #000000/#FFFFFF
 * gets true black/white (no manifest indirection is allowed to drift those). The coverage guard
 * (`device-chrome.test.ts`) asserts each token below resolves from a real manifest entry.
 */
export const DEVICE_CHROME_TOKENS = {
	portRecess: "device.port.recess",
	portSlider: "device.port.slider",
	bezel: "device.bezel",
	lcdTint: "device.lcd.tint",
	brushedBase: "device.brushed.base",
} as const;

export type DeviceChromePart = keyof typeof DEVICE_CHROME_TOKENS;

/** Resolve a single device-chrome color through the manifest. */
export function deviceChromeColor(part: DeviceChromePart): string {
	return getSurfaceToken(DEVICE_CHROME_TOKENS[part]);
}

/** All device-chrome colors, resolved once from the (static) manifest. */
export const DEVICE_CHROME: Record<DeviceChromePart, string> = {
	portRecess: deviceChromeColor("portRecess"),
	portSlider: deviceChromeColor("portSlider"),
	bezel: deviceChromeColor("bezel"),
	lcdTint: deviceChromeColor("lcdTint"),
	brushedBase: deviceChromeColor("brushedBase"),
};
