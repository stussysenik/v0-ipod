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
///|
/// Model serialization — JSON encode/decode for state persistence and FFI bridge.

///|
/// Serialize a complete IpodModel to JSON string.
pub fn serialize_model(
  m : SongMetadata,
  p : PresentationState,
  i : InteractionState,
  pb : PlaybackState,
) -> String {
  let parts = []
  parts.push("{")
  parts.push(key_obj("metadata"))
  parts.push(key_str("title", m.title))
  parts.push(",")
  parts.push(key_str("artist", m.artist))
  parts.push(",")
  parts.push(key_str("album", m.album))
  parts.push(",")
  parts.push(key_str("artwork", m.artwork))
  parts.push(",")
  parts.push(key_num("duration", m.duration.to_string()))
  parts.push(",")
  parts.push(key_num("currentTime", m.currentTime.to_string()))
  parts.push(",")
  parts.push(key_num("rating", m.rating.to_string()))
  parts.push(",")
  parts.push(key_num("trackNumber", m.trackNumber.to_string()))
  parts.push(",")
  parts.push(key_num("totalTracks", m.totalTracks.to_string()))
  parts.push("},")
  
  parts.push(key_obj("presentation"))
  parts.push(key_str("skinColor", p.skinColor))
  parts.push(",")
  parts.push(key_str("bgColor", p.bgColor))
  parts.push(",")
  parts.push(key_str_v("viewMode", view_mode_str(p.viewMode)))
  parts.push(",")
  parts.push(key_str_v("hardwarePreset", preset_str(p.hardwarePreset)))
  parts.push("},")
  
  parts.push(key_obj("interaction"))
  parts.push(key_str_v("interactionModel", im_str(i.interactionModel)))
  parts.push(",")
  parts.push(key_str_v("osScreen", os_str(i.osScreen)))
  parts.push(",")
  parts.push(key_num("menuIndex", i.menuIndex.to_string()))
  parts.push(",")
  parts.push(key_num("osOriginalMenuSplit", i.osOriginalMenuSplit.to_string()))
  parts.push(",")
  parts.push(key_bool("isNowPlayingEditable", i.isNowPlayingEditable))
  parts.push(",")
  parts.push(key_bool("isPlaying", i.isPlaying))
  parts.push(",")
  parts.push(key_num("batteryLevel", i.batteryLevel.to_string()))
  parts.push("},")
  
  parts.push(key_obj("playback"))
  parts.push(key_num("currentTime", pb.currentTime.to_string()))
  parts.push(",")
  parts.push(key_num("duration", pb.duration.to_string()))
  parts.push(",")
  parts.push(key_str_v("selectionKind", sel_str(pb.selectionKind)))
  parts.push(",")
  parts.push(key_num("rangeStartTime", pb.rangeStartTime.to_string()))
  parts.push(",")
  parts.push(key_num("rangeEndTime", pb.rangeEndTime.to_string()))
  parts.push("}")
  parts.push("}")
  
  let mut result = ""
  for part in parts {
    result = result + part
  }
  result
}

///|
fn key_obj(k : String) -> String {
  "\"" + k + "\":{"
}

///|
fn key_str(k : String, v : String) -> String {
  "\"" + k + "\":\"" + v + "\""
}

///|
fn key_str_v(k : String, v : String) -> String {
  "\"" + k + "\":\"" + v + "\""
}

///|
fn key_num(k : String, v : String) -> String {
  "\"" + k + "\":" + v
}

///|
fn key_bool(k : String, v : Bool) -> String {
  if v {
    "\"" + k + "\":true"
  } else {
    "\"" + k + "\":false"
  }
}

///|
fn view_mode_str(vm : ViewMode) -> String {
  match vm {
    Flat => "flat"
    Focus => "focus"
    Preview => "preview"
    Ascii => "ascii"
    ThreeD => "3d"
  }
}

///|
fn preset_str(hp : HardwarePresetId) -> String {
  match hp {
    Classic2007 => "classic-2007"
    Classic2008 => "classic-2008"
    Classic2009 => "classic-2009"
    Classic2008Black => "classic-2008-black"
    Classic2008Silver => "classic-2008-silver"
  }
}

///|
fn im_str(im : InteractionModel) -> String {
  match im {
    Direct => "direct"
    IpodOs => "ipod-os"
    IpodOsOriginal => "ipod-os-original"
  }
}

///|
fn os_str(os : OsScreen) -> String {
  match os {
    Menu => "menu"
    NowPlaying => "now-playing"
  }
}

///|
fn sel_str(sk : SnapshotSelectionKind) -> String {
  match sk {
    Moment => "moment"
    Range => "range"
  }
}

///|
/// Parse the JSON produced by serialize_model back into an IpodModel.
pub fn deserialize_model(json : String) -> Result[IpodModel, String] {
  let m = parse_meta(json)
  let p = parse_pres(json)
  let i = parse_inter(json)
  let pb = parse_pb(json)
  Ok({ metadata: m, presentation: p, interaction: i, playback: pb })
}

///|
fn section_json(json : String, section : String) -> String {
  let key = "\"" + section + "\":{"
  let idx = find_str(json, key, 0)
  if idx == -1 {
    "{}"
  } else {
    let start = idx + key.length()
    extract_nested(json, start)
  }
}

///|
fn extract_nested(s : String, start : Int) -> String {
  let mut depth = 1
  let mut i = start
  while i < s.length() && depth > 0 {
    if s[i] == '{' {
      depth = depth + 1
    } else if s[i] == '}' {
      depth = depth - 1
    }
    if depth > 0 {
      i = i + 1
    }
  }
  if i <= start {
    "{}"
  } else {
    s_sub(s, start, i)
  }
}

