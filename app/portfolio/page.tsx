import type { Metadata } from "next";

import { PortfolioFeedStage } from "@/components/ipod/scenes/portfolio-feed-stage";
import senikFeed from "@/content/senik.feed.json";
import type { IpodFeed } from "@/lib/feed/schema";

export const metadata: Metadata = {
	title: "Stüssy Senik · iPod Portfolio",
	description:
		"A portfolio you browse like an iPod — spin the wheel through works, writing, labs, and the hiring case. Design Engineer & Creative Producer.",
};

// The feed is the single source of truth (authored from lib/portfolio/data.ts); the
// shared renderer turns it into a container-query, white-label iPod. The JSON is
// validated at runtime inside the renderer (loadFeed); the cast only satisfies TS.
const feed = senikFeed as unknown as IpodFeed;

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
