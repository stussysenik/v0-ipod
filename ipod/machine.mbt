///|
/// iPod workbench state machine — pure reducer function.
/// Handles all 29 IpodEvent constructors via string tag + data dispatch.

///|
/// Parse a string to an Int, returning 0 on failure.
fn parse_int(s : String) -> Int {
  if s.length() == 0 {
    0
  } else {
    let sign = if s[0] == '-' { -1 } else { 1 }
    let start = if s[0] == '-' || s[0] == '+' { 1 } else { 0 }
    parse_int_digits(s, start, 0) * sign
  }
}

///|
fn parse_int_digits(s : String, i : Int, acc : Int) -> Int {
  if i >= s.length() {
    acc
  } else {
    let c = s[i].to_int()
    if c >= 48 && c <= 57 {
      parse_int_digits(s, i + 1, acc * 10 + (c - 48))
    } else {
      parse_int_digits(s, i + 1, acc)
    }
  }
}

///|
/// Parse a string to a Double, returning 0.0 on failure.
fn parse_double(s : String) -> Double {
  if s.length() == 0 {
    0.0
  } else {
    let sign = if s[0] == '-' { -1.0 } else { 1.0 }
    let start = if s[0] == '-' || s[0] == '+' { 1 } else { 0 }
    let (int_part, next_i) = parse_double_int(s, start, 0.0)
    if next_i < s.length() && s[next_i] == '.' {
      let frac_part = parse_double_frac(s, next_i + 1, 0.0, 0.1)
      (int_part + frac_part) * sign
    } else {
      int_part * sign
    }
  }
}

///|
fn parse_double_int(s : String, i : Int, acc : Double) -> (Double, Int) {
  if i >= s.length() || s[i] == '.' {
    (acc, i)
  } else {
    let c = s[i].to_int()
    if c >= 48 && c <= 57 {
      parse_double_int(s, i + 1, acc * 10.0 + (c - 48).to_double())
    } else {
      (acc, i)
    }
  }
}

///|
fn parse_double_frac(
  s : String,
  i : Int,
  acc : Double,
  mult : Double,
) -> Double {
  if i >= s.length() {
    acc
  } else {
    let c = s[i].to_int()
    if c >= 48 && c <= 57 {
      parse_double_frac(s, i + 1, acc + (c - 48).to_double() * mult, mult * 0.1)
    } else {
      parse_double_frac(s, i + 1, acc, mult)
    }
  }
}

///|
/// Parse a string to a Bool, returning false unless exactly "true" or "1".
fn parse_bool(s : String) -> Bool {
  s == "true" || s == "1"
}

