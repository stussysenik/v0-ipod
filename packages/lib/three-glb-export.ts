import type * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * three-glb-export — serialize a Three.js object subtree to a binary glTF (.glb).
 *
 * The iPod device is generated entirely in-code as a `THREE.Group` of
 * `meshPhysicalMaterial` meshes, so there is no `.glb` on disk to hand to a
 * designer — this mints one from the live scene graph. The exporter round-trips
 * the PBR material props (metalness, roughness, clearcoat, ior, sheen,
 * anisotropy, envMapIntensity…) into glTF's metallic-roughness + KHR extensions,
 * so the file opens in Blender / Spline / web / AR looking the way it did here.
 *
 * What survives the trip: geometry, the PBR material props glTF represents
 * natively, and the baked LCD/wheel textures. What does NOT: the drei
 * `<Environment>` IBL, the hard spot lights, post-processing, and any material
 * feature glTF has no slot for (anisotropy, dispersion). The file is lit-neutral
 * — the recipient lights it in their own renderer.
 */

export interface GlbExportOptions {
	/** Export the whole subtree or only visible meshes. Defaults to true. */
	onlyVisible?: boolean;
	/** Max texture dimension (px) — baked LCD/wheel textures downscale to this. */
	maxTextureSize?: number;
	/** Trim animations (the iPod has none, but the exporter walks them). */
	truncateDrawRange?: boolean;
}

export interface GlbExportResult {
	buffer: ArrayBuffer;
	/** Diagnostics — mesh + texture counts, for the UI fingerprint. */
	stats: { meshes: number; textures: number; triangles: number };
}

function countMeshData(root: THREE.Object3D): GlbExportResult['stats'] {
	let meshes = 0;
	let textures = 0;
	let triangles = 0;
	const seen = new Set<THREE.Texture>();
	root.traverse((o) => {
		const mesh = o as THREE.Mesh;
		if (!mesh.isMesh) return;
		meshes++;
		const geo = mesh.geometry as THREE.BufferGeometry;
		if (geo.index) triangles += geo.index.count / 3;
		else if (geo.attributes.position) triangles += geo.attributes.position.count / 3;
		const mat = mesh.material as THREE.Material | THREE.Material[];
		const mats = Array.isArray(mat) ? mat : [mat];
		for (const m of mats) {
			const map = (m as THREE.MeshPhysicalMaterial).map;
			if (map && !seen.has(map)) {
				seen.add(map);
				textures++;
			}
		}
	});
	return { meshes, textures, triangles };
}

/**
 * Serialize a Three.js object (the device root group) to a GLB ArrayBuffer.
 * Resolves with the buffer + mesh/texture/triangle stats for the proof fingerprint.
 */
export async function exportObjectToGlb(
	root: THREE.Object3D,
	options: GlbExportOptions = {},
): Promise<GlbExportResult> {
	const { onlyVisible = true, truncateDrawRange = true } = options;
	const exporter = new GLTFExporter();

	const buffer = await exporter.parseAsync(root, {
		binary: true,
		onlyVisible,
		truncateDrawRange,
		includeCustomExtensions: false,
	});

	// parseAsync returns ArrayBuffer when binary:true; normalise just in case. The DOM lib
	// types the result as ArrayBufferLike (SharedArrayBuffer lacks slice/byteOffset), so
	// pin + copy through a real ArrayBuffer view to guarantee a clean, owned buffer.
	let normalized: ArrayBuffer;
	if (ArrayBuffer.isView(buffer)) {
		const view = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
		normalized = view.slice().buffer;
	} else {
		normalized = new Uint8Array(buffer as ArrayBuffer).slice().buffer;
	}

	return { buffer: normalized, stats: countMeshData(root) };
}

/** Trigger a browser download of a GLB buffer. */
export function downloadGlb(buffer: ArrayBuffer, filename: string): void {
	const blob = new Blob([buffer], { type: 'model/gltf-binary' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.download = filename;
	link.href = url;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
