import type { Metadata } from "next";

import { Ipod3DStageClient } from "@ipod/components/ipod/scenes/ipod-3d-stage-client";

export const metadata: Metadata = {
	title: "iPod · 3D Focus",
	description:
		"A focused 3D render of the iPod classic — physically accurate proportions, live display and click wheel, and a finished steel back.",
};

export default function ThreeDFocusPage() {
	return (
		<main className="min-h-dvh w-full overflow-hidden bg-white">
			<Ipod3DStageClient />
		</main>
	);
}
