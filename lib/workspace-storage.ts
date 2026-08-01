/**
 * Every browser-storage key the app writes, declared once.
 *
 * The registry is not a list for reading — it is the input to three operations that cannot
 * be written correctly without it: a reset that knows what to clear, a fresh-boot fixture
 * that knows what must be absent, and the unit gate that fails on any key literal outside
 * this file. A registry without that gate is accurate for a month and misleading after.
 *
 * Class decides what a reset does with a key:
 *   settings — user intent that outlives a reset (theme choice, saved themes, saved colours)
 *   content  — the document under edit (snapshot, studio state, camera, motion shelf)
 *   cache    — derived or advisory (export counter, coach hint, deploy version)
 *   legacy   — migrated on read, swept on write
 *   restore  — the pre-reset image; the one class a reset writes instead of clearing
 *
 * Key strings are verbatim and the three naming conventions stay: renaming a key discards
 * every existing visitor's data, so a rename is a migration and not a tidy-up.
 */
export const STORAGE_CLASSES = ["settings", "content", "cache", "legacy", "restore"] as const;
export type StorageClass = (typeof STORAGE_CLASSES)[number];

export interface StorageEntry {
	key: string;
	owner: string;
	class: StorageClass;
}

// lib/studio-themes.ts
export const STUDIO_THEMES_STORAGE_KEY = "ipodStudioThemes";
export const STUDIO_DEFAULT_THEME_STORAGE_KEY = "ipodStudioDefaultTheme";

// hooks/use-ipod-theme.tsx
export const IPOD_THEME_STORAGE_KEY = "ipod-theme";

// lib/studio-camera-store.ts
export const CAMERA_STORE_KEY = "ipod-3d-camera.v1";
export const LEGACY_LOCKED_POSE_KEY = "ipod-3d-locked-pose";
export const LEGACY_SHOTS_KEY = "ipod-3d-studio-shots";
export const LEGACY_PRESETS_KEY = "ipod-3d-camera-presets";

// lib/ipod-state/storage.ts
export const METADATA_STORAGE_KEY = "ipodSnapshotMetadata.v2";
export const UI_STORAGE_KEY = "ipodSnapshotUiState";
export const SNAPSHOT_STORAGE_KEY = "ipodSnapshotSongSnapshot";
export const EXPORT_COUNTER_STORAGE_KEY = "ipodSnapshotExportCounter";
export const LAST_EXPORTED_BATTERY_KEY = "ipodSnapshotLastBattery";
export const BATTERY_BIRTH_KEY = "ipodBatteryBirth";
export const STUDIO_STORAGE_KEY = "ipodSnapshotStudio";
export const PANEL_LAYOUT_STORAGE_KEY = "ipodSnapshotPanelLayout";
export const SAVED_COLORS_CASE_KEY = "ipodSnapshotCaseCustomColors";
export const SAVED_COLORS_BG_KEY = "ipodSnapshotBgCustomColors";
export const SAVED_COLORS_RING_KEY = "ipodSnapshotRingCustomColors";
export const SAVED_COLORS_CENTER_KEY = "ipodSnapshotCenterCustomColors";

// lib/motion/motion-shelf.ts
export const MOTION_SHELF_STORAGE_KEY = "ipodStudioMotions";

// components/ipod/scenes/ipod-3d-coach-hint.tsx
export const GESTURE_COACHED_KEY = "ipod-3d-gesture-coached";

// components/ipod/editors/grey-palette-picker.tsx
export const GREY_FAMILY_STORAGE_KEY = "ipodSnapshotGreyFamily";

// components/service-worker-cleanup.tsx
export const DEPLOY_VERSION_STORAGE_KEY = "ipodSnapshotDeployVersion";

// this module — the one key a reset writes instead of clearing.
export const WORKSPACE_RESTORE_KEY = "ipodWorkspaceRestore";

