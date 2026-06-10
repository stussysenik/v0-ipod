import type {
  IpodInteractionModel,
  IpodNowPlayingLayoutPosition,
  IpodNowPlayingLayoutState,
  IpodOsScreen,
  IpodViewMode,
  SnapshotSelectionKind,
} from "./ipod-state";

export const SCENE_DOCUMENT_VERSION = 1 as const;

export const SCENE_NODE_IDS = [
  "scene",
  "stage",
  "shell",
  "screen",
  "status-bar",
  "now-playing",
  "artwork",
  "title",
  "artist",
  "album",
  "rating",
  "track-info",
  "progress",
  "elapsed-time",
  "remaining-time",
  "wheel",
  "toolbox",
] as const;

export type SceneNodeId = (typeof SCENE_NODE_IDS)[number];

export type SceneNodeKind =
  | "scene"
  | "container"
  | "device-shell"
  | "screen"
  | "status-bar"
  | "artwork"
  | "text"
  | "rating"
  | "track-info"
  | "progress"
  | "time"
  | "wheel"
  | "toolbox";

export type SceneNodeRole =
  | "root"
  | "preview-stage"
  | "ipod-shell"
  | "playback-screen"
  | "status-bar"
  | "now-playing-layout"
  | "album-artwork"
  | "track-title"
  | "track-artist"
  | "track-album"
  | "playback-rating"
  | "track-position"
  | "playback-progress"
  | "elapsed-time"
  | "remaining-time"
  | "click-wheel"
  | "inspector";

export type SceneValue =
  | string
  | number
  | boolean
  | null
  | readonly SceneValue[]
  | { readonly [key: string]: SceneValue };

export type SceneNodeProps = Readonly<Record<string, SceneValue>>;

export interface SceneNode {
  id: SceneNodeId;
  kind: SceneNodeKind;
  role: SceneNodeRole;
  parentId: SceneNodeId | null;
  children: readonly SceneNodeId[];
  props: SceneNodeProps;
}

export interface ScenePreferences {
  viewMode: IpodViewMode;
  interactionModel: IpodInteractionModel;
  selectionKind: SnapshotSelectionKind;
  rangeStartTime: number | null;
  rangeEndTime: number | null;
  osScreen: IpodOsScreen;
  menuIndex: number;
  osOriginalMenuSplit: number;
}

export type SceneExportPresetId =
  | "product"
  | "square"
  | "portrait"
  | "story"
  | "landscape";

export interface SceneExportIntent {
  presetId: SceneExportPresetId;
  format: "png" | "gif";
}

export const PROJECTION_PROFILE_IDS = [
  "authoring-desktop",
  "authoring-mobile",
  "viewer-flat",
  "viewer-preview",
  "viewer-focus",
  "viewer-3d",
  "viewer-ascii",
  "export-product",
  "export-square",
  "export-portrait",
  "export-story",
  "export-landscape",
] as const;

export type ProjectionProfileId = (typeof PROJECTION_PROFILE_IDS)[number];

export type ProjectionProfileContext = "authoring" | "viewer" | "export";

export interface ProjectionProfile {
  id: ProjectionProfileId;
  label: string;
  context: ProjectionProfileContext;
  stage: {
    width: number;
    height: number;
    padding: number;
    offsetY: number;
    scaleMode: "fit" | "fixed";
  };
  inspector: {
    mode: "dock" | "sheet";
    compact: boolean;
  };
  constraints: {
    mobile: boolean;
    pointerMode: "direct" | "authentic" | "mixed";
    exportSafe: boolean;
  };
  layout: {
    nowPlayingOffsets: IpodNowPlayingLayoutState;
    offsetClamp: IpodNowPlayingLayoutPosition;
  };
  exportFrame?: {
    presetId: SceneExportPresetId;
    width: number;
    height: number;
    padding: number;
    offsetY: number;
  };
}

export type ProjectionProfileRegistry = Readonly<
  Record<ProjectionProfileId, ProjectionProfile>
>;

export interface SceneDocument {
  version: typeof SCENE_DOCUMENT_VERSION;
  rootId: SceneNodeId;
  selectedNodeId: SceneNodeId | null;
  activeProfileId: ProjectionProfileId;
  nodes: Readonly<Record<SceneNodeId, SceneNode>>;
  preferences: ScenePreferences;
  exportIntent: SceneExportIntent;
}

export interface SceneProjectionState {
  document: SceneDocument;
  profiles: ProjectionProfileRegistry;
}
