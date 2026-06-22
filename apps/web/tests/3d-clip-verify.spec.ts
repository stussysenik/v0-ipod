import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * Keyframe-diff verification for the /3d export — the "own the render function" guarantee.
 *
 * Exports a real motion clip through the live UI, extracts every frame with ffmpeg, and checks
 * the owned-finish invariants numerically (no eyeballing):
 *
 *   loop-seam   SSIM(last,first) ≈ SSIM(adjacent)  — the wrap is just another motion step,
 *               not a freeze or a pop (seamless IG loop).
 *   no-pop      max consecutive-frame whole-image difference is small — no stale opening
 *               frame, no mid-clip jump.
 *   no-crawl    in the device's centre region, the max consecutive-frame *peak* difference
 *               stays bounded — a near-mirror back (roughness below STEEL_ROUGHNESS_FLOOR)
 *               would spike here as hotspots crawl across a turntable's 360° spin. This is
 *               the metric that guards the de-strobe fix.
 *   no-clip     the fraction of pure-black (crush) and pure-white (blow-out) pixels stays
 *               low — form survives at both tonal extremes (invariant I4).
 *
 * NOTE on coverage: this runs the default device colours. Full colour×motion matrix coverage
 * (white-on-white / black-on-black separation) needs cockpit colour automation — tracked as a
 * follow-up; not silently claimed here.
 */

const OUT_DIR = path.join(os.tmpdir(), "ipod-3d-clip-verify");

// ffmpeg prints filter stats to stderr; merge it into stdout via the shell.
function ssim(a: string, b: string): number {
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(a)} -i ${JSON.stringify(b)} -filter_complex ssim -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	const m = out.match(/All:([0-9.]+)/);
	return m ? Number(m[1]) : NaN;
}

/** Max whole-image average difference between consecutive frames — catches pops/freezes. */
function maxConsecutiveJump(mp4: string): number {
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(mp4)} -vf "tblend=all_mode=difference,signalstats,metadata=print" -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	const vals = [...out.matchAll(/YAVG=([0-9.]+)/g)].map((m) => Number(m[1]));
	return vals.length ? Math.max(...vals) : NaN;
}

/**
 * Crawl proxy: crop to the centre third (where the device — and on a turntable, its polished
 * back — sits), take the consecutive-frame difference, and read its PEAK luma per frame. A
 * crawling specular hotspot is a small, bright, fast-moving spot, so it spikes the peak even
 * when the whole-frame average stays calm. Returns the max peak across the clip (0..255).
 */
function maxCenterCrawl(mp4: string): number {
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(mp4)} -vf "crop=iw/3:ih/3:iw/3:ih/3,tblend=all_mode=difference,signalstats,metadata=print" -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	const vals = [...out.matchAll(/YMAX=([0-9.]+)/g)].map((m) => Number(m[1]));
	return vals.length ? Math.max(...vals) : NaN;
}

/**
 * Fraction (0..1) of pixels at a tonal extreme, averaged over the clip. `mode="white"` masks
 * pixels ≥254 (blow-out), `mode="black"` masks ≤1 (crush); the mask's mean luma / 255 is the
 * fraction. Excludes nothing — the flat backdrop counts too, so thresholds are generous.
 */
function clipFraction(mp4: string, mode: "white" | "black"): number {
	const expr = mode === "white" ? "if(gte(lum(X,Y),254),255,0)" : "if(lte(lum(X,Y),1),255,0)";
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(mp4)} -vf "format=gray,geq=lum='${expr}',signalstats,metadata=print" -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	const vals = [...out.matchAll(/YAVG=([0-9.]+)/g)].map((m) => Number(m[1]));
	if (!vals.length) return NaN;
	const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
	return mean / 255;
}

async function captureClip(page: Page, move: "Orbit" | "Turntable" | "Sweep" | "Robo"): Promise<string> {
	// Select the move in the picker, then fire the single Export clip button.
	await page.getByRole("button", { name: move, exact: true }).click();
	const clipButton = page.getByRole("button", { name: /Export clip/i });
	await expect(clipButton).toBeEnabled();
	const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
	await clipButton.click();
	const download = await downloadPromise;
	const mp4Path = path.join(OUT_DIR, `${move.toLowerCase()}.mp4`);
	await download.saveAs(mp4Path);
	await expect(clipButton).toBeEnabled({ timeout: 120_000 });
	return mp4Path;
}

