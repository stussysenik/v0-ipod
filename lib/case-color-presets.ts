/**
 * Case colour presets, split by whether the claim behind them is factual.
 *
 * THE RULE THIS MODULE ENFORCES
 *
 * A preset presented as an Apple finish must be an Apple finish, attested by the
 * manifest, carrying the generation and year it shipped in. Everything else is a
 * house colour and says so. The two never mix in one list, and a house colour
 * may not borrow the name of an Apple product — a swatch called "Bondi" beside
 * a swatch called "Silver" reads as two entries in one catalogue, and only one
 * of them is true.
 *
 * This is not pedantry about naming. The product's whole proposition is that it
 * is a faithful digital twin; a picker that quietly mixes invented colours into
 * an authentic set spends that credibility for nothing.
 */

import { colorManifest, type AuthenticFinish } from "./color-manifest";
import { deltaECIEDE2000, hexToLab } from "./color-proximity";
import { lightnessOf } from "./color-verdict";

export interface AuthenticPreset {
	kind: "authentic";
	id: string;
	/** The finish's own name, as shipped. */
	label: string;
	hex: string;
	generation: string;
	year: number;
	/** Manifest provenance note. Displayed verbatim; never paraphrased. */
	notes: string;
}

export interface HousePreset {
	kind: "house";
	id: string;
	/** Descriptive, never a product name. See `APPLE_PRODUCT_NAMES`. */
	label: string;
	hex: string;
	/** Why this colour exists in the set. Not a heritage claim. */
	notes: string;
}

export type CasePreset = AuthenticPreset | HousePreset;

const toAuthentic = (f: AuthenticFinish): AuthenticPreset => ({
	kind: "authentic",
	id: f.id,
	label: f.label,
	hex: f.hex,
	generation: f.generation,
	year: f.year,
	notes: f.notes,
});

/**
 * Every finish the manifest attests, ordered light to dark so the strip reads as
 * a ramp. Derived from the manifest rather than transcribed, so there is no copy
 * to drift.
 */
export const AUTHENTIC_PRESETS: readonly AuthenticPreset[] = colorManifest.authenticFinishes
	.map(toAuthentic)
	.sort((a, b) => lightnessOf(b.hex) - lightnessOf(a.hex));

/** Authentic finishes grouped by the generation they shipped in. */
export function authenticPresetsByGeneration(): { generation: string; presets: AuthenticPreset[] }[] {
	const groups = new Map<string, AuthenticPreset[]>();
	for (const preset of AUTHENTIC_PRESETS) {
		groups.set(preset.generation, [...(groups.get(preset.generation) ?? []), preset]);
	}
	return [...groups.entries()]
		.map(([generation, presets]) => ({ generation, presets }))
		.sort((a, b) => Math.min(...a.presets.map((p) => p.year)) - Math.min(...b.presets.map((p) => p.year)));
}

/**
 * Names Apple has shipped as product or finish names. A house preset carrying
 * one of these implies a heritage it does not have.
 *
 * Not exhaustive as a trademark list, and not meant to be — it is a guard
 * against the specific failure of reaching for an Apple-sounding name because it
 * sounds good, which is how "Bondi" and "Graphite" got into this picker.
 */
export const APPLE_PRODUCT_NAMES: readonly string[] = [
	"bondi",
	"graphite",
	"snow",
	"tangerine",
	"blueberry",
	"grape",
	"lime",
	"strawberry",
	"indigo",
	"sage",
	"ruby",
	"flower power",
	"blue dalmatian",
	"space grey",
	"space gray",
	"midnight",
	"starlight",
	"product red",
	"jet black",
	"rose gold",
];

/**
 * House colours. Descriptive names only, each stating what it is rather than
 * what it alludes to. These are offered as a starting point for a custom shell,
 * never as heritage.
 */
