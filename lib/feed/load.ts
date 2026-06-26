/**
 * Feed loader — validate, then normalize.
 *
 * `loadFeed` is the single door an unknown feed passes through. Invalid feeds fail
 * loudly with field-level errors (no silent coercion); valid feeds come back as a
 * `NormalizedFeed` with the lookup indices every consumer needs (slug → work,
 * id → asset, resolved covers). Pure: no fetch, no DOM — callers supply the object.
 */

import { z } from "zod";

import { IpodFeedSchema, type Asset, type IpodFeed, type Work } from "./schema";

/** One field-level validation problem. `path` is dot/bracket-joined for humans. */
export type FeedIssue = { path: string; message: string };

export class FeedValidationError extends Error {
	readonly issues: FeedIssue[];
	constructor(issues: FeedIssue[]) {
		super(
			`Invalid IpodFeed (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n` +
				issues.map((i) => `  • ${i.path || "<root>"}: ${i.message}`).join("\n"),
		);
		this.name = "FeedValidationError";
		this.issues = issues;
	}
}

function formatPath(path: PropertyKey[]): string {
	return path
		.map((seg, i) =>
			typeof seg === "number" ? `[${seg}]` : i === 0 ? String(seg) : `.${String(seg)}`,
		)
		.join("");
}

export type NormalizedFeed = {
	feed: IpodFeed;
	worksBySlug: Map<string, Work>;
	assetsById: Map<string, Asset>;
	/** Resolve a work's `cover` (asset id or direct URL) to a concrete asset, if any. */
	resolveCover: (work: Work) => Asset | undefined;
};

/**
 * Validate `input` against the feed schema and build lookup indices.
 * @throws {FeedValidationError} with every field-level issue when invalid.
 */
export function loadFeed(input: unknown): NormalizedFeed {
	const result = IpodFeedSchema.safeParse(input);
	if (!result.success) {
		throw new FeedValidationError(zodIssues(result.error));
	}
	const feed = result.data;

	const assetsById = new Map(feed.assets.map((a) => [a.id, a]));
	const worksBySlug = new Map<string, Work>();
	const dupes: FeedIssue[] = [];
	feed.works.forEach((w, i) => {
		if (worksBySlug.has(w.slug)) {
			dupes.push({ path: `works[${i}].slug`, message: `duplicate slug "${w.slug}"` });
		}
		worksBySlug.set(w.slug, w);
	});
	// Every menu node that opens a work must point at a real slug.
	collectSlugRefs(feed).forEach(({ slug, path }) => {
		if (!worksBySlug.has(slug)) {
			dupes.push({ path, message: `menu references unknown work slug "${slug}"` });
		}
	});
	if (dupes.length > 0) throw new FeedValidationError(dupes);

	const resolveCover = (work: Work): Asset | undefined => {
		if (!work.cover) return undefined;
		const byId = assetsById.get(work.cover);
		if (byId) return byId;
		// A direct URL cover becomes a one-off asset so consumers have a uniform shape.
		return { id: work.cover, src: work.cover, type: "image" };
	};

	return { feed, worksBySlug, assetsById, resolveCover };
}

function zodIssues(error: z.ZodError): FeedIssue[] {
	return error.issues.map((issue) => ({
		path: formatPath(issue.path),
		message: issue.message,
	}));
}

/** Walk the menu tree, collecting every `slug` reference with its source path. */
function collectSlugRefs(feed: IpodFeed): { slug: string; path: string }[] {
	const refs: { slug: string; path: string }[] = [];
	const walk = (nodes: IpodFeed["menu"], base: string) => {
		nodes.forEach((node, i) => {
			const here = `${base}[${i}]`;
			if (node.slug) refs.push({ slug: node.slug, path: `${here}.slug` });
			if (node.children) walk(node.children, `${here}.children`);
		});
	};
	walk(feed.menu, "menu");
	return refs;
}