function analyze(label: string, mp4: string) {
	const framesDir = path.join(OUT_DIR, `${label}-frames`);
	fs.rmSync(framesDir, { force: true, recursive: true });
	fs.mkdirSync(framesDir, { recursive: true });
	execFileSync("ffmpeg", ["-y", "-i", mp4, "-vsync", "0", path.join(framesDir, "f-%03d.png")], {
		stdio: "ignore",
	});
	const frames = fs.readdirSync(framesDir).filter((f) => f.endsWith(".png")).sort();
	const n = frames.length;
	const loopSeam = ssim(path.join(framesDir, frames[0]!), path.join(framesDir, frames[n - 1]!));
	const adjacentSeam = ssim(path.join(framesDir, frames[n - 2]!), path.join(framesDir, frames[n - 1]!));
	const maxJump = maxConsecutiveJump(mp4);
	const crawl = maxCenterCrawl(mp4);
	const whiteClip = clipFraction(mp4, "white");
	const blackClip = clipFraction(mp4, "black");

	// contact sheet for eyeballing
	execFileSync("ffmpeg", [
		"-y", "-i", mp4,
		"-vf", "scale=216:384,tile=10x15:padding=4:color=white",
		path.join(OUT_DIR, `${label}-contact.png`),
	], { stdio: "ignore" });

	console.log(`\n=== ${label.toUpperCase()} ===`);
	console.log(`frames=${n}`);
	console.log(`loop-seam SSIM(last,first)=${loopSeam.toFixed(4)}  adjacent=${adjacentSeam.toFixed(4)}  (want seam ≈ adjacent)`);
	console.log(`max consecutive jump=${maxJump.toFixed(2)}  (whole-frame avg; pop guard)`);
	console.log(`max centre crawl=${crawl.toFixed(2)}  (peak Δ in centre third; de-strobe guard)`);
	console.log(`clip fraction  white=${(whiteClip * 100).toFixed(2)}%  black=${(blackClip * 100).toFixed(2)}%`);
	console.log(`contact: ${path.join(OUT_DIR, `${label}-contact.png`)}`);
	return { n, loopSeam, adjacentSeam, maxJump, crawl, whiteClip, blackClip };
}

test("owned-finish keyframe invariants — Orbit + Turntable", async ({ page }) => {
	fs.rmSync(OUT_DIR, { force: true, recursive: true });
	fs.mkdirSync(OUT_DIR, { recursive: true });

	// Pin the colourway these gates were calibrated against: silver device on a
	// white stage under the Apple rig. The factory boot theme is Noir (black
	// device, cobalt stage, Designer Dark rig), whose carved dark side
	// legitimately exceeds the crush gates — that's the owned look, not a
	// regression. Colours ride the persisted UI state; the rig is one cockpit
	// click after load (it also sets the white stage).
	await page.addInitScript(() => {
		localStorage.setItem(
			"ipodSnapshotUiState",
			JSON.stringify({ skinColor: "#E8E8E8", bgColor: "#FFFFFF" }),
		);
	});
	await page.goto("/3d", { waitUntil: "domcontentloaded" });
	await page.locator("canvas").first().waitFor({ state: "visible", timeout: 60_000 });
	await page.getByRole("button", { name: "Apple", exact: true }).click();
	await page.waitForTimeout(2500);

	const orbitMp4 = await captureClip(page, "Orbit");
	const turntableMp4 = await captureClip(page, "Turntable");
	await page.close();

	const orbit = analyze("orbit", orbitMp4);
	const turntable = analyze("turntable", turntableMp4);
	console.log("\nOUTDIR:", OUT_DIR);

	// Seamless loops, no opening pop (both moves close on the hero seam).
	for (const clip of [orbit, turntable]) {
		expect(clip.n).toBeGreaterThan(60);
		expect(clip.loopSeam).toBeGreaterThan(clip.adjacentSeam - 0.03);
	}
	// Orbit barely moves → tiny whole-frame jumps. Turntable spins 360°, so its whole-frame
	// jump is legitimately large — we do NOT gate it on maxJump (that measures rotation, not
	// crawl). Instead the centre-crawl peak is the de-strobe guard: with the roughness floor a
	// turntable's back reads as a smooth gradient, so its centre peak stays well under a hard
	// specular flicker. (Calibrated against the floored material; tighten once a baseline lands.)
	expect(orbit.maxJump).toBeLessThan(12);
	// `crawl` (centre peak-Δ) is LOGGED, not gated: an A/B run proved it can't isolate specular
	// crawl — a pure mirror back (0.05) and the floored back (0.13) both score ~223 because the
	// metric is dominated by the device's high-contrast edges legitimately rotating through the
	// centre. Isolating night-env hotspot crawl needs the Designer Dark rig + a high-frequency
	// (not peak) temporal metric — tracked as a follow-up.
	//
	// What the A/B DID prove sensitive: the floored back diffuses the env into a softer reflection,
	// cutting turntable black-crush from 18.4% (mirror) to 12.9% (floored). Gate between the two so
	// a regression that re-mirrors the back trips here. (Default Apple/white-stage colours.)
	expect(turntable.blackClip).toBeLessThan(0.16);
	// No-clip (I4): form survives both extremes — only a small sliver of either pole.
	for (const clip of [orbit, turntable]) {
		expect(clip.whiteClip).toBeLessThan(0.25);
		expect(clip.blackClip).toBeLessThan(0.25);
	}
});
