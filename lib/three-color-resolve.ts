import * as THREE from "three";

/**
 * WYSIWYG export resolve — make an offscreen render match the live canvas.
 *
 * Why this exists: the live `/3d` view is drawn through the @react-three/postprocessing
 * `EffectComposer`, which (a) forces `renderer.toneMapping = NoToneMapping` while mounted
 * and (b) ends its chain with a vignette + the linear→sRGB output encode. The export path,
 * by contrast, renders the scene to a plain `WebGLRenderTarget`. In three r152+ a render to
 * a non-XR render target is hard-wired to output **LinearSRGBColorSpace with NoToneMapping**
 * (it ignores `texture.colorSpace`), so the read-back pixels are raw linear light — i.e.
 * everything comes out ~2.2 gamma darker than the screen, with no vignette. That is the
 * "exports look significantly darker" bug.
 *
 * The fix is a single fullscreen resolve pass that samples the linear scene target and
 * reproduces the live composer's tail EXACTLY: the same DEFAULT-technique vignette, then
 * the sRGB OETF. We write the already-encoded bytes from a raw `ShaderMaterial` (three does
 * not append its colorspace_fragment to raw shaders, so our output is passed through
 * untouched) into a byte target, then read those bytes back — so the exported PNG/MP4 is
 * pixel-faithful to what the user composed on screen.
 *
 * Keep the vignette uniforms in lockstep with `<Vignette>` in `post-processing.tsx`.
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
uniform float uVignetteOffset;
uniform float uVignetteDarkness;

// IEC 61966-2-1 linear → sRGB, matching three's getLinearToSRGB output encode.
vec3 linearToSRGB(vec3 c) {
	vec3 lo = c * 12.92;
	vec3 hi = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
	return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.0031308))));
}

void main() {
	vec4 src = texture2D(tDiffuse, vUv);
	vec3 color = src.rgb;

	// postprocessing Vignette, DEFAULT technique — applied in linear, before the encode,
	// exactly as the live EffectPass does.
	const vec2 center = vec2(0.5);
	float d = distance(vUv, center);
	color *= smoothstep(0.8, uVignetteOffset * 0.799, d * (uVignetteDarkness + uVignetteOffset));

	color = linearToSRGB(color);
	gl_FragColor = vec4(color, src.a);
}
`;

export interface ColorResolveOptions {
	/** Mirror `<Vignette offset>` in post-processing.tsx. */
	vignetteOffset?: number;
	/** Mirror `<Vignette darkness>` in post-processing.tsx. */
	vignetteDarkness?: number;
}

export class ColorResolvePass {
	private readonly scene = new THREE.Scene();
	private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	private readonly material: THREE.ShaderMaterial;
	private readonly quad: THREE.Mesh;
	private outRT: THREE.WebGLRenderTarget | null = null;

	constructor(options: ColorResolveOptions = {}) {
		this.material = new THREE.ShaderMaterial({
			vertexShader: RESOLVE_VERT,
			fragmentShader: RESOLVE_FRAG,
			uniforms: {
				tDiffuse: { value: null },
				uVignetteOffset: { value: options.vignetteOffset ?? 0.32 },
				uVignetteDarkness: { value: options.vignetteDarkness ?? 0.18 },
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
