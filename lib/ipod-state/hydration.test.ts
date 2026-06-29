import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadPersistedWorkbenchModel } from "./effects";
import { saveUiState } from "./storage";
import { createInitialIpodWorkbenchModel, normalizeModel } from "./update";
import type { IpodUiState } from "@/types/ipod-state";

/**
 * The hydration boundary must carry a returning user's persisted finish into the restored
 * model — the whole-model RESTORE the workbench dispatches on mount reads exactly this. If it
 * silently fell back to the preset default, the device would render defaults regardless of
 * what the user saved (the visible half of the hydration-desync).
 */

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

describe("persisted finish hydration", () => {
	it("restores a saved skin color rather than the preset default", () => {
		const initial = createInitialIpodWorkbenchModel();
		saveUiState({ ...BASE_UI, skinColor: "#3366CC" });

		const restored = normalizeModel(loadPersistedWorkbenchModel(initial));

		expect(restored.presentation.skinColor).toBe("#3366CC");
		expect(restored.presentation.skinColor).not.toBe(initial.presentation.skinColor);
	});

	it("restores saved wheel + background finish together", () => {
		saveUiState({
			...BASE_UI,
			skinColor: "#101010",
			ringColor: "#202020",
			centerColor: "#303030",
			bgColor: "#F0F0F0",
		});

		const restored = normalizeModel(
			loadPersistedWorkbenchModel(createInitialIpodWorkbenchModel()),
		);

		expect(restored.presentation.ringColor).toBe("#202020");
		expect(restored.presentation.centerColor).toBe("#303030");
		expect(restored.presentation.bgColor).toBe("#F0F0F0");
	});
});
