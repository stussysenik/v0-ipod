import { describe, expect, it } from "vitest";

import feedJson from "@/content/senik.feed.json";
import { loadFeed } from "@/lib/feed/load";

// JSON imports widen literals (e.g. `version: number`), so cast to the loader's
// `unknown` door — the schema, not TypeScript, is the validation gate here.
const feed = feedJson as unknown;

describe("senik.feed.json", () => {
	it("validates against the IpodFeed schema", () => {
		expect(() => loadFeed(feed)).not.toThrow();
	});

	it("has unique work slugs and a real catalog (> 15 works)", () => {
		const { feed: parsed, worksBySlug } = loadFeed(feed);
		expect(parsed.works.length).toBeGreaterThan(15);
		// Every slug indexed exactly once ⇒ no duplicates collapsed in the map.
		expect(worksBySlug.size).toBe(parsed.works.length);
	});

	it("resolves known slugs via worksBySlug", () => {
		const { worksBySlug } = loadFeed(feed);
		expect(worksBySlug.get("ipod-emulator")?.title).toBe("iPod emulator");
		expect(worksBySlug.get("about")?.title).toBe("About");
		expect(worksBySlug.get("20260410-webgpu-compute")?.tags).toContain("webgpu");
	});
});
