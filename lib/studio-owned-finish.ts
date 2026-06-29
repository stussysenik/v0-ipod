/**
 * studio-owned-finish — the render function takes OWNERSHIP of a clean export.
 *
 * The `/3d` studio lets an end-user pick device colours against a stage colour, then export a
 * motion clip. Across that combinatorial space one render-owned invariant must always hold,
 * independent of the picked colours and the motion:
 *
 *   I1  no specular crawl — the polished back never drops below STEEL_ROUGHNESS_FLOOR, so a
 *                           turntable melts the env's bright spots into a smooth moving gradient
 *                           instead of crawling hotspots. (Applied at the material.)
 *
 * NOTE — the studio LIGHTING is deliberately NOT a function of the chosen colours. The rig the
 * scene renders is exactly the lighting config the user dialled in (`studio.lighting`); colours
 * and the stage/background never reshape the light. That keeps the two independent and the export
 * fingerprint's `lighting` field a complete, deterministic description of the rig. (Earlier this
 * module also reshaped the rig's light energy from the colours for auto-separation/no-crush — that
 * coupling was removed in favour of explicit, deterministic manual control.)
 */

/**
 * Below this GGX roughness the steel back is a 1:1 mirror: a turntable's full 360° azimuth then
 * converts the camera's angular velocity directly into hotspots crawling across the back
 * whenever the env carries discrete point sources (the Night preset's street lights), strobing
 * once per cycle — the opposite of "pleasing to watch on a loop". At 0.13 the GGX lobe is wide
 * enough to low-pass those spots into a smooth gradient while clearcoat keeps the wet polish.
 * Exported as the single source of truth so the material can't silently regress below it.
 */
export const STEEL_ROUGHNESS_FLOOR = 0.13;
