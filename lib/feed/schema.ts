/**
 * IpodFeed — the versioned, declarative content manifest.
 *
 * The iPod renders *data*, not hardcoded JSX. A single feed (meta, theme tokens,
 * a menu tree, works, and assets) is enough to render any branded portfolio: swap
 * the feed + tokens and you get a new instance. This is the substrate the browser
 * navigation, the Lit `<ipod-classic>` element, and `/portfolio` all consume.
 *
 * Framework-neutral by construction: zod + plain types, zero React/DOM. Both the
 * React workbench and the Lit element validate against the same schema here.
 */

import { z } from "zod";

/** Current feed schema version. Bump on breaking shape changes; loaders pin this. */
export const FEED_VERSION = 1;

/**
 * Theme tokens map 1:1 to CSS custom properties consumed by the keep-out stage.
 * Known keys are optional (the stage ships defaults); a feed may add its own via
 * the catchall. White-labeling is "provide tokens", never "edit code".
 */
export const ThemeTokensSchema = z
	.object({
		accent: z.string().optional(),
		background: z.string().optional(),
		surface: z.string().optional(),
		foreground: z.string().optional(),
		muted: z.string().optional(),
		fontSans: z.string().optional(),
		fontMono: z.string().optional(),
		radius: z.string().optional(),
	})
	.catchall(z.string());

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

/** A media asset referenced by id from works/menu so the same file is declared once. */
export const AssetSchema = z.object({
	id: z.string().min(1),
	src: z.string().min(1),
	alt: z.string().optional(),
	type: z.enum(["image", "video"]).default("image"),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

/** An outbound link on a work's preview (the "link-bio" rows). */
export const WorkLinkSchema = z.object({
	label: z.string().min(1),
	href: z.string().min(1),
});

export type WorkLink = z.infer<typeof WorkLinkSchema>;

/**
 * A work is a self-contained, link-bio-grade preview: it carries everything needed
 * to render its own card AND its expanded case-study surface (IA model C).
 */
export const WorkSchema = z.object({
	slug: z
		.string()
		.min(1)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
	title: z.string().min(1),
	summary: z.string().optional(),
	/** Asset id, or a direct URL. Resolved against `assets` at load time. */
	cover: z.string().optional(),
	accent: z.string().optional(),
	year: z.string().optional(),
	role: z.string().optional(),
	tags: z.array(z.string()).default([]),
	links: z.array(WorkLinkSchema).default([]),
	/** Long-form body, rendered in the expanded surface. Plain markdown/text. */
	body: z.string().optional(),
});

export type Work = z.infer<typeof WorkSchema>;

/**
 * The menu tree — the browser IA. A node is exactly one of: a submenu (`children`),
 * a work opener (`slug`), or an external link (`href`). Recursive via `z.lazy`.
 */
export type MenuNode = {
	id: string;
	label: string;
	icon?: string;
	children?: MenuNode[];
	slug?: string;
	href?: string;
};

export const MenuNodeSchema: z.ZodType<MenuNode> = z.lazy(() =>
	z
		.object({
			id: z.string().min(1),
			label: z.string().min(1),
			icon: z.string().optional(),
			children: z.array(MenuNodeSchema).optional(),
			slug: z.string().optional(),
			href: z.string().optional(),
		})
		.refine(
			(n) => [n.children, n.slug, n.href].filter((v) => v !== undefined).length === 1,
			{ message: "menu node must have exactly one of: children, slug, href" },
		),
);

export const FeedMetaSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	description: z.string().optional(),
	author: z.string().optional(),
	url: z.string().optional(),
});

export type FeedMeta = z.infer<typeof FeedMetaSchema>;

/** The whole manifest. `version` gates compatibility; loaders reject mismatches. */
export const IpodFeedSchema = z.object({
	version: z.literal(FEED_VERSION),
	meta: FeedMetaSchema,
	theme: ThemeTokensSchema.default({}),
	menu: z.array(MenuNodeSchema).min(1),
	works: z.array(WorkSchema).default([]),
	assets: z.array(AssetSchema).default([]),
});

export type IpodFeed = z.infer<typeof IpodFeedSchema>;
