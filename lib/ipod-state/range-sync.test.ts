import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadPersistedWorkbenchModel } from "./effects";
import { loadUiState, saveUiState } from "./storage";
import { createInitialIpodWorkbenchModel, normalizeModel } from "./update";
import type { IpodUiState } from "@/types/ipod-state";

/**
 * Range start/end must obey one invariant everywhere: they exist iff
 * `selectionKind === "range"`. `normalizeModel` and `normalizePlaybackSnapshot`
 * enforce it, but the UI-state load path (used by the 2D hard-refresh restore)
 * historically did not — so a "moment" selection could resurrect stale range
 * times measured against a previous song/duration, surfacing as a desynced
 * start/end and a stale end−start difference after a browser hard refresh.
 */

// Node unit env has no DOM; back localStorage with a plain in-memory map.
function installLocalStorage(): void {
	const store = new Map<string, string>();
	(globalThis as { localStorage?: Storage }).localStorage = {
		getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
		setItem: (k: string, v: string) => void store.set(k, String(v)),
		removeItem: (k: string) => void store.delete(k),
		clear: () => store.clear(),
		key: (i: number) => Array.from(store.keys())[i] ?? null,
		get length() {
			return store.size;
		},
	} as Storage;
}

const BASE_UI: IpodUiState = {
	...createInitialIpodWorkbenchModel().presentation,
	interactionModel: "wheel",
	selectionKind: "moment",
	rangeStartTime: null,
	rangeEndTime: null,
	osScreen: "menu",
	menuIndex: 0,
	osOriginalMenuSplit: 0.5,
	osNowPlayingLayout: null,
	isPlaying: false,
	batteryLevel: 1,
	batteryMode: "manual",
} as unknown as IpodUiState;

beforeEach(installLocalStorage);
afterEach(() => localStorage.clear());

describe("range/selection persistence invariant", () => {
	it("loadUiState drops stale range times when selection is a moment", () => {
		// A prior "range" session left start/end behind; the user is now on "moment".
		saveUiState({
			...BASE_UI,
			selectionKind: "moment",
			rangeStartTime: 30,
			rangeEndTime: 60,
		});

		const loaded = loadUiState();
		expect(loaded?.selectionKind).toBe("moment");
		expect(loaded?.rangeStartTime ?? null).toBeNull();
		expect(loaded?.rangeEndTime ?? null).toBeNull();
	});

	it("hard-refresh restore never carries stale range into a moment selection", () => {
		saveUiState({
			...BASE_UI,
			selectionKind: "moment",
			rangeStartTime: 30,
			rangeEndTime: 60,
		});

		const restored = normalizeModel(
			loadPersistedWorkbenchModel(createInitialIpodWorkbenchModel()),
		);
		expect(restored.playback.selectionKind).toBe("moment");
		expect(restored.playback.rangeStartTime).toBeNull();
		expect(restored.playback.rangeEndTime).toBeNull();
	});

	it("preserves a genuine range selection across a hard-refresh restore", () => {
		saveUiState({
			...BASE_UI,
			selectionKind: "range",
			rangeStartTime: 30,
			rangeEndTime: 60,
		});

		const restored = normalizeModel(
			loadPersistedWorkbenchModel(createInitialIpodWorkbenchModel()),
		);
		expect(restored.playback.selectionKind).toBe("range");
		expect(restored.playback.rangeStartTime).toBe(30);
		expect(restored.playback.rangeEndTime).toBe(60);
	});
});
