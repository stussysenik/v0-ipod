import {
  DEFAULT_OS_NOW_PLAYING_LAYOUT,
  type IpodInteractionModel,
  type IpodNowPlayingLayoutState,
  type IpodViewMode,
} from "@/types/ipod-state";
import type {
  ProjectionProfile,
  ProjectionProfileId,
  ProjectionProfileRegistry,
  SceneExportPresetId,
} from "@/types/scene-document";

export const BASE_EXPORT_SCENE_WIDTH = 466;
export const BASE_EXPORT_SCENE_HEIGHT = 716;

type ExportFrameConfig = {
  label: string;
  width: number;
  height: number;
  padding: number;
  offsetY: number;
};

const PRODUCT_WIDTH = 1080;
const PRODUCT_HEIGHT = Math.round(
  PRODUCT_WIDTH * (BASE_EXPORT_SCENE_HEIGHT / BASE_EXPORT_SCENE_WIDTH),
);

const EXPORT_FRAME_CONFIGS: Record<SceneExportPresetId, ExportFrameConfig> = {
  product: {
    label: "Product",
    width: PRODUCT_WIDTH,
    height: PRODUCT_HEIGHT,
    padding: 42,
    offsetY: -18,
  },
  square: {
    label: "Square",
    width: 1080,
    height: 1080,
    padding: 82,
    offsetY: -36,
  },
  portrait: {
    label: "Portrait",
    width: 1080,
    height: 1350,
    padding: 74,
    offsetY: -20,
  },
  story: {
    label: "Story",
    width: 1080,
    height: 1920,
    padding: 104,
    offsetY: -54,
  },
  landscape: {
    label: "Landscape",
    width: 1920,
    height: 1080,
    padding: 88,
    offsetY: -24,
  },
};

export const EXPORT_PRESET_ORDER: SceneExportPresetId[] = [
  "product",
  "square",
  "portrait",
  "story",
  "landscape",
];

function getPointerMode(
  interactionModel: IpodInteractionModel,
): ProjectionProfile["constraints"]["pointerMode"] {
  return interactionModel === "direct" ? "direct" : "authentic";
}

function cloneLayout(
  layout: IpodNowPlayingLayoutState | undefined,
): IpodNowPlayingLayoutState {
  return { ...(layout ?? DEFAULT_OS_NOW_PLAYING_LAYOUT) };
}

function createBaseProfile(
  profile: Omit<ProjectionProfile, "layout"> & {
    layout?: ProjectionProfile["layout"];
  },
  nowPlayingLayout: IpodNowPlayingLayoutState,
): ProjectionProfile {
  return {
    ...profile,
    layout: profile.layout ?? {
      nowPlayingOffsets: cloneLayout(nowPlayingLayout),
      offsetClamp: { x: 156, y: 156 },
    },
  };
}

export function getExportProfileId(presetId: SceneExportPresetId): ProjectionProfileId {
  return `export-${presetId}` as ProjectionProfileId;
}

export function getViewerProfileId(viewMode: IpodViewMode): ProjectionProfileId {
  switch (viewMode) {
    case "preview":
      return "viewer-preview";
    case "focus":
      return "viewer-focus";
    case "3d":
      return "viewer-3d";
    case "ascii":
      return "viewer-ascii";
    case "flat":
    default:
      return "viewer-flat";
  }
}

export function getAuthoringProfileId(isCompactViewport: boolean): ProjectionProfileId {
  return isCompactViewport ? "authoring-mobile" : "authoring-desktop";
}

