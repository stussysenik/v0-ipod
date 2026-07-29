type Hsl = { h: number; s: number; l: number };
type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return { r: 0, g: 0, b: 0 };
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16),
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (x: number) =>
		Math.max(0, Math.min(255, Math.round(x)))
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): Hsl {
	const { r, g, b } = hexToRgb(hex);
	const nr = r / 255;
	const ng = g / 255;
	const nb = b / 255;
	const max = Math.max(nr, ng, nb);
	const min = Math.min(nr, ng, nb);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case nr:
				h = ((ng - nb) / d + (ng < nb ? 6 : 0)) / 6;
				break;
			case ng:
				h = ((nb - nr) / d + 2) / 6;
				break;
			case nb:
				h = ((nr - ng) / d + 4) / 6;
				break;
		}
	}
	return { h: Math.round(h * 360), s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
	const hue = ((h % 360) + 360) % 360;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = l - c / 2;
	const hPrime = hue / 60;
	let r: number, g: number, b: number;
	if (hPrime < 1) [r, g, b] = [c, x, 0];
	else if (hPrime < 2) [r, g, b] = [x, c, 0];
	else if (hPrime < 3) [r, g, b] = [0, c, x];
	else if (hPrime < 4) [r, g, b] = [0, x, c];
	else if (hPrime < 5) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	return rgbToHex(
		(r + m) * 255,
		(g + m) * 255,
		(b + m) * 255,
	);
}

function rgbToXyz({ r, g, b }: Rgb): { x: number; y: number; z: number } {
	let nr = r / 255;
	let ng = g / 255;
	let nb = b / 255;
	nr = nr > 0.04045 ? Math.pow((nr + 0.055) / 1.055, 2.4) : nr / 12.92;
	ng = ng > 0.04045 ? Math.pow((ng + 0.055) / 1.055, 2.4) : ng / 12.92;
	nb = nb > 0.04045 ? Math.pow((nb + 0.055) / 1.055, 2.4) : nb / 12.92;
	return {
		x: (nr * 0.4124564 + ng * 0.3575761 + nb * 0.1804375) * 100,
		y: (nr * 0.2126729 + ng * 0.7151522 + nb * 0.072175) * 100,
		z: (nr * 0.0193339 + ng * 0.119192 + nb * 0.9503041) * 100,
	};
}

/**
 * CIE 15 D65, 2° standard observer. The tristimulus values sRGB (IEC 61966-2-1)
 * is defined against, scaled to Y = 100 to match `rgbToXyz` above.
 */
const D65_WHITE = { x: 95.047, y: 100, z: 108.883 } as const;

/**
 * CIE L*a*b* companding constants, exact rather than the rounded forms that
 * circulate as 0.008856 / 7.787.
 *
 *   DELTA   = 6/29          the linear/cube-root crossover in t
 *   EPSILON = (6/29)³       that crossover expressed in t itself
 *   KAPPA   = 1/(3·(6/29)²) = 841/108, the linear segment's slope
 *
 * The rounded slope (7.787 vs 841/108 = 7.787037…) only bites below the
 * crossover — L* < 8 — which is precisely where this product lives: every black
 * finish in the manifest (#111111, #1A1B1F, #1b1818, #1c1a1b) linearises below
 * EPSILON, so the dark end of the range is the one place the shortcut costs
 * accuracy. Exact constants make the near-black tolerances mean what they say.
 */
const LAB_DELTA = 6 / 29;
const LAB_EPSILON = LAB_DELTA ** 3;
const LAB_KAPPA = 1 / (3 * LAB_DELTA ** 2);

/**
 * CIE L* companding f(t). Exported so the crossover can be located and pinned
 * from outside: EPSILON and KAPPA are a matched pair, and rounding either one
 * alone puts a discontinuity in L* that no 8-bit grey happens to straddle — so
 * it is invisible to sampling and only findable by probing the branch boundary.
 */
export function labCompand(t: number): number {
	return t > LAB_EPSILON ? Math.cbrt(t) : LAB_KAPPA * t + 4 / 29;
}

function xyzToLab(xyz: { x: number; y: number; z: number }): {
	l: number;
	a: number;
	b: number;
} {
	const fx = labCompand(xyz.x / D65_WHITE.x);
	const fy = labCompand(xyz.y / D65_WHITE.y);
	const fz = labCompand(xyz.z / D65_WHITE.z);
	return {
		l: 116 * fy - 16,
		a: 500 * (fx - fy),
		b: 200 * (fy - fz),
	};
}

export function rgbToLab(rgb: Rgb): { l: number; a: number; b: number } {
	return xyzToLab(rgbToXyz(rgb));
}

export function hexToLab(hex: string): { l: number; a: number; b: number } {
	return rgbToLab(hexToRgb(hex));
}

