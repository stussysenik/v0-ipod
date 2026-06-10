import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Export continuity guard — proves the screen keeps LOOPING for the full clip.
 *
 * The bug this locks down: on a long export the marquee / song clock / progress bar
 * could freeze partway (e.g. "music stops at 0:20" on a 60s clip) because they read
 * a clock that wasn't the deterministic render timeline. The fix (lib/export-clock.ts
 * + the capture clock) drives every looping element off `i / total` sampled at bake
 * time, so the screen advances end-to-end.
 *
 * How we prove it without eyeballing a video:
 *   - Export in HOLD style → the camera is pinned to the hero pose, so the ONLY thing
 *     that can change between frames is the on-device screen (marquee scroll + the
 *     ticking time + progress fill). A static camera turns "did the screen update?"
 *     into a clean whole-frame difference signal.
 *   - Seed a long (overflowing) title and a SHORT song so the marquee scrolls and the
 *     song must loop several times within the clip.
 *   - Extract every frame, take the consecutive whole-frame difference, and assert the
 *     screen is still changing in the LAST third of the clip. A frozen export would go
 *     flat after the early frames — exactly the regression we're guarding.
 */

const METADATA_STORAGE_KEY = "ipodSnapshotMetadata";
const OUT_DIR = path.join(os.tmpdir(), "ipod-3d-export-continuity");
const CLIP_SECONDS = 12;

/** Per-frame whole-image average difference vs. the previous frame (0..255). */
function consecutiveDiffs(mp4: string): number[] {
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(mp4)} -vf "tblend=all_mode=difference,signalstats,metadata=print" -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	return [...out.matchAll(/YAVG=([0-9.]+)/g)].map((m) => Number(m[1]));
}

/**
 * Luma spread (YMAX − YMIN, 0..255) of the central screen region of one frame.
 * A live Now Playing screen mixes dark text/artwork with the pale LCD, so the
 * spread is large; a blank bake leaves a near-uniform pale rectangle and the
 * spread collapses. Crop: middle of the frame, where the LCD sits in the hero
 * hold framing.
 */
function screenRegionLumaSpread(framePng: string): number {
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(framePng)} -vf "crop=iw/4:ih/5:(iw-iw/4)/2:ih*0.32,signalstats,metadata=print" -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	const min = Number(out.match(/YMIN=([0-9.]+)/)?.[1] ?? 0);
	const max = Number(out.match(/YMAX=([0-9.]+)/)?.[1] ?? 0);
	return max - min;
}

