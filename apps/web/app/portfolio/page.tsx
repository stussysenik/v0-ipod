import type { Metadata } from "next";

import { IpodPortfolioStage } from "@ipod/components/ipod/scenes/ipod-portfolio-stage";

export const metadata: Metadata = {
	title: "Stüssy Senik · iPod Portfolio",
	description:
		"A portfolio you browse like an iPod — spin the wheel through works, the hiring case, writings, labs, and CV. Design Engineer & Creative Producer. REMIX, RE-THINK, RE:IMAGINE.",
};

export default function PortfolioPage() {
	return (
		// The stage paints its own Noir backdrop; the main matches so overscroll
		// and the PWA letterbox never flash white around the blue field.
		<main className="min-h-dvh w-full overflow-hidden bg-[#0048FF]">
			<IpodPortfolioStage />
		</main>
	);
}
