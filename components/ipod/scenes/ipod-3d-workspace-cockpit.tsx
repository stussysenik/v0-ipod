"use client";

import { type CSSProperties, useCallback, useEffect, useState } from "react";

import { StudioButton, StudioField, StudioRow } from "@/components/ui/studio-controls";
import {
	type ResetScope,
	pendingReset,
	readRestorePoint,
	resetWorkspace,
	restoreWorkspace,
	storedWorkspaceKeys,
} from "@/lib/workspace-storage";

import { Ipod3DCockpitHeader } from "./ipod-3d-cockpit-header";

/**
 * The workspace cockpit for /3d — the back room, where the visitor's persisted state is a
 * value they can read and a thing they can return to factory.
 *
 * WHY IT READS STORAGE ITSELF
 * ---------------------------
 * Every other cockpit edits the model; this one edits what survives the model. The count it
 * shows is `storedWorkspaceKeys()` and the count it names before clearing is
 * `pendingReset(scope)` — the same filter `resetWorkspace` walks, so the number shown and
 * the number cleared cannot disagree. Reading in an effect rather than during render keeps
 * the server-rendered markup free of a value only the browser has.
 *
 * WHY THERE IS A RESTORE
 * ----------------------
 * A reset writes a version rather than erasing one, so the gesture is reversible and the
 * card states the version it is holding. A reset whose restore point cannot be written
 * throws and clears nothing; that outcome surfaces as a value on the Reset row.
 *
 * The confirmation is a two-step on the surface, not a dialog: the command is replaced by
 * the scope it will clear plus Clear/Cancel, so what is about to happen is read in the same
 * place it was asked for.
 */

interface Ipod3DWorkspaceCockpitProps {
	/**
	 * Re-read persisted state into the live surface. Called after a reset or a restore so
	 * the studio shows the resulting state without a reload.
	 */
	onRehydrate: () => void;
	/**
	 * Any value that changes when the model does. The count is a reading of storage, and the
	 * stage writes storage on a trailing debounce after every edit — so a count taken at the
	 * moment of a reset is stale as soon as the fresh model lands. Re-reading once the writes
	 * settle is what keeps the row a value rather than a memory of one.
	 */
	watch: unknown;
}

/** The stage persists on a 300ms trailing debounce; read after it lands, not during. */
const PERSIST_SETTLE_MS = 400;

const SCOPE_LABEL: Record<ResetScope, string> = {
	content: "Content",
	all: "Everything",
};

export function Ipod3DWorkspaceCockpit({ onRehydrate, watch }: Ipod3DWorkspaceCockpitProps) {
	const [stored, setStored] = useState<number | null>(null);
	const [restorable, setRestorable] = useState<number | null>(null);
	const [confirming, setConfirming] = useState<ResetScope | null>(null);
	const [aborted, setAborted] = useState(false);

	const read = useCallback(() => {
		setStored(storedWorkspaceKeys().length);
		const point = readRestorePoint();
		setRestorable(point ? Object.keys(point.entries).length : null);
	}, []);

	useEffect(read, [read]);

	// The stage persists on a 300ms trailing debounce after every model change; re-read
	// once the writes have had time to land, never while they are still settling.
	useEffect(() => {
		const timer = window.setTimeout(read, PERSIST_SETTLE_MS);
		return () => window.clearTimeout(timer);
	}, [read, watch]);

	const commit = useCallback(
		(scope: ResetScope) => {
			try {
				resetWorkspace(scope);
				setAborted(false);
			} catch {
				setAborted(true);
			}
			setConfirming(null);
			read();
			onRehydrate();
		},
		[onRehydrate, read],
	);

	const undo = useCallback(() => {
		restoreWorkspace();
		setAborted(false);
		read();
		onRehydrate();
	}, [onRehydrate, read]);

	// The scope is only counted while it is being confirmed: the reading has to be the one
	// taken at the moment of the confirmation, not one cached from an earlier render.
	const doomed = confirming ? pendingReset(confirming).length : 0;

	return (
		<div className="pointer-events-auto w-full select-none rounded-[14px] border border-black/[0.09] bg-white/95 backdrop-blur-sm">
			<Ipod3DCockpitHeader id="workspace" />
			<div className="px-3.5 pb-3 pt-1">
				<StudioRow label="Stored">
					<StudioField>{stored === null ? "—" : `${stored} keys`}</StudioField>
				</StudioRow>

				{confirming ? (
					<>
						<StudioRow label="Clearing">
							<StudioField>{`${SCOPE_LABEL[confirming]} · ${doomed} keys`}</StudioField>
						</StudioRow>
						<div className="flex gap-1.5 pt-1">
							<StudioButton onPress={() => commit(confirming)}>
								<ResetGlyph />
								Clear
							</StudioButton>
							<StudioButton onPress={() => setConfirming(null)}>Cancel</StudioButton>
						</div>
					</>
				) : (
					<>
						{aborted && (
							<StudioRow label="Reset">
								<StudioField>Aborted</StudioField>
							</StudioRow>
						)}
						<div className="flex gap-1.5 pt-1">
							<StudioButton isDisabled={stored === 0} onPress={() => setConfirming("content")}>
								<ResetGlyph />
								Reset
							</StudioButton>
							<StudioButton isDisabled={stored === 0} onPress={() => setConfirming("all")}>
								<ResetGlyph />
								Reset all
							</StudioButton>
						</div>
					</>
				)}

				{restorable !== null && (
					<>
						<div className="mt-3 border-t border-black/[0.06] pt-1" />
						<StudioRow label="Restore point">
							<StudioField>{`${restorable} keys`}</StudioField>
						</StudioRow>
						<div className="flex gap-1.5 pt-1">
							<StudioButton fullWidth onPress={undo}>
								<RestoreGlyph />
								Restore
							</StudioButton>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

// ─── Glyphs ─────────────────────────────────────────────────────────────────

const glyph: CSSProperties = { width: 10, height: 10 };

/** Clockwise return — the workspace going forward to factory. */
function ResetGlyph() {
	return (
		<svg viewBox="0 0 10 10" style={glyph} fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
			<path d="M8.2 5A3.2 3.2 0 1 1 5 1.8" />
			<path d="M4.2 0.4v2.8l2.4-1.4z" fill="currentColor" stroke="none" />
		</svg>
	);
}

/** The same arc counter-clockwise — the version coming back. */
function RestoreGlyph() {
	return (
		<svg viewBox="0 0 10 10" style={glyph} fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
			<path d="M1.8 5A3.2 3.2 0 1 0 5 1.8" />
			<path d="M5.8 0.4v2.8L3.4 1.8z" fill="currentColor" stroke="none" />
		</svg>
	);
}
