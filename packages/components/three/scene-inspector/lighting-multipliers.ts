/**
 * A throwaway store for RELATIVE lighting-intensity multipliers — the dev
 * scratchpad's "is the look too dark / too bright" dials.
 *
 * The Lighting Cockpit owns the ABSOLUTE per-light values (persistent, reducer-
 * driven, WYSIWYG with the export). This store is the ephemeral complement: a
 * set of multipliers layered on top for rapid experimentation. It is read only
 * by <StudioLighting>, defaults every channel to 1, and is written only by the
 * dev-only Leva scratchpad — so in production (where the scratchpad never mounts)
 * the snapshot is always the identity and the rendered output is unchanged.
 */
export type LightingMultiplierKey = 'ambient' | 'key' | 'fill' | 'rim' | 'env';

export type LightingMultipliers = Record<LightingMultiplierKey, number>;

const IDENTITY: LightingMultipliers = {
	ambient: 1,
	key: 1,
	fill: 1,
	rim: 1,
	env: 1,
};

let state: LightingMultipliers = { ...IDENTITY };
const listeners = new Set<() => void>();

function emit() {
	for (const l of listeners) l();
}

export const lightingMultipliersStore = {
	subscribe(l: () => void) {
		listeners.add(l);
		return () => {
			listeners.delete(l);
		};
	},
	getSnapshot() {
		return state;
	},
	set(key: LightingMultiplierKey, value: number) {
		if (state[key] === value) return;
		state = { ...state, [key]: value };
		emit();
	},
	/**
	 * Apply a full multiplier set in ONE emit. The hot preview + export paths
	 * update all five channels per frame; this keeps that to a single store
	 * change (and a single React re-render) instead of five.
	 */
	setAll(values: Partial<LightingMultipliers>) {
		const next = { ...state, ...values };
		let changed = false;
		for (const k of Object.keys(next) as LightingMultiplierKey[]) {
			if (next[k] !== state[k]) {
				changed = true;
				break;
			}
		}
		if (!changed) return;
		state = next;
		emit();
	},
	reset() {
		if (state === IDENTITY) return;
		state = { ...IDENTITY };
		emit();
	},
};
