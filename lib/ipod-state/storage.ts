import type { SongMetadata } from "@/types/ipod";
import {
	COLOR_TARGETS,
	createInitialStudioState,
	DEFAULT_PANEL_LAYOUT,
	DEFAULT_SAVED_COLORS,
	MAX_SAVED_COLORS,
	type BatteryMode,
	type ColorTarget,
	type IpodStudioState,
	type IpodWorkbenchModel,
	type PanelLayoutState,
	type SavedColorHistory,
} from "@/lib/ipod-state/model";
import { BATTERY_BOOT_OFFSET_MS } from "@/lib/ipod-state/battery-cycle";
import { sanitizeLightingConfig } from "@/lib/studio-lighting-config";
import {
	DEFAULT_BACK_COLOR,
	DEFAULT_BEZEL_COLOR,
	DEFAULT_INTERACTION_MODEL,
	DEFAULT_MENU_INDEX,
	DEFAULT_OS_NOW_PLAYING_LAYOUT,
	DEFAULT_OS_SCREEN,
	DEFAULT_OS_ORIGINAL_MENU_SPLIT,
	NOW_PLAYING_LAYOUT_ELEMENT_IDS,
	DEFAULT_SELECTION_KIND,
	SONG_SNAPSHOT_SCHEMA_VERSION,
	type IpodHardwarePresetId,
	type IpodInteractionModel,
	type IpodNowPlayingLayoutPosition,
	type IpodNowPlayingLayoutState,
	type IpodOsScreen,
	type IpodPlaybackSnapshot,
	type IpodUiState,
	type IpodViewMode,
	type SnapshotSelectionKind,
	type SongSnapshot,
} from "@/types/ipod-state";
import { DEFAULT_HARDWARE_PRESET_ID } from "@/lib/ipod-classic-presets";

// Bumped to .v2 so the refreshed default song (Frank Ocean — "In My Room") actually
// surfaces for returning sessions. Persisted metadata is spread on top of the fallback
// in loadPersistedWorkbenchModel(), so without a key bump the previously-saved song would
// keep masking the new default. Old key is orphaned (harmless) and re-seeds on first save.
const METADATA_STORAGE_KEY = "ipodSnapshotMetadata.v2";
const UI_STORAGE_KEY = "ipodSnapshotUiState";
const SNAPSHOT_STORAGE_KEY = "ipodSnapshotSongSnapshot";
const EXPORT_COUNTER_STORAGE_KEY = "ipodSnapshotExportCounter";
const LAST_EXPORTED_BATTERY_KEY = "ipodSnapshotLastBattery";
// The moment the live (self-discharging) battery cycle was "born". Stamped once on
// first visit; every later load derives the current charge from `now - birth`, so the
// cycle is continuous across reloads/closures with no stored level to flicker.
const BATTERY_BIRTH_KEY = "ipodBatteryBirth";
// The /3d studio slice (lighting rig, flat/lock/marquee toggles, camera pose) rides its own
// key rather than the whitelisted SongSnapshot.ui, since it carries a nested lighting record.
const STUDIO_STORAGE_KEY = "ipodSnapshotStudio";
// Floating tool-panel layout (spec: floating-panel-system) is editor-local, per-mode
// chrome — not song/finish — so it rides its own key rather than the shared SongSnapshot.
const PANEL_LAYOUT_STORAGE_KEY = "ipodSnapshotPanelLayout";
// "Recent Custom" color history, one localStorage key per target. These pre-date the
// model-lift and are kept verbatim so a user's existing swatches survive the migration
// into `model.savedColors` (spec: floating-panel-system §6 — colors panel).
const SAVED_COLORS_KEYS: Record<ColorTarget, string> = {
	case: "ipodSnapshotCaseCustomColors",
	bg: "ipodSnapshotBgCustomColors",
	ring: "ipodSnapshotRingCustomColors",
	center: "ipodSnapshotCenterCustomColors",
};
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export function loadMetadata(): Partial<SongMetadata> | null {
	try {
		const raw = localStorage.getItem(METADATA_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;
		return parsed as Partial<SongMetadata>;
	} catch {
		return null;
	}
}

export function saveMetadata(state: SongMetadata): void {
	try {
		localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Ignore quota errors
	}
}

function isViewMode(value: unknown): value is IpodViewMode {
	return (
		value === "flat" ||
		value === "3d" ||
		value === "focus" ||
		value === "preview" ||
		value === "ascii"
	);
}

function isInteractionModel(value: unknown): value is IpodInteractionModel {
	return value === "direct" || value === "ipod-os" || value === "ipod-os-original";
}

function isHardwarePreset(value: unknown): value is IpodHardwarePresetId {
	return value === "classic-2007" || value === "classic-2008" || value === "classic-2009";
}

function isSelectionKind(value: unknown): value is SnapshotSelectionKind {
	return value === "moment" || value === "range";
}

function isOsScreen(value: unknown): value is IpodOsScreen {
	return value === "menu" || value === "now-playing";
}

function isBatteryMode(value: unknown): value is BatteryMode {
	return value === "manual" || value === "solar";
}

export function isHexColor(value: unknown): value is string {
	return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}

function isSongMetadata(value: unknown): value is SongMetadata {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value as Partial<SongMetadata>;
	return (
		typeof candidate.title === "string" &&
		typeof candidate.artist === "string" &&
		typeof candidate.album === "string" &&
		typeof candidate.artwork === "string" &&
		typeof candidate.duration === "number" &&
		typeof candidate.currentTime === "number" &&
		typeof candidate.rating === "number" &&
		typeof candidate.trackNumber === "number" &&
		typeof candidate.totalTracks === "number"
	);
}

function getFiniteNonNegativeNumber(value: unknown): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return null;
	}
	return Math.floor(value);
}

