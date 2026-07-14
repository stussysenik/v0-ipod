/**
 * The graph test (§10.5).
 *
 * Every other test in this suite checks a page in isolation, and that is exactly why
 * `/portfolio` and `/3d-portfolio` shipped unreachable: a page that renders and a page
 * a visitor can *find* are different claims, and only the first was ever asserted. Two
 * surfaces existed, passed all their tests, and had no inbound edge and no way home.
 *
 * So this asserts a property of the whole graph rather than of any node in it, and it
 * reads the routes off disk rather than from a list someone has to remember to update —
 * a new orphan route fails here on the day it is added.
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
	HOME,
	SURFACE_EDGES,
	type SurfaceRoute,
	surfaceNavNodes,
	UNLISTED_ROUTES,
} from "./routes";

const APP_DIR = join(process.cwd(), "app");

/** Every route the app actually ships, discovered from the filesystem. */
function shippedRoutes(dir = APP_DIR, prefix = ""): string[] {
	const routes: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (entry === "page.tsx") {
			routes.push(prefix === "" ? "/" : prefix);
		} else if (statSync(full).isDirectory() && !entry.startsWith("_")) {
			// Route groups `(x)` and private `_x` folders do not create URL segments.
			const segment = entry.startsWith("(") ? "" : `/${entry}`;
			routes.push(...shippedRoutes(full, `${prefix}${segment}`));
		}
	}
	return routes;
}

/** Routes reachable from `start` by walking outbound edges. */
function reachableFrom(start: SurfaceRoute): Set<string> {
	const seen = new Set<string>([start]);
	const queue: SurfaceRoute[] = [start];
	while (queue.length > 0) {
		const current = queue.shift() as SurfaceRoute;
		for (const next of SURFACE_EDGES[current]) {
			if (seen.has(next)) continue;
			seen.add(next);
			queue.push(next);
		}
	}
	return seen;
}

const surfaces = Object.keys(SURFACE_EDGES) as SurfaceRoute[];

describe("route graph", () => {
	it("accounts for every shipped route — as a surface, or explicitly unlisted", () => {
		const declared = new Set<string>([...surfaces, ...UNLISTED_ROUTES]);
		const unaccounted = shippedRoutes().filter((route) => !declared.has(route));

		// A new page.tsx that nobody linked to lands here. That is the bug this file exists
		// to catch, so the failure names it rather than just reporting a set difference.
		expect(
			unaccounted,
			`These routes ship but are not in the graph. Add an inbound edge in SURFACE_EDGES, ` +
				`or list them in UNLISTED_ROUTES to declare them intentionally unreachable.`,
		).toEqual([]);
	});

	it("makes every surface reachable from home", () => {
		const reachable = reachableFrom(HOME as SurfaceRoute);
		const orphans = surfaces.filter((route) => !reachable.has(route));

		expect(orphans, `unreachable from ${HOME} — a visitor can only get here by typing the URL`)
			.toEqual([]);
	});

	it("gives every surface a path home", () => {
		const stranded = surfaces.filter((route) => !reachableFrom(route).has(HOME));

		expect(stranded, `no path back to ${HOME} — a visitor who lands here is stuck`).toEqual([]);
	});

	it("mirrors the device pair with the portfolio pair", () => {
		// `/ ⇄ /3d` was the app's only edge. If the portfolio pair does not switch the same
		// way, the 3D portfolio is a second orphan hiding behind the first (§10.4).
		expect(SURFACE_EDGES["/portfolio"]).toContain("/3d-portfolio");
		expect(SURFACE_EDGES["/3d-portfolio"]).toContain("/portfolio");
	});
});

describe("surfaceNavNodes", () => {
	it("emits a valid href-only menu node per outbound edge", () => {
		const nodes = surfaceNavNodes("/portfolio");

		expect(nodes.map((n) => n.href)).toEqual(["/3d-portfolio", "/"]);
		for (const node of nodes) {
			// The feed schema refines menu nodes to exactly one of children/slug/href; a nav
			// node that carried any of the others would fail `loadFeed` at runtime.
			expect(node.children).toBeUndefined();
			expect(node.slug).toBeUndefined();
			expect(node.label.length).toBeGreaterThan(0);
		}
	});
});
