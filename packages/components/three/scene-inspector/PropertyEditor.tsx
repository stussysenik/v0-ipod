'use client';

import { useState, useSyncExternalStore } from 'react';
import * as THREE from 'three';

import { inspectorStore } from './inspector-store';

/**
 * Editable view of the selected node: transform, the material fields it actually
 * has (introspected from `material.type`), read-only geometry info, and object
 * flags. Writes straight to the three object — WYSIWYG, compose-time only.
 */
export function PropertyEditor() {
	const selected = useSyncExternalStore(
		inspectorStore.subscribe,
		() => inspectorStore.getSnapshot().selected,
	);
	if (!selected) {
		return (
			<div className="px-1 py-3 text-center font-mono text-[10px] text-white/40">
				Pick a node to inspect
			</div>
		);
	}

	const mat = (selected as THREE.Mesh).material as THREE.Material | undefined;
	const geo = (selected as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;

	return (
		<div className="flex flex-col gap-3 overflow-y-auto">
			<div className="px-1 text-[9px] font-semibold uppercase tracking-widest text-white/45">
				{selected.name || selected.type}
			</div>

			<Section title="Transform">
				<Vec3Row label="pos" vector={selected.position} />
				<Vec3Row label="rot" vector={selected.rotation} isRotation />
				<Vec3Row label="scl" vector={selected.scale} />
			</Section>

			{mat && <MaterialSection material={mat} />}

			{geo && (
				<Section title="Geometry">
					<InfoRow label="type" value={geo.type} />
					<InfoRow
						label="vertices"
						value={String(geo.attributes.position?.count ?? 0)}
					/>
					<InfoRow
						label="bounds"
						value={
							geo.boundingSphere
								? geo.boundingSphere.radius.toFixed(
										3,
									)
								: '—'
						}
					/>
				</Section>
			)}

			<Section title="Object">
				<InfoRow label="name" value={selected.name || '—'} />
				<BoolRow
					label="visible"
					value={selected.visible}
					onChange={(v) => (selected.visible = v)}
				/>
				<NumRow
					label="renderOrder"
					value={selected.renderOrder}
					onChange={(v) => (selected.renderOrder = v)}
				/>
			</Section>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<div className="border-b border-white/10 px-1 pb-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40">
				{title}
			</div>
			{children}
		</div>
	);
}

type Vec3Like = THREE.Vector3 | THREE.Euler;

function Vec3Row({
	label,
	vector,
	isRotation,
}: {
	label: string;
	vector: Vec3Like;
	isRotation?: boolean;
}) {
	const [, force] = useState(0);
	const bump = () => force((n) => n + 1);
	const read = () => ({
		x: isRotation ? THREE.MathUtils.radToDeg(vector.x) : vector.x,
		y: isRotation ? THREE.MathUtils.radToDeg(vector.y) : vector.y,
		z: isRotation ? THREE.MathUtils.radToDeg(vector.z) : vector.z,
	});
	return (
		<div className="flex items-center gap-1 px-1">
			<span className="w-6 font-mono text-[10px] text-white/45">{label}</span>
			{(['x', 'y', 'z'] as const).map((axis) => (
				<input
					key={axis}
					type="number"
					step={isRotation ? 1 : 0.05}
					className="w-14 rounded bg-white/5 px-1 py-0.5 font-mono text-[10px] text-white/90 outline-none focus:bg-white/10"
					value={read()[axis].toFixed(isRotation ? 0 : 3)}
					onChange={(e) => {
						const v = Number(e.target.value);
						if (isRotation) {
							(vector as THREE.Euler)[axis] =
								THREE.MathUtils.degToRad(v);
						} else {
							(vector as THREE.Vector3)[axis] = v;
						}
						bump();
					}}
				/>
			))}
		</div>
	);
}

function MaterialSection({ material }: { material: THREE.Material }) {
	const m = material as THREE.MeshStandardMaterial;
	const has = (p: string) => p in m;
	return (
		<Section title={`Material · ${m.type.replace('Mesh', '').replace('Material', '')}`}>
			{has('color') && (
				<ColorRow
					label="color"
					value={m.color}
					onChange={(c) => m.color.set(c)}
				/>
			)}
			{has('roughness') && (
				<NumRow
					label="roughness"
					value={m.roughness}
					onChange={(v) => (m.roughness = v)}
				/>
			)}
			{has('metalness') && (
				<NumRow
					label="metalness"
					value={m.metalness}
					onChange={(v) => (m.metalness = v)}
				/>
			)}
			{has('opacity') && (
				<NumRow
					label="opacity"
					value={m.opacity}
					onChange={(v) => (m.opacity = v)}
				/>
			)}
			{has('transparent') && (
				<BoolRow
					label="transparent"
					value={m.transparent}
					onChange={(v) => (m.transparent = v)}
				/>
			)}
			{has('emissive') && m.emissive instanceof THREE.Color && (
				<ColorRow
					label="emissive"
					value={m.emissive}
					onChange={(c) => m.emissive.set(c)}
				/>
			)}
			{has('clearcoat') && (
				<NumRow
					label="clearcoat"
					value={(m as THREE.MeshPhysicalMaterial).clearcoat}
					onChange={(v) =>
						((m as THREE.MeshPhysicalMaterial).clearcoat = v)
					}
				/>
			)}
			{has('clearcoatRoughness') && (
				<NumRow
					label="clearcoatR"
					value={(m as THREE.MeshPhysicalMaterial).clearcoatRoughness}
					onChange={(v) =>
						((
							m as THREE.MeshPhysicalMaterial
						).clearcoatRoughness = v)
					}
				/>
			)}
		</Section>
	);
}

function NumRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex items-center gap-1 px-1">
			<span className="w-16 truncate font-mono text-[10px] text-white/45">
				{label}
			</span>
			<input
				type="number"
				step={0.05}
				min={0}
				className="w-20 rounded bg-white/5 px-1 py-0.5 font-mono text-[10px] text-white/90 outline-none focus:bg-white/10"
				value={Number(value).toFixed(3)}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</div>
	);
}

function ColorRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: THREE.Color;
	onChange: (hex: string) => void;
}) {
	return (
		<div className="flex items-center gap-1 px-1">
			<span className="w-16 truncate font-mono text-[10px] text-white/45">
				{label}
			</span>
			<input
				type="color"
				className="h-4 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
				value={`#${value.getHexString()}`}
				onChange={(e) => onChange(e.target.value)}
			/>
			<span className="font-mono text-[10px] text-white/60">
				#{value.getHexString()}
			</span>
		</div>
	);
}

function BoolRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center gap-1 px-1">
			<span className="w-16 truncate font-mono text-[10px] text-white/45">
				{label}
			</span>
			<button
				type="button"
				className={`h-4 w-7 rounded-full transition-colors ${value ? 'bg-sky-500/80' : 'bg-white/15'}`}
				onClick={() => onChange(!value)}
			>
				<span
					className={`block h-3 w-3 rounded-full bg-white transition-transform ${value ? 'translate-x-3.5' : 'translate-x-0.5'}`}
				/>
			</button>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between px-1">
			<span className="font-mono text-[10px] text-white/45">{label}</span>
			<span className="font-mono text-[10px] text-white/70">{value}</span>
		</div>
	);
}
