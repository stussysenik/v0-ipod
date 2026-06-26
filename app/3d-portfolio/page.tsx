import type { Metadata } from "next";

import { IpodPortfolioStage } from "@/components/ipod/scenes/ipod-portfolio-stage";
import senikFeed from "@/content/senik.feed.json";
import type { IpodFeed } from "@/lib/feed/schema";

export const metadata: Metadata = {
	title: "Stüssy Senik · iPod Portfolio (3D)",
	description:
		"The portfolio you browse like an iPod — rendered in 3D. Spin the wheel through works, writing, and labs on a physically accurate iPod classic.",
};

// Same canonical feed as `/portfolio`; only the device shell differs (3D vs flat).
const feed = senikFeed as unknown as IpodFeed;

export default function ThreeDPortfolioPage() {
	return (
		<main className="min-h-dvh w-full overflow-hidden">
			<IpodPortfolioStage feed={feed} />
		</main>
	);
}
