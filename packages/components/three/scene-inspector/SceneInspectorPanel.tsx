'use client';

import { useSyncExternalStore } from 'react';

import { inspectorStore, type TransformMode } from './inspector-store';
import { PropertyEditor } from './PropertyEditor';
import { SceneTree } from './SceneTree';
import { StatsHud } from './StatsHud';

/**
 * DOM overlay half of the dev inspector: stats HUD, a Pick-mode toolbar, the
 * scene-graph browser, and the live property editor. Mounted outside the canvas
 * (in the stage) and gated to development. `pointer-events-none` on the shell;
 * interactive children re-enable it.
 */
export function SceneInspectorPanel() {
	const pickMode = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().pickMode,
	);
	const selected = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().selected,
	);
	const transformMode = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().transformMode,
	);

	const MODE_LABELS: Record<TransformMode, string> = {
		translate: 'Move',
		rotate: 'Rotate',
		scale: 'Scale',
	};

	return (
		<div className="pointer-events-none fixed inset-0 z-[150] font-mono">
			{/* Stats HUD — top-left */}
			<div className="pointer-events-auto absolute left-3 top-20">
				<StatsHud />
			</div>

			{/* Toolbar — top-right */}
			<div className="pointer-events-auto absolute right-3 top-20 flex items-center gap-2">
				<button
					type="button"
					className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
						pickMode
							? 'border-sky-400/50 bg-sky-500/20 text-sky-200'
							: 'border-white/10 bg-black/60 text-white/60 hover:text-white/90'
					}`}
					onClick={() => inspectorStore.setPickMode(!pickMode)}
				>
					<span
						className={`h-1.5 w-1.5 rounded-full ${pickMode ? 'bg-sky-400' : 'bg-white/30'}`}
					/>
					Pick
				</button>
				{/* Gizmo mode — only useful while something is selected (gizmo is shown). */}
				{selected && (
					<div className="flex overflow-hidden rounded-lg border border-white/10 bg-black/60">
						{(['translate', 'rotate', 'scale'] as const).map(
							(mode) => (
								<button
									key={mode}
									type="button"
									onClick={() =>
										inspectorStore.setTransformMode(
											mode,
										)
									}
									className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
										transformMode ===
										mode
											? 'bg-violet-500/30 text-violet-100'
											: 'text-white/50 hover:text-white/90'
									}`}
								>
									{MODE_LABELS[mode]}
								</button>
							),
						)}
					</div>
				)}
				{selected && (
					<span className="max-w-[140px] truncate rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-[10px] text-white/70">
						{selected.name || selected.type}
					</span>
				)}
			</div>

			{/* Scene tree — bottom-left */}
			<div className="pointer-events-auto absolute bottom-24 left-3 w-56 rounded-lg border border-white/10 bg-black/70 p-2 backdrop-blur-md">
				<SceneTree />
			</div>

			{/* Property editor — bottom-right */}
			<div className="pointer-events-auto absolute bottom-24 right-3 w-60 rounded-lg border border-white/10 bg-black/70 p-2 backdrop-blur-md">
				<PropertyEditor />
			</div>
		</div>
	);
}
