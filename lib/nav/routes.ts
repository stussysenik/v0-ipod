/**
 * The app's route graph — declared once, as data.
 *
 * Before this module the graph was four hard-coded hrefs scattered across a rail
 * button, a command entry, and two pages, which meant no one could ask "is every
 * surface reachable?" — and the answer, for two of them, was no. `/portfolio` and
 * `/3d-portfolio` shipped with zero inbound edges and no way home.
 *
 * Keeping the edges here makes reachability a property of one value, so
 * `routes.test.ts` can assert what no per-page test can see: every surface is
 * reachable from home, and every surface can get back to it.
 */

import type { MenuNode } from "@/lib/feed/schema";

export const HOME = "/";

export type SurfaceRoute = "/" | "/3d" | "/portfolio" | "/3d-portfolio";

export const SURFACE_LABEL: Record<SurfaceRoute, string> = {
	"/": "iPod",
	"/3d": "3D Studio",
	"/portfolio": "Portfolio",
	"/3d-portfolio": "3D Portfolio",
};

/**
 * Outbound in-app edges per surface. The device pair (`/ ⇄ /3d`) is mirrored by the
 * portfolio pair (`/portfolio ⇄ /3d-portfolio`), and both portfolio surfaces carry a
 * way home — otherwise reaching one is a dead end.
 */
export const SURFACE_EDGES: Record<SurfaceRoute, readonly SurfaceRoute[]> = {
	"/": ["/3d", "/portfolio"],
	"/3d": ["/"],
	"/portfolio": ["/3d-portfolio", "/"],
	"/3d-portfolio": ["/portfolio", "/"],
};

/**
 * Routes deliberately kept out of the visitor's journey (§10.6). `/whitelabel` is the
 * embed demo for the portable custom element and `/dev` is an internal workbench —
 * both are reachable by URL on purpose and neither should grow an inbound link.
 * Listing them here is the "say so" the spec asked for: the graph test treats an
 * unlisted route as an error unless it appears in this array.
 */
export const UNLISTED_ROUTES = ["/whitelabel", "/dev"] as const;

/**
 * The portfolio surfaces navigate through the device's own menu, not through chrome
 * wrapped around it — D12 ("the device is the product") is honored rather than traded
 * against, because the iPod's menu is already a navigation hierarchy. These ride the
 * existing `href` → `pendingLink` path, so no new mechanism is introduced.
 */
export function surfaceNavNodes(from: SurfaceRoute): MenuNode[] {
	return SURFACE_EDGES[from].map((href) => ({
		id: `nav:${href}`,
		label: SURFACE_LABEL[href],
		href,
	}));
}
