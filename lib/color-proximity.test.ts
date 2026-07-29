import { describe, expect, it } from "vitest";
import {
	deltaE2000Lab,
	meanHuePrime,
	labCompand,
	deltaECIEDE2000,
	hexToLab,
	rgbToLab,
	rgbToHex,
	hexToRgb,
	type Lab,
} from "./color-proximity";

/**
 * Conformance data for CIEDE2000: Sharma, Wu & Dalal (2005), "The CIEDE2000
 * color-difference formula: implementation notes, supplementary test data and
 * mathematical observations". The 34 pairs exist to exercise the discontinuities
 * a naive transcription gets wrong — the hue-average wrap across 0/360 (pairs
 * 9-16) and the chroma-zero branch — so a formula that passes all 34 is
 * conformant in the places conformance is actually hard.
 */
const SHARMA: ReadonlyArray<readonly [Lab, Lab, number]> = [
	[{ l: 50, a: 2.6772, b: -79.7751 }, { l: 50, a: 0, b: -82.7485 }, 2.0425],
	[{ l: 50, a: 3.1571, b: -77.2803 }, { l: 50, a: 0, b: -82.7485 }, 2.8615],
	[{ l: 50, a: 2.8361, b: -74.02 }, { l: 50, a: 0, b: -82.7485 }, 3.4412],
	[{ l: 50, a: -1.3802, b: -84.2814 }, { l: 50, a: 0, b: -82.7485 }, 1.0],
	[{ l: 50, a: -1.1848, b: -84.8006 }, { l: 50, a: 0, b: -82.7485 }, 1.0],
	[{ l: 50, a: -0.9009, b: -85.5211 }, { l: 50, a: 0, b: -82.7485 }, 1.0],
	[{ l: 50, a: 0, b: 0 }, { l: 50, a: -1, b: 2 }, 2.3669],
	[{ l: 50, a: -1, b: 2 }, { l: 50, a: 0, b: 0 }, 2.3669],
	[{ l: 50, a: 2.49, b: -0.001 }, { l: 50, a: -2.49, b: 0.0009 }, 7.1792],
	[{ l: 50, a: 2.49, b: -0.001 }, { l: 50, a: -2.49, b: 0.001 }, 7.1792],
	[{ l: 50, a: 2.49, b: -0.001 }, { l: 50, a: -2.49, b: 0.0011 }, 7.2195],
	[{ l: 50, a: 2.49, b: -0.001 }, { l: 50, a: -2.49, b: 0.0012 }, 7.2195],
	[{ l: 50, a: -0.001, b: 2.49 }, { l: 50, a: 0.0009, b: -2.49 }, 4.8045],
	[{ l: 50, a: -0.001, b: 2.49 }, { l: 50, a: 0.001, b: -2.49 }, 4.8045],
	[{ l: 50, a: -0.001, b: 2.49 }, { l: 50, a: 0.0011, b: -2.49 }, 4.7461],
	[{ l: 50, a: 2.5, b: 0 }, { l: 50, a: 0, b: -2.5 }, 4.3065],
	[{ l: 50, a: 2.5, b: 0 }, { l: 73, a: 25, b: -18 }, 27.1492],
	[{ l: 50, a: 2.5, b: 0 }, { l: 61, a: -5, b: 29 }, 22.8977],
	[{ l: 50, a: 2.5, b: 0 }, { l: 56, a: -27, b: -3 }, 31.903],
	[{ l: 50, a: 2.5, b: 0 }, { l: 58, a: 24, b: 15 }, 19.4535],
	[{ l: 50, a: 2.5, b: 0 }, { l: 50, a: 3.1736, b: 0.5854 }, 1.0],
	[{ l: 50, a: 2.5, b: 0 }, { l: 50, a: 3.2972, b: 0 }, 1.0],
	[{ l: 50, a: 2.5, b: 0 }, { l: 50, a: 1.8634, b: 0.5757 }, 1.0],
	[{ l: 50, a: 2.5, b: 0 }, { l: 50, a: 3.2592, b: 0.335 }, 1.0],
	[{ l: 60.2574, a: -34.0099, b: 36.2677 }, { l: 60.4626, a: -34.1751, b: 39.4387 }, 1.2644],
	[{ l: 63.0109, a: -31.0961, b: -5.8663 }, { l: 62.8187, a: -29.7946, b: -4.0864 }, 1.263],
	[{ l: 61.2901, a: 3.7196, b: -5.3901 }, { l: 61.4292, a: 2.248, b: -4.962 }, 1.8731],
	[{ l: 35.0831, a: -44.1164, b: 3.7933 }, { l: 35.0232, a: -40.0716, b: 1.5901 }, 1.8645],
	[{ l: 22.7233, a: 20.0904, b: -46.694 }, { l: 23.0331, a: 14.973, b: -42.5619 }, 2.0373],
	[{ l: 36.4612, a: 47.858, b: 18.3852 }, { l: 36.2715, a: 50.5065, b: 21.2231 }, 1.4146],
	[{ l: 90.8027, a: -2.0831, b: 1.441 }, { l: 91.1528, a: -1.6435, b: 0.0447 }, 1.4441],
	[{ l: 90.9257, a: -0.5406, b: -0.9208 }, { l: 88.6381, a: -0.8985, b: -0.7239 }, 1.5381],
	[{ l: 6.7747, a: -0.2908, b: -2.4247 }, { l: 5.8714, a: -0.0985, b: -2.2286 }, 0.6377],
	[{ l: 2.0776, a: 0.0795, b: -1.135 }, { l: 0.9033, a: -0.0636, b: -0.5514 }, 0.9082],
];