function getMenuSplit(value: unknown): number | null {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return null;
	}
	return Math.min(Math.max(value, 0.4), 0.7);
}

function getLayoutPosition(value: unknown): IpodNowPlayingLayoutPosition | null {
	if (typeof value !== "object" || value === null) {
		return null;
	}

	const candidate = value as Partial<IpodNowPlayingLayoutPosition>;
	if (
		typeof candidate.x !== "number" ||
		!Number.isFinite(candidate.x) ||
		typeof candidate.y !== "number" ||
		!Number.isFinite(candidate.y)
	) {
		return null;
	}

	return {
		x: Math.round(candidate.x),
		y: Math.round(candidate.y),
	};
}

function getNowPlayingLayout(value: unknown): IpodNowPlayingLayoutState {
	if (typeof value !== "object" || value === null) {
		return DEFAULT_OS_NOW_PLAYING_LAYOUT;
	}

	const safe: IpodNowPlayingLayoutState = {};

	for (const id of NOW_PLAYING_LAYOUT_ELEMENT_IDS) {
		const position = getLayoutPosition((value as Record<string, unknown>)[id]);
		if (position) {
			safe[id] = position;
		}
	}

	return safe;
}

function normalizePlaybackSnapshot(
	metadata: SongMetadata,
	playback: unknown,
	ui: Partial<IpodUiState> | null,
): IpodPlaybackSnapshot {
	const playbackCandidate =
		typeof playback === "object" && playback !== null
			? (playback as Partial<IpodPlaybackSnapshot>)
			: null;
	const safeDuration = Math.max(
		1,
		getFiniteNonNegativeNumber(playbackCandidate?.duration) ??
			Math.floor(metadata.duration),
	);
	const safeCurrentTime = Math.min(
		Math.max(
			getFiniteNonNegativeNumber(playbackCandidate?.currentTime) ??
				metadata.currentTime,
			0,
		),
		safeDuration,
	);
	const selectionKind = isSelectionKind(playbackCandidate?.selectionKind)
		? playbackCandidate.selectionKind
		: (ui?.selectionKind ?? DEFAULT_SELECTION_KIND);

	let rangeStartTime =
		getFiniteNonNegativeNumber(playbackCandidate?.rangeStartTime) ??
		ui?.rangeStartTime ??
		null;
	let rangeEndTime =
		getFiniteNonNegativeNumber(playbackCandidate?.rangeEndTime) ??
		ui?.rangeEndTime ??
		null;

	if (selectionKind === "range") {
		rangeStartTime = Math.min(
			Math.max(rangeStartTime ?? safeCurrentTime, 0),
			safeDuration,
		);
		rangeEndTime = Math.min(
			Math.max(rangeEndTime ?? safeCurrentTime + 15, rangeStartTime),
			safeDuration,
		);
	} else {
		rangeStartTime = null;
		rangeEndTime = null;
	}

	return {
		currentTime: safeCurrentTime,
		duration: safeDuration,
		selectionKind,
		rangeStartTime,
		rangeEndTime,
	};
}

