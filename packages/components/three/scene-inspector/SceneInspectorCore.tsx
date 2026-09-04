'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { highlight } from './highlight';
import { inspectorStore } from './inspector-store';

const STATS_INTERVAL = 0.25; // ~4 Hz HUD updates
const DRAG_THRESHOLD = 6; // px — below this a pointerup is a "click" (pick), else a drag

/**
 * In-canvas half of the dev inspector. Owns three.js access: publishes `gl.info`
 * stats, raycasts picks, and applies the selection highlight. Renders nothing to
 * the DOM — it only mutates three objects and writes the store. Mounts only in
 * development (see the gate in three-d-ipod.tsx).
 */
export function SceneInspectorCore() {
	const { gl, scene, camera, size } = useThree();
	const down = useRef<{ x: number; y: number; t: number } | null>(null);
	const statsAccum = useRef(0);
	const emaFps = useRef(0);
	const undoHighlight = useRef<(() => void) | null>(null);

	// Register the live scene/camera/canvas once, clear on unmount.
	useEffect(() => {
		inspectorStore.register(scene, camera, gl.domElement);
		return () => inspectorStore.clear();
	}, [scene, camera, gl.domElement]);

	// Apply/clear highlight from store selection.
	useEffect(() => {
		const apply = () => {
			const selected = inspectorStore.getSnapshot().selected;
			undoHighlight.current?.();
			undoHighlight.current = selected ? highlight(selected) : null;
		};
		apply();
		return inspectorStore.subscribe(apply);
	}, []);

	useFrame((_, delta) => {
		// --- Stats (throttled) ---
		const dt = Math.min(delta, 0.1);
		if (emaFps.current === 0) emaFps.current = 1 / Math.max(dt, 1e-4);
		else emaFps.current += (1 / Math.max(dt, 1e-4) - emaFps.current) * 0.1;
		statsAccum.current += dt;
		if (statsAccum.current >= STATS_INTERVAL) {
			statsAccum.current = 0;
			const info = gl.info;
			inspectorStore.setStats({
				fps: Math.round(emaFps.current),
				frameMs: Number((1000 / Math.max(emaFps.current, 1e-4)).toFixed(1)),
				calls: info.render.calls,
				triangles: info.render.triangles,
				geometries: info.memory.geometries,
				textures: info.memory.textures,
			});
		}
	});

	// --- Picking (opt-in via pickMode; click-vs-drag guard) ---
	useEffect(() => {
		const el = gl.domElement;

		const onPointerDown = (e: PointerEvent) => {
			if (!inspectorStore.getSnapshot().pickMode) return;
			down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
		};
		const onPointerUp = (e: PointerEvent) => {
			const d = down.current;
			down.current = null;
			if (!d || !inspectorStore.getSnapshot().pickMode) return;
			const travelled = Math.hypot(e.clientX - d.x, e.clientY - d.y);
			if (travelled > DRAG_THRESHOLD) return; // it was an orbit drag, not a pick
			pickAt(e.clientX, e.clientY);
		};
		const onPointerLeave = () => {
			down.current = null;
		};

		el.addEventListener('pointerdown', onPointerDown);
		el.addEventListener('pointerup', onPointerUp);
		el.addEventListener('pointerleave', onPointerLeave);
		return () => {
			el.removeEventListener('pointerdown', onPointerDown);
			el.removeEventListener('pointerup', onPointerUp);
			el.removeEventListener('pointerleave', onPointerLeave);
		};
	}, [gl.domElement, size.width, size.height, camera]);

	return null;
}

function pickAt(clientX: number, clientY: number) {
	const { scene, camera, canvas } = inspectorStore.getSnapshot();
	if (!scene || !camera || !canvas) return;
	const rect = canvas.getBoundingClientRect();
	const pointer = new THREE.Vector2(
		((clientX - rect.left) / rect.width) * 2 - 1,
		-((clientY - rect.top) / rect.height) * 2 + 1,
	);
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(pointer, camera);
	const hits = raycaster.intersectObjects(scene.children, true);
	const first = hits.find((h) => (h.object as THREE.Mesh).isMesh) ?? hits[0];
	inspectorStore.setSelected(first ? first.object : null);
}