export const WORKSPACE_STORAGE_KEYS: readonly StorageEntry[] = [
	{ key: STUDIO_THEMES_STORAGE_KEY, owner: "lib/studio-themes.ts", class: "settings" },
	{ key: STUDIO_DEFAULT_THEME_STORAGE_KEY, owner: "lib/studio-themes.ts", class: "settings" },
	{ key: IPOD_THEME_STORAGE_KEY, owner: "hooks/use-ipod-theme.tsx", class: "settings" },
	{ key: CAMERA_STORE_KEY, owner: "lib/studio-camera-store.ts", class: "content" },
	{ key: LEGACY_LOCKED_POSE_KEY, owner: "lib/studio-camera-store.ts", class: "legacy" },
	{ key: LEGACY_SHOTS_KEY, owner: "lib/studio-camera-store.ts", class: "legacy" },
	{ key: LEGACY_PRESETS_KEY, owner: "lib/studio-camera-store.ts", class: "legacy" },
	{ key: METADATA_STORAGE_KEY, owner: "lib/ipod-state/storage.ts", class: "content" },
	{ key: UI_STORAGE_KEY, owner: "lib/ipod-state/storage.ts", class: "content" },
	{ key: SNAPSHOT_STORAGE_KEY, owner: "lib/ipod-state/storage.ts", class: "content" },
	{ key: EXPORT_COUNTER_STORAGE_KEY, owner: "lib/ipod-state/storage.ts", class: "cache" },
	{ key: LAST_EXPORTED_BATTERY_KEY, owner: "lib/ipod-state/storage.ts", class: "cache" },
	{ key: BATTERY_BIRTH_KEY, owner: "lib/ipod-state/storage.ts", class: "cache" },
	{ key: STUDIO_STORAGE_KEY, owner: "lib/ipod-state/storage.ts", class: "content" },
	{ key: PANEL_LAYOUT_STORAGE_KEY, owner: "lib/ipod-state/storage.ts", class: "content" },
	{ key: SAVED_COLORS_CASE_KEY, owner: "lib/ipod-state/storage.ts", class: "settings" },
	{ key: SAVED_COLORS_BG_KEY, owner: "lib/ipod-state/storage.ts", class: "settings" },
	{ key: SAVED_COLORS_RING_KEY, owner: "lib/ipod-state/storage.ts", class: "settings" },
	{ key: SAVED_COLORS_CENTER_KEY, owner: "lib/ipod-state/storage.ts", class: "settings" },
	{ key: MOTION_SHELF_STORAGE_KEY, owner: "lib/motion/motion-shelf.ts", class: "content" },
	{ key: GESTURE_COACHED_KEY, owner: "components/ipod/scenes/ipod-3d-coach-hint.tsx", class: "cache" },
	{ key: GREY_FAMILY_STORAGE_KEY, owner: "components/ipod/editors/grey-palette-picker.tsx", class: "settings" },
	{ key: DEPLOY_VERSION_STORAGE_KEY, owner: "components/service-worker-cleanup.tsx", class: "cache" },
	{ key: WORKSPACE_RESTORE_KEY, owner: "lib/workspace-storage.ts", class: "restore" },
] as const;

function buildKeyMap(): Record<string, StorageEntry> {
	const map: Record<string, StorageEntry> = {};
	for (const entry of WORKSPACE_STORAGE_KEYS) {
		map[entry.key] = entry;
	}
	return map;
}

export const WORKSPACE_KEY_MAP: Readonly<Record<string, StorageEntry>> = buildKeyMap();

export function getStorageClass(key: string): StorageClass | undefined {
	return WORKSPACE_KEY_MAP[key]?.class;
}

export function isDeclaredKey(key: string): boolean {
	return key in WORKSPACE_KEY_MAP;
}

export type ResetScope = "content" | "all";

/** A key a reset removes: everything but `settings` outside the wide scope, never `restore`. */
function isClearedBy(entry: StorageEntry, scope: ResetScope): boolean {
	if (entry.class === "restore") return false;
	if (entry.class === "settings") return scope === "all";
	return true;
}

