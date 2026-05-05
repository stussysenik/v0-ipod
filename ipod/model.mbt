///|
/// iPod workbench state model — all types matching the original v0-ipod TypeScript definitions.

///|
/// View modes for the iPod display.
pub enum ViewMode {
  Flat
  Focus
  Preview
  Ascii
  ThreeD
} derive(Eq, Debug)

///|
/// Interaction models controlling how the user navigates.
pub enum InteractionModel {
  Direct
  IpodOs
  IpodOsOriginal
} derive(Eq, Debug)

///|
/// Hardware preset generations.
pub enum HardwarePresetId {
  Classic2007
  Classic2008
  Classic2009
  Classic2008Black
  Classic2008Silver
} derive(Eq, Debug)

///|
/// Snapshot selection kind.
pub enum SnapshotSelectionKind {
  Moment
  Range
} derive(Eq, Debug)

///|
/// Which screen is active in iPod OS mode.
pub enum OsScreen {
  Menu
  NowPlaying
} derive(Eq, Debug)

///|
/// Song metadata — the core domain type.
pub(all) struct SongMetadata {
  title : String
  artist : String
  album : String
  artwork : String
  duration : Double
  currentTime : Double
  rating : Int
  trackNumber : Int
  totalTracks : Int
}

///|
/// Presentation state (visual preferences).
pub(all) struct PresentationState {
  skinColor : String
  bgColor : String
  viewMode : ViewMode
  hardwarePreset : HardwarePresetId
}

///|
/// Interaction state (how user navigates).
pub(all) struct InteractionState {
  interactionModel : InteractionModel
  osScreen : OsScreen
  menuIndex : Int
  osOriginalMenuSplit : Double
  isNowPlayingEditable : Bool
  isPlaying : Bool
  batteryLevel : Double
}

///|
/// Playback/export state.
pub(all) struct PlaybackState {
  currentTime : Double
  duration : Double
  selectionKind : SnapshotSelectionKind
  rangeStartTime : Double
  rangeEndTime : Double
}

///|
/// The full iPod workbench model — single source of truth.
pub(all) struct IpodModel {
  metadata : SongMetadata
  presentation : PresentationState
  interaction : InteractionState
  playback : PlaybackState
}

///|
/// Create a default model with sensible initial values.
pub fn default_model() -> IpodModel {
  {
    metadata: {
      title: "Strobe",
      artist: "deadmau5",
      album: "For Lack of a Better Name",
      artwork: "",
      duration: 154.0,
      currentTime: 0.0,
      rating: 0,
      trackNumber: 1,
      totalTracks: 10,
    },
    presentation: {
      skinColor: "#111111",
      bgColor: "#1a1a1a",
      viewMode: Flat,
      hardwarePreset: Classic2008,
    },
    interaction: {
      interactionModel: Direct,
      osScreen: Menu,
      menuIndex: 0,
      osOriginalMenuSplit: 0.55,
      isNowPlayingEditable: false,
      isPlaying: false,
      batteryLevel: 0.85,
    },
    playback: {
      currentTime: 0.0,
      duration: 154.0,
      selectionKind: Moment,
      rangeStartTime: 0.0,
      rangeEndTime: 15.0,
    },
  }
}

///|
/// Clamp numeric values to valid ranges, enforce invariants.
pub fn normalize_model(model : IpodModel) -> IpodModel {
  let meta = model.metadata
  let meta = {
    ..meta,
    duration: if meta.duration < 1.0 {
      1.0
    } else {
      meta.duration
    },
    currentTime: if meta.currentTime < 0.0 {
      0.0
    } else if meta.currentTime > meta.duration {
      meta.duration
    } else {
      meta.currentTime
    },
    rating: if meta.rating < 0 {
      0
    } else if meta.rating > 5 {
      5
    } else {
      meta.rating
    },
    trackNumber: if meta.trackNumber < 1 {
      1
    } else if meta.trackNumber > meta.totalTracks {
      meta.totalTracks
    } else {
      meta.trackNumber
    },
    totalTracks: if meta.totalTracks < 1 {
      1
    } else {
      meta.totalTracks
    },
  }

  let inter = model.interaction
  let inter = {
    ..inter,
    menuIndex: if inter.menuIndex < 0 {
      0
    } else {
      inter.menuIndex
    },
    osOriginalMenuSplit: if inter.osOriginalMenuSplit < 0.4 {
      0.4
    } else if inter.osOriginalMenuSplit > 0.7 {
      0.7
    } else {
      inter.osOriginalMenuSplit
    },
    batteryLevel: if inter.batteryLevel < 0.05 {
      0.05
    } else if inter.batteryLevel > 1.0 {
      1.0
    } else {
      inter.batteryLevel
    },
  }

  let pb = model.playback
  let pb = {
    ..pb,
    currentTime: if pb.currentTime < 0.0 {
      0.0
    } else if pb.currentTime > meta.duration {
      meta.duration
    } else {
      pb.currentTime
    },
    duration: meta.duration,
    rangeStartTime: if pb.rangeStartTime < 0.0 {
      0.0
    } else if pb.rangeStartTime > meta.duration {
      meta.duration
    } else {
      pb.rangeStartTime
    },
    rangeEndTime: if pb.rangeEndTime < pb.rangeStartTime {
      pb.rangeStartTime
    } else if pb.rangeEndTime > meta.duration {
      meta.duration
    } else {
      pb.rangeEndTime
    },
  }

  { ..model, metadata: meta, interaction: inter, playback: pb }
}
