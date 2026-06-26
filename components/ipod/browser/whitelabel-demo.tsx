"use client";

/**
 * White-label proof: the same `<IpodFeedBrowser>` renders two completely different
 * brands purely by swapping the feed (content + theme tokens). No code changes
 * between them — that is the sellable claim. Swapping the feed re-skins the whole
 * stage because theme tokens are just `--ipod-*` variables.
 */

import { useState } from "react";

import type { IpodFeed } from "@/lib/feed/schema";

import { IpodClassicEmbed } from "./ipod-classic-embed";

const NOIR: IpodFeed = {
	version: 1,
	meta: { id: "noir", title: "Studio Noir", description: "A monochrome design studio." },
	theme: {
		accent: "#0048FF",
		background: "#08090b",
		surface: "#101114",
		foreground: "#f4f4f6",
		muted: "#7c7d82",
		radius: "12px",
	},
	menu: [
		{ id: "work", label: "Work", children: [{ id: "w1", label: "Atlas", slug: "atlas" }, { id: "w2", label: "Vapor", slug: "vapor" }] },
		{ id: "studio", label: "Studio", slug: "studio" },
		{ id: "say-hi", label: "Say Hi", href: "mailto:hi@noir.studio" },
	],
	works: [
		{ slug: "atlas", title: "Atlas", summary: "A wayfinding system for transit.", year: "2025", role: "Lead", tags: ["systems"], links: [{ label: "Case", href: "https://example.com/atlas" }] },
		{ slug: "vapor", title: "Vapor", summary: "Generative album art at scale.", year: "2024", tags: ["generative"], links: [] },
		{ slug: "studio", title: "Studio Noir", summary: "Two people, calm software.", tags: [], links: [], body: "We make high-signal interfaces." },
	],
	assets: [],
};

const SUNSET: IpodFeed = {
	version: 1,
	meta: { id: "sunset", title: "Sunset Co.", description: "A warm consumer brand." },
	theme: {
		accent: "#FF5A2C",
		background: "#1a0f0a",
		surface: "#2a1a12",
		foreground: "#fff4ec",
		muted: "#c89a86",
		fontSans: "'Georgia', serif",
		radius: "20px",
	},
	menu: [
		{ id: "shop", label: "Shop", children: [{ id: "s1", label: "Citrus Kit", slug: "citrus" }, { id: "s2", label: "Dune Tote", slug: "dune" }] },
		{ id: "story", label: "Our Story", slug: "story" },
		{ id: "ig", label: "Instagram", href: "https://instagram.com" },
	],
	works: [
		{ slug: "citrus", title: "Citrus Kit", summary: "Cold-pressed everything.", year: "2026", tags: ["product"], links: [{ label: "Buy", href: "https://example.com/citrus" }] },
		{ slug: "dune", title: "Dune Tote", summary: "Recycled canvas, desert dyes.", tags: ["product"], links: [] },
		{ slug: "story", title: "Our Story", summary: "Made in the golden hour.", tags: [], links: [], body: "Sunset Co. started on a porch." },
	],
	assets: [],
};

const FEEDS = [NOIR, SUNSET];

export function WhitelabelDemo() {
	const [index, setIndex] = useState(0);
	const feed = FEEDS[index];
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
			<div style={{ display: "flex", gap: 8 }}>
				{FEEDS.map((f, i) => (
					<button
						key={f.meta.id}
						type="button"
						onClick={() => setIndex(i)}
						aria-pressed={i === index}
						style={{
							padding: "8px 16px",
							borderRadius: 999,
							border: "1px solid #444",
							cursor: "pointer",
							background: i === index ? "#fff" : "transparent",
							color: i === index ? "#000" : "#fff",
							font: "inherit",
						}}
					>
						{f.meta.title}
					</button>
				))}
			</div>
			{/* Bounded width to prove container-query (not viewport) responsiveness.
			    Mounts the actual browser-native <ipod-classic> element. */}
			<div style={{ inlineSize: "min(420px, 92vw)" }}>
				<IpodClassicEmbed feed={feed} />
			</div>
		</div>
	);
}
