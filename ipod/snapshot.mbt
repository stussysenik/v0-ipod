///|
/// Model serialization — JSON encode/decode for state persistence and FFI bridge.

///|
/// Serialize a complete IpodModel to JSON string.
pub fn serialize_model(model : IpodModel) -> String {
  let m = model.metadata
  let p = model.presentation
  let i = model.interaction
  let pb = model.playback
  "{" +
  key_obj("metadata") +
  key_str("title", m.title) + "," +
  key_str("artist", m.artist) + "," +
  key_str("album", m.album) + "," +
  key_str("artwork", m.artwork) + "," +
  key_num("duration", m.duration.to_string()) + "," +
  key_num("currentTime", m.currentTime.to_string()) + "," +
  key_num("rating", m.rating.to_string()) + "," +
  key_num("trackNumber", m.trackNumber.to_string()) + "," +
  key_num("totalTracks", m.totalTracks.to_string()) +
  "}," +
  key_obj("presentation") +
  key_str("skinColor", p.skinColor) + "," +
  key_str("bgColor", p.bgColor) + "," +
  key_str_v("viewMode", view_mode_str(p.viewMode)) + "," +
  key_str_v("hardwarePreset", preset_str(p.hardwarePreset)) +
  "}," +
  key_obj("interaction") +
  key_str_v("interactionModel", im_str(i.interactionModel)) + "," +
  key_str_v("osScreen", os_str(i.osScreen)) + "," +
  key_num("menuIndex", i.menuIndex.to_string()) + "," +
  key_num("osOriginalMenuSplit", i.osOriginalMenuSplit.to_string()) + "," +
  key_bool("isNowPlayingEditable", i.isNowPlayingEditable) + "," +
  key_bool("isPlaying", i.isPlaying) + "," +
  key_num("batteryLevel", i.batteryLevel.to_string()) +
  "}," +
  key_obj("playback") +
  key_num("currentTime", pb.currentTime.to_string()) + "," +
  key_num("duration", pb.duration.to_string()) + "," +
  key_str_v("selectionKind", sel_str(pb.selectionKind)) + "," +
  key_num("rangeStartTime", pb.rangeStartTime.to_string()) + "," +
  key_num("rangeEndTime", pb.rangeEndTime.to_string()) +
  "}" +
  "}"
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