test("export screen keeps animating for the full clip (no mid-export freeze)", async ({ page }) => {
	fs.rmSync(OUT_DIR, { force: true, recursive: true });
	fs.mkdirSync(OUT_DIR, { recursive: true });

	// A long title overflows the LCD (marquee scrolls); a short song forces several
	// loop wraps inside a 12s clip. currentTime 0 so it starts at the top.
	await page.addInitScript(
		({ metadataStorageKey }) => {
			localStorage.setItem(
				metadataStorageKey,
				JSON.stringify({
					title: "Sufjan Stevens - Chicago (Demo Version From The Avalanche Outtakes)",
					artist: "Sufjan Stevens",
					album: "Illinois",
					artwork: "/default-artwork.png",
					duration: 6,
					currentTime: 0,
					rating: 4,
					trackNumber: 2,
					totalTracks: 12,
				}),
			);
		},
		{ metadataStorageKey: METADATA_STORAGE_KEY },
	);

	// Spec (3d-export-reliability): a persistent blank bake is allowed to hold the
	// last good texture, but a healthy export should repair every blank via the
	// warm retry — the hold-last-good warning firing here would mean the guard's
	// retry budget no longer suffices.
	const blankHoldWarnings: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "warning" && message.text().includes("screen bake blank after retries")) {
			blankHoldWarnings.push(message.text());
		}
	});

	await page.goto("/3d", { waitUntil: "domcontentloaded" });
	await page.locator("canvas").first().waitFor({ state: "visible", timeout: 60_000 });
	await page.waitForTimeout(2500); // let the rig settle to rest

	// Hold style → static camera, so frame-to-frame change is purely the screen.
	await page.getByRole("button", { name: "Hold", exact: true }).click();

	// Stretch the clip well past the old early-freeze point.
	const slider = page.getByTestId("clip-length-slider");
	await slider.fill(String(CLIP_SECONDS));
	await expect(page.locator("text=/^" + CLIP_SECONDS + "s$/")).toBeVisible();

	const clipButton = page.getByRole("button", { name: /Export clip/i });
	await expect(clipButton).toBeEnabled();
	const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
	await clipButton.click();
	const download = await downloadPromise;
	const mp4Path = path.join(OUT_DIR, "hold.mp4");
	await download.saveAs(mp4Path);
	await expect(clipButton).toBeEnabled({ timeout: 120_000 });
	await page.close();

	// Sanity: ffmpeg gave us a frame stream.
	execFileSync("ffmpeg", ["-y", "-i", mp4Path, "-vsync", "0", path.join(OUT_DIR, "f-%04d.png")], {
		stdio: "ignore",
	});

	const diffs = consecutiveDiffs(mp4Path);
	expect(diffs.length).toBeGreaterThan(CLIP_SECONDS * 20); // ≥ ~20fps worth of frames

	// A bake-driven screen update spikes the whole-frame diff; between bakes it's ~0.
	// "Still animating" = at least one real spike in each third, and several overall.
	const SPIKE = 0.1; // YAVG units — comfortably above encoder noise (~0.0x)
	const third = Math.floor(diffs.length / 3);
	const firstThird = diffs.slice(0, third);
	const lastThird = diffs.slice(third * 2);

	const spikes = (arr: number[]) => arr.filter((d) => d > SPIKE).length;

	console.log(
		`[continuity] frames=${diffs.length} spikes: first=${spikes(firstThird)} last=${spikes(lastThird)} total=${spikes(diffs)}`,
	);

	// The screen updates across the WHOLE clip, not just the opening — the last third
	// must still show screen motion (this is the assertion that fails on the freeze bug).
	expect(spikes(lastThird)).toBeGreaterThan(0);
	expect(spikes(diffs)).toBeGreaterThanOrEqual(3);

	// Blank-screen guard (spec: exported clips SHALL never contain a blank Now
	// Playing screen). Sample frames across the clip; the screen region of every
	// one must keep real contrast — a blank bake collapses the luma spread.
	const frames = fs
		.readdirSync(OUT_DIR)
		.filter((f) => f.startsWith("f-") && f.endsWith(".png"))
		.sort();
	expect(frames.length).toBeGreaterThan(0);
	const SAMPLES = 12;
	const BLANK_SPREAD_FLOOR = 40; // blank pale LCD ≈ single-digit spread; live screen ≫ 100
	const sampled = Array.from({ length: SAMPLES }, (_, i) =>
		frames[Math.min(frames.length - 1, Math.floor((i / (SAMPLES - 1)) * (frames.length - 1)))],
	);
	const spreads = sampled.map((frame) => screenRegionLumaSpread(path.join(OUT_DIR, frame)));
	console.log(`[continuity] screen-region luma spreads: ${spreads.map((s) => s.toFixed(0)).join(", ")}`);
	for (const spread of spreads) {
		expect(spread).toBeGreaterThan(BLANK_SPREAD_FLOOR);
	}

	// And the guard never had to fall back to holding a stale texture.
	expect(blankHoldWarnings).toHaveLength(0);
});

test("two consecutive exports in one session both download", async ({ page }) => {
	// Spec/task 2.6 — Chrome's multiple-automatic-downloads policy can silently
	// swallow the second scripted download of a session; this pins that both
	// exports hand Playwright a download artifact.
	await page.goto("/3d", { waitUntil: "domcontentloaded" });
	await page.locator("canvas").first().waitFor({ state: "visible", timeout: 60_000 });
	await page.waitForTimeout(2500);

	await page.getByRole("button", { name: "Hold", exact: true }).click();
	const slider = page.getByTestId("clip-length-slider");
	await slider.fill("3");

	const clipButton = page.getByRole("button", { name: /Export clip/i });
	for (const round of [1, 2] as const) {
		await expect(clipButton).toBeEnabled({ timeout: 120_000 });
		const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
		await clipButton.click();
		const download = await downloadPromise;
		expect(download.suggestedFilename(), `round ${round} download`).toMatch(/\.mp4$/);
		// The machine must return to idle (button re-enabled) after every export.
		await expect(clipButton).toBeEnabled({ timeout: 120_000 });
	}
});
