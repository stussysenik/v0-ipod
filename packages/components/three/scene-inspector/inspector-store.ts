'use client';

import type * as THREE from 'three';

export type InspectorStats = {
	fps: number;
	frameMs: number;
	calls: number;
	triangles: number;
	geometries: number;
	textures: number;
};

export type TransformMode = 'translate' | 'rotate' | 'scale';

type InspectorState = {
	ready: boolean;
	scene: THREE.Scene | null;
	camera: THREE.Camera | null;
	canvas: HTMLCanvasElement | null;
	stats: InspectorStats | null;
	selected: THREE.Object3D | null;
	pickMode: boolean;
	/** Active gizmo axis mode. Shared so the canvas gizmo + the panel buttons agree. */
	transformMode: TransformMode;
	/** True while the gizmo is being dragged — OrbitRig reads this to suppress orbit. */
	gizmoDragging: boolean;
};

const initial: InspectorState = {
	ready: false,
	scene: null,
	camera: null,
	canvas: null,
	stats: null,
	selected: null,
	pickMode: false,
	transformMode: 'translate',
	gizmoDragging: false,
};

let state: InspectorState = initial;
const listeners = new Set<() => void>();

function emit() {
	for (const l of listeners) l();
}

export const inspectorStore = {
	subscribe(l: () => void) {
		listeners.add(l);
		return () => {
			listeners.delete(l);
		};
	},
	getSnapshot() {
		return state;
	},
	register(scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement) {
		state = { ...state, ready: true, scene, camera, canvas };
		emit();
	},
	clear() {
		state = { ...initial, selected: state.selected };
		emit();
	},
	setStats(stats: InspectorStats) {
		state = { ...state, stats };
		emit();
	},
	setSelected(selected: THREE.Object3D | null) {
		if (state.selected === selected) return;
		state = { ...state, selected };
		emit();
	},
	setPickMode(pickMode: boolean) {
		if (state.pickMode === pickMode) return;
		state = { ...state, pickMode };
		emit();
	},
};
