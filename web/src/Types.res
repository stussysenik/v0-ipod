// Types mirroring MoonBit structs and enums for type-safe FFI

type rec viewMode = Flat | Focus | Preview | Ascii | ThreeD

type rec interactionModel = Direct | IpodOs | IpodOsOriginal

type rec hardwarePresetId =
  | Classic2007
  | Classic2008
  | Classic2009
  | Classic2008Black
  | Classic2008Silver

type rec snapshotSelectionKind = Moment | Range

type rec osScreen = Menu | NowPlaying

type songMetadata = {
  title: string,
  artist: string,
  album: string,
  artwork: string,
  duration: float,
  currentTime: float,
  rating: int,
  trackNumber: int,
  totalTracks: int,
}

type presentationState = {
  skinColor: string,
  bgColor: string,
  viewMode: viewMode,
  hardwarePreset: hardwarePresetId,
}

type interactionState = {
  interactionModel: interactionModel,
  osScreen: osScreen,
  menuIndex: int,
  osOriginalMenuSplit: float,
  isNowPlayingEditable: bool,
  isPlaying: bool,
  batteryLevel: float,
}

type playbackState = {
  currentTime: float,
  duration: float,
  selectionKind: snapshotSelectionKind,
  rangeStartTime: float,
  rangeEndTime: float,
}

type ipodModel = {
  metadata: songMetadata,
  presentation: presentationState,
  interaction: interactionState,
  playback: playbackState,
}

type appleFinish = {label: string, hex: string}

type wheelColors = {
  labelColor: string,
  borderColor: string,
  centerBorder: string,
  centerGradient: string,
}

type dispatchResult = {model: ipodModel, effects: array<string>}

// All 29 IpodEvent variants, matching MoonBit's IpodEvent enum
type rec ipodEvent =
  | UpdateTitle(string)
  | UpdateArtist(string)
  | UpdateAlbum(string)
  | UpdateArtwork(string)
  | UpdateDuration(float)
  | UpdateCurrentTime(float)
  | UpdateRating(int)
  | UpdateTrackNumber(int)
  | UpdateTotalTracks(int)
  | SetViewMode(viewMode)
  | SetSkinColor(string)
  | SetBgColor(string)
  | SetHardwarePreset(hardwarePresetId)
  | SetInteractionModel(interactionModel)
  | SetOsScreen(osScreen)
  | SetOsMenuIndex(int)
  | CycleOsMenu(int)
  | SetOsOriginalMenuSplit(float)
  | SetOsNowPlayingEditable(bool)
  | ToggleOsNowPlayingEditable
  | SetIsPlaying(bool)
  | ToggleIsPlaying
  | SetBatteryLevel(float)
  | SetSelectionKind(snapshotSelectionKind)
  | SetRangeStartTime(float)
  | SetRangeEndTime(float)
  | RestoreModel(ipodModel)
  | ResetModel
  | ApplySongSnapshot
