import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const downloadsDir = path.join(os.homedir(), "Downloads");
const METADATA_STORAGE_KEY = "ipodSnapshotMetadata";
const UI_STORAGE_KEY = "ipodSnapshotUiState";
const SNAPSHOT_STORAGE_KEY = "ipodSnapshotSongSnapshot";
const EXPORT_COUNTER_STORAGE_KEY = "ipodSnapshotExportCounter";

async function allowDownloadsToHomeDirectory(page: Page) {
	const client = await page.context().newCDPSession(page);
	await client.send("Page.setDownloadBehavior", {
		behavior: "allow",
		downloadPath: downloadsDir,
	});
}

async function waitForDownloadedFile(filePath: string, timeoutMs = 90_000): Promise<number> {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeoutMs) {
		if (fs.existsSync(filePath)) {
			const size = fs.statSync(filePath).size;
			if (size > 0) {
				return size;
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	throw new Error(`Timed out waiting for ${filePath}`);
}

function getExtractedFrameHashes(filePath: string): [string, string] {
	const frameCount = Number.parseInt(
		execFileSync(
			"ffprobe",
			[
				"-v",
				"error",
				"-count_frames",
				"-select_streams",
				"v:0",
				"-show_entries",
				"stream=nb_read_frames",
				"-of",
				"default=nokey=1:noprint_wrappers=1",
				filePath,
			],
			{ encoding: "utf8" },
		).trim(),
		10,
	);
	if (!Number.isFinite(frameCount) || frameCount < 2) {
		throw new Error(`Expected at least two frames in ${filePath}`);
	}

	const middleFrameIndex = Math.max(1, Math.floor(frameCount / 2));
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ipod-export-frames-"));

	try {
		execFileSync(
			"ffmpeg",
			[
				"-y",
				"-i",
				filePath,
				"-vf",
				`select='eq(n,0)+eq(n,${middleFrameIndex})'`,
				"-vsync",
				"0",
				path.join(tmpDir, "frame-%03d.png"),
			],
			{ stdio: "ignore" },
		);

		const firstFrame = fs.readFileSync(path.join(tmpDir, "frame-001.png"));
		const middleFrame = fs.readFileSync(path.join(tmpDir, "frame-002.png"));
		return [
			crypto.createHash("sha256").update(firstFrame).digest("hex"),
			crypto.createHash("sha256").update(middleFrame).digest("hex"),
		];
	} finally {
		fs.rmSync(tmpDir, { force: true, recursive: true });
	}
}

async function prepareExportSurface(page: Page) {
	await page.addInitScript(
		({
			exportCounterStorageKey,
			metadataStorageKey,
			snapshotStorageKey,
			uiStorageKey,
		}) => {
		localStorage.removeItem("ipod-workbench-model");
		localStorage.removeItem("ipod-song-snapshot");
		localStorage.removeItem("ipod-export-counter");
		localStorage.removeItem(metadataStorageKey);
		localStorage.removeItem(uiStorageKey);
		localStorage.removeItem(snapshotStorageKey);
		localStorage.removeItem(exportCounterStorageKey);
		localStorage.setItem(
			metadataStorageKey,
			JSON.stringify({
				title: "Doesn't Just Happen",
				artist: "James Blake",
				album: "Playing Robots Into Heaven",
				artwork: "/default-artwork.png",
				duration: 252,
				currentTime: 47,
				rating: 4,
				trackNumber: 2,
				totalTracks: 12,
			}),
		);
		localStorage.setItem(
			uiStorageKey,
			JSON.stringify({
				viewMode: "preview",
				interactionModel: "direct",
				osScreen: "now-playing",
				isPlaying: true,
			}),
		);
		localStorage.setItem(exportCounterStorageKey, "0");
	},
		{
			exportCounterStorageKey: EXPORT_COUNTER_STORAGE_KEY,
			metadataStorageKey: METADATA_STORAGE_KEY,
			snapshotStorageKey: SNAPSHOT_STORAGE_KEY,
			uiStorageKey: UI_STORAGE_KEY,
		},
	);
	await page.goto("/", { waitUntil: "domcontentloaded" });
	await page.getByTestId("screen-progress").waitFor({ state: "visible" });
	await page.waitForTimeout(800);
}

test.describe.configure({ mode: "serial" });

test.describe("Export downloads", () => {
	test("GIF export lands in ~/Downloads", async ({ page }) => {
		await allowDownloadsToHomeDirectory(page);
		await prepareExportSurface(page);

		const filePath = path.join(
			downloadsDir,
			"ipod-0000-james-blake-doesn-t-just-happen.gif",
		);
		fs.rmSync(filePath, { force: true });

		const downloadPromise = page.waitForEvent("download", {
			timeout: 60_000,
		});
		await page.getByTestId("gif-export-button").click();
		await page.getByRole("spinbutton").fill("3");
		await page.getByRole("button", { name: "Export .gif" }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toBe(
			"ipod-0000-james-blake-doesn-t-just-happen.gif",
		);
		await page.close();

		const size = await waitForDownloadedFile(filePath, 60_000);
		expect(size).toBeGreaterThan(100_000);
		const [firstFrameHash, middleFrameHash] = getExtractedFrameHashes(filePath);
		expect(firstFrameHash).not.toBe(middleFrameHash);
	});

	test("MP4 export lands in ~/Downloads", async ({ page }) => {
		await allowDownloadsToHomeDirectory(page);
		await prepareExportSurface(page);

		const mp4Button = page.getByTestId("mp4-export-button");
		await expect(mp4Button).toBeEnabled();

		const filePath = path.join(
			downloadsDir,
			"ipod-0000-james-blake-doesn-t-just-happen.mp4",
		);
		fs.rmSync(filePath, { force: true });

		const downloadPromise = page.waitForEvent("download", {
			timeout: 120_000,
		});
		await mp4Button.click();
		await page.getByRole("spinbutton").fill("3");
		await page.getByRole("button", { name: "Export .mp4" }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toBe(
			"ipod-0000-james-blake-doesn-t-just-happen.mp4",
		);
		await page.close();

		const size = await waitForDownloadedFile(filePath, 120_000);
		expect(size).toBeGreaterThan(100_000);
		const [firstFrameHash, middleFrameHash] = getExtractedFrameHashes(filePath);
		expect(firstFrameHash).not.toBe(middleFrameHash);
	});
});
