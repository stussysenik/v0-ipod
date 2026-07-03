import type { Metadata } from "next";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import { Ipod3DStageClient } from "@/components/ipod/scenes/ipod-3d-stage-client";

export const metadata: Metadata = {
	title: "iPod · 3D Focus",
	description:
		"A focused 3D render of the iPod classic — physically accurate proportions, live display and click wheel, and a finished steel back.",
};

export default function ThreeDFocusPage() {
	return (
		<main className="min-h-dvh w-full overflow-hidden bg-white">
			<AppErrorBoundary label="3D stage">
				<Ipod3DStageClient />
			</AppErrorBoundary>
		</main>
	);
}
