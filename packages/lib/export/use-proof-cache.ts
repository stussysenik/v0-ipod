"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FingerprintPose } from "./export-fingerprint";
import { proofFingerprint } from "./export-fingerprint";
import { createIdbProofPersistence } from "./proof-cache-idb";
import { createProofStore, type ProofEntry, type ProofStore } from "./proof-cache";
import { createProofRenderQueue } from "./proof-render-queue";
import { createProofScheduler } from "./proof-scheduler";
import {
	selectExportSnapshot,
	type ProofExportOptions,
	type ProofModelSlice,
} from "./proof-inputs";

/**
 * Ambient proof orchestration for `/3d`.
 *
 * Watches the live composition (model + export options + camera pose) and, whenever it has
 * been STABLE for one idle interval, speculatively renders the anchor proof frame into a
 * content-addressed cache — so by the time the user looks at the panel, the guaranteed frame
 * is already there. The hook itself is thin: all the WHEN-to-render policy lives in the pure
 * `proof-scheduler`, the storage in `proof-cache`, the single-flight in `proof-render-queue`.
 *
 * The pose is read by polling (`getPose`) rather than React state, because orbit drag mutates
 * the camera imperatively. We only re-render the panel when the *current fingerprint* changes
 * or a new frame lands (`version`), never on every poll tick.
 */

const MEMORY_ENTRIES = 30;
const IDLE_MS = 300;

export interface UseProofCacheArgs {
	/** The pixel-determining studio state (the full workbench model satisfies this). */
	model: ProofModelSlice;
	/** Aspect/quality/motion options driving the export + fingerprint. */
	options: ProofExportOptions;
	/** Read the live camera pose; null until the orbit rig mounts. */
	getPose: () => FingerprintPose | null;
	/** Render the anchor frame for a snapshot (the stage's `captureHighRes` adapter). */
	render: (snapshot: ReturnType<typeof selectExportSnapshot>) => Promise<Blob | null>;
	/** A real export bake is in flight — suspend speculative rendering. */
	isExporting: boolean;
	/** Master gate: only pre-compute while idle (not playing the move, tab visible, etc.). */
	enabled: boolean;
}

export interface ProofCacheHandle {
	/** The fingerprint of the current composition (null until the first pose is read). */
	currentFingerprint: string | null;
	/** Synchronous, non-bumping cache read for the panel + history thumbnails. */
	peek: (fingerprint: string) => ProofEntry | undefined;
	/** Bumps whenever a frame is stored, so readers re-render to pick it up. */
	version: number;
}

export function useProofCache({
	model,
	options,
	getPose,
	render,
	isExporting,
	enabled,
}: UseProofCacheArgs): ProofCacheHandle {
	// One store + queue + scheduler for the lifetime of the stage.
	const storeRef = useRef<ProofStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createProofStore({ max: MEMORY_ENTRIES, persist: createIdbProofPersistence() });
	}
	const queueRef = useRef(createProofRenderQueue());

	const [version, setVersion] = useState(0);
	const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);

	// Keep the latest inputs in refs so the polling effect reads fresh values without
	// re-arming the interval every render.
	const modelRef = useRef(model);
	modelRef.current = model;
	const optionsRef = useRef(options);
	optionsRef.current = options;
	const getPoseRef = useRef(getPose);
	getPoseRef.current = getPose;
	const renderRef = useRef(render);
	renderRef.current = render;
	const isExportingRef = useRef(isExporting);
	isExportingRef.current = isExporting;

	const schedulerRef = useRef<ReturnType<typeof createProofScheduler> | null>(null);
	if (schedulerRef.current === null) {
		schedulerRef.current = createProofScheduler({
			store: storeRef.current,
			queue: queueRef.current,
			render: (snapshot) => renderRef.current(snapshot),
			now: () => Date.now(),
			isExporting: () => isExportingRef.current,
			onStored: () => setVersion((v) => v + 1),
		});
	}

	// Suspend the queue the instant a real export starts; resume + drain when it ends. The
	// proof render and the export both funnel through captureHighRes, which owns the camera —
	// they must never overlap.
	useEffect(() => {
		if (isExporting) queueRef.current.suspend();
		else queueRef.current.resume();
	}, [isExporting]);

	// The idle clock. Every interval: read the pose, build the snapshot + fingerprint, surface
	// the current key, and let the scheduler decide whether to render.
	useEffect(() => {
		if (!enabled) return;
		const id = window.setInterval(() => {
			const pose = getPoseRef.current();
			if (!pose) return;
			const snapshot = selectExportSnapshot(modelRef.current, pose, optionsRef.current);
			const key = proofFingerprint(snapshot);
			setCurrentFingerprint((prev) => (prev === key ? prev : key));
			schedulerRef.current?.tick(key, snapshot);
		}, IDLE_MS);
		return () => window.clearInterval(id);
	}, [enabled]);

	const peek = useCallback((fingerprint: string) => storeRef.current?.peek(fingerprint), []);

	return { currentFingerprint, peek, version };
}
