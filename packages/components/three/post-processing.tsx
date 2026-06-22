"use client";

import { ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface PostProcessingProps {
	enabled?: boolean;
}

export function PostProcessing({ enabled = true }: PostProcessingProps) {
	if (!enabled) return null;

	return (
		<EffectComposer>
			<ChromaticAberration
				radialModulation
				modulationOffset={0.15}
				offset={[0.0003, 0.0003]}
			/>
			<Noise
				blendFunction={BlendFunction.OVERLAY}
				opacity={0.006}
			/>
			<Vignette darkness={0.12} offset={0.18} />
		</EffectComposer>
	);
}
