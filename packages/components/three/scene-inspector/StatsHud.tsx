'use client';

import { useSyncExternalStore } from 'react';

import { inspectorStore } from './inspector-store';

/**
 * At-a-glance performance readout drawn from `gl.info` + the render loop.
 * Top-left of the inspector overlay.
 */
export function StatsHud() {
	const stats = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().stats,
	);
	if (!stats) return null;
	return (
		<div className="pointer-events-none rounded-lg border border-white/10 bg-black/70 px-3 py-2 font-mono text-[10px] leading-relaxed text-white/90 backdrop-blur-md">
			<div className="mb-1 flex items-center justify-between gap-3 border-b border-white/10 pb-1 text-[9px] font-semibold uppercase tracking-widest text-white/50">
				<span>Scene</span>
				<span>{stats.fps} fps</span>
			</div>
			<Row label="frame" value={`${stats.frameMs} ms`} />
			<Row label="draws" value={String(stats.calls)} />
			<Row label="tris" value={formatNum(stats.triangles)} />
			<Row label="geo" value={String(stats.geometries)} />
			<Row label="tex" value={String(stats.textures)} />
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-3">
			<span className="text-white/45">{label}</span>
			<span className="tabular-nums text-emerald-300/90">{value}</span>
		</div>
	);
}

function formatNum(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}
