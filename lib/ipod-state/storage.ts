import type { SongMetadata } from "@/types/ipod";
import {
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

const METADATA_STORAGE_KEY = "ipodSnapshotMetadata";
const UI_STORAGE_KEY = "ipodSnapshotUiState";
const SNAPSHOT_STORAGE_KEY = "ipodSnapshotSongSnapshot";
const EXPORT_COUNTER_STORAGE_KEY = "ipodSnapshotExportCounter";
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
		if (isViewMode(candidate.viewMode)) safe.viewMode = candidate.viewMode;
		if (isHardwarePreset(candidate.hardwarePreset))
			safe.hardwarePreset = candidate.hardwarePreset;
		if (isInteractionModel(candidate.interactionModel)) {
			safe.interactionModel = candidate.interactionModel;
		}
		if (isSelectionKind(candidate.selectionKind))
			safe.selectionKind = candidate.selectionKind;
		if (isOsScreen(candidate.osScreen)) safe.osScreen = candidate.osScreen;
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
	if (isViewMode(parsed.viewMode)) safe.viewMode = parsed.viewMode;
	if (isHardwarePreset(parsed.hardwarePreset)) safe.hardwarePreset = parsed.hardwarePreset;
	if (isInteractionModel(parsed.interactionModel))
		safe.interactionModel = parsed.interactionModel;
	if (isSelectionKind(parsed.selectionKind)) safe.selectionKind = parsed.selectionKind;
	if (isOsScreen(parsed.osScreen)) safe.osScreen = parsed.osScreen;

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
