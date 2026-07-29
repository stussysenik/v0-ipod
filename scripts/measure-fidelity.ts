/**
 * Measure the colour-fidelity envelope.
 *
 * Reproduces every number in `FIDELITY_ENVELOPE` (lib/color-fidelity.ts) from
 * scratch, so the published tolerances stay checkable rather than remembered.
 * The exhaustive pass walks all 16,777,216 sRGB colours and takes the worst
 * ΔE00 per L* band; `--quick` samples instead, for a fast sanity run.
 *
 * Usage:
 *   bun run scripts/measure-fidelity.ts [--quick]
 */

import {
	FIDELITY_ENVELOPE,
	measureExportParity,
	measureFidelity,
	type DisplayTransform,
} from "../lib/color-fidelity";
import { colorManifest } from "../lib/color-manifest";
import { hexToLab } from "../lib/color-proximity";
import { linearToSrgb, srgbToLinear } from "../lib/three-color-resolve";

const QUICK = process.argv.includes("--quick");
const STEP = QUICK ? 7 : 1;

const hexOf = (r: number, g: number, b: number) =>
	`#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const MANIFEST_COLORS = [
	...colorManifest.authenticFinishes.map((f) => ({ label: f.label, hex: f.hex })),
];

function perFinishTable(transform: DisplayTransform) {
	console.log(
		`\n### Per finish — ${transform === "none" ? "NoToneMapping (shipped)" : "Khronos PBR Neutral"}\n`,
	);
	console.log("| finish | source | exported | ΔE00 | L* |");
	console.log("| --- | --- | --- | ---: | ---: |");
	for (const { label, hex } of MANIFEST_COLORS) {
		const m = measureFidelity(hex, transform);
		console.log(
			`| ${label} | \`${m.source}\` | \`${m.exported}\` | ${m.deltaE.toFixed(4)} | ${hexToLab(hex).l.toFixed(1)} |`,
		);
	}
}

function bandTable(transform: DisplayTransform) {
	const max = FIDELITY_ENVELOPE.map(() => 0);
	const arg = FIDELITY_ENVELOPE.map(() => "");
	let n = 0;
	for (let r = 0; r < 256; r += STEP)
		for (let g = 0; g < 256; g += STEP)
			for (let b = 0; b < 256; b += STEP) {
				const hex = hexOf(r, g, b);
				const l = hexToLab(hex).l;
				const i = FIDELITY_ENVELOPE.findIndex(
					(band, idx) =>
						l >= band.minL && (idx === FIDELITY_ENVELOPE.length - 1 ? l <= 100.001 : l < band.maxL),
				);
				if (i < 0) continue;
				const d = measureFidelity(hex, transform).deltaE;
				if (d > max[i]) {
					max[i] = d;
					arg[i] = hex;
				}
				n += 1;
			}

	console.log(
		`\n### Per L* band — ${transform === "none" ? "NoToneMapping (shipped)" : "Khronos PBR Neutral"}` +
			` — ${n.toLocaleString()} colours\n`,
	);
	console.log("| L* band | measured max ΔE00 | worst colour | published tolerance | headroom |");
	console.log("| --- | ---: | --- | ---: | ---: |");
	FIDELITY_ENVELOPE.forEach((band, i) => {
		const published = transform === "neutral" ? band.toleranceNeutral : band.toleranceNone;
		console.log(
			`| ${band.minL}–${band.maxL} | ${max[i].toFixed(4)} | \`${arg[i] || "—"}\` | ${published} | ${(published - max[i]).toFixed(4)} |`,
		);
	});
	return max;
}

console.log("# Colour-fidelity envelope");
console.log(QUICK ? "\n(quick sample — pass no flag for the exhaustive run)" : "\n(exhaustive)");

perFinishTable("none");
perFinishTable("neutral");
const maxNone = bandTable("none");
const maxNeutral = bandTable("neutral");

console.log("\n### Published table vs this run\n");
let drift = false;
FIDELITY_ENVELOPE.forEach((band, i) => {
	const noneOk = maxNone[i] <= band.toleranceNone + 1e-9;
	const neutralOk = maxNeutral[i] <= band.toleranceNeutral + 1e-9;
	if (!noneOk || !neutralOk) drift = true;
	console.log(
		`  L* ${band.minL}-${band.maxL}: none ${noneOk ? "ok" : "OVER"} (${maxNone[i].toFixed(4)} vs ${band.toleranceNone}),` +
			` neutral ${neutralOk ? "ok" : "OVER"} (${maxNeutral[i].toFixed(4)} vs ${band.toleranceNeutral})`,
	);
});

console.log("\n### Live-versus-export parity\n");
console.log("The renderer and the resolve pass must apply the same operator. three picks tone");
console.log("mapping per render target, so the export path never inherits renderer.toneMapping.");
console.log("\n| renderer | resolve pass | worst ΔE00 across finishes |");
console.log("| --- | --- | ---: |");
for (const [rend, res] of [
	["none", "none"],
	["neutral", "neutral"],
	["neutral", "none"],
	["none", "neutral"],
] as const) {
	const worst = Math.max(
		...MANIFEST_COLORS.map(({ hex }) => measureExportParity(hex, rend, res).deltaE),
	);
	console.log(`| ${rend} | ${res} | ${worst.toFixed(4)} |`);
}

console.log("\n### Transfer-function round trip\n");
let mismatches = 0;
for (let v = 0; v < 256; v += 1) {
	const round = Math.round(Math.min(Math.max(linearToSrgb(srgbToLinear(v / 255)), 0), 1) * 255);
	if (round !== v) mismatches += 1;
}
console.log(`channel-wise round-trip mismatches across all 256 codes: ${mismatches}`);
console.log("(the chain is channel-independent, so 0 proves exactness over the full 24-bit cube)");

if (drift) {
	console.error("\nFIDELITY_ENVELOPE is below a measured maximum. Update the table.");
	process.exit(1);
}
console.log("\nPublished envelope holds.");