/** Every declared key holding a value right now. Reads through one place, not per caller. */
export function storedWorkspaceKeys(): string[] {
	const present: string[] = [];
	for (const entry of WORKSPACE_STORAGE_KEYS) {
		try {
			if (localStorage.getItem(entry.key) !== null) present.push(entry.key);
		} catch {
			// ignore private-mode failures
		}
	}
	return present;
}

/**
 * What a reset with this scope would remove — the list a confirmation names, and the list
 * the reset itself walks. One filter, so the count shown and the count cleared cannot
 * disagree.
 */
export function pendingReset(scope: ResetScope = "content"): string[] {
	const present = new Set(storedWorkspaceKeys());
	return WORKSPACE_STORAGE_KEYS.filter((e) => isClearedBy(e, scope) && present.has(e.key)).map(
		(e) => e.key,
	);
}

/** The workspace as it stood before a reset — every declared key that held a value. */
export interface RestorePoint {
	/** The scope the reset ran with, so the surface can name what it undoes. */
	scope: ResetScope;
	/** Key → stored value, verbatim. Absent means the key held nothing. */
	entries: Record<string, string>;
}

function writeRestorePoint(point: RestorePoint): void {
	try {
		localStorage.setItem(WORKSPACE_RESTORE_KEY, JSON.stringify(point));
	} catch {
		// Quota or private mode. Abort rather than clear: a gesture that cannot be undone
		// does not run.
		throw new Error("Reset aborted — the restore point could not be written.");
	}
}

export function readRestorePoint(): RestorePoint | null {
	try {
		const raw = localStorage.getItem(WORKSPACE_RESTORE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;
		const { scope, entries } = parsed as Partial<RestorePoint>;
		if (scope !== "content" && scope !== "all") return null;
		if (typeof entries !== "object" || entries === null) return null;
		return { scope, entries };
	} catch {
		return null;
	}
}

/**
 * Returns the workspace to a first-load state, and returns the keys it removed.
 *
 * A reset is a **version, not an erasure**: the whole workspace is captured to
 * `WORKSPACE_RESTORE_KEY` before the first key goes. The capture includes the previous
 * restore point — that key is declared like any other — so point N nests point N-1 and the
 * chain of resets is walkable from one key instead of a hand-rolled stack whose oldest
 * entry someone has to decide to drop.
 *
 * Order is load-bearing. The restore point is written *first* and its failure throws, so a
 * storage that cannot hold the undo never gets cleared. Removal itself stays tolerant of
 * per-key failures, which is the pre-existing private-mode contract.
 */
export function resetWorkspace(scope: ResetScope = "content"): string[] {
	const doomed = pendingReset(scope);
	if (doomed.length === 0) return [];

	const entries: Record<string, string> = {};
	for (const key of storedWorkspaceKeys()) {
		const value = localStorage.getItem(key);
		if (value !== null) entries[key] = value;
	}
	writeRestorePoint({ scope, entries });

	const removed: string[] = [];
	for (const key of doomed) {
		try {
			localStorage.removeItem(key);
			removed.push(key);
		} catch {
			// ignore quota / private-mode failures
		}
	}
	return removed;
}

/**
 * Puts the last restore point back and returns the keys it wrote.
 *
 * The point is an exact image, so a declared key absent from it is removed rather than
 * left: restoring is "the workspace as it was", not "the workspace plus whatever arrived
 * since". `WORKSPACE_RESTORE_KEY` is itself declared, so this loop also reinstates the
 * previous point — or removes it when the restored state predates every reset.
 */
export function restoreWorkspace(): string[] {
	const point = readRestorePoint();
	if (!point) return [];
	const restored: string[] = [];
	for (const entry of WORKSPACE_STORAGE_KEYS) {
		const value = point.entries[entry.key];
		try {
			if (value === undefined) {
				localStorage.removeItem(entry.key);
			} else {
				localStorage.setItem(entry.key, value);
				restored.push(entry.key);
			}
		} catch {
			// ignore quota / private-mode failures
		}
	}
	return restored;
}
