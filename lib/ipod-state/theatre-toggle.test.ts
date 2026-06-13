import { beforeAll, describe, expect, it } from "vitest";

import { createInitialStudioState } from "./model";
import type { IpodWorkbenchModel } from "./model";
import { ipodWorkbenchReducer } from "./update";

/**
 * The Theatre.js studio is a dev-only camera-keyframe overlay. It must stay OFF by
 * default (so it never clutters the live view or leaks into an export), and the
 * toggle must round-trip through both the reducer and localStorage persistence so a
 * designer's choice survives a refresh. These tests pin both invariants — the
 * persistence whitelist in storage.ts is the easy thing to forget when a new studio
 * flag is added.
 */
function baseModel(): IpodWorkbenchModel {
	// Studio toggles patch only the studio slice (patchStudio), so a partial model
	// scoped to that slice is enough to exercise them.
	return { studio: createInitialStudioState() } as IpodWorkbenchModel;
}

describe("theatre studio toggle", () => {
	it("defaults off so the overlay never surprises the view or an export", () => {
		expect(createInitialStudioState().theatreStudio).toBe(false);
	});

	it("TOGGLE_THEATRE_STUDIO flips the flag without touching siblings", () => {
		const start = baseModel();
		const on = ipodWorkbenchReducer(start, { type: "TOGGLE_THEATRE_STUDIO" });
		expect(on.studio.theatreStudio).toBe(true);
		// Adjacent toggles are untouched — the patch is surgical.
		expect(on.studio.marquee).toBe(start.studio.marquee);
		expect(on.studio.interactionLocked).toBe(start.studio.interactionLocked);

		const off = ipodWorkbenchReducer(on, { type: "TOGGLE_THEATRE_STUDIO" });
		expect(off.studio.theatreStudio).toBe(false);
	});

	it("SET_THEATRE_STUDIO sets the flag explicitly", () => {
		const next = ipodWorkbenchReducer(baseModel(), {
			type: "SET_THEATRE_STUDIO",
			payload: true,
		});
		expect(next.studio.theatreStudio).toBe(true);
	});
});

describe("theatre studio persistence", () => {
	// The unit project runs in the node environment, so stub a minimal localStorage
	// before importing storage.ts (which reads it at call time).
	beforeAll(() => {
		const store = new Map<string, string>();
		(globalThis as { localStorage?: Storage }).localStorage = {
			getItem: (k: string) => store.get(k) ?? null,
			setItem: (k: string, v: string) => void store.set(k, v),
			removeItem: (k: string) => void store.delete(k),
			clear: () => store.clear(),
			key: (i: number) => Array.from(store.keys())[i] ?? null,
			get length() {
				return store.size;
			},
		} as Storage;
	});

	it("survives a localStorage round-trip (whitelist includes the flag)", async () => {
		const { saveStudioState, loadStudioState } = await import("./storage");
		const on = ipodWorkbenchReducer(baseModel(), {
			type: "SET_THEATRE_STUDIO",
			payload: true,
		});
		saveStudioState(on.studio);
		expect(loadStudioState()?.theatreStudio).toBe(true);
	});
});
