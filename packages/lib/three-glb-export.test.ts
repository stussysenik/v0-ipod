import { BoxGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { describe, expect, it, vi } from 'vitest';

// three's GLTFExporter is browser/DOM-coupled, so we mock it at the top level and unit
// the pure wiring: subtree stats + the ArrayBuffer contract the download helper
// (`downloadGlb`) wraps into a Blob. The real exporter round-trips geometry/materials
// in the integration path (the live /3d stage).

vi.mock('three/examples/jsm/exporters/GLTFExporter.js', () => ({
	GLTFExporter: class {
		parseAsync = async () => new ArrayBuffer(128);
	},
}));

import { exportObjectToGlb } from './three-glb-export';

describe('exportObjectToGlb', () => {
	it('counts meshes, triangles and unique textures in the subtree', async () => {
		const group = new Group();
		const geo = new BoxGeometry(1, 1, 1); // 12 tris
		const a = new Mesh(geo, new MeshPhysicalMaterial());
		const b = new Mesh(geo, new MeshStandardMaterial());
		a.name = 'body';
		b.name = 'wheel';
		group.add(a, b);

		const { stats } = await exportObjectToGlb(group);
		expect(stats.meshes).toBe(2);
		expect(stats.triangles).toBe(24);
		expect(stats.textures).toBe(0);
	});

	it('returns an owned, non-empty ArrayBuffer', async () => {
		const group = new Group();
		group.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshPhysicalMaterial()));

		const { buffer } = await exportObjectToGlb(group);
		expect(buffer).toBeInstanceOf(ArrayBuffer);
		expect(buffer.byteLength).toBe(128);
	});
});
