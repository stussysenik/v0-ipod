import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The bug this guards: a deployed page whose PocketBase URL fell back to
 * `http://127.0.0.1:8090` did not call a server we run — it called port 8090 on the
 * **visitor's own machine**, once per `/3d` load, logging `ERR_CONNECTION_REFUSED` in
 * their console. Caught on the launch preview by a Lighthouse "errors in console" fail.
 *
 * The module reads `NODE_ENV` and the env var at import time, so each case needs a fresh
 * module registry rather than a re-import of the cached one.
 */
async function loadWith(env: { nodeEnv: string; url?: string }) {
	vi.resetModules();
	vi.stubEnv("NODE_ENV", env.nodeEnv);
	if (env.url === undefined) {
		vi.stubEnv("NEXT_PUBLIC_POCKETBASE_URL", "");
	} else {
		vi.stubEnv("NEXT_PUBLIC_POCKETBASE_URL", env.url);
	}
	return await import("./pocketbase");
}

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe("export history configuration", () => {
	it("is disabled in production when no PocketBase URL is configured", async () => {
		const pocketbase = await loadWith({ nodeEnv: "production" });
		expect(pocketbase.isExportHistoryEnabled).toBe(false);
	});

	it("never reaches the network while disabled — no request leaves the visitor's browser", async () => {
		const pocketbase = await loadWith({ nodeEnv: "production" });
		const fetchSpy = vi.spyOn(globalThis, "fetch");

		await expect(pocketbase.getExportHistory()).resolves.toEqual([]);
		await expect(
			pocketbase.saveExportToHistory(new Blob(["x"]), "clip.mp4", {
				title: "t",
				move: "m",
				aspect: "square",
				duration: 1,
			}),
		).resolves.toBeNull();

		// The pre-fix code returned [] too — but only *after* the request failed. An empty
		// result is therefore not the assertion that matters; the silent network is.
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("is enabled in production once a URL is configured", async () => {
		const pocketbase = await loadWith({
			nodeEnv: "production",
			url: "https://pb.example.com",
		});
		expect(pocketbase.isExportHistoryEnabled).toBe(true);
	});

	it("keeps the localhost convenience in development", async () => {
		const pocketbase = await loadWith({ nodeEnv: "development" });
		expect(pocketbase.isExportHistoryEnabled).toBe(true);
	});
});
