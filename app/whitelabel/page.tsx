import type { Metadata } from "next";

import { WhitelabelDemo } from "@/components/ipod/browser/whitelabel-demo";

export const metadata: Metadata = {
	title: "White-Label · iPod",
	description:
		"One element, any brand. The same iPod renders two different portfolios by swapping the feed and theme tokens — the white-label proof.",
};

export default function WhitelabelPage() {
	return (
		<main
			style={{
				minBlockSize: "100dvh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 24,
				padding: "32px 16px",
				background: "#000",
				color: "#fff",
			}}
		>
			<header style={{ textAlign: "center", maxInlineSize: 520 }}>
				<h1 style={{ fontSize: 22, margin: 0 }}>One element, any brand</h1>
				<p style={{ color: "#8a8a8e", fontSize: 14, marginTop: 8 }}>
					The same <code>&lt;ipod-classic&gt;</code> renders both — only the feed and theme tokens
					change. It is container-query responsive, so it is correct at any embed size.
				</p>
			</header>
			<WhitelabelDemo />
		</main>
	);
}
