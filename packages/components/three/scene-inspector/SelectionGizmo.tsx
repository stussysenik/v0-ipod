'use client';

import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useReducer } from 'react';
import { inspectorStore } from './inspector-store';

/**
 * Renders a drei `TransformControls` gizmo bound to the inspector's selected
 * object. It is the canvas counterpart to the mode toggle buttons in the DOM
 * panel — both read/write the same `transformMode` on the store, so they can
 * never disagree.
 *
 * OrbitRig is a custom controller (not drei OrbitControls), so it can't pick up
 * drei's `makeDefault` auto-disable. Instead we flip `gizmoDragging` on the
 * store during a gizmo drag and let OrbitRig suppress its own drag while it's
 * set — the same `lockedRef` pattern it already uses.
 */
export function SelectionGizmo() {
	const { gl } = useThree();
	const state = useInspectorState();
	const selected = state?.selected ?? null;

	const onMouseDown = useCallback(() => {
		// Stop events reaching the canvas so OrbitRig won't orbit mid-drag.
		gl.domElement.style.cursor = 'move';
		inspectorStore.setGizmoDragging(true);
	}, [gl.domElement]);

	const onMouseUp = useCallback(() => {
		gl.domElement.style.cursor = 'auto';
		inspectorStore.setGizmoDragging(false);
	}, [gl.domElement]);

	if (!selected) return null;

	return (
		<TransformControls
			object={selected}
			mode={state?.transformMode ?? 'translate'}
			size={0.7}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
		/>
	);
}

/**
 * Re-render on selection/mode change by reading the store as component state.
 * Returns null until the first snapshot is ready.
 */
function useInspectorState() {
	const [, force] = useReducer((n: number) => n + 1, 0);
	useEffect(() => {
		return inspectorStore.subscribe(force);
	}, []);
	return inspectorStore.getSnapshot();
}
