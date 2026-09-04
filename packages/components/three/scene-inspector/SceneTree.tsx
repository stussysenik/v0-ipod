'use client';

import { useState, useSyncExternalStore } from 'react';
import type * as THREE from 'three';

import { inspectorStore } from './inspector-store';

/**
 * Recursive, collapsible browser of the live `scene` graph. Clicking a row
 * selects + highlights that node in the canvas.
 */
export function SceneTree() {
	const scene = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().scene,
	);
	if (!scene) return null;
	return (
		<div className="flex max-h-[40vh] flex-col overflow-y-auto">
			<div className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-widest text-white/45">
				Scene graph
			</div>
			{scene.children.map((child) => (
				<TreeNode key={child.id} object={child} depth={0} />
			))}
		</div>
	);
}

function TreeNode({ object, depth }: { object: THREE.Object3D; depth: number }) {
	const selected = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().selected,
	);
	const [open, setOpen] = useState(depth < 1);
	const hasChildren = object.children.length > 0;
	const isSelected = selected === object;
	const label = object.name || object.type;

	const icon = isMesh(object) ? '◆' : isLight(object) ? '☀' : hasChildren ? '▸' : '·';

	return (
		<div>
			<button
				type="button"
				className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left font-mono text-[10px] transition-colors ${
					isSelected
						? 'bg-sky-500/30 text-sky-200'
						: 'text-white/70 hover:bg-white/5 hover:text-white'
				}`}
				style={{ paddingLeft: depth * 10 + 4 }}
				onClick={() => {
					if (hasChildren) setOpen((o) => !o);
					inspectorStore.setSelected(object);
				}}
			>
				<span className="w-2 text-white/40">
					{hasChildren && open ? '▾' : icon}
				</span>
				<span className="truncate">{label}</span>
				{!object.visible && (
					<span className="ml-auto text-amber-400/70">hidden</span>
				)}
			</button>
			{open &&
				hasChildren &&
				object.children.map((c) => (
					<TreeNode key={c.id} object={c} depth={depth + 1} />
				))}
		</div>
	);
}

function isMesh(o: THREE.Object3D): o is THREE.Mesh {
	return (o as THREE.Mesh).isMesh === true;
}
function isLight(o: THREE.Object3D): o is THREE.Light {
	return (o as THREE.Light).isLight === true;
}
