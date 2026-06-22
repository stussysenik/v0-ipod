import {
	assign,
	fromPromise,
	setup,
} from "xstate";
import {
	colorDistance,
	findKumuPaletteProximityMatches,
	generateAnalogousShades,
	generateTonalShades,
	hexToHsl,
	hslToHex,
	normalizeHexColor,
	type ProximityMatch,
} from "@ipod/lib/color-proximity";

export interface ColorMachineContext {
	baseHex: string;
	currentHex: string;
	proximityMatches: ProximityMatch[];
	analogousShades: string[];
	tonalShades: string[];
}

export type ColorMachineEvent =
	| { type: "UPDATE_BASE"; color: string }
	| { type: "APPLY_FUNCTOR" }
	| { type: "APPLY_ADJUNCTION" }
	| { type: "APPLY_MORPHISM" }
	| { type: "APPLY_ANALOGOUS"; index: number }
	| { type: "APPLY_TONAL"; index: number }
	| { type: "RETURN" };

const computeColorDerivations = fromPromise(
	async ({ input }: { input: { hex: string } }) => {
		const hex = normalizeHexColor(input.hex);
		return {
			proximityMatches: findKumuPaletteProximityMatches(hex, 8),
			analogousShades: generateAnalogousShades(hex, 3).slice(0, 5),
			tonalShades: generateTonalShades(hex, 5),
			hex,
		};
	},
);

export const colorCategoryMachine = setup({
	types: {
		context: {} as ColorMachineContext,
		events: {} as ColorMachineEvent,
	},
	actors: { computeColorDerivations },
	guards: {
		hasProximityMatches: ({ context }) => context.proximityMatches.length > 0,
	},
}).createMachine({
	id: "colorCategory",
	initial: "identity",
	context: {
		baseHex: "#111827",
		currentHex: "#111827",
		proximityMatches: [],
		analogousShades: [],
		tonalShades: [],
	},
	states: {
		identity: {
			on: {
				UPDATE_BASE: {
					target: "computing",
					actions: assign({
						baseHex: ({ event }) => event.color,
					}),
				},
				APPLY_FUNCTOR: { target: "endofunctor" },
				APPLY_ADJUNCTION: { target: "adjunction" },
				APPLY_MORPHISM: { target: "morphism" },
				APPLY_ANALOGOUS: {
					target: "analogous",
					actions: assign({
						baseHex: ({ context }) => context.currentHex,
					}),
				},
				APPLY_TONAL: {
					target: "tonal",
					actions: assign({
						baseHex: ({ context }) => context.currentHex,
					}),
				},
			},
		},
		endofunctor: {
			entry: assign({
				currentHex: ({ context }) => {
					const { h, s, l } = hexToHsl(context.baseHex);
					return hslToHex((h + 30) % 360, s, l);
				},
			}),
			on: {
				RETURN: { target: "identity" },
				UPDATE_BASE: {
					target: "computing",
					actions: assign({
						baseHex: ({ event }) => event.color,
					}),
				},
				APPLY_ADJUNCTION: { target: "adjunction" },
			},
		},
		adjunction: {
			entry: assign({
				currentHex: ({ context }) => {
					const { h, s, l } = hexToHsl(context.baseHex);
					return hslToHex((h + 180) % 360, s, l);
				},
			}),
			on: {
				RETURN: { target: "identity" },
				UPDATE_BASE: {
					target: "computing",
					actions: assign({
						baseHex: ({ event }) => event.color,
					}),
				},
				APPLY_FUNCTOR: { target: "endofunctor" },
			},
		},
		morphism: {
			entry: assign({
				currentHex: ({ context }) => {
					const { h, s, l } = hexToHsl(context.baseHex);
					return hslToHex(h, s, Math.min(0.9, l + 0.2));
				},
			}),
			on: {
				RETURN: { target: "identity" },
				UPDATE_BASE: {
					target: "computing",
					actions: assign({
						baseHex: ({ event }) => event.color,
					}),
				},
			},
		},
		analogous: {
			entry: assign({
				currentHex: ({ context, event }) => {
					if (event.type === "APPLY_ANALOGOUS") {
						const shades = generateAnalogousShades(context.baseHex, 3);
						return shades[event.index] ?? shades[0] ?? context.currentHex;
					}
					return context.currentHex;
				},
			}),
			always: { target: "identity" },
		},
		tonal: {
			entry: assign({
				currentHex: ({ context, event }) => {
					if (event.type === "APPLY_TONAL") {
						const shades = generateTonalShades(context.baseHex, 5);
						return shades[event.index] ?? shades[2] ?? context.currentHex;
					}
					return context.currentHex;
				},
			}),
			always: { target: "identity" },
		},
		computing: {
			invoke: {
				src: "computeColorDerivations",
				input: ({ context }) => ({ hex: context.baseHex }),
				onDone: {
					target: "identity",
					actions: assign(({ event }) => ({
						currentHex: event.output.hex,
						proximityMatches: event.output.proximityMatches,
						analogousShades: event.output.analogousShades,
						tonalShades: event.output.tonalShades,
					})),
				},
				onError: {
					target: "identity",
				},
			},
		},
	},
});

export function computeProximityLabel(a: string, b: string): string {
	const d = colorDistance(a, b);
	if (d < 3) return "Exact Match";
	if (d < 8) return "Near Identical";
	if (d < 15) return "Close Shade";
	if (d < 30) return "Similar";
	return "Distant";
}