export function loadUiState(): Partial<IpodUiState> | null {
	try {
		const raw = localStorage.getItem(UI_STORAGE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;

		const candidate = parsed as Partial<IpodUiState>;
		const safe: Partial<IpodUiState> = {};
		if (isHexColor(candidate.skinColor)) safe.skinColor = candidate.skinColor;
		if (isHexColor(candidate.bgColor)) safe.bgColor = candidate.bgColor;
		if (isHexColor(candidate.ringColor)) safe.ringColor = candidate.ringColor;
		if (isHexColor(candidate.centerColor)) safe.centerColor = candidate.centerColor;
		if (isViewMode(candidate.viewMode)) safe.viewMode = candidate.viewMode;
		if (isHardwarePreset(candidate.hardwarePreset))
			safe.hardwarePreset = candidate.hardwarePreset;
		if (isInteractionModel(candidate.interactionModel)) {
			safe.interactionModel = candidate.interactionModel;
		}
		if (isSelectionKind(candidate.selectionKind))
			safe.selectionKind = candidate.selectionKind;
		if (isOsScreen(candidate.osScreen)) safe.osScreen = candidate.osScreen;
		if (typeof candidate.isPlaying === "boolean") {
			safe.isPlaying = candidate.isPlaying;
		}
		const rangeStartTime = getFiniteNonNegativeNumber(candidate.rangeStartTime);
		if (rangeStartTime !== null) safe.rangeStartTime = rangeStartTime;
		const rangeEndTime = getFiniteNonNegativeNumber(candidate.rangeEndTime);
		if (rangeEndTime !== null) safe.rangeEndTime = rangeEndTime;
		if (
			typeof candidate.menuIndex === "number" &&
			Number.isFinite(candidate.menuIndex)
		) {
			safe.menuIndex = Math.max(0, Math.floor(candidate.menuIndex));
		}
		const osOriginalMenuSplit = getMenuSplit(candidate.osOriginalMenuSplit);
		if (osOriginalMenuSplit !== null) {
			safe.osOriginalMenuSplit = osOriginalMenuSplit;
		}
		safe.osNowPlayingLayout = getNowPlayingLayout(candidate.osNowPlayingLayout);
		if (isBatteryMode(candidate.batteryMode))
			safe.batteryMode = candidate.batteryMode;
		return safe;
	} catch {
		return null;
	}
}

export function saveUiState(state: IpodUiState): void {
	try {
		localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Ignore quota errors
	}
}

export function loadSongSnapshot(): SongSnapshot | null {
	try {
		const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;
		const candidate = parsed as Partial<SongSnapshot>;

		if (!isSongMetadata(candidate.metadata)) {
			return null;
		}
		if (!candidate.ui) {
			return null;
		}

		const partialUi = loadUiStateCandidate(candidate.ui);
		if (!partialUi.skinColor || !partialUi.bgColor || !partialUi.viewMode) {
			return null;
		}

		const playback = normalizePlaybackSnapshot(
			candidate.metadata,
			candidate.playback,
			partialUi,
		);
		const ui: IpodUiState = {
			skinColor: partialUi.skinColor,
			bgColor: partialUi.bgColor,
			ringColor: partialUi.ringColor ?? "",
			centerColor: partialUi.centerColor ?? "",
			backColor: partialUi.backColor ?? DEFAULT_BACK_COLOR,
			edgeColor: partialUi.edgeColor ?? partialUi.backColor ?? DEFAULT_BACK_COLOR,
			bezelColor: partialUi.bezelColor ?? DEFAULT_BEZEL_COLOR,
			viewMode: partialUi.viewMode,
			hardwarePreset: partialUi.hardwarePreset ?? DEFAULT_HARDWARE_PRESET_ID,
			interactionModel: partialUi.interactionModel ?? DEFAULT_INTERACTION_MODEL,
			selectionKind: playback.selectionKind,
			rangeStartTime: playback.rangeStartTime,
			rangeEndTime: playback.rangeEndTime,
			osScreen: partialUi.osScreen ?? DEFAULT_OS_SCREEN,
			menuIndex: partialUi.menuIndex ?? DEFAULT_MENU_INDEX,
			osOriginalMenuSplit:
				partialUi.osOriginalMenuSplit ?? DEFAULT_OS_ORIGINAL_MENU_SPLIT,
			osNowPlayingLayout:
				partialUi.osNowPlayingLayout ?? DEFAULT_OS_NOW_PLAYING_LAYOUT,
			isPlaying: partialUi.isPlaying ?? false,
			batteryLevel: partialUi.batteryLevel ?? 1.0,
			batteryMode: partialUi.batteryMode ?? "manual",
		};

		return {
			schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
			metadata: {
				...candidate.metadata,
				currentTime: playback.currentTime,
				duration: playback.duration,
			},
			ui,
			playback,
		};
	} catch {
		return null;
	}
}

export function saveSongSnapshot(snapshot: SongSnapshot): void {
	try {
		const playback = normalizePlaybackSnapshot(
			snapshot.metadata,
			snapshot.playback,
			snapshot.ui,
		);
		const normalized: SongSnapshot = {
			schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
			metadata: {
				...snapshot.metadata,
				currentTime: playback.currentTime,
				duration: playback.duration,
			},
			ui: {
				...snapshot.ui,
				selectionKind: playback.selectionKind,
				rangeStartTime: playback.rangeStartTime,
				rangeEndTime: playback.rangeEndTime,
			},
			playback,
		};
		localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(normalized));
	} catch {
		// Ignore quota errors
	}
}

