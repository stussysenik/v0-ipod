export const STORAGE_CLASSES = ["settings", "content", "cache", "legacy"] as const;
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

export function resetWorkspace(scope: ResetScope = "content"): string[] {
	const removed: string[] = [];
	for (const entry of WORKSPACE_STORAGE_KEYS) {
		try {
			const shouldRemove =
				entry.class === "legacy" ||
				entry.class === "content" ||
				entry.class === "cache" ||
				(scope === "all" && entry.class === "settings");
			if (shouldRemove && localStorage.getItem(entry.key) !== null) {
				localStorage.removeItem(entry.key);
				removed.push(entry.key);
			}
		} catch {
			// ignore quota / private-mode failures
		}
	}
	return removed;
}
