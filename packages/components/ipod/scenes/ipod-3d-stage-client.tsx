"use client";

import dynamic from "next/dynamic";

// The 3D studio is a fully client-side surface: a WebGL canvas plus a workbench
// whose entire initial state is rehydrated from localStorage (case/finish colors,
// camera presets, studio shots, locked pose). Server-rendering it produced a
// guaranteed hydration mismatch — the server has no localStorage, so it paints the
// defaults (white stage, #141212 center) while the client's first render paints the
// persisted look (#0B0D12 stage, #303030 center). React then discarded and rebuilt
// the tree. SSR buys this route nothing (the canvas is already client-only and the
// page needs no SEO), so we render the whole stage client-only — which removes the
// mismatch at the source rather than papering over each field.
const Ipod3DStage = dynamic(
	() => import("./ipod-3d-stage").then((m) => m.Ipod3DStage),
	{
		ssr: false,
		// Hold the same neutral surface the page wrapper paints, so the load reads as
		// a plain "still loading" beat rather than a flash of the wrong theme.
		loading: () => <div className="h-dvh w-full" aria-hidden />,
	},
);

export function Ipod3DStageClient() {
	return <Ipod3DStage />;
}
