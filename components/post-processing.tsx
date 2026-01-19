"use client"

import { EffectComposer, ChromaticAberration, Noise, Vignette } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import { Vector2 } from "three"

interface PostProcessingProps {
  exportMode?: boolean
  enabled?: boolean
}

export function PostProcessing({ exportMode = false, enabled = true }: PostProcessingProps) {
  if (!enabled) return null

  return (
    <EffectComposer>
      {/* Chromatic aberration - subtle RGB separation at edges */}
      <ChromaticAberration
        offset={new Vector2(0.002, 0.002)}
        radialModulation
        modulationOffset={0.5}
      />
      {/* Film grain - 2-3% noise per PDF spec */}
      <Noise
        opacity={exportMode ? 0.03 : 0.02}
        blendFunction={BlendFunction.OVERLAY}
      />
      {/* Vignette for depth */}
      <Vignette
        offset={0.1}
        darkness={exportMode ? 0.4 : 0.3}
      />
    </EffectComposer>
  )
}