export const HOUSE_PRESETS: readonly HousePreset[] = [
	{ kind: "house", id: "house-paper", label: "Paper", hex: "#FBFBF8", notes: "Warm off-white. Highest headroom in the set." },
	{ kind: "house", id: "house-pearl", label: "Pearl", hex: "#E4E4E6", notes: "Cool light neutral." },
	{ kind: "house", id: "house-steel", label: "Steel", hex: "#C7C9CD", notes: "Mid neutral with a blue cast." },
	{ kind: "house", id: "house-gunmetal", label: "Gunmetal", hex: "#535861", notes: "Dark cool neutral." },
	{ kind: "house", id: "house-ink", label: "Ink", hex: "#1B1B1F", notes: "Near-black, cool." },
	{ kind: "house", id: "house-clay", label: "Clay", hex: "#B5121B", notes: "Deep warm red. High chroma; desaturates in the wheel recess." },
	{ kind: "house", id: "house-teal", label: "Teal", hex: "#0E7C9B", notes: "Mid cyan-blue." },
	{ kind: "house", id: "house-brass", label: "Brass", hex: "#C9A86A", notes: "Warm mid yellow." },
	{ kind: "house", id: "house-cobalt", label: "Cobalt", hex: "#2B4C8C", notes: "Deep blue." },
	{ kind: "house", id: "house-moss", label: "Moss", hex: "#7E8C6A", notes: "Desaturated warm green." },
];

export const ALL_PRESETS: readonly CasePreset[] = [...AUTHENTIC_PRESETS, ...HOUSE_PRESETS];

/**
 * Lab chroma below which a house colour reads as a neutral grey.
 *
 * Not a taste threshold — the set is bimodal and this sits in the gap. The
 * neutrals top out at C* 5.86 (Gunmetal); the chromatics start at 20.11 (Moss).
 */
const NEUTRAL_CHROMA_MAX = 10;

const chromaOf = (hex: string): number => {
	const { a, b } = hexToLab(hex);
	return Math.hypot(a, b);
};

/**
 * The neutral house colours, light to dark — the curated row in the grey picker.
 *
 * Derived from `HOUSE_PRESETS`, not transcribed. This used to be a second list
 * in the manifest under `curatedFavorites.case`, holding the same five hexes
 * under different labels plus a sixth called "Silver" (#D9DADC) that was ΔE00
 * 5.93 from the attested silver-6g finish — an Apple finish name on a colour
 * Apple never shipped, which is the exact failure this module exists to stop.
 * House colours have no business in the manifest either way: the manifest's job
 * is attestation, and a house colour is by definition not attested.
 */
export const CASE_CURATED_FAVORITES: readonly { label: string; value: string }[] = HOUSE_PRESETS
	.filter((p) => chromaOf(p.hex) <= NEUTRAL_CHROMA_MAX)
	.slice()
	.sort((a, b) => lightnessOf(b.hex) - lightnessOf(a.hex))
	.map((p) => ({ label: p.label, value: p.hex }));

/**
 * Does a label claim Apple heritage? Word-boundary matched so "Steel" is fine
 * and "Brushed Steel" is fine, while "Graphite" is not.
 */
export function claimsAppleHeritage(label: string): boolean {
	const lower = label.toLowerCase();
	return APPLE_PRODUCT_NAMES.some((name) => new RegExp(`\\b${name}\\b`).test(lower));
}

/**
 * The nearest authentic finish to an arbitrary hex, so a custom colour can state
 * its distance from the real catalogue instead of implying membership in it.
 */
export function nearestAuthenticPreset(hex: string): { preset: AuthenticPreset; deltaE: number } {
	let best: { preset: AuthenticPreset; deltaE: number } | null = null;
	for (const preset of AUTHENTIC_PRESETS) {
		const deltaE = deltaECIEDE2000(hex, preset.hex);
		if (!best || deltaE < best.deltaE) best = { preset, deltaE };
	}
	if (!best) throw new Error("case-color-presets: no authentic presets");
	return best;
}
