import * as THREE from "three";

/**
 * Khronos PBR Neutral display transform — CPU port of three r182's `NeutralToneMapping`
 * (the GLSL in `tonemapping_pars_fragment`). Operates on **linear** RGB, the space the
 * GPU tone-maps in *before* the sRGB output encode, and is kept bit-faithful to the
 * shader so the live canvas and the export path apply one identical transform — WYSIWYG
 * parity by construction, not by coincidence.
 *
 * Why Neutral (and its exact shape, which the tests below pin):
 *  - **peak < 0.76** → identity minus a black-level offset (≤0.04 linear, tapering to 0
 *    at true black). All three channels shift by the same offset, so channel *differences*
 *    are preserved — hue survives; only the shadow floor moves. This is why chosen finish
 *    colours are not hue-distorted by the transform.
 *  - **peak ≥ 0.76** → the peak channel compresses monotonically toward, but never
 *    reaching, white, with a mild desaturation toward that peak. Highlights roll off
 *    filmically instead of clipping to a flat plateau.
 *
 * Note the offset is a *radiance* operation: it darkens near-black final pixel radiance,
 * not the picked albedo the user reads off a `toneMapped={false}` swatch. A black finish
 * reading correctly is the job of specular separation (finish table), not of this curve.
 */
const NEUTRAL_DESATURATION = 0.15;

/** Linear peak below which Neutral is identity-minus-black-offset (`0.8 - 0.04`). */
export const NEUTRAL_START_COMPRESSION = 0.8 - 0.04;

export type LinearRgb = readonly [number, number, number];

export function neutralToneMap(color: LinearRgb, exposure = 1): [number, number, number] {
	let r = color[0] * exposure;
	let g = color[1] * exposure;
	let b = color[2] * exposure;

	const x = Math.min(r, g, b);
	const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	r -= offset;
	g -= offset;
	b -= offset;

	const peak = Math.max(r, g, b);
	if (peak < NEUTRAL_START_COMPRESSION) return [r, g, b];

	const d = 1 - NEUTRAL_START_COMPRESSION;
	const newPeak = 1 - (d * d) / (peak + d - NEUTRAL_START_COMPRESSION);
	const scale = newPeak / peak;
	r *= scale;
	g *= scale;
	b *= scale;

	const desat = 1 - 1 / (NEUTRAL_DESATURATION * (peak - newPeak) + 1);
	return [r + (newPeak - r) * desat, g + (newPeak - g) * desat, b + (newPeak - b) * desat];
}

/** IEC 61966-2-1 sRGB → linear, channel-wise. CPU twin of three's sRGB→linear decode. */
export function srgbToLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** IEC 61966-2-1 linear → sRGB, channel-wise. CPU twin of the export shader's OETF. */
export function linearToSrgb(c: number): number {
	return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
}

/**
 * WYSIWYG export resolve — make an offscreen render match the live canvas.
 *
 * Why this exists: the live `/3d` view renders straight to the drawing buffer — no
 * post-processing composer in the chain — with `NoToneMapping` and `SRGBColorSpace`
 * output, so three appends its linear→sRGB output encode to every on-screen pixel.
 * The export path, by contrast, renders the scene to a plain `WebGLRenderTarget`. In
 * three r152+ a render to a non-XR render target is hard-wired to output
 * **LinearSRGBColorSpace with NoToneMapping** (it ignores `texture.colorSpace`), so the
 * read-back pixels are raw linear light — i.e. everything comes out ~2.2 gamma darker
 * than the screen. That is the "exports look significantly darker" bug.
 *
 * The fix is a single fullscreen resolve pass — used ONLY by the export path, never the
 * live render — that samples the linear scene target and applies the same sRGB OETF the
 * live canvas gets from three's output encode. We write the already-encoded bytes from a
 * raw `ShaderMaterial` (three does not append its colorspace_fragment to raw shaders, so
 * our output is passed through untouched) into a byte target, then read those bytes back
 * — so the exported PNG/MP4 is pixel-faithful to what the user composed on screen.
 *
 * There is no vignette anywhere in the pipeline (a product plate wants a clean, uniform
 * field), so this resolve is a straight encode with nothing to keep in lockstep beyond
 * the colour-space transform.
 */

const RESOLVE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const RESOLVE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;

// IEC 61966-2-1 linear → sRGB, matching three's getLinearToSRGB output encode.
vec3 linearToSRGB(vec3 c) {
	vec3 lo = c * 12.92;
	vec3 hi = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
	return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.0031308))));
}

void main() {
	vec4 src = texture2D(tDiffuse, vUv);
	// Straight linear → sRGB encode. No vignette: a product plate wants a clean, uniform
	// field, so the live canvas carries no darkening and neither does the export.
	vec3 color = linearToSRGB(src.rgb);
	gl_FragColor = vec4(color, src.a);
}
`;

export class ColorResolvePass {
	private readonly scene = new THREE.Scene();
	private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	private readonly material: THREE.ShaderMaterial;
	private readonly quad: THREE.Mesh;
	private outRT: THREE.WebGLRenderTarget | null = null;

	constructor() {
		this.material = new THREE.ShaderMaterial({
			vertexShader: RESOLVE_VERT,
			fragmentShader: RESOLVE_FRAG,
			uniforms: {
				tDiffuse: { value: null },
			},
			depthTest: false,
			depthWrite: false,
		});
		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
		this.quad.frustumCulled = false;
		this.scene.add(this.quad);
	}

	/**
	 * Resolve a linear-light source target into sRGB-encoded RGBA bytes that match the
	 * live composer output. Fills and returns `buffer` (allocated by the caller so clip
	 * renders can reuse one allocation across every frame).
	 */
	resolve(
		renderer: THREE.WebGLRenderer,
		source: THREE.WebGLRenderTarget,
		width: number,
		height: number,
		buffer: Uint8Array | Uint8ClampedArray,
	): Uint8Array | Uint8ClampedArray {
		if (!this.outRT || this.outRT.width !== width || this.outRT.height !== height) {
			this.outRT?.dispose();
			this.outRT = new THREE.WebGLRenderTarget(width, height, {
				type: THREE.UnsignedByteType,
				format: THREE.RGBAFormat,
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
			});
		}
		this.material.uniforms.tDiffuse.value = source.texture;
		const prev = renderer.getRenderTarget();
		renderer.setRenderTarget(this.outRT);
		renderer.render(this.scene, this.camera);
		renderer.readRenderTargetPixels(this.outRT, 0, 0, width, height, buffer);
		renderer.setRenderTarget(prev);
		return buffer;
	}

	dispose() {
		this.outRT?.dispose();
		this.outRT = null;
		this.quad.geometry.dispose();
		this.material.dispose();
	}
}
