import type { Metadata } from "next";

import { IpodPortfolioStage } from "@/components/ipod/scenes/ipod-portfolio-stage";

export const metadata: Metadata = {
	title: "Stüssy Senik · iPod Portfolio",
	description:
		"A portfolio you browse like an iPod — spin the wheel through projects, photos, videos, labs, and CV. Built on a CNC-accurate 3D iPod classic.",
};

export default function PortfolioPage() {
	return (
		<main className="min-h-dvh w-full overflow-hidden bg-white">
			<IpodPortfolioStage />
		</main>
	);
}