///|
fn s_sub(s : String, start : Int, end : Int) -> String {
  let mut result = ""
  let mut i = start
  while i < end && i < s.length() {
    result = result + s[i].to_string()
    i = i + 1
  }
  result
}

///|
fn find_str(haystack : String, needle : String, start : Int) -> Int {
  let mut i = start
  while i + needle.length() <= haystack.length() {
    let mut matched = true
    let mut j = 0
    while j < needle.length() {
      if haystack[i + j] != needle[j] {
        matched = false
        j = needle.length()
      }
      j = j + 1
    }
    if matched {
      return i
    }
    i = i + 1
  }
  -1
}

///|
fn field_str(json : String, key : String) -> String {
  let needle = "\"" + key + "\":\""
  let idx = find_str(json, needle, 0)
  if idx == -1 {
    ""
  } else {
    let start = idx + needle.length()
    parse_string_val(json, start)
  }
}

///|
fn parse_string_val(s : String, start : Int) -> String {
  let mut i = start
  let mut result = ""
  while i < s.length() && s[i] != '"' {
    result = result + s[i].to_string()
    i = i + 1
  }
  result
}

///|
fn field_num(json : String, key : String) -> Double {
  let needle = "\"" + key + "\":"
  let idx = find_str(json, needle, 0)
  if idx == -1 {
    0.0
  } else {
    let start = idx + needle.length()
    parse_num_val(json, start)
  }
}

///|
fn parse_num_val(s : String, start : Int) -> Double {
  let mut result = ""
  let mut i = start
  while i < s.length() && s[i] != ',' && s[i] != '}' {
    result = result + s[i].to_string()
    i = i + 1
  }
  parse_double(result)
}

///|
fn field_bool(json : String, key : String) -> Bool {
  let needle = "\"" + key + "\":"
  let idx = find_str(json, needle, 0)
  if idx == -1 {
    false
  } else {
    let start = idx + needle.length()
    if start + 4 <= json.length() && s_eq(json, start, "true") {
      true
    } else {
      false
    }
  }
}

///|
fn s_eq(s : String, start : Int, v : String) -> Bool {
  if start + v.length() > s.length() {
    false
  } else {
    let mut i = 0
    while i < v.length() {
      if s[start + i] != v[i] {
        return false
      }
      i = i + 1
    }
    true
  }
}

///|
fn parse_meta(json : String) -> SongMetadata {
  let sec = section_json(json, "metadata")
  {
    title: field_str(sec, "title"),
    artist: field_str(sec, "artist"),
    album: field_str(sec, "album"),
    artwork: field_str(sec, "artwork"),
    duration: field_num(sec, "duration"),
    currentTime: field_num(sec, "currentTime"),
    rating: parse_int(field_str(sec, "rating")),
    trackNumber: parse_int(field_str(sec, "trackNumber")),
    totalTracks: parse_int(field_str(sec, "totalTracks")),
  }
}

///|
fn parse_pres(json : String) -> PresentationState {
  let sec = section_json(json, "presentation")
  {
    skinColor: field_str(sec, "skinColor"),
    bgColor: field_str(sec, "bgColor"),
    viewMode: parse_vm(field_str(sec, "viewMode")),
    hardwarePreset: parse_hp(field_str(sec, "hardwarePreset")),
  }
}

///|
fn parse_vm(s : String) -> ViewMode {
  match s {
    "focus" => Focus
    "preview" => Preview
    "ascii" => Ascii
    "3d" => ThreeD
    _ => Flat
  }
}

///|
fn parse_hp(s : String) -> HardwarePresetId {
  match s {
    "classic-2007" => Classic2007
    "classic-2009" => Classic2009
    "classic-2008-black" => Classic2008Black
    "classic-2008-silver" => Classic2008Silver
    _ => Classic2008
  }
}

///|
fn parse_inter(json : String) -> InteractionState {
  let sec = section_json(json, "interaction")
  {
    interactionModel: parse_im(field_str(sec, "interactionModel")),
    osScreen: parse_os(field_str(sec, "osScreen")),
    menuIndex: parse_int(
      num_to_str(field_num(sec, "menuIndex")),
    ),
    osOriginalMenuSplit: field_num(sec, "osOriginalMenuSplit"),
    isNowPlayingEditable: field_bool(sec, "isNowPlayingEditable"),
    isPlaying: field_bool(sec, "isPlaying"),
    batteryLevel: field_num(sec, "batteryLevel"),
  }
}

///|
fn num_to_str(n : Double) -> String {
  n.to_string()
}

///|
fn parse_im(s : String) -> InteractionModel {
  match s {
    "ipod-os" => IpodOs
    "ipod-os-original" => IpodOsOriginal
    _ => Direct
  }
}

///|
fn parse_os(s : String) -> OsScreen {
  if s == "now-playing" { NowPlaying } else { Menu }
}

///|
fn parse_pb(json : String) -> PlaybackState {
  let sec = section_json(json, "playback")
  {
    currentTime: field_num(sec, "currentTime"),
    duration: field_num(sec, "duration"),
    selectionKind: parse_sk(field_str(sec, "selectionKind")),
    rangeStartTime: field_num(sec, "rangeStartTime"),
    rangeEndTime: field_num(sec, "rangeEndTime"),
  }
}

///|
fn parse_sk(s : String) -> SnapshotSelectionKind {
  if s == "range" { Range } else { Moment }
}