///|
/// Reduce an IpodModel by applying an event (tag + data string).
/// Returns the new model and an array of effect strings.
pub fn reduce(
  model : IpodModel,
  event_tag : String,
  event_data : String,
) -> (IpodModel, Array[String]) {
  match event_tag {
    // Metadata — string fields
    "UPDATE_TITLE" => {
      let meta = { ..model.metadata, title: event_data }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    "UPDATE_ARTIST" => {
      let meta = { ..model.metadata, artist: event_data }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    "UPDATE_ALBUM" => {
      let meta = { ..model.metadata, album: event_data }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    "UPDATE_ARTWORK" => {
      let meta = { ..model.metadata, artwork: event_data }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    // Metadata — numeric fields
    "UPDATE_DURATION" => {
      let d = parse_double(event_data)
      let meta = { ..model.metadata, duration: d }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    "UPDATE_CURRENT_TIME" => {
      let t = parse_double(event_data)
      let pb = { ..model.playback, currentTime: t }
      (normalize_model({ ..model, playback: pb }), ["PERSIST_METADATA"])
    }
    "UPDATE_RATING" => {
      let r = parse_int(event_data)
      let meta = { ..model.metadata, rating: r }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    "UPDATE_TRACK_NUMBER" => {
      let tn = parse_int(event_data)
      let meta = { ..model.metadata, trackNumber: tn }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    "UPDATE_TOTAL_TRACKS" => {
      let tt = parse_int(event_data)
      let meta = { ..model.metadata, totalTracks: tt }
      (normalize_model({ ..model, metadata: meta }), ["PERSIST_METADATA"])
    }
    // View mode
    "SET_VIEW_MODE" => {
      let vm = match event_data {
        "focus" => Focus
        "preview" => Preview
        "ascii" => Ascii
        "3d" => ThreeD
        _ => Flat
      }
      let pres = { ..model.presentation, viewMode: vm }
      ({ ..model, presentation: pres }, ["PERSIST_UI_STATE"])
    }
    // Colors
    "SET_SKIN_COLOR" => {
      let pres = { ..model.presentation, skinColor: event_data }
      ({ ..model, presentation: pres }, ["PERSIST_UI_STATE"])
    }
    "SET_BG_COLOR" => {
      let pres = { ..model.presentation, bgColor: event_data }
      ({ ..model, presentation: pres }, ["PERSIST_UI_STATE"])
    }
    // Hardware presets
    "SET_HARDWARE_PRESET" => {
      let hp = match event_data {
        "classic-2007" => Classic2007
        "classic-2009" => Classic2009
        "classic-2008-black" => Classic2008Black
        "classic-2008-silver" => Classic2008Silver
        _ => Classic2008
      }
      let color = match hp {
        Classic2008Silver => "#C0C0C0"
        _ => "#111111"
      }
      let pres = { ..model.presentation, hardwarePreset: hp, skinColor: color }
      ({ ..model, presentation: pres }, ["PERSIST_UI_STATE"])
    }
    // Interaction model
    "SET_INTERACTION_MODEL" => {
      let im = match event_data {
        "ipod-os" => IpodOs
        "ipod-os-original" => IpodOsOriginal
        _ => Direct
      }
      let inter = { ..model.interaction, interactionModel: im }
      ({ ..model, interaction: inter }, ["PERSIST_UI_STATE"])
    }
    "SET_OS_SCREEN" => {
      let screen = if event_data == "now-playing" { NowPlaying } else { Menu }
      let inter = { ..model.interaction, osScreen: screen }
      ({ ..model, interaction: inter }, [])
    }
    // Navigation
    "SET_OS_MENU_INDEX" => {
      let idx = parse_int(event_data)
      let inter = { ..model.interaction, menuIndex: idx }
      (normalize_model({ ..model, interaction: inter }), [])
    }
    "CYCLE_OS_MENU" => {
      let delta = parse_int(event_data)
      let inter = {
        ..model.interaction,
        menuIndex: model.interaction.menuIndex + delta,
      }
      (normalize_model({ ..model, interaction: inter }), [])
    }
    "SET_OS_ORIGINAL_MENU_SPLIT" => {
      let split = parse_double(event_data)
      let inter = { ..model.interaction, osOriginalMenuSplit: split }
      (normalize_model({ ..model, interaction: inter }), ["PERSIST_UI_STATE"])
    }
    // Now playing editable
    "SET_OS_NOW_PLAYING_EDITABLE" => {
      let editable = parse_bool(event_data)
      let inter = { ..model.interaction, isNowPlayingEditable: editable }
      ({ ..model, interaction: inter }, [])
    }
    "TOGGLE_OS_NOW_PLAYING_EDITABLE" => {
      let inter = {
        ..model.interaction,
        isNowPlayingEditable: !model.interaction.isNowPlayingEditable,
      }
      ({ ..model, interaction: inter }, [])
    }
    // Playback
    "SET_IS_PLAYING" => {
      let playing = parse_bool(event_data)
      let inter = { ..model.interaction, isPlaying: playing }
      ({ ..model, interaction: inter }, [])
    }
    "TOGGLE_IS_PLAYING" => {
      let inter = {
        ..model.interaction,
        isPlaying: !model.interaction.isPlaying,
      }
      ({ ..model, interaction: inter }, [])
    }
    // Battery
    "SET_BATTERY_LEVEL" => {
      let level = parse_double(event_data)
      let inter = { ..model.interaction, batteryLevel: level }
      (normalize_model({ ..model, interaction: inter }), [])
    }
    // Snapshot selection
    "SET_SELECTION_KIND" => {
      let kind = match event_data {
        "range" => Range
        _ => Moment
      }
      let pb = { ..model.playback, selectionKind: kind }
      ({ ..model, playback: pb }, [])
    }
    "SET_RANGE_START_TIME" => {
      let t = parse_double(event_data)
      let pb = { ..model.playback, rangeStartTime: t }
      (normalize_model({ ..model, playback: pb }), [])
    }
    "SET_RANGE_END_TIME" => {
      let t = parse_double(event_data)
      let pb = { ..model.playback, rangeEndTime: t }
      (normalize_model({ ..model, playback: pb }), [])
    }
    // Song snapshot application
    "APPLY_SONG_SNAPSHOT" =>
      match deserialize_model(event_data) {
        Ok(m) => (m, ["PERSIST_METADATA", "PERSIST_UI_STATE"])
        Err(_) => (model, [])
      }
    // Lifecycle
    "RESET_MODEL" => (default_model(), ["PERSIST_METADATA", "PERSIST_UI_STATE"])
    "RESTORE_MODEL" =>
      match deserialize_model(event_data) {
        Ok(m) => (m, [])
        Err(_) => (model, [])
      }
    _ => (model, [])
  }
}