function loadUiStateCandidate(candidate: unknown): Partial<IpodUiState> {
	if (typeof candidate !== "object" || candidate === null) {
		return {};
	}

	const parsed = candidate as Partial<IpodUiState>;
	const safe: Partial<IpodUiState> = {};
	if (isHexColor(parsed.skinColor)) safe.skinColor = parsed.skinColor;
	if (isHexColor(parsed.bgColor)) safe.bgColor = parsed.bgColor;
	if (isHexColor(parsed.ringColor)) safe.ringColor = parsed.ringColor;
	if (isHexColor(parsed.centerColor)) safe.centerColor = parsed.centerColor;
	if (isViewMode(parsed.viewMode)) safe.viewMode = parsed.viewMode;
	if (isHardwarePreset(parsed.hardwarePreset)) safe.hardwarePreset = parsed.hardwarePreset;
	if (isInteractionModel(parsed.interactionModel))
		safe.interactionModel = parsed.interactionModel;
	if (isSelectionKind(parsed.selectionKind)) safe.selectionKind = parsed.selectionKind;
	if (isOsScreen(parsed.osScreen)) safe.osScreen = parsed.osScreen;
	if (typeof parsed.batteryLevel === "number") safe.batteryLevel = parsed.batteryLevel;
	if (isBatteryMode(parsed.batteryMode)) safe.batteryMode = parsed.batteryMode;

	const rangeStartTime = getFiniteNonNegativeNumber(parsed.rangeStartTime);
	if (rangeStartTime !== null) safe.rangeStartTime = rangeStartTime;
	const rangeEndTime = getFiniteNonNegativeNumber(parsed.rangeEndTime);
	if (rangeEndTime !== null) safe.rangeEndTime = rangeEndTime;
	if (typeof parsed.menuIndex === "number" && Number.isFinite(parsed.menuIndex)) {
		safe.menuIndex = Math.max(0, Math.floor(parsed.menuIndex));
	}
	const osOriginalMenuSplit = getMenuSplit(parsed.osOriginalMenuSplit);
	if (osOriginalMenuSplit !== null) {
		safe.osOriginalMenuSplit = osOriginalMenuSplit;
	}
	safe.osNowPlayingLayout = getNowPlayingLayout(parsed.osNowPlayingLayout);

	return safe;
}

