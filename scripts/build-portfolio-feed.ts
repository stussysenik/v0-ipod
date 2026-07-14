/**
 * Writes `content/senik.feed.json` from `lib/portfolio/data.ts`.
 *
 * The feed is what `/portfolio` and `/3d-portfolio` render; `data.ts` is where its
 * content is authored. This script is the only thing allowed to bridge them — do not
 * hand-edit the JSON, or `build-feed.test.ts` will fail on the next run and tell you so.
 *
 *   pnpm feed:build
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildSenikFeed } from "../lib/portfolio/build-feed";

const OUT = resolve(import.meta.dirname, "../content/senik.feed.json");

const feed = buildSenikFeed();
writeFileSync(OUT, `${JSON.stringify(feed, null, 2)}\n`, "utf8");

console.log(
	`feed → ${OUT}\n  ${feed.works.length} works · ${feed.menu.length} menu sections`,
);
