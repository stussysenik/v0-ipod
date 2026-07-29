/**
 * The colour engine — one authority every surface reads from.
 *
 * Structure: a flat registry of peers. There is no parent colour and no derived
 * child; every node is addressable by every other node, and a relation between
 * two nodes belongs to neither of them. A pair is therefore stored and emitted
 * ONCE under a canonical unordered key, which is what stops the same combination
 * appearing twice in a list as (a,b) and again as (b,a).
 *
 * Measurement is delegated, never re-implemented: distance is CIEDE2000 from
 * lib/color-proximity.ts (verified against the Sharma reference pairs) and
 * contrast is the WCAG model. Adding a fifth private copy of either is the
 * defect this module exists to close.
 */

import { deltaECIEDE2000, hexToRgb, normalizeHexColor } from "./color-proximity";

export interface ColorNode {
	/** Stable handle. Unique within a registry. */
	id: string;
	hex: string;
	/** What the colour is for. Free-form; rules may filter on it. */
	role?: string;
	/** Colour family as the manifest uses the term: white, black, silver, u2. */
	family?: string;
}

/** A rule is data, so a control surface can build one without new code. */
export interface MatchRule {
	/** Perceptual distance floor — how different a pair must be to read as two colours. */
	minDeltaE?: number;
	/** Perceptual distance ceiling — how close a pair must be to read as coherent. */
	maxDeltaE?: number;
	/** WCAG contrast floor, for pairs that must carry text. */
	minContrast?: number;
	maxContrast?: number;
	/** Restrict to pairs within one family, or across two different families. */
	family?: "same" | "different";
	/** Only consider nodes whose role is in this set. */
	roles?: readonly string[];
}

export interface Match {
	/** Canonical unordered key. Identical for (a,b) and (b,a). */
	key: string;
	a: ColorNode;
	b: ColorNode;
	deltaE: number;
	contrast: number;
}

const HEX = /^#[0-9a-f]{6}$/;
/** Accepted authoring forms: #rgb or #rrggbb, with or without the hash. */
const RAW_HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * sRGB EOTF, for the WCAG luminance model.
 *
 * The knee is 0.04045, the normative IEC 61966-2-1 value. WCAG 2.x quotes
 * 0.03928 instead — a long-standing erratum in the guideline text, not a second
 * model. The distinction is unobservable here and provably so: the two knees
 * bracket the interval (0.03928, 0.04045], and no 8-bit code lands inside it
 * (10/255 = 0.03922, 11/255 = 0.04314). Every hex input therefore takes the same
 * branch under either constant. `color-engine.test.ts` asserts this across all
 * 256 codes, which is what makes collapsing the repo's copies onto this one a
 * proven no-op rather than a judgement call.
 */
function toLinear(c: number): number {
	const s = c / 255;
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * WCAG 2.x relative luminance — THE luminance authority for the repo.
 *
 * This answers one physical question: how much light reaches the eye, weighted
 * for the eye's own spectral sensitivity, for the purpose of predicting whether
 * two colours can be told apart as figure and ground. `color-manifest` and
 * `studio-control-tokens` both defer here; `shared-ui-tokens` reaches it through
 * `studio-control-tokens.contrastRatio`.
 *
 * NOT the same question as `srgbToLinear` in lib/three-color-resolve.ts. That one
 * converts an encoded value into radiometric light so a renderer can do physics
 * on it — per channel, no observer weighting, no contrast semantics. The two look
 * alike because they share a transfer function; merging them would silently make
 * a lighting change a contrast change. They stay separately named on purpose.
 */
export function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.x contrast ratio, ≥ 1. The figure-and-ground question. */
export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Unordered pair identity: sorting the ids makes (a,b) and (b,a) one edge. */
export function pairKey(idA: string, idB: string): string {
	return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

/**
 * A registry of peers. Construction normalises and rejects malformed input up
 * front so a bad hex surfaces where it was authored, not as a silent black
 * swatch three layers down.
 */
export class ColorRegistry {
	private readonly nodes = new Map<string, ColorNode>();

	constructor(nodes: readonly ColorNode[] = []) {
		for (const n of nodes) this.add(n);
	}

	add(node: ColorNode): this {
		// Checked against the raw input: normalizeHexColor answers malformed input
		// with #000000 rather than an error, so normalising first would turn a typo
		// into a legitimate-looking black swatch.
		if (!RAW_HEX.test(node.hex)) {
			throw new Error(`ColorRegistry: invalid hex for "${node.id}": ${node.hex}`);
		}
		const hex = normalizeHexColor(node.hex).toLowerCase();
		if (!HEX.test(hex)) throw new Error(`ColorRegistry: invalid hex for "${node.id}": ${node.hex}`);
		if (this.nodes.has(node.id)) throw new Error(`ColorRegistry: duplicate id "${node.id}"`);
		this.nodes.set(node.id, { ...node, hex });
		return this;
	}

	get(id: string): ColorNode | undefined {
		return this.nodes.get(id);
	}

	list(): ColorNode[] {
		return [...this.nodes.values()];
	}

	get size(): number {
		return this.nodes.size;
	}

	/**
	 * Every unordered pair, measured. Emitted once per pair — the upper triangle
	 * of the relation matrix, never the diagonal and never both triangles.
	 */
	pairs(roles?: readonly string[]): Match[] {
		const nodes = roles ? this.list().filter((n) => n.role && roles.includes(n.role)) : this.list();
		const out: Match[] = [];
		for (let i = 0; i < nodes.length; i += 1) {
			for (let j = i + 1; j < nodes.length; j += 1) {
				const a = nodes[i];
				const b = nodes[j];
				out.push({
					key: pairKey(a.id, b.id),
					a,
					b,
					deltaE: deltaECIEDE2000(a.hex, b.hex),
					contrast: contrastRatio(a.hex, b.hex),
				});
			}
		}
		return out;
	}

	/**
	 * Combinations satisfying a rule, each appearing exactly once, ordered by
	 * perceptual distance so the closest match is first.
	 */
	match(rule: MatchRule = {}): Match[] {
		return this.pairs(rule.roles)
			.filter((m) => satisfies(m, rule))
			.sort((x, y) => x.deltaE - y.deltaE || x.key.localeCompare(y.key));
	}

	/**
	 * Matches involving one node. A peer relation read from one side — the same
	 * edges `match` returns, filtered, never recomputed with a different rule.
	 */
	matchesFor(id: string, rule: MatchRule = {}): Match[] {
		if (!this.nodes.has(id)) throw new Error(`ColorRegistry: unknown id "${id}"`);
		return this.match(rule).filter((m) => m.a.id === id || m.b.id === id);
	}
}

function satisfies(m: Match, rule: MatchRule): boolean {
	if (rule.minDeltaE !== undefined && m.deltaE < rule.minDeltaE) return false;
	if (rule.maxDeltaE !== undefined && m.deltaE > rule.maxDeltaE) return false;
	if (rule.minContrast !== undefined && m.contrast < rule.minContrast) return false;
	if (rule.maxContrast !== undefined && m.contrast > rule.maxContrast) return false;
	if (rule.family === "same" && m.a.family !== m.b.family) return false;
	if (rule.family === "different" && m.a.family === m.b.family) return false;
	return true;
}
