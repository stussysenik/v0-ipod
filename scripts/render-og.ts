#!/usr/bin/env bun
/**
 * Renders the launch poster to `public/og.png` — the 1200x630 unfurl card (8.1).
 *
 * The frame is produced by the app's own `captureHighRes`, the same offscreen path
 * an export takes, reached through the dev-only `__ipodCaptureOg` seam in
 * `ipod-3d-stage.tsx`. That matters: a page screenshot would carry the camera bar
 * and header into the card, and would sample the live canvas (transparent, at DPR)
 * rather than the export renderer (opaque, with the stage colour baked in).
 *
 * The device is whatever `/3d` cold-loads — the Noir shell on the #0048FF stage.
 * The poster is therefore not a separate composition that can drift from the app;
 * it is the app's own first paint, captured.
 *
 * Usage: `pnpm dev:raw` (port 4001), then `pnpm og:render`.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const ORIGIN = process.env.OG_ORIGIN ?? "http://localhost:4001";
const OUT = resolve(import.meta.dir, "..", "public", "og.png");
const WIDTH = 1200;
const HEIGHT = 630;

type CaptureHost = {
	__ipodCaptureOg?: (
		width: number,
		height: number,
		framing: "front" | "hero",
	) => Promise<string | null>;
};

// `hero`'s 3/4 shot fills a landscape frame by cropping the device top and bottom.
// The card is the first thing the audience sees, and a clipped device would read as
// an accident — `front` fits the whole device to the aspect, which is the same claim
// the app makes everywhere else (D8: the device is framed).
const FRAMING = "front" as const;

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	// A landscape viewport keeps the WebGL context's aspect close to the poster's, so
	// the capture's reach fit lands where the composition was designed.
	await page.setViewportSize({ width: WIDTH, height: HEIGHT });
	await page.goto(`${ORIGIN}/3d`, { waitUntil: "networkidle" });

	// The canvas mounts via next/dynamic and the seam is installed in an effect, so
	// wait for the seam itself rather than a paint heuristic.
	await page.waitForFunction(
		() => typeof (window as unknown as CaptureHost).__ipodCaptureOg === "function",
		undefined,
		{ timeout: 30_000 },
	);
	// Let the rig settle on its opening pose before asking it to hold still.
	await page.waitForTimeout(2_000);

	const dataUrl = await page.evaluate(
		async ({ width, height, framing }) => {
			const capture = (window as unknown as CaptureHost).__ipodCaptureOg;
			if (!capture) throw new Error("__ipodCaptureOg missing");
			return await capture(width, height, framing);
		},
		{ width: WIDTH, height: HEIGHT, framing: FRAMING },
	);

	if (!dataUrl) throw new Error("capture returned no image");

	const base64 = dataUrl.split(",")[1];
	if (!base64) throw new Error("capture returned a malformed data URL");

	const bytes = Buffer.from(base64, "base64");
	writeFileSync(OUT, bytes);
	console.log(`[og] wrote ${OUT} — ${WIDTH}x${HEIGHT}, ${(bytes.length / 1024).toFixed(1)} KB`);
} finally {
	await browser.close();
}
