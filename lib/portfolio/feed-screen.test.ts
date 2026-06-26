import { describe, expect, it } from "vitest";

import senikFeed from "@/content/senik.feed.json";
import { loadFeed } from "@/lib/feed/load";
import { initNav, navReducer } from "@/lib/nav/machine";

import { deriveScreen, seekToNav } from "./feed-screen";

const model = loadFeed(senikFeed);
const feed = model.feed;

describe("deriveScreen", () => {
	it("projects the root menu with the feed title and the feed's top-level nodes", () => {
		const state = initNav(feed);
		const screen = deriveScreen(state, model);

		expect(screen.isMenu).toBe(true);
		expect(screen.title).toBe(feed.meta.title);
		expect(screen.rows.map((r) => r.id)).toEqual(feed.menu.map((n) => n.id));
		expect(screen.cursor).toBe(0);
		expect(screen.openWork).toBeUndefined();
	});

	it("marks submenu/external rows with the right hint, slugs with none", () => {
		const state = initNav(feed);
		const screen = deriveScreen(state, model);
		for (const row of screen.rows) {
			const node = feed.menu.find((n) => n.id === row.id)!;
			if (node.children?.length) expect(row.hint).toBe("›");
			else if (node.href) expect(row.hint).toBe("↗");
			else expect(row.hint).toBe("");
		}
	});

	it("titles a drilled submenu with the drilled node's own label", () => {
		const submenu = feed.menu.find((n) => n.children && n.children.length > 0)!;
		const start = initNav(feed);
		// focus the submenu, then select to drill in
		const idx = feed.menu.findIndex((n) => n.id === submenu.id);
		const focused = navReducer(start, { type: "focus", index: idx });
		const drilled = navReducer(focused, { type: "select" });

		const screen = deriveScreen(drilled, model);
		expect(screen.isMenu).toBe(true);
		expect(screen.title).toBe(submenu.label);
		expect(screen.rows.map((r) => r.id)).toEqual(submenu.children!.map((c) => c.id));
	});

	it("opens a work into a content screen titled by the work", () => {
		// find a submenu whose first child is a slug work
		const submenu = feed.menu.find(
			(n) => n.children?.some((c) => c.slug),
		)!;
		const idx = feed.menu.findIndex((n) => n.id === submenu.id);
		const drilled = navReducer(navReducer(initNav(feed), { type: "focus", index: idx }), {
			type: "select",
		});
		const slugChildIdx = submenu.children!.findIndex((c) => c.slug);
		const onWork = navReducer(navReducer(drilled, { type: "focus", index: slugChildIdx }), {
			type: "select",
		});

		const screen = deriveScreen(onWork, model);
		expect(screen.isMenu).toBe(false);
		expect(screen.openWork).toBeDefined();
		expect(screen.title).toBe(screen.openWork!.title);
	});
});

describe("seekToNav", () => {
	it("maps clockwise to next and counter-clockwise to prev", () => {
		expect(seekToNav(1)).toBe("next");
		expect(seekToNav(2)).toBe("next");
		expect(seekToNav(-1)).toBe("prev");
	});
});
