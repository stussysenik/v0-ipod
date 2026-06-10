import type {
  IpodNowPlayingLayoutElementId,
  IpodNowPlayingLayoutPosition,
  IpodUiState,
} from "@/types/ipod-state";
import type {
  ProjectionProfile,
  ProjectionProfileId,
  SceneDocument,
  SceneExportPresetId,
  SceneNode,
  SceneNodeId,
  SceneNodeProps,
  ScenePreferences,
  SceneProjectionState,
  SceneValue,
} from "@/types/scene-document";
import { SCENE_DOCUMENT_VERSION } from "@/types/scene-document";
import {
  buildProjectionProfiles,
  getAuthoringProfileId,
  getExportProfileId,
  getProjectionProfile,
  getViewerProfileId,
} from "@/lib/projection-profiles";

export type SceneProjectionIntent =
  | { type: "select-node"; nodeId: SceneNodeId | null }
  | { type: "set-active-profile"; profileId: ProjectionProfileId }
  | { type: "set-export-preset"; presetId: SceneExportPresetId }
  | {
      type: "set-preference";
      key: keyof ScenePreferences;
      value: ScenePreferences[keyof ScenePreferences];
    }
  | {
      type: "update-node-props";
      nodeId: SceneNodeId;
      props: Readonly<Record<string, SceneValue>>;
    }
  | {
      type: "update-layout-position";
      nodeId: IpodNowPlayingLayoutElementId;
      position: IpodNowPlayingLayoutPosition;
      profileId?: ProjectionProfileId;
    };

function createNode(
  id: SceneNodeId,
  kind: SceneNode["kind"],
  role: SceneNode["role"],
  parentId: SceneNodeId | null,
  children: readonly SceneNodeId[],
  props: SceneNodeProps = {},
): SceneNode {
  return {
    id,
    kind,
    role,
    parentId,
    children,
    props,
  };
}

function buildSceneNodes(ui: IpodUiState): Readonly<Record<SceneNodeId, SceneNode>> {
  return {
    scene: createNode("scene", "scene", "root", null, ["stage", "toolbox"], {
      backgroundColor: ui.bgColor,
    }),
    stage: createNode("stage", "container", "preview-stage", "scene", ["shell"], {
      viewMode: ui.viewMode,
    }),
    shell: createNode(
      "shell",
      "device-shell",
      "ipod-shell",
      "stage",
      ["screen", "wheel"],
      {
        hardwarePreset: ui.hardwarePreset,
        skinColor: ui.skinColor,
      },
    ),
    screen: createNode(
      "screen",
      "screen",
      "playback-screen",
      "shell",
      ["status-bar", "now-playing"],
      {
        interactionModel: ui.interactionModel,
        osScreen: ui.osScreen,
      },
    ),
    "status-bar": createNode("status-bar", "status-bar", "status-bar", "screen", [], {
      batteryVisible: true,
    }),
    "now-playing": createNode(
      "now-playing",
      "container",
      "now-playing-layout",
      "screen",
      ["artwork", "title", "artist", "album", "rating", "track-info", "progress"],
    ),
    artwork: createNode("artwork", "artwork", "album-artwork", "now-playing", [], {
      binding: "artwork",
    }),
    title: createNode("title", "text", "track-title", "now-playing", [], {
      binding: "title",
    }),
    artist: createNode("artist", "text", "track-artist", "now-playing", [], {
      binding: "artist",
    }),
    album: createNode("album", "text", "track-album", "now-playing", [], {
      binding: "album",
    }),
    rating: createNode("rating", "rating", "playback-rating", "now-playing", [], {
      binding: "rating",
    }),
    "track-info": createNode(
      "track-info",
      "track-info",
      "track-position",
      "now-playing",
      [],
      {
        binding: "track-number",
      },
    ),
    progress: createNode(
      "progress",
      "progress",
      "playback-progress",
      "now-playing",
      ["elapsed-time", "remaining-time"],
      {
        binding: "progress",
      },
    ),
    "elapsed-time": createNode("elapsed-time", "time", "elapsed-time", "progress", [], {
      binding: "currentTime",
    }),
    "remaining-time": createNode(
      "remaining-time",
      "time",
      "remaining-time",
      "progress",
      [],
      {
        binding: "remainingTime",
      },
    ),
    wheel: createNode("wheel", "wheel", "click-wheel", "shell", [], {
      interactionModel: ui.interactionModel,
    }),
    toolbox: createNode("toolbox", "toolbox", "inspector", "scene", [], {
      selectionKind: ui.selectionKind,
    }),
  };
}

function getDefaultSelectedNodeId(ui: IpodUiState): SceneNodeId {
  if (ui.interactionModel !== "direct" && ui.osScreen === "menu") {
    return "screen";
  }
  return "title";
}