export function loadExportCounter(): number {
	try {
		const raw = localStorage.getItem(EXPORT_COUNTER_STORAGE_KEY);
		if (!raw) return 0;
		const parsed = Number.parseInt(raw, 10);
		if (!Number.isFinite(parsed) || parsed < 0) {
			return 0;
		}
		return parsed;
	} catch {
		return 0;
	}
}

export function saveExportCounter(nextCounter: number): void {
	try {
		const safe = Math.max(0, Math.floor(nextCounter));
		localStorage.setItem(EXPORT_COUNTER_STORAGE_KEY, String(safe));
	} catch {
		// Ignore quota errors
	}
}

export function loadLastExportedBatteryLevel(): number {
	try {
		const raw = localStorage.getItem(LAST_EXPORTED_BATTERY_KEY);
		if (!raw) {
			const snapshot = loadSongSnapshot();
			return snapshot?.ui.batteryLevel ?? 1.0;
		}
		const parsed = parseFloat(raw);
		if (!Number.isFinite(parsed)) {
			const snapshot = loadSongSnapshot();
			return snapshot?.ui.batteryLevel ?? 1.0;
		}
		return Math.min(Math.max(parsed, 0.08), 1.0);
	} catch {
		return 1.0;
	}
}

/**
 * The birth moment for the live battery cycle (epoch ms). Stamped to `now` on the
 * first call that finds no stored value, so a genuine first visit starts at a full
 * charge; every later load returns the same origin and the cycle stays continuous.
 */
export function loadBatteryBirth(now: number): number {
	try {
		const raw = localStorage.getItem(BATTERY_BIRTH_KEY);
		if (raw) {
			const parsed = parseInt(raw, 10);
			if (Number.isFinite(parsed)) return parsed;
		}
		// First visit: stamp the birth a little in the past so the opening read boots
		// below full (~85%) instead of a clinical 100% (spec: never start at 100%).
		const birth = now - BATTERY_BOOT_OFFSET_MS;
		localStorage.setItem(BATTERY_BIRTH_KEY, String(birth));
		return birth;
	} catch {
		return now - BATTERY_BOOT_OFFSET_MS;
	}
}

export function saveWorkbenchModel(model: IpodWorkbenchModel): void {
	const snapshot: SongSnapshot = {
		schemaVersion: SONG_SNAPSHOT_SCHEMA_VERSION,
		metadata: model.metadata,
		ui: {
			skinColor: model.presentation.skinColor,
			bgColor: model.presentation.bgColor,
			ringColor: model.presentation.ringColor,
			centerColor: model.presentation.centerColor,
			backColor: model.presentation.backColor,
			edgeColor: model.presentation.edgeColor,
			bezelColor: model.presentation.bezelColor,
			viewMode: model.presentation.viewMode,
			hardwarePreset: model.presentation.hardwarePreset,
			interactionModel: model.interaction.interactionModel,
			selectionKind: model.playback.selectionKind,
			rangeStartTime: model.playback.rangeStartTime,
			rangeEndTime: model.playback.rangeEndTime,
			osScreen: model.interaction.osScreen,
			menuIndex: model.interaction.menuIndex,
			osOriginalMenuSplit: model.interaction.osOriginalMenuSplit,
			osNowPlayingLayout: model.interaction.osNowPlayingLayout,
			isPlaying: model.interaction.isPlaying,
			batteryLevel: model.interaction.batteryLevel,
			batteryMode: model.interaction.batteryMode,
		},
		playback: model.playback,
	};
	saveSongSnapshot(snapshot);
	saveStudioState(model.studio);
	saveSavedColors(model.savedColors);
}

