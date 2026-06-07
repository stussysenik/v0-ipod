import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

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

function maxConsecutiveJump(mp4: string): number {
	const out = execSync(
		`ffmpeg -i ${JSON.stringify(mp4)} -vf "tblend=all_mode=difference,signalstats,metadata=print" -f null - 2>&1`,
		{ encoding: "utf8" },
	);
	const vals = [...out.matchAll(/YAVG=([0-9.]+)/g)].map((m) => Number(m[1]));
	return vals.length ? Math.max(...vals) : NaN;
}

async function captureClip(page: Page, label: string, buttonRe: RegExp): Promise<string> {
	const clipButton = page.getByRole("button", { name: buttonRe });
	await expect(clipButton).toBeEnabled();
	const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
	await clipButton.click();
	const download = await downloadPromise;
	const mp4Path = path.join(OUT_DIR, `${label}.mp4`);
	await download.saveAs(mp4Path);
	// wait for the dock to return to idle before the next capture
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
	const first = path.join(framesDir, frames[0]!);
	const last = path.join(framesDir, frames[n - 1]!);
	const loopSeam = ssim(first, last);
	const maxJump = maxConsecutiveJump(mp4);
	const adjacentSeam = ssim(path.join(framesDir, frames[n - 2]!), last);

	// contact sheet for eyeballing
	execFileSync("ffmpeg", [
		"-y", "-i", mp4,
		"-vf", "scale=216:384,tile=10x15:padding=4:color=white",
		path.join(OUT_DIR, `${label}-contact.png`),
	], { stdio: "ignore" });

	const size = fs.statSync(mp4).size;
	console.log(`\n=== ${label.toUpperCase()} ===`);
	console.log(`frames=${n}  size=${(size / 1024).toFixed(0)}KB`);
	// The last frame is one motion-step before frame 0 (t=i/total), so a seamless
	// loop has seam SSIM ≈ the adjacent-frame SSIM — continuous, not a freeze.
	console.log(`loop-seam SSIM(last,first)=${loopSeam.toFixed(4)}  adjacent=${adjacentSeam.toFixed(4)}  (want seam ≈ adjacent)`);
	console.log(`max consecutive-frame jump=${maxJump.toFixed(2)}  (want < 10 — no pop)`);
	console.log(`contact: ${path.join(OUT_DIR, `${label}-contact.png`)}`);
	return { n, loopSeam, maxJump, adjacentSeam };
}

test("verify fixed Orbit + new Robo clips frame-by-frame", async ({ page }) => {
	fs.rmSync(OUT_DIR, { force: true, recursive: true });
	fs.mkdirSync(OUT_DIR, { recursive: true });

	await page.goto("/3d", { waitUntil: "domcontentloaded" });
	await page.locator("canvas").first().waitFor({ state: "visible", timeout: 60_000 });
	await page.waitForTimeout(2500);

	const orbitMp4 = await captureClip(page, "orbit", /Clip · Orbit/);
	const roboMp4 = await captureClip(page, "robo", /Clip · Robo/);
	await page.close();

	const orbit = analyze("orbit", orbitMp4);
	const robo = analyze("robo", roboMp4);
	console.log("\nOUTDIR:", OUT_DIR);

	// Both must be seamless loops with no opening pop.
	expect(orbit.n).toBe(150);
	expect(robo.n).toBe(150);
	// No opening pop / mid-clip jump.
	expect(orbit.maxJump).toBeLessThan(10);
	expect(robo.maxJump).toBeLessThan(10);
	// Seamless loop: the wrap (last→first) is no worse than a normal motion step.
	expect(orbit.loopSeam).toBeGreaterThan(orbit.adjacentSeam - 0.02);
	expect(robo.loopSeam).toBeGreaterThan(robo.adjacentSeam - 0.02);
});
