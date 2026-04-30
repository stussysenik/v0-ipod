import { expect, test } from "@playwright/test";

const METADATA_STORAGE_KEY = "ipodSnapshotMetadata";
const UI_STORAGE_KEY = "ipodSnapshotUiState";

test("preview button brings the title marquee back on the now playing screen", async ({
	page,
}) => {
	await page.addInitScript(
		({ metadataStorageKey, uiStorageKey }) => {
			localStorage.setItem(
				metadataStorageKey,
				JSON.stringify({
					title: "Sufjan Stevens - Chicago (Demo Version From The Avalanche Outtakes)",
					artist: "Sufjan Stevens",
					album: "Illinois",
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
					viewMode: "flat",
					interactionModel: "ipod-os",
					osScreen: "menu",
					isPlaying: false,
				}),
			);
		},
		{
			metadataStorageKey: METADATA_STORAGE_KEY,
			uiStorageKey: UI_STORAGE_KEY,
		},
	);

	await page.goto("/", { waitUntil: "domcontentloaded" });
	await page.waitForFunction(({ uiStorageKey }) => {
		const raw = localStorage.getItem(uiStorageKey);
		if (!raw) {
			return false;
		}

		try {
			const parsed = JSON.parse(raw);
			return (
				parsed?.interactionModel === "ipod-os" &&
				parsed?.osScreen === "menu" &&
				typeof parsed?.hardwarePreset === "string"
			);
		} catch {
			return false;
		}
	}, { uiStorageKey: UI_STORAGE_KEY });
	await page.getByTestId("preview-view-button").click();
	const title = page.getByTestId("track-title-text");
	await expect(title).toContainText("Sufjan Stevens");
	await page.waitForTimeout(1200);

	const marqueeState = await title.evaluate((node) => {
		const track = node.querySelector<HTMLElement>('[data-marquee-track="true"]');
		return {
			active: node.getAttribute("data-marquee-active"),
			overflow: node.getAttribute("data-marquee-overflow"),
			transform: track?.style.transform ?? null,
		};
	});

	expect(marqueeState.active).toBe("true");
	expect(marqueeState.overflow).toBe("true");
	expect(marqueeState.transform).not.toBe("translateX(0px)");
});

test("preview button animates overflowing artist text too", async ({ page }) => {
	await page.addInitScript(
		({ metadataStorageKey, uiStorageKey }) => {
			localStorage.setItem(
				metadataStorageKey,
				JSON.stringify({
					title: "STORM II",
					artist: "GENERATION & Yung Lean",
					album: "STORM - Single",
					artwork: "/default-artwork.png",
					duration: 197,
					currentTime: 7,
					rating: 4,
					trackNumber: 2,
					totalTracks: 2,
				}),
			);
			localStorage.setItem(
				uiStorageKey,
				JSON.stringify({
					viewMode: "flat",
					interactionModel: "ipod-os",
					osScreen: "menu",
					isPlaying: false,
				}),
			);
		},
		{
			metadataStorageKey: METADATA_STORAGE_KEY,
			uiStorageKey: UI_STORAGE_KEY,
		},
	);

	await page.goto("/", { waitUntil: "domcontentloaded" });
	await page.waitForFunction(({ uiStorageKey }) => {
		const raw = localStorage.getItem(uiStorageKey);
		if (!raw) {
			return false;
		}

		try {
			const parsed = JSON.parse(raw);
			return (
				parsed?.interactionModel === "ipod-os" &&
				parsed?.osScreen === "menu" &&
				typeof parsed?.hardwarePreset === "string"
			);
		} catch {
			return false;
		}
	}, { uiStorageKey: UI_STORAGE_KEY });
	await page.getByTestId("preview-view-button").click();
	const artist = page.getByTestId("track-artist-text");
	await expect(artist).toContainText("GENERATION");
	await page.waitForTimeout(2500);

	const marqueeState = await artist.evaluate((node) => {
		const track = node.querySelector<HTMLElement>('[data-marquee-track="true"]');
		return {
			active: node.getAttribute("data-marquee-active"),
			overflow: node.getAttribute("data-marquee-overflow"),
			transform: track?.style.transform ?? null,
		};
	});

	expect(marqueeState.active).toBe("true");
	expect(marqueeState.overflow).toBe("true");
	expect(marqueeState.transform).not.toBe("translateX(0px)");
});

test("preview button keeps short titles static like the original iPod behavior", async ({
	page,
}) => {
	await page.addInitScript(
		({ metadataStorageKey, uiStorageKey }) => {
			localStorage.setItem(
				metadataStorageKey,
				JSON.stringify({
					title: "Chamakay",
					artist: "Blood Orange",
					album: "Cupid Deluxe",
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
					viewMode: "flat",
					interactionModel: "ipod-os",
					osScreen: "menu",
					isPlaying: false,
				}),
			);
		},
		{
			metadataStorageKey: METADATA_STORAGE_KEY,
			uiStorageKey: UI_STORAGE_KEY,
		},
	);

	await page.goto("/", { waitUntil: "domcontentloaded" });
	await page.waitForFunction(({ uiStorageKey }) => {
		const raw = localStorage.getItem(uiStorageKey);
		if (!raw) {
			return false;
		}

		try {
			const parsed = JSON.parse(raw);
			return (
				parsed?.interactionModel === "ipod-os" &&
				parsed?.osScreen === "menu" &&
				typeof parsed?.hardwarePreset === "string"
			);
		} catch {
			return false;
		}
	}, { uiStorageKey: UI_STORAGE_KEY });
	await page.getByTestId("preview-view-button").click();
	const title = page.getByTestId("track-title-text");
	await expect(title).toContainText("Chamakay");
	await page.waitForTimeout(1200);

	const marqueeState = await title.evaluate((node) => {
		const track = node.querySelector<HTMLElement>('[data-marquee-track="true"]');
		return {
			active: node.getAttribute("data-marquee-active"),
			overflow: node.getAttribute("data-marquee-overflow"),
			mode: node.getAttribute("data-marquee-mode"),
			transform: track?.style.transform ?? null,
		};
	});

	expect(marqueeState.active).toBe("false");
	expect(marqueeState.overflow).toBe("false");
	expect(marqueeState.mode).toBe(null);
	expect(marqueeState.transform).toBe("translateX(0px)");
});
