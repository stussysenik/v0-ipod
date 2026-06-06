"use client";

import { EffectComposer, Vignette } from "@react-three/postprocessing";

interface PostProcessingProps {
	enabled?: boolean;
}

/**
 * Minimal composite. A product render wants a clean frame, not film grit — so
 * the only pass is a whisper of vignette to seat the device against the black
 * backdrop. No chromatic aberration (it draws colored fringe lines on every
 * edge) and no noise (it muddies the chrome).
 */
export function PostProcessing({ enabled = true }: PostProcessingProps) {
	if (!enabled) return null;

	return (
		<EffectComposer>
			<Vignette darkness={0.18} offset={0.32} />
		</EffectComposer>
	);
}