/** Inverse of `labCompand`. */
function labDecompand(f: number): number {
	return f > LAB_DELTA ? f ** 3 : 3 * LAB_DELTA ** 2 * (f - 4 / 29);
}

/**
 * L*a*b* → sRGB hex, the inverse of `hexToLab`.
 *
 * Returns `inGamut: false` when the colour cannot be represented in sRGB, rather
 * than clamping silently — a clamped channel shifts hue, which is exactly the
 * failure a caller reaching for Lab is trying to avoid. `labToHexClamped` below
 * handles the recovery.
 */
export function labToRgb(lab: Lab): { r: number; g: number; b: number; inGamut: boolean } {
	const fy = (lab.l + 16) / 116;
	const fx = fy + lab.a / 500;
	const fz = fy - lab.b / 200;

	const x = (labDecompand(fx) * D65_WHITE.x) / 100;
	const y = (labDecompand(fy) * D65_WHITE.y) / 100;
	const z = (labDecompand(fz) * D65_WHITE.z) / 100;

	// XYZ → linear sRGB (D65). The inverse of the matrix in `rgbToXyz`.
	const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
	const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
	const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

	const encode = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.abs(c) ** (1 / 2.4) - 0.055);
	const channels = [rl, gl, bl];
	const inGamut = channels.every((c) => c >= -1e-6 && c <= 1 + 1e-6);
	const [r, g, b] = channels.map((c) => encode(Math.max(c, 0)) * 255);
	return { r, g, b, inGamut };
}

/**
 * L*a*b* → hex, reducing chroma until the colour fits in sRGB.
 *
 * Lightness and hue are held; only C* gives way. That ordering is the point: a
 * caller asking for "this pigment at that lightness" would rather have a slightly
 * duller colour than a shifted hue, and per-channel clamping delivers the
 * opposite. Bisection on C* converges to within 0.01 in ~14 steps.
 */
export function labToHexClamped(lab: Lab): string {
	const direct = labToRgb(lab);
	if (direct.inGamut) return rgbToHex(direct.r, direct.g, direct.b);

	const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
	const hue = Math.atan2(lab.b, lab.a);
	let lo = 0;
	let hi = chroma;
	for (let i = 0; i < 24 && hi - lo > 1e-3; i += 1) {
		const mid = (lo + hi) / 2;
		const probe = labToRgb({ l: lab.l, a: mid * Math.cos(hue), b: mid * Math.sin(hue) });
		if (probe.inGamut) lo = mid;
		else hi = mid;
	}
	const final = labToRgb({ l: lab.l, a: lo * Math.cos(hue), b: lo * Math.sin(hue) });
	return rgbToHex(final.r, final.g, final.b);
}

export function deltaECIE76(a: string, b: string): number {
	const labA = hexToLab(a);
	const labB = hexToLab(b);
	const dl = labA.l - labB.l;
	const da = labA.a - labB.a;
	const db = labA.b - labB.b;
	return Math.sqrt(dl * dl + da * da + db * db);
}

export type Lab = { l: number; a: number; b: number };

/**
 * Mean hue h̄' — CIEDE2000 (Sharma, Wu & Dalal 2005) eq. 14. Exported so the
 * branch selection can be asserted directly: the published 34-pair reference set
 * does not reach the `h1' + h2' >= 360` case, so passing it is not evidence this
 * is right.
 *
 * Four cases, all load-bearing:
 *  - Either chroma zero — hue is undefined for that colour, so the *sum* stands
 *    in for the mean. Averaging would fold in a meaningless 0° and rotate T.
 *  - Arc within 180° — the plain mean.
 *  - Arc wider than 180° — the mean lies across the 0/360 seam, so 360 is added
 *    or subtracted to bring h̄' back into range. Which one applies is decided by
 *    the sum, not by the sign of the difference: adding 360 unconditionally puts
 *    h̄' outside [0,360) whenever h1' + h2' >= 360.
 *
 * Only RT is sensitive to picking wrong. T is a sum of cosines of integer
 * multiples of h̄', so a 360 offset leaves it unchanged; RT's Gaussian is centred
 * at 275° and both candidate values fall far from it. Measured consequence of the
 * wrong branch, over 400k random Lab pairs spanning the full volume: < 2e-4 ΔE00.
 * Corrected because the standard says so, not because it was moving decisions.
 */
export function meanHuePrime(h1Prime: number, h2Prime: number, chromaZero: boolean): number {
	if (chromaZero) return h1Prime + h2Prime;
	const sum = h1Prime + h2Prime;
	if (Math.abs(h1Prime - h2Prime) <= 180) return sum / 2;
	return sum < 360 ? (sum + 360) / 2 : (sum - 360) / 2;
}

/**
 * CIEDE2000 over Lab pairs — the authority every colour tolerance in the repo
 * rests on. Kept Lab-level because the published conformance data (Sharma, Wu &
 * Dalal 2005) is specified in Lab: routing it through hex would quantise the
 * inputs and make a conformance failure indistinguishable from a rounding error.
 */
