"use client";

import {
  EffectComposer,
  ChromaticAberration,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";

interface PostProcessingProps {
  exportMode?: boolean;
  enabled?: boolean;
}

export function PostProcessing({
  exportMode = false,
  enabled = true,
}: PostProcessingProps) {
  if (!enabled) return null;

  return (
    <EffectComposer>
      {/* Keep aberration nearly imperceptible to avoid synthetic RGB fringing */}
      <ChromaticAberration
        offset={new Vector2(0.00035, 0.00035)}
        radialModulation
        modulationOffset={0.2}
      />
      {/* Keep grain almost invisible for clean industrial renders */}
      <Noise opacity={exportMode ? 0.01 : 0.008} blendFunction={BlendFunction.OVERLAY} />
      {/* Softer vignette for gentle edge falloff */}
      <Vignette offset={0.2} darkness={exportMode ? 0.18 : 0.14} />
    </EffectComposer>
  );
}
