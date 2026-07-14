import type { Metadata } from "next";

import { PortfolioFeedStage } from "@/components/ipod/scenes/portfolio-feed-stage";
import senikFeed from "@/content/senik.feed.json";
import type { IpodFeed } from "@/lib/feed/schema";
import { surfaceNavNodes } from "@/lib/nav/routes";

export const metadata: Metadata = {
	title: "Stüssy Senik · iPod Portfolio",
	description:
		"A portfolio you browse like an iPod — spin the wheel through the works, the process, and the hiring case. R&D Experience Design Engineer.",
};

// The feed is the single source of truth (authored from lib/portfolio/data.ts); the
// shared renderer turns it into a container-query, white-label iPod. The JSON is
// validated at runtime inside the renderer (loadFeed); the cast only satisfies TS.
const base = senikFeed as unknown as IpodFeed;

// The way out lives in the device's menu, appended here rather than in the feed JSON:
// that file is also the portable custom element's content, and an embedded iPod must
// not carry links to *this* site's routes (`/` would resolve to the embedder's root).
// Routes are a property of the hosting surface, so the surface is what adds them.
const feed: IpodFeed = {
	...base,
	menu: [...base.menu, ...surfaceNavNodes("/portfolio")],
};

export default function PortfolioPage() {
	return (
		<main
			style={{
				minBlockSize: "100dvh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "24px 16px",
				background: feed.theme.background ?? "#000",
			}}
		>
			{/* Bounded so the real device sits centered without fighting the viewport. */}
			<div style={{ inlineSize: "min(360px, 92vw)" }}>
				<PortfolioFeedStage feed={feed} />
			</div>
		</main>
	);
}