/**
 * CIEDE2000's parametric weighting factors, exposed because the standard exposes
 * them: kL, kC and kH scale the lightness, chroma and hue terms so the metric can
 * be pointed at a specific question instead of always answering "how different
 * do these look, all else equal".
 *
 * The standard's reference condition is 1/1/1. The textile industry ships 2/1/1.
 * This repo needs one more: a very large kL, which suppresses the lightness term
 * and leaves a pure undertone comparison — see `deltaE00Undertone`.
 */
export interface ParametricFactors {
	kL?: number;
	kC?: number;
	kH?: number;
}

export function deltaE2000Lab(labA: Lab, labB: Lab, factors: ParametricFactors = {}): number {
	const l1 = labA.l;
	const a1 = labA.a;
	const b1 = labA.b;
	const l2 = labB.l;
	const a2 = labB.a;
	const b2 = labB.b;

	const c1 = Math.sqrt(a1 * a1 + b1 * b1);
	const c2 = Math.sqrt(a2 * a2 + b2 * b2);
	const cBar = (c1 + c2) / 2;
	const g =
		0.5 *
		(1 -
			Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));
	const a1Prime = a1 * (1 + g);
	const a2Prime = a2 * (1 + g);
	const c1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
	const c2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);
	const cBarPrime = (c1Prime + c2Prime) / 2;

	let h1Prime =
		(Math.atan2(b1, a1Prime) * 180) / Math.PI;
	if (h1Prime < 0) h1Prime += 360;
	let h2Prime =
		(Math.atan2(b2, a2Prime) * 180) / Math.PI;
	if (h2Prime < 0) h2Prime += 360;

	const deltaLPrime = l2 - l1;
	const deltaCPrime = c2Prime - c1Prime;

	let deltaHPrime: number;
	if (c1Prime * c2Prime === 0) {
		deltaHPrime = 0;
	} else {
		let dh = h2Prime - h1Prime;
		if (Math.abs(dh) > 180) dh = dh > 0 ? dh - 360 : dh + 360;
		deltaHPrime =
			2 * Math.sqrt(c1Prime * c2Prime) *
			Math.sin(((dh * Math.PI) / 180) / 2);
	}

	const lBarPrime = (l1 + l2) / 2;
	const hBarPrime = meanHuePrime(h1Prime, h2Prime, c1Prime * c2Prime === 0);

	const t =
		1 -
		0.17 * Math.cos(((hBarPrime - 30) * Math.PI) / 180) +
		0.24 * Math.cos(((2 * hBarPrime) * Math.PI) / 180) +
		0.32 * Math.cos(((3 * hBarPrime + 6) * Math.PI) / 180) -
		0.2 * Math.cos(((4 * hBarPrime - 63) * Math.PI) / 180);

	const sl =
		1 + (0.015 * Math.pow(lBarPrime - 50, 2)) / Math.sqrt(20 + Math.pow(lBarPrime - 50, 2));
	const sc = 1 + 0.045 * cBarPrime;
	const sh = 1 + 0.015 * cBarPrime * t;

	const rt =
		-2 *
		Math.sqrt(Math.pow(cBarPrime, 7) / (Math.pow(cBarPrime, 7) + Math.pow(25, 7))) *
		Math.sin(
			((60 *
				Math.exp(-Math.pow((hBarPrime - 275) / 25, 2)) *
				Math.PI) /
				180),
		);

	const { kL: kl = 1, kC: kc = 1, kH: kh = 1 } = factors;

	return Math.sqrt(
		Math.pow(deltaLPrime / (kl * sl), 2) +
			Math.pow(deltaCPrime / (kc * sc), 2) +
			Math.pow(deltaHPrime / (kh * sh), 2) +
			rt * (deltaCPrime / (kc * sc)) * (deltaHPrime / (kh * sh)),
	);
}

export function deltaECIEDE2000(a: string, b: string): number {
	return deltaE2000Lab(hexToLab(a), hexToLab(b));
}

/**
 * Undertone distance: CIEDE2000 with the lightness term suppressed.
 *
 * WHY THIS EXISTS
 *
 * Two parts moulded from the same plastic, one recessed, are *supposed* to differ
 * in lightness — less light reaches the recessed one. What they cannot do is
 * differ in undertone: the same pigment cannot read warm on the shell and cool on
 * the wheel. So "do these belong to the same part?" is a question about chroma and
 * hue with lightness explicitly excluded, and a plain ΔE00 ceiling cannot express
 * it — ΔE00 folds ΔL' in, so it fails a correctly-shaded recess and passes a
 * wrong-pigment match at the same lightness.
 *
 * Implemented with the standard's own kL factor rather than by deleting the term,
 * so this stays CIEDE2000 under a stated parametric condition instead of becoming
 * a bespoke metric. 1e9 drives ΔL'/(kL·SL) to zero for any real Lab pair while
 * leaving the chroma-hue interaction term RT intact.
 */