export function buildProjectionProfiles(options?: {
  interactionModel?: IpodInteractionModel;
  nowPlayingLayout?: IpodNowPlayingLayoutState;
}): ProjectionProfileRegistry {
  const interactionModel = options?.interactionModel ?? "direct";
  const nowPlayingLayout = options?.nowPlayingLayout ?? DEFAULT_OS_NOW_PLAYING_LAYOUT;
  const pointerMode = getPointerMode(interactionModel);

  const profiles: Record<ProjectionProfileId, ProjectionProfile> = {
    "authoring-desktop": createBaseProfile(
      {
        id: "authoring-desktop",
        label: "Authoring Desktop",
        context: "authoring",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode,
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "authoring-mobile": createBaseProfile(
      {
        id: "authoring-mobile",
        label: "Authoring Mobile",
        context: "authoring",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "sheet",
          compact: true,
        },
        constraints: {
          mobile: true,
          pointerMode,
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "viewer-flat": createBaseProfile(
      {
        id: "viewer-flat",
        label: "Viewer Flat",
        context: "viewer",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode,
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "viewer-preview": createBaseProfile(
      {
        id: "viewer-preview",
        label: "Viewer Preview",
        context: "viewer",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "viewer-focus": createBaseProfile(
      {
        id: "viewer-focus",
        label: "Viewer Focus",
        context: "viewer",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode,
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "viewer-3d": createBaseProfile(
      {
        id: "viewer-3d",
        label: "Viewer 3D",
        context: "viewer",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "viewer-ascii": createBaseProfile(
      {
        id: "viewer-ascii",
        label: "Viewer ASCII",
        context: "viewer",
        stage: {
          width: BASE_EXPORT_SCENE_WIDTH,
          height: BASE_EXPORT_SCENE_HEIGHT,
          padding: 0,
          offsetY: 0,
          scaleMode: "fit",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: false,
        },
      },
      nowPlayingLayout,
    ),
    "export-product": createBaseProfile(
      {
        id: "export-product",
        label: "Export Product",
        context: "export",
        stage: {
          width: EXPORT_FRAME_CONFIGS.product.width,
          height: EXPORT_FRAME_CONFIGS.product.height,
          padding: EXPORT_FRAME_CONFIGS.product.padding,
          offsetY: EXPORT_FRAME_CONFIGS.product.offsetY,
          scaleMode: "fixed",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: true,
        },
        exportFrame: {
          presetId: "product",
          width: EXPORT_FRAME_CONFIGS.product.width,
          height: EXPORT_FRAME_CONFIGS.product.height,
          padding: EXPORT_FRAME_CONFIGS.product.padding,
          offsetY: EXPORT_FRAME_CONFIGS.product.offsetY,
        },
      },
      nowPlayingLayout,
    ),
    "export-square": createBaseProfile(
      {
        id: "export-square",
        label: "Export Square",
        context: "export",
        stage: {
          width: EXPORT_FRAME_CONFIGS.square.width,
          height: EXPORT_FRAME_CONFIGS.square.height,
          padding: EXPORT_FRAME_CONFIGS.square.padding,
          offsetY: EXPORT_FRAME_CONFIGS.square.offsetY,
          scaleMode: "fixed",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: true,
        },
        exportFrame: {
          presetId: "square",
          width: EXPORT_FRAME_CONFIGS.square.width,
          height: EXPORT_FRAME_CONFIGS.square.height,
          padding: EXPORT_FRAME_CONFIGS.square.padding,
          offsetY: EXPORT_FRAME_CONFIGS.square.offsetY,
        },
      },
      nowPlayingLayout,
    ),
    "export-portrait": createBaseProfile(
      {
        id: "export-portrait",
        label: "Export Portrait",
        context: "export",
        stage: {
          width: EXPORT_FRAME_CONFIGS.portrait.width,
          height: EXPORT_FRAME_CONFIGS.portrait.height,
          padding: EXPORT_FRAME_CONFIGS.portrait.padding,
          offsetY: EXPORT_FRAME_CONFIGS.portrait.offsetY,
          scaleMode: "fixed",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: true,
        },
        exportFrame: {
          presetId: "portrait",
          width: EXPORT_FRAME_CONFIGS.portrait.width,
          height: EXPORT_FRAME_CONFIGS.portrait.height,
          padding: EXPORT_FRAME_CONFIGS.portrait.padding,
          offsetY: EXPORT_FRAME_CONFIGS.portrait.offsetY,
        },
      },
      nowPlayingLayout,
    ),
    "export-story": createBaseProfile(
      {
        id: "export-story",
        label: "Export Story",
        context: "export",
        stage: {
          width: EXPORT_FRAME_CONFIGS.story.width,
          height: EXPORT_FRAME_CONFIGS.story.height,
          padding: EXPORT_FRAME_CONFIGS.story.padding,
          offsetY: EXPORT_FRAME_CONFIGS.story.offsetY,
          scaleMode: "fixed",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: true,
        },
        exportFrame: {
          presetId: "story",
          width: EXPORT_FRAME_CONFIGS.story.width,
          height: EXPORT_FRAME_CONFIGS.story.height,
          padding: EXPORT_FRAME_CONFIGS.story.padding,
          offsetY: EXPORT_FRAME_CONFIGS.story.offsetY,
        },
      },
      nowPlayingLayout,
    ),
    "export-landscape": createBaseProfile(
      {
        id: "export-landscape",
        label: "Export Landscape",
        context: "export",
        stage: {
          width: EXPORT_FRAME_CONFIGS.landscape.width,
          height: EXPORT_FRAME_CONFIGS.landscape.height,
          padding: EXPORT_FRAME_CONFIGS.landscape.padding,
          offsetY: EXPORT_FRAME_CONFIGS.landscape.offsetY,
          scaleMode: "fixed",
        },
        inspector: {
          mode: "dock",
          compact: false,
        },
        constraints: {
          mobile: false,
          pointerMode: "mixed",
          exportSafe: true,
        },
        exportFrame: {
          presetId: "landscape",
          width: EXPORT_FRAME_CONFIGS.landscape.width,
          height: EXPORT_FRAME_CONFIGS.landscape.height,
          padding: EXPORT_FRAME_CONFIGS.landscape.padding,
          offsetY: EXPORT_FRAME_CONFIGS.landscape.offsetY,
        },
      },
      nowPlayingLayout,
    ),
  };

  return profiles;
}

export function getProjectionProfile(
  profiles: ProjectionProfileRegistry,
  profileId: ProjectionProfileId,
): ProjectionProfile {
  return profiles[profileId];
}

export function getExportProjectionProfile(
  presetId: SceneExportPresetId,
  options?: {
    interactionModel?: IpodInteractionModel;
    nowPlayingLayout?: IpodNowPlayingLayoutState;
  },
): ProjectionProfile {
  const profiles = buildProjectionProfiles(options);
  return profiles[getExportProfileId(presetId)];
}