export function loadWorkbenchModel(): IpodWorkbenchModel | null {
	const snapshot = loadSongSnapshot();
	if (!snapshot) return null;

	return {
		metadata: snapshot.metadata,
		playback: snapshot.playback,
		presentation: {
			skinColor: snapshot.ui.skinColor,
			bgColor: snapshot.ui.bgColor,
			ringColor: snapshot.ui.ringColor,
			centerColor: snapshot.ui.centerColor,
			backColor: snapshot.ui.backColor,
			edgeColor: snapshot.ui.edgeColor ?? snapshot.ui.backColor,
			bezelColor: snapshot.ui.bezelColor,
			viewMode: snapshot.ui.viewMode,
			hardwarePreset: snapshot.ui.hardwarePreset,
		},
		interaction: {
			interactionModel: snapshot.ui.interactionModel,
			osScreen: snapshot.ui.osScreen,
			menuIndex: snapshot.ui.menuIndex,
			osOriginalMenuSplit: snapshot.ui.osOriginalMenuSplit,
			osNowPlayingLayout: snapshot.ui.osNowPlayingLayout,
			isNowPlayingEditable: false,
			isPlaying: snapshot.ui.isPlaying,
			batteryLevel: snapshot.ui.batteryLevel,
			batteryMode: snapshot.ui.batteryMode,
		},
		// Studio rides its own key; default to a fresh slice if absent or corrupt.
		studio: loadStudioState() ?? createInitialStudioState(),
		// Panel layout rides its own key too (editor-local, per-mode chrome).
		panelLayout: loadPanelLayout(),
		// Color history rides its own per-target keys (editor-local chrome).
		savedColors: loadSavedColors(),
	};
}

export function saveStudioState(studio: IpodStudioState): void {
	try {
		localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(studio));
	} catch {
		// Ignore quota errors
	}
}

export function loadStudioState(): IpodStudioState | null {
	try {
		const raw = localStorage.getItem(STUDIO_STORAGE_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;
		const c = parsed as Partial<IpodStudioState>;
		const base = createInitialStudioState();
		return {
			lighting: sanitizeLightingConfig(c.lighting),
			technicalFlat: typeof c.technicalFlat === "boolean" ? c.technicalFlat : base.technicalFlat,
			interactionLocked:
				typeof c.interactionLocked === "boolean" ? c.interactionLocked : base.interactionLocked,
			marquee: typeof c.marquee === "boolean" ? c.marquee : base.marquee,
			showPorts: typeof c.showPorts === "boolean" ? c.showPorts : base.showPorts,
			layoutMode: typeof c.layoutMode === "boolean" ? c.layoutMode : base.layoutMode,
			theatreStudio:
				typeof c.theatreStudio === "boolean" ? c.theatreStudio : base.theatreStudio,
		};
	} catch {
		return null;
	}
}

export function savePanelLayout(layout: PanelLayoutState): void {
	try {
		localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
	} catch {
		// Ignore quota errors
	}
}

export function loadPanelLayout(): PanelLayoutState {
	try {
		const raw = localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY);
		if (!raw) return { ...DEFAULT_PANEL_LAYOUT };
		const parsed: unknown = JSON.parse(raw);
		// Plain sparse data; the host resolves every frame against the registry default,
		// so a shallow object check is enough to reject corrupt blobs without over-validating.
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			return { ...DEFAULT_PANEL_LAYOUT };
		}
		return parsed as PanelLayoutState;
	} catch {
		return { ...DEFAULT_PANEL_LAYOUT };
	}
}

export function loadSavedColors(): SavedColorHistory {
	const result: SavedColorHistory = { case: [], bg: [], ring: [], center: [] };
	for (const target of COLOR_TARGETS) {
		try {
			const raw = localStorage.getItem(SAVED_COLORS_KEYS[target]);
			if (!raw) continue;
			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) continue;
			result[target] = parsed
				.filter((v): v is string => typeof v === "string" && HEX_COLOR_PATTERN.test(v))
				.slice(0, MAX_SAVED_COLORS);
		} catch {
			// Ignore corrupt blobs — target stays empty.
		}
	}
	return result;
}

export function saveSavedColors(history: SavedColorHistory): void {
	const safe = history ?? DEFAULT_SAVED_COLORS;
	for (const target of COLOR_TARGETS) {
		try {
			localStorage.setItem(SAVED_COLORS_KEYS[target], JSON.stringify(safe[target] ?? []));
		} catch {
			// Ignore quota errors
		}
	}
}

export function saveLastExportedBatteryLevel(level: number): void {
	try {
		const clamped = Math.min(Math.max(level, 0.08), 1.0);
		localStorage.setItem(LAST_EXPORTED_BATTERY_KEY, String(clamped));
	} catch {
		// Ignore quota errors
	}
}