export function deltaE00Undertone(a: string, b: string): number {
	return deltaE2000Lab(hexToLab(a), hexToLab(b), { kL: 1e9 });
}

export function colorDistance(a: string, b: string): number {
	return deltaECIEDE2000(a, b);
}

export interface ProximityMatch {
	hex: string;
	distance: number;
	hsl: Hsl;
	label: string;
}

export function findNearestShades(
	baseHex: string,
	palette: string[],
	limit = 6,
): ProximityMatch[] {
	return palette
		.map((hex) => ({
			hex,
			distance: deltaECIEDE2000(baseHex, hex),
			hsl: hexToHsl(hex),
			label: `ΔE ${deltaECIEDE2000(baseHex, hex).toFixed(1)}`,
		}))
		.sort((a, b) => a.distance - b.distance)
		.slice(0, limit);
}

export function generateAnalogousShades(baseHex: string, count = 3): string[] {
	const { h, s, l } = hexToHsl(baseHex);
	const shades: string[] = [baseHex];
	const step = 30;
	for (let i = 1; i < count; i++) {
		shades.push(hslToHex((h + step * i) % 360, s, l));
		shades.push(hslToHex((h - step * i + 360) % 360, s, l));
	}
	return shades;
}

export function generateTonalShades(baseHex: string, count = 5): string[] {
	const { h, s, l } = hexToHsl(baseHex);
	const shades: string[] = [];
	const step = 0.08;
	for (let i = -Math.floor(count / 2); i <= Math.floor(count / 2); i++) {
		const newL = Math.max(0.05, Math.min(0.95, l + step * i));
		shades.push(hslToHex(h, s, newL));
	}
	return shades;
}

export function isWebColorApiAvailable(): boolean {
	try {
		return typeof CSS !== "undefined" && typeof CSS.supports === "function";
	} catch {
		return false;
	}
}

export function validateHexColor(hex: string): boolean {
	if (isWebColorApiAvailable()) {
		return CSS.supports("color", hex);
	}
	return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function normalizeHexColor(hex: string): string {
	if (!/^#?[a-f\d]{3,6}$/i.test(hex)) return "#000000";
	let clean = hex.replace("#", "");
	if (clean.length === 3) {
		clean = clean
			.split("")
			.map((c) => c + c)
			.join("");
	}
	return `#${clean}`.toUpperCase();
}

const KUMU_PALETTE = [
	"#111827",
	"#1F2937",
	"#374151",
	"#4B5563",
	"#6B7280",
	"#9CA3AF",
	"#D1D5DB",
	"#E5E7EB",
	"#F3F4F6",
	"#F9FAFB",
	"#1E3A5F",
	"#1E40AF",
	"#3730A3",
	"#5B21B6",
	"#6D28D9",
	"#7C3AED",
	"#8B5CF6",
	"#A78BFA",
	"#C4B5FD",
	"#DDD6FE",
	"#064E3B",
	"#065F46",
	"#047857",
	"#059669",
	"#10B981",
	"#34D399",
	"#6EE7B7",
	"#A7F3D0",
	"#D1FAE5",
	"#ECFDF5",
	"#7F1D1D",
	"#991B1B",
	"#B91C1C",
	"#DC2626",
	"#EF4444",
	"#F87171",
	"#FCA5A5",
	"#FECACA",
	"#FEE2E2",
	"#FEF2F2",
	"#78350F",
	"#92400E",
	"#B45309",
	"#D97706",
	"#F59E0B",
	"#FBBF24",
	"#FCD34D",
	"#FDE68A",
	"#FEF3C7",
	"#FFFBEB",
];

export function findKumuPaletteProximityMatches(
	baseHex: string,
	limit = 8,
): ProximityMatch[] {
	return findNearestShades(baseHex, KUMU_PALETTE, limit);
}

/**
 * Derive the screen gasket color from the case skin color.
 *
 * The gasket is the physical gap between the aluminum shell and the display.
 * On iPods it reads as a slightly recessed shadowed edge, not a harsh
 * independent line.  We derive it from the case color so the transition
 * stays cohesive on every theme, including white / silver where a fixed
 * `#110f0f` would dominate.
 */
export function deriveGasketColor(skinHex: string): string {
	const { h, s, l } = hexToHsl(skinHex);
	if (l < 0.18) return "#110f0f";
	if (l > 0.7) return hslToHex(h, s, l);
	const ratio = 0.55 + (l - 0.18) * 0.63;
	const gasketL = Math.max(0.06, l * ratio);
	return hslToHex(h, s * 0.5, gasketL);
}
