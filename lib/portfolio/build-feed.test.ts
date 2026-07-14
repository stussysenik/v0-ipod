import { describe, expect, it } from "vitest";

import checkedIn from "@/content/senik.feed.json";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { loadFeed } from "@/lib/feed/load";
import { buildSenikFeed } from "@/lib/portfolio/build-feed";
import { projects } from "@/lib/portfolio/data";

describe("senik.feed.json is derived, not hand-authored", () => {
	/**
	 * The guard that pays for this whole file. `/portfolio` renders the JSON, not
	 * `data.ts` — so an edit to `data.ts` that never reached the JSON used to be a
	 * silent content bug (it shipped a cut work and a dead URL for weeks). Now it is a
	 * failing test with a fix in the message.
	 */
	it("matches `pnpm feed:build` output — run it if this fails", () => {
		expect(checkedIn).toEqual(JSON.parse(JSON.stringify(buildSenikFeed())));
	});

	it("still validates against the IpodFeed schema", () => {
		expect(() => loadFeed(buildSenikFeed())).not.toThrow();
	});
});

describe("the shipped portfolio surface", () => {
	it("serves every work in data.ts, addressed by its own slug", () => {
		const { worksBySlug } = loadFeed(buildSenikFeed());
		for (const project of projects) {
			expect(worksBySlug.get(project.slug)?.title).toBe(project.title);
		}
	});

	it("indexes every slug exactly once", () => {
		const { feed, worksBySlug } = loadFeed(buildSenikFeed());
		expect(worksBySlug.size).toBe(feed.works.length);
	});

	it("lists exactly the works on the canonical site — no extras (spec: D5)", () => {
		const { feed } = loadFeed(buildSenikFeed());
		const works = feed.menu.find((node) => node.id === "works");
		expect(works?.children?.map((c) => c.slug)).toEqual(projects.map((p) => p.slug));
	});

	it("does not serve the iPod emulator as a work — the visitor is holding it", () => {
		const { worksBySlug } = loadFeed(buildSenikFeed());
		expect(worksBySlug.has("ipod-emulator")).toBe(false);
	});

	it("hides the archived Writing and Labs sections while their flags are false", () => {
		const { feed } = loadFeed(buildSenikFeed());
		const ids = feed.menu.map((node) => node.id);
		// Asserted against the flags, not hard-coded — flipping one restores its section
		// and this test follows it rather than failing.
		expect(ids.includes("writing")).toBe(FEATURE_FLAGS.SHOW_PORTFOLIO_WRITINGS);
		expect(ids.includes("labs")).toBe(FEATURE_FLAGS.SHOW_PORTFOLIO_LABS);
	});
});
