/**
 * Canonical example feed — the default render and the fixture tests pin against.
 *
 * Small but exercises every shape: a nested menu, works with covers/links/body,
 * an external link node, and a full theme. Kept valid at all times (the feed test
 * loads it); treat it as the worked example of the schema.
 */

import type { IpodFeed } from "./schema";

export const EXAMPLE_FEED: IpodFeed = {
	version: 1,
	meta: {
		id: "example",
		title: "iPod Feed",
		description: "The RSS of design engineering — a portfolio you browse like an iPod.",
		author: "Example",
		url: "https://example.com",
	},
	theme: {
		accent: "#0048FF",
		background: "#000000",
		surface: "#111214",
		foreground: "#f5f5f7",
		muted: "#8a8a8e",
		fontSans: "'Inter', system-ui, sans-serif",
		fontMono: "'Berkeley Mono', ui-monospace, monospace",
		radius: "12px",
	},
	menu: [
		{
			id: "works",
			label: "Works",
			children: [
				{ id: "m-aurora", label: "Aurora", slug: "aurora" },
				{ id: "m-tident", label: "Trident", slug: "trident" },
			],
		},
		{ id: "about", label: "About", slug: "about" },
		{ id: "contact", label: "Contact", href: "mailto:hello@example.com" },
	],
	works: [
		{
			slug: "aurora",
			title: "Aurora",
			summary: "A real-time color engine for product photography.",
			cover: "asset-aurora",
			accent: "#5B8DEF",
			year: "2025",
			role: "Design Engineer",
			tags: ["webgl", "color"],
			links: [{ label: "Live", href: "https://example.com/aurora" }],
			body: "Aurora renders deterministic studio lighting in the browser.",
		},
		{
			slug: "trident",
			title: "Trident",
			summary: "Three-way export pipeline with WYSIWYG proofs.",
			cover: "https://example.com/trident.jpg",
			year: "2024",
			tags: ["export"],
			links: [],
		},
		{
			slug: "about",
			title: "About",
			summary: "Design engineer & creative producer.",
			tags: [],
			links: [{ label: "CV", href: "https://example.com/cv" }],
			body: "I build tactile, museum-grade software.",
		},
	],
	assets: [
		{
			id: "asset-aurora",
			src: "/feed/aurora-cover.jpg",
			alt: "Aurora cover",
			type: "image",
			width: 1200,
			height: 1200,
		},
	],
};
