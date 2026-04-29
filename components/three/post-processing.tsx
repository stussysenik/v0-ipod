"use client";

import { ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

interface PostProcessingProps {
	exportMode?: boolean;
	enabled?: boolean;
}

export function PostProcessing({ exportMode = false, enabled = true }: PostProcessingProps) {
	if (!enabled) return null;

	return (
		<EffectComposer>
			{/* Keep aberration nearly imperceptible to avoid synthetic RGB fringing */}
			<ChromaticAberration
				radialModulation
				modulationOffset={0.2}
				offset={new Vector2(0.00035, 0.00035)}
			/>
			{/* Keep grain almost invisible for clean industrial renders */}
			<Noise
				blendFunction={BlendFunction.OVERLAY}
				opacity={exportMode ? 0.01 : 0.008}
			/>
			{/* Softer vignette for gentle edge falloff */}
			<Vignette darkness={exportMode ? 0.18 : 0.14} offset={0.2} />
		</EffectComposer>
	);
}
