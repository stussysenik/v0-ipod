///|
/// All 29 iPod workbench events as algebraic data type.
/// Mirrors the IpodWorkbenchAction union from the original TypeScript.
pub enum IpodEvent {
  // Metadata updates
  UpdateTitle(String)
  UpdateArtist(String)
  UpdateAlbum(String)
  UpdateArtwork(String)
  UpdateDuration(Double)
  UpdateCurrentTime(Double)
  UpdateRating(Int)
  UpdateTrackNumber(Int)
  UpdateTotalTracks(Int)
  // View mode and presentation
  SetViewMode(ViewMode)
  SetSkinColor(String)
  SetBgColor(String)
  SetHardwarePreset(HardwarePresetId)
  // Interaction
  SetInteractionModel(InteractionModel)
  SetOsScreen(OsScreen)
  SetOsMenuIndex(Int)
  CycleOsMenu(Int)
  SetOsOriginalMenuSplit(Double)
  SetOsNowPlayingEditable(Bool)
  ToggleOsNowPlayingEditable
  SetIsPlaying(Bool)
  ToggleIsPlaying
  SetBatteryLevel(Double)
  // Playback / snapshot
  SetSelectionKind(SnapshotSelectionKind)
  SetRangeStartTime(Double)
  SetRangeEndTime(Double)
  // Lifecycle
  RestoreModel(IpodModel)
  ResetModel
  ApplySongSnapshot(SongSnapshot)
}

///|
/// A serializable song snapshot for persistence.
pub(all) struct SongSnapshot {
  schemaVersion : Int
  title : String
  artist : String
  album : String
  artwork : String
  duration : Double
  currentTime : Double
  rating : Int
  trackNumber : Int
  totalTracks : Int
  skinColor : String
  bgColor : String
  viewMode : ViewMode
  hardwarePreset : HardwarePresetId
  interactionModel : InteractionModel
  osScreen : OsScreen
  menuIndex : Int
  osOriginalMenuSplit : Double
  isPlaying : Bool
  batteryLevel : Double
  selectionKind : SnapshotSelectionKind
  rangeStartTime : Double
  rangeEndTime : Double
}