describe("deltaE2000Lab — CIEDE2000 conformance", () => {
	it.each(SHARMA.map((p, i) => [i + 1, ...p] as const))(
		"Sharma pair %i",
		(_i, labA, labB, expected) => {
			expect(deltaE2000Lab(labA, labB)).toBeCloseTo(expected, 4);
		},
	);

	it("is symmetric across every reference pair", () => {
		for (const [labA, labB] of SHARMA) {
			expect(deltaE2000Lab(labA, labB)).toBeCloseTo(deltaE2000Lab(labB, labA), 10);
		}
	});

	it("is zero for a colour against itself", () => {
		for (const [labA] of SHARMA) {
			expect(deltaE2000Lab(labA, labA)).toBe(0);
		}
	});
});

describe("deltaECIEDE2000 — hex entry point", () => {
	it("agrees with the Lab entry point it delegates to", () => {
		const pairs: [string, string][] = [
			["#1b1818", "#202022"],
			["#FFFFFF", "#000000"],
			["#C0C0C0", "#C8C9CB"],
		];
		for (const [a, b] of pairs) {
			expect(deltaECIEDE2000(a, b)).toBeCloseTo(deltaE2000Lab(hexToLab(a), hexToLab(b)), 10);
		}
	});

	it("is zero and symmetric on hex inputs", () => {
		expect(deltaECIEDE2000("#1b1818", "#1b1818")).toBe(0);
		expect(deltaECIEDE2000("#1b1818", "#F5F5F0")).toBeCloseTo(
			deltaECIEDE2000("#F5F5F0", "#1b1818"),
			10,
		);
	});

	it("round-trips hex through rgb without drift", () => {
		for (const hex of ["#1b1818", "#F5F5F0", "#C0C0C0", "#2D2F34"]) {
			const { r, g, b } = hexToRgb(hex);
			expect(rgbToHex(r, g, b).toLowerCase()).toBe(hex.toLowerCase());
		}
	});
});

/**
 * The Lab chain, covered independently of the formula that consumes it.
 *
 * Why this exists: `deltaE2000Lab` is verified against Sharma in Lab, so it never
 * touches sRGB. Everything the product actually measures enters through
 * `hexToLab`. An error in the chain therefore produces wrong ΔE with a
 * conformant formula, and the Sharma suite stays green — the two failures are
 * indistinguishable without this file.
 */
