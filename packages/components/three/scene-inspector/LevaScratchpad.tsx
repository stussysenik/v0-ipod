'use client';

import { button, folder, Leva, useControls } from 'leva';
import { useEffect } from 'react';
import { type LightingMultiplierKey, lightingMultipliersStore } from './lighting-multipliers';

/**
 * A dev-only Leva scratchpad for RELATIVE lighting-intensity multipliers.
 *
 * The Lighting Cockpit owns the absolute per-light values (persistent, reducer-
 * driven); this panel is the ephemeral complement — throwaway "what if everything
 * were 20% brighter" scaling for rapid look experimentation. Values are written
 * to `lightingMultipliersStore`, which <StudioLighting> reads and applies.
 *
 * Mounted only in development behind a static NODE_ENV gate and a next/dynamic
 * import, so the Leva dependency never enters the production bundle.
 */
export function LevaScratchpad() {
	const multipliers = useControls({
		Lighting: folder(
			{
				ambient: { value: 1, min: 0, max: 3, step: 0.01, label: 'Ambient' },
				key: { value: 1, min: 0, max: 3, step: 0.01, label: 'Key' },
				fill: { value: 1, min: 0, max: 3, step: 0.01, label: 'Fill' },
				rim: { value: 1, min: 0, max: 3, step: 0.01, label: 'Rim' },
				env: { value: 1, min: 0, max: 3, step: 0.01, label: 'Environment' },
			},
			{ collapsed: false },
		),
		'Reset all': button(() => lightingMultipliersStore.reset()),
	});

	// Push Leva's values into the store whenever they change.
	useEffect(() => {
		(Object.keys(multipliers) as LightingMultiplierKey[]).forEach((key) => {
			const value = multipliers[key];
			if (typeof value === 'number') lightingMultipliersStore.set(key, value);
		});
	}, [multipliers]);

	return (
		<Leva
			collapsed={false}
			oneLineLabels
			titleBar={{ title: 'Scratchpad' }}
			theme={{
				colors: {
					accent1: '#a78bfa',
					accent2: '#a78bfa',
					accent3: '#a78bfa',
				},
			}}
		/>
	);
}
