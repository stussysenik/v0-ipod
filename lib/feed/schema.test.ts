import { describe, expect, it } from "vitest";

import { EXAMPLE_FEED } from "./example";
import { FeedValidationError, loadFeed } from "./load";
import { themeToCssText, themeToCssVars } from "./theme";

describe("loadFeed — valid", () => {
	it("normalizes the canonical example: indices + cover resolution", () => {
		const { feed, worksBySlug, assetsById, resolveCover } = loadFeed(EXAMPLE_FEED);

		expect(feed.meta.id).toBe("example");
		expect(worksBySlug.size).toBe(3);
		expect(worksBySlug.get("aurora")?.title).toBe("Aurora");

		// Cover by asset id resolves to the declared asset…
		expect(resolveCover(worksBySlug.get("aurora")!)?.src).toBe("/feed/aurora-cover.jpg");
		// …a direct-URL cover becomes a uniform one-off asset…
		expect(resolveCover(worksBySlug.get("trident")!)?.src).toBe("https://example.com/trident.jpg");
		// …and a coverless work resolves to nothing.
		expect(resolveCover(worksBySlug.get("about")!)).toBeUndefined();

		expect(assetsById.get("asset-aurora")?.width).toBe(1200);
	});

	it("applies schema defaults when works omit optional arrays", () => {
		const { feed, worksBySlug } = loadFeed({
			version: 1,
			meta: { id: "min", title: "Min" },
			menu: [{ id: "m", label: "Solo", slug: "solo" }],
			works: [{ slug: "solo", title: "Solo" }],
		});
		const solo = worksBySlug.get("solo")!;
		expect(solo.tags).toEqual([]);
		expect(solo.links).toEqual([]);
		// theme + assets also default to empty rather than failing.
		expect(feed.theme).toEqual({});
		expect(feed.assets).toEqual([]);
	});
});

describe("loadFeed — invalid (field-level errors)", () => {
	const base = () => structuredClone(EXAMPLE_FEED) as unknown as Record<string, unknown>;

	it("rejects a wrong version", () => {
		const bad = base();
		bad.version = 2;
		expect(() => loadFeed(bad)).toThrow(FeedValidationError);
	});

	it("rejects a non-kebab slug with a pointed path", () => {
		const bad = base();
		(bad.works as { slug: string }[])[0].slug = "Not Kebab";
		try {
			loadFeed(bad);
			expect.unreachable("should have thrown");
		} catch (e) {
			const err = e as FeedValidationError;
			expect(err).toBeInstanceOf(FeedValidationError);
			expect(err.issues.some((i) => i.path.startsWith("works[0].slug"))).toBe(true);
		}
	});

	it("rejects a menu node with two of {children, slug, href}", () => {
		const bad = base();
		(bad.menu as Record<string, unknown>[])[1] = { id: "x", label: "X", slug: "about", href: "/x" };
		expect(() => loadFeed(bad)).toThrow(FeedValidationError);
	});

	it("rejects a menu slug reference with no matching work", () => {
		const bad = base();
		(bad.menu as { id: string; label: string; slug?: string }[])[1] = {
			id: "ghost",
			label: "Ghost",
			slug: "does-not-exist",
		};
		try {
			loadFeed(bad);
			expect.unreachable("should have thrown");
		} catch (e) {
			const err = e as FeedValidationError;
			expect(err.issues[0].message).toContain("unknown work slug");
		}
	});

	it("rejects duplicate work slugs", () => {
		const bad = base();
		(bad.works as { slug: string }[]).push({ ...(bad.works as { slug: string }[])[0] });
		try {
			loadFeed(bad);
			expect.unreachable("should have thrown");
		} catch (e) {
			expect((e as FeedValidationError).issues.some((i) => i.message.includes("duplicate"))).toBe(
				true,
			);
		}
	});

	it("collects multiple issues at once", () => {
		const err = (() => {
			try {
				loadFeed({ version: 1 });
			} catch (e) {
				return e as FeedValidationError;
			}
		})();
		expect(err).toBeInstanceOf(FeedValidationError);
		expect(err!.issues.length).toBeGreaterThan(1);
	});
});

describe("theme tokens → CSS variables", () => {
	it("maps camelCase tokens to kebab --ipod-* variables", () => {
		const vars = themeToCssVars(EXAMPLE_FEED.theme);
		expect(vars["--ipod-accent"]).toBe("#0048FF");
		expect(vars["--ipod-font-sans"]).toBe("'Inter', system-ui, sans-serif");
	});

	it("drops empty values so partial themes fall back to defaults", () => {
		expect(themeToCssVars({ accent: "", background: "#fff" })).toEqual({
			"--ipod-background": "#fff",
		});
	});

	it("serializes to an inline style string", () => {
		const text = themeToCssText({ accent: "#000" });
		expect(text).toBe("--ipod-accent: #000;");
	});
});
