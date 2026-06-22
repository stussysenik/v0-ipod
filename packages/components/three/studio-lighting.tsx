"use client";

import { Backdrop, Environment, Lightformer } from "@react-three/drei";

import { APPLE_PRODUCT_RIG, type StudioLightingConfig } from "@ipod/lib/studio-lighting-config";

/**
 * studio-lighting — the *render* half of the `/3d` rig.
 *
 * The lighting DATA (the `StudioLightingConfig` type and the named `APPLE_PRODUCT_RIG`
 * default) now lives in the framework-free `@/lib/studio-lighting-config` module, so the
 * persisted workbench model and the Lighting Cockpit can read/edit the exact same record
 * this component renders. See that file for the env-first lighting philosophy. Re-exported
 * here so existing importers keep working.
 */
export { APPLE_PRODUCT_RIG, type StudioLightingConfig };

/**
 * Studio field — a uniform, unlit backdrop behind the device.
 *
 * This used to carry a radial-gradient sweep (brightest behind the subject, falling off to the
 * frame edges) to fake studio depth. But a gradient is fixed in world space: the instant the
 * camera moves, the device slides across a *varying* background, so a motion loop reads
 * inconsistent and the falloff competes with the Now Playing screen for the eye. The single job
 * of this surface is to be recessive negative space, so it's now a FLAT field — every pixel the
 * exact Stage colour regardless of the cove's curvature or the camera angle (an unlit
 * `meshBasicMaterial`, `toneMapped={false}`, so it's perfectly predictable and WYSIWYG between
 * the live canvas and the export, immune to the env-first rig).
 *
 * Constant every frame → the device reads identically through the whole move and the exports
 * land neutral, matching the clean 2D plate. Grounding comes from the separate ContactShadows
 * shadow-catcher, not from any backdrop gradient. The Stage colour still drives it, so the
 * colour cockpit keeps full control — it just drives a uniform field now, not a gradient.
 */
export function StudioBackdrop({ stageColor = "#ffffff" }: { stageColor?: string }) {
	return (
		<Backdrop floor={1.5} position={[0, -3.55, -7]} receiveShadow={false} scale={[46, 26, 14]} segments={24}>
			<meshBasicMaterial color={stageColor} toneMapped={false} />
		</Backdrop>
	);
}

/**
 * Render a studio lighting rig from its config. Defaults to the named Apple Product rig;
 * pass an overridden config (Phase 3 dev panel) to live-tune material/lighting.
 */
export function StudioLighting({ config = APPLE_PRODUCT_RIG }: { config?: StudioLightingConfig }) {
	const { ambient, key, fill, rim, env } = config;
	return (
		<>
			<ambientLight color={ambient.color} intensity={ambient.intensity} />
			<spotLight
				castShadow={key.castShadow}
				angle={key.angle}
				color={key.color}
				intensity={key.intensity}
				penumbra={key.penumbra}
				position={key.position}
				shadow-bias={-0.0001}
				shadow-mapSize={[1024, 1024]}
			/>
			<spotLight angle={fill.angle} color={fill.color} intensity={fill.intensity} penumbra={fill.penumbra} position={fill.position} />
			<spotLight angle={rim.angle} color={rim.color} intensity={rim.intensity} penumbra={rim.penumbra} position={rim.position} />
			<Environment background={false} blur={env.blur} environmentIntensity={env.intensity} frames={1} preset={env.preset}>
				{env.softboxes.map((s, i) => (
					<Lightformer key={i} color={s.color} intensity={s.intensity} position={s.position} scale={s.scale} />
				))}
			</Environment>
		</>
	);
}