export function buildSceneDocument(
  ui: IpodUiState,
  options?: {
    selectedNodeId?: SceneNodeId | null;
    activeProfileId?: ProjectionProfileId;
    exportPresetId?: SceneExportPresetId;
    exportFormat?: "png" | "gif";
    compactViewport?: boolean;
  },
): SceneDocument {
  const exportPresetId = options?.exportPresetId ?? "product";
  const defaultProfileId =
    options?.activeProfileId ?? getAuthoringProfileId(options?.compactViewport ?? false);

  return {
    version: SCENE_DOCUMENT_VERSION,
    rootId: "scene",
    selectedNodeId: options?.selectedNodeId ?? getDefaultSelectedNodeId(ui),
    activeProfileId: defaultProfileId,
    nodes: buildSceneNodes(ui),
    preferences: {
      viewMode: ui.viewMode,
      interactionModel: ui.interactionModel,
      selectionKind: ui.selectionKind,
      rangeStartTime: ui.rangeStartTime,
      rangeEndTime: ui.rangeEndTime,
      osScreen: ui.osScreen,
      menuIndex: ui.menuIndex,
      osOriginalMenuSplit: ui.osOriginalMenuSplit,
    },
    exportIntent: {
      presetId: exportPresetId,
      format: options?.exportFormat ?? "png",
    },
  };
}

export function buildSceneProjectionState(
  ui: IpodUiState,
  options?: {
    selectedNodeId?: SceneNodeId | null;
    compactViewport?: boolean;
    exportPresetId?: SceneExportPresetId;
    exportFormat?: "png" | "gif";
  },
): SceneProjectionState {
  const profiles = buildProjectionProfiles({
    interactionModel: ui.interactionModel,
    nowPlayingLayout: ui.osNowPlayingLayout,
  });
  const document = buildSceneDocument(ui, {
    ...options,
    activeProfileId: getAuthoringProfileId(options?.compactViewport ?? false),
  });

  return {
    document,
    profiles,
  };
}

export function selectSceneNode(
  state: SceneProjectionState,
  nodeId: SceneNodeId | null,
): SceneNode | null {
  if (!nodeId) {
    return null;
  }
  return state.document.nodes[nodeId] ?? null;
}

export function selectScenePath(
  state: SceneProjectionState,
  nodeId: SceneNodeId | null,
): SceneNodeId[] {
  if (!nodeId) {
    return [];
  }

  const path: SceneNodeId[] = [];
  let cursor: SceneNode | undefined = state.document.nodes[nodeId];
  while (cursor) {
    path.unshift(cursor.id);
    cursor = cursor.parentId ? state.document.nodes[cursor.parentId] : undefined;
  }

  return path;
}

export function selectSelectedScenePath(state: SceneProjectionState): SceneNodeId[] {
  return selectScenePath(state, state.document.selectedNodeId);
}

export function selectActiveProjectionProfile(
  state: SceneProjectionState,
): ProjectionProfile {
  return getProjectionProfile(state.profiles, state.document.activeProfileId);
}

export function selectExportProjectionProfile(
  state: SceneProjectionState,
  presetId: SceneExportPresetId = state.document.exportIntent.presetId,
): ProjectionProfile {
  return getProjectionProfile(state.profiles, getExportProfileId(presetId));
}

export function selectViewerProjectionProfile(
  state: SceneProjectionState,
): ProjectionProfile {
  return getProjectionProfile(
    state.profiles,
    getViewerProfileId(state.document.preferences.viewMode),
  );
}

export function applySceneProjectionIntent(
  state: SceneProjectionState,
  intent: SceneProjectionIntent,
): SceneProjectionState {
  switch (intent.type) {
    case "select-node":
      return {
        ...state,
        document: {
          ...state.document,
          selectedNodeId: intent.nodeId,
        },
      };
    case "set-active-profile":
      return {
        ...state,
        document: {
          ...state.document,
          activeProfileId: intent.profileId,
        },
      };
    case "set-export-preset":
      return {
        ...state,
        document: {
          ...state.document,
          exportIntent: {
            ...state.document.exportIntent,
            presetId: intent.presetId,
          },
        },
      };
    case "set-preference":
      return {
        ...state,
        document: {
          ...state.document,
          preferences: {
            ...state.document.preferences,
            [intent.key]: intent.value,
          },
        },
      };
    case "update-node-props": {
      const currentNode = state.document.nodes[intent.nodeId];
      if (!currentNode) {
        return state;
      }

      return {
        ...state,
        document: {
          ...state.document,
          nodes: {
            ...state.document.nodes,
            [intent.nodeId]: {
              ...currentNode,
              props: {
                ...currentNode.props,
                ...intent.props,
              },
            },
          },
        },
      };
    }
    case "update-layout-position": {
      const profileId = intent.profileId ?? state.document.activeProfileId;
      const currentProfile = state.profiles[profileId];
      if (!currentProfile) {
        return state;
      }

      const nextOffsets = {
        ...currentProfile.layout.nowPlayingOffsets,
      };

      if (intent.position.x === 0 && intent.position.y === 0) {
        delete nextOffsets[intent.nodeId];
      } else {
        nextOffsets[intent.nodeId] = intent.position;
      }

      return {
        ...state,
        profiles: {
          ...state.profiles,
          [profileId]: {
            ...currentProfile,
            layout: {
              ...currentProfile.layout,
              nowPlayingOffsets: nextOffsets,
            },
          },
        },
      };
    }
    default:
      return state;
  }
}
