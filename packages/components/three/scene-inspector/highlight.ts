import * as THREE from 'three';

/**
 * Dependency-free selection highlight. Two paths:
 *  - materials with an `emissive` channel (standard/physical) → emissive boost
 *  - anything else (groups, lights) → a Box3Helper outline
 * `apply` returns an `undo` that restores the exact prior state, so re-selecting
 * or unmounting never leaks a highlight onto the live scene.
 */

type Emissiveable = THREE.Material & {
	emissive?: THREE.Color;
	emissiveIntensity?: number;
};

const ACCENT = new THREE.Color('#38bdf8');

export function highlight(object: THREE.Object3D): () => void {
	const meshes = collectMeshes(object);
	if (meshes.length === 0) {
		// Groups / lights: outline the world bounding box.
		const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(object), ACCENT);
		helper.name = '__inspector_highlight__';
		object.add(helper);
		return () => {
			object.remove(helper);
			helper.geometry.dispose();
		};
	}

	const undos: Array<() => void> = [];
	for (const mesh of meshes) {
		const mat = mesh.material as Emissiveable | Emissiveable[];
		const mats = Array.isArray(mat) ? mat : [mat];
		for (const m of mats) {
			if (m && 'emissive' in m && m.emissive instanceof THREE.Color) {
				const prevColor = m.emissive.clone();
				const prevIntensity =
					'emissiveIntensity' in m &&
					typeof m.emissiveIntensity === 'number'
						? m.emissiveIntensity
						: 1;
				m.emissive.copy(ACCENT);
				if ('emissiveIntensity' in m) m.emissiveIntensity = 0.6;
				undos.push(() => {
					m.emissive!.copy(prevColor);
					if ('emissiveIntensity' in m)
						m.emissiveIntensity = prevIntensity;
				});
			}
		}
	}
	// If no material had an emissive channel, fall back to a box outline.
	if (undos.length === 0) {
		const helper = new THREE.Box3Helper(new THREE.Box3().setFromObject(object), ACCENT);
		helper.name = '__inspector_highlight__';
		object.add(helper);
		undos.push(() => {
			object.remove(helper);
			helper.geometry.dispose();
		});
	}
	return () => {
		for (const u of undos) u();
	};
}

function collectMeshes(object: THREE.Object3D): THREE.Mesh[] {
	const out: THREE.Mesh[] = [];
	object.traverse((o) => {
		if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
	});
	return out;
}