describe("Lab chain — sRGB → XYZ → L*a*b*", () => {
	/**
	 * Independently computed: a second transcription of IEC 61966-2-1 (EOTF and
	 * the D65 sRGB→XYZ matrix) followed by CIE 15 L*a*b* companding, evaluated at
	 * double precision outside this codebase. Not derived from the implementation.
	 */
	const REFERENCE: ReadonlyArray<readonly [string, Lab]> = [
		["#FFFFFF", { l: 100.0000038667, a: -0.0000166667, b: 0.0000066667 }],
		["#000000", { l: 0, a: 0, b: 0 }],
		["#808080", { l: 53.5850157717, a: -0.0000099978, b: 0.0000039991 }],
		["#404040", { l: 27.0934151759, a: -0.0000061916, b: 0.0000024766 }],
		["#111111", { l: 5.0633299998, a: -0.0000021825, b: 0.000000873 }],
		["#FF0000", { l: 53.2407941413, a: 80.0924595964, b: 67.2031965159 }],
		["#00FF00", { l: 87.7347223528, a: -86.1827164205, b: 83.1793205027 }],
		["#0000FF", { l: 32.2970109329, a: 79.1875198451, b: -107.8601617541 }],
		["#00FFFF", { l: 91.1132198128, a: -48.0875280588, b: -14.1311860918 }],
		["#123456", { l: 21.0417245717, a: 1.0539103928, b: -24.1012305201 }],
		// The manifest's own extremes: the reddest finish and the darkest blacks,
		// which are the colours the fidelity tolerances are actually written about.
		["#CC0000", { l: 42.5238602184, a: 67.6959293737, b: 56.801637357 }],
		["#1b1818", { l: 8.5870777896, a: 1.4782629519, b: 0.5348853604 }],
		["#2D2F34", { l: 19.3864797685, a: 0.3794450343, b: -3.4930710036 }],
		["#C0C0C0", { l: 77.7043667134, a: -0.0000134633, b: 0.0000053853 }],
		["#F5F5F0", { l: 96.4136172712, a: -0.873032466, b: 2.4013763172 }],
	];

	it.each(REFERENCE.map(([hex, lab]) => [hex, lab] as const))(
		"hexToLab(%s) matches the independent reference",
		(hex, expected) => {
			const got = hexToLab(hex);
			expect(got.l).toBeCloseTo(expected.l, 8);
			expect(got.a).toBeCloseTo(expected.a, 8);
			expect(got.b).toBeCloseTo(expected.b, 8);
		},
	);

	it("hexToLab is rgbToLab composed with hexToRgb, not a second path", () => {
		for (const [hex] of REFERENCE) {
			expect(hexToLab(hex)).toEqual(rgbToLab(hexToRgb(hex)));
		}
	});

	/**
	 * Closed-form check, independent of any reference table: for a neutral grey
	 * X/Xn, Y/Yn and Z/Zn are equal, so f() returns the same value three times and
	 * a* = b* = 0 by construction. Residual is the sRGB matrix's own rounding —
	 * its Y row sums to 1.0000001 rather than 1 — not a chain error.
	 */
	it("neutral greys land on the a*=b*=0 axis", () => {
		for (let v = 0; v < 256; v += 1) {
			const hex = `#${v.toString(16).padStart(2, "0").repeat(3)}`;
			const { a, b } = hexToLab(hex);
			expect(Math.abs(a)).toBeLessThan(2e-5);
			expect(Math.abs(b)).toBeLessThan(2e-5);
		}
	});

	/** L* must be monotonic in grey level — a companding-branch error breaks this. */
	it("L* increases monotonically across all 256 grey levels", () => {
		let prev = -1;
		for (let v = 0; v < 256; v += 1) {
			const hex = `#${v.toString(16).padStart(2, "0").repeat(3)}`;
			const { l } = hexToLab(hex);
			expect(l).toBeGreaterThan(prev);
			prev = l;
		}
	});

	/**
	 * The companding crossover, located by bisection rather than assumed. EPSILON
	 * and KAPPA are a matched pair: rounding either one alone (the widespread
	 * 0.008856 / 7.787 forms) leaves a step in L* that no 8-bit grey straddles, so
	 * no amount of sampling colours can find it. Probing the branch boundary can.
	 */
	it("switches companding branches at exactly t = (6/29)³", () => {
		// f is cube-root above the crossover and linear below. Bisect on which
		// branch the module actually takes, without telling it where to look.
		const isCubeBranch = (t: number) => labCompand(t) === Math.cbrt(t);
		let lo = 0;
		let hi = 0.05;
		expect(isCubeBranch(hi)).toBe(true);
		expect(isCubeBranch(lo)).toBe(false);
		for (let i = 0; i < 200; i += 1) {
			const mid = (lo + hi) / 2;
			if (isCubeBranch(mid)) hi = mid;
			else lo = mid;
		}
		// Resolution limit is ~1e-9, not machine epsilon: the two branches meet at
		// the crossover, so just below it they agree to within a few ULP and are
		// briefly indistinguishable by identity. That is ample — the rounded
		// constant sits 4.5e-7 away, two orders of magnitude outside this window.
		const exact = (6 / 29) ** 3;
		expect(Math.abs(hi - exact)).toBeLessThan(1e-8);
		expect(Math.abs(hi - 0.008856)).toBeGreaterThan(1e-7);
	});

	/**
	 * Continuity: at the crossover the linear branch must land exactly on the cube
	 * root. Probing either side instead would only measure f's slope there, which
	 * is nonzero — so the comparison has to be branch-against-branch at the seam.
	 * This is what a rounded KAPPA breaks: 7.787·ε + 4/29 misses 6/29 by ~3e-6.
	 */
	it("is continuous across that crossover — the linear branch meets the cube root", () => {
		const epsilon = (6 / 29) ** 3;
		expect(labCompand(epsilon)).toBeCloseTo(Math.cbrt(epsilon), 15);
		expect(labCompand(epsilon)).toBeCloseTo(6 / 29, 15);
	});
});

/**
 * CIEDE2000 mean-hue selection (Sharma eq. 14). The 34 published pairs do not
 * reach the h1'+h2' ≥ 360 branch, so conformance there has to be asserted
 * directly rather than inferred from the reference suite passing.
 */
describe("deltaE2000Lab — mean-hue branch selection", () => {
	/**
	 * Eq. 14's truth table. The expected value is always the midpoint of the SHORT
	 * arc between the two hues — that is what the branch machinery is for, and
	 * stating it that way makes each row checkable by hand.
	 */
	it.each([
		// [h1', h2', chromaZero, expected midpoint, arc taken]
		[30, 60, false, 45, "30° arc — plain mean"],
		[0, 180, false, 90, "exactly 180° — plain mean, boundary is inclusive"],
		[200, 20, false, 110, "exactly 180° at the far end — plain mean"],
		[190, 350, false, 270, "160° arc — plain mean, no wrap needed"],
		[10, 350, false, 0, "20° arc across the seam, sum = 360 — subtract 360"],
		[359, 1, false, 0, "2° arc across the seam, sum = 360 — subtract 360"],
		[0, 359, false, 359.5, "1° arc across the seam, sum < 360 — add 360"],
		[350, 100, false, 45, "110° arc across the seam, sum > 360 — subtract 360"],
		[300, 100, false, 20, "160° arc across the seam, sum > 360 — subtract 360"],
		[20, 300, false, 340, "80° arc across the seam, sum < 360 — add 360"],
		[0, 0, true, 0, "chroma zero — sum, not mean"],
		[0, 240, true, 240, "chroma zero — sum, not mean"],
	])("h1'=%s h2'=%s chromaZero=%s → %s (%s)", (h1, h2, zero, expected) => {
		expect(meanHuePrime(h1, h2, zero)).toBeCloseTo(expected, 12);
	});

	it("always returns a value the rotation term can consume, i.e. inside [0, 360)", () => {
		for (let h1 = 0; h1 < 360; h1 += 7) {
			for (let h2 = 0; h2 < 360; h2 += 7) {
				const h = meanHuePrime(h1, h2, false);
				expect(h).toBeGreaterThanOrEqual(0);
				expect(h).toBeLessThan(360);
			}
		}
	});

	it("is symmetric in its two hue arguments, as the mean of an unordered pair must be", () => {
		for (let h1 = 0; h1 < 360; h1 += 11) {
			for (let h2 = 0; h2 < 360; h2 += 11) {
				expect(meanHuePrime(h1, h2, false)).toBeCloseTo(meanHuePrime(h2, h1, false), 12);
			}
		}
	});

	it("uses the sum, not the mean, when one colour has zero chroma", () => {
		// A grey against a chromatic colour: h' is undefined for the grey, so eq. 14
		// takes h̄' = h1' + h2'. Verified against the independent transcription.
		expect(deltaE2000Lab({ l: 50, a: 0, b: 0 }, { l: 60, a: 20, b: -30 })).toBeCloseTo(23.169828, 5);
	});

	it("stays symmetric where the branch changes, which an unbalanced offset breaks", () => {
		const probes: ReadonlyArray<readonly [Lab, Lab]> = [
			[
				{ l: 50, a: 10, b: -5 },
				{ l: 50, a: 10, b: 5 },
			],
			[
				{ l: 60, a: 40, b: -2 },
				{ l: 60, a: 40, b: 2 },
			],
			[
				{ l: 50, a: -30, b: 40 },
				{ l: 50, a: 30, b: -40 },
			],
			[
				{ l: 32, a: 79, b: -108 },
				{ l: 32, a: 79, b: 108 },
			],
		];
		for (const [a, b] of probes) {
			expect(deltaE2000Lab(a, b)).toBeCloseTo(deltaE2000Lab(b, a), 12);
		}
	});
});
