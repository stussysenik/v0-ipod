// Type-safe FFI bridge to MoonBit JS exports

// --- Raw MoonBit JS exports ---

@module("../js/ipod_moonbit.js")
external defaultModelJsonRaw: unit => string = "default_model_json"

@module("../js/ipod_moonbit.js")
external reduceModelRaw: (string, string, string) => string = "reduce_model"

@module("../js/ipod_moonbit.js")
external authenticFinishesRaw: unit => string = "get_authentic_finishes"

@module("../js/ipod_moonbit.js")
external deriveWheelRaw: string => string = "derive_wheel_json"

@module("../js/ipod_moonbit.js")
external marqueeCycleMsRaw: (float, float, float) => float = "marquee_cycle_ms"

@module("../js/ipod_moonbit.js")
external marqueeFrameRaw: (float, float) => float = "marquee_frame"

@module("../js/ipod_moonbit.js")
external marqueeNeededRaw: (float, float) => bool = "marquee_needed"

@module("../js/ipod_moonbit.js")
external colorIsDarkRaw: string => bool = "color_is_dark"

// --- JSON parsing helpers ---

let getStr = (dict: Dict.t<JSON.t>, key: string): string =>
  switch Dict.get(dict, key) {
  | Some(String(s)) => s
  | _ => ""
  }

let getFloat = (dict: Dict.t<JSON.t>, key: string): float =>
  switch Dict.get(dict, key) {
  | Some(Number(n)) => n
  | _ => 0.0
  }

let getInt = (dict: Dict.t<JSON.t>, key: string): int =>
  Float.toInt(getFloat(dict, key))

let getBool = (dict: Dict.t<JSON.t>, key: string): bool =>
  switch Dict.get(dict, key) {
  | Some(Boolean(true)) => true
  | Some(Boolean(false)) => false
  | _ => false
  }

let parseViewMode = (s: string): Types.viewMode =>
  switch s {
  | "focus" => Focus
  | "preview" => Preview
  | "ascii" => Ascii
  | "3d" => ThreeD
  | _ => Flat
  }

let parseHardwarePreset = (s: string): Types.hardwarePresetId =>
  switch s {
  | "classic-2007" => Classic2007
  | "classic-2009" => Classic2009
  | "classic-2008-black" => Classic2008Black
  | "classic-2008-silver" => Classic2008Silver
  | _ => Classic2008
  }

let parseInteractionModel = (s: string): Types.interactionModel =>
  switch s {
  | "ipod-os" => IpodOs
  | "ipod-os-original" => IpodOsOriginal
  | _ => Direct
  }

let parseOsScreen = (s: string): Types.osScreen =>
  switch s {
  | "now-playing" => NowPlaying
  | _ => Menu
  }

let parseSelectionKind = (s: string): Types.snapshotSelectionKind =>
  switch s {
  | "range" => Range
  | _ => Moment
  }

let parseSongMetadata = (d: Dict.t<JSON.t>): Types.songMetadata => {
  title: getStr(d, "title"),
  artist: getStr(d, "artist"),
  album: getStr(d, "album"),
  artwork: getStr(d, "artwork"),
  duration: getFloat(d, "duration"),
  currentTime: getFloat(d, "currentTime"),
  rating: getInt(d, "rating"),
  trackNumber: getInt(d, "trackNumber"),
  totalTracks: getInt(d, "totalTracks"),
}

let parsePresentation = (d: Dict.t<JSON.t>): Types.presentationState => {
  skinColor: getStr(d, "skinColor"),
  bgColor: getStr(d, "bgColor"),
  viewMode: parseViewMode(getStr(d, "viewMode")),
  hardwarePreset: parseHardwarePreset(getStr(d, "hardwarePreset")),
}

let parseInteraction = (d: Dict.t<JSON.t>): Types.interactionState => {
  interactionModel: parseInteractionModel(getStr(d, "interactionModel")),
  osScreen: parseOsScreen(getStr(d, "osScreen")),
  menuIndex: getInt(d, "menuIndex"),
  osOriginalMenuSplit: getFloat(d, "osOriginalMenuSplit"),
  isNowPlayingEditable: getBool(d, "isNowPlayingEditable"),
  isPlaying: getBool(d, "isPlaying"),
  batteryLevel: getFloat(d, "batteryLevel"),
}

let parsePlayback = (d: Dict.t<JSON.t>): Types.playbackState => {
  currentTime: getFloat(d, "currentTime"),
  duration: getFloat(d, "duration"),
  selectionKind: parseSelectionKind(getStr(d, "selectionKind")),
  rangeStartTime: getFloat(d, "rangeStartTime"),
  rangeEndTime: getFloat(d, "rangeEndTime"),
}

let rec parseIpModel = (raw: string): Types.ipodModel =>
  switch Js.Json.parseExn(raw) {
  | Object(d) =>
    {
      metadata: switch Dict.get(d, "metadata") {
      | Some(Object(md)) => parseSongMetadata(md)
      | _ => parseSongMetadata(Dict.make())
      },
      presentation: switch Dict.get(d, "presentation") {
      | Some(Object(pd)) => parsePresentation(pd)
      | _ => parsePresentation(Dict.make())
      },
      interaction: switch Dict.get(d, "interaction") {
      | Some(Object(id)) => parseInteraction(id)
      | _ => parseInteraction(Dict.make())
      },
      playback: switch Dict.get(d, "playback") {
      | Some(Object(pd)) => parsePlayback(pd)
      | _ => parsePlayback(Dict.make())
      },
    }
  | _ => parseIpModel("{}")
  }

let parseDispatchResult = (raw: string): Types.dispatchResult => {
  switch Js.Json.parseExn(raw) {
  | Object(d) =>
    {
      model: switch Dict.get(d, "model") {
      | Some(Object(_)) => parseIpModel(raw)
      | _ => parseIpModel("{}")
      },
      effects: switch Dict.get(d, "effects") {
      | Some(Array(arr)) =>
        Belt.Array.map(arr, v =>
          switch v {
          | String(s) => s
          | _ => ""
          }
        )
      | _ => Belt.Array.make(0, "")
      },
    }
  | _ => {model: parseIpModel("{}"), effects: []}
  }
}

let parseFinishes = (raw: string): array<Types.appleFinish> =>
  switch Js.Json.parseExn(raw) {
  | Array(arr) =>
    Belt.Array.map(arr, v =>
      switch v {
      | Object(d) => ({label: getStr(d, "label"), hex: getStr(d, "hex")}: Types.appleFinish)
      | _ => ({label: "", hex: "#000000"}: Types.appleFinish)
      }
    )
  | _ => []
  }

let parseWheelColors = (raw: string): Types.wheelColors =>
  switch Js.Json.parseExn(raw) {
  | Object(d) => {
      labelColor: getStr(d, "labelColor"),
      borderColor: getStr(d, "borderColor"),
      centerBorder: getStr(d, "centerBorder"),
      centerGradient: getStr(d, "centerGradient"),
    }
  | _ => {
      labelColor: "#FFFFFF",
      borderColor: "#555555",
      centerBorder: "#444444",
      centerGradient: "#666666",
    }
  }

// --- Variant-to-tag conversion ---

let eventToTagData = (event: Types.ipodEvent): (string, string) =>
  switch event {
  | UpdateTitle(v) => ("UPDATE_TITLE", v)
  | UpdateArtist(v) => ("UPDATE_ARTIST", v)
  | UpdateAlbum(v) => ("UPDATE_ALBUM", v)
  | UpdateArtwork(v) => ("UPDATE_ARTWORK", v)
  | UpdateDuration(v) => ("UPDATE_DURATION", Float.toString(v))
  | UpdateCurrentTime(v) => ("UPDATE_CURRENT_TIME", Float.toString(v))
  | UpdateRating(v) => ("UPDATE_RATING", Int.toString(v))
  | UpdateTrackNumber(v) => ("UPDATE_TRACK_NUMBER", Int.toString(v))
  | UpdateTotalTracks(v) => ("UPDATE_TOTAL_TRACKS", Int.toString(v))
  | SetViewMode(v) => (
    "SET_VIEW_MODE",
    switch v {
    | Flat => "flat" | Focus => "focus" | Preview => "preview" | Ascii => "ascii" | ThreeD => "3d"
    },
  )
  | SetSkinColor(v) => ("SET_SKIN_COLOR", v)
  | SetBgColor(v) => ("SET_BG_COLOR", v)
  | SetHardwarePreset(v) => (
    "SET_HARDWARE_PRESET",
    switch v {
    | Classic2007 => "classic-2007" | Classic2008 => "classic-2008"
    | Classic2009 => "classic-2009" | Classic2008Black => "classic-2008-black"
    | Classic2008Silver => "classic-2008-silver"
    },
  )
  | SetInteractionModel(v) => (
    "SET_INTERACTION_MODEL",
    switch v {
    | Direct => "direct" | IpodOs => "ipod-os" | IpodOsOriginal => "ipod-os-original"
    },
  )
  | SetOsScreen(v) => ("SET_OS_SCREEN", switch v { | Menu => "menu" | NowPlaying => "now-playing" })
  | SetOsMenuIndex(v) => ("SET_OS_MENU_INDEX", Int.toString(v))
  | CycleOsMenu(v) => ("CYCLE_OS_MENU", Int.toString(v))
  | SetOsOriginalMenuSplit(v) => ("SET_OS_ORIGINAL_MENU_SPLIT", Float.toString(v))
  | SetOsNowPlayingEditable(v) => ("SET_OS_NOW_PLAYING_EDITABLE", v ? "true" : "false")
  | ToggleOsNowPlayingEditable => ("TOGGLE_OS_NOW_PLAYING_EDITABLE", "")
  | SetIsPlaying(v) => ("SET_IS_PLAYING", v ? "true" : "false")
  | ToggleIsPlaying => ("TOGGLE_IS_PLAYING", "")
  | SetBatteryLevel(v) => ("SET_BATTERY_LEVEL", Float.toString(v))
  | SetSelectionKind(v) => ("SET_SELECTION_KIND", switch v { | Moment => "moment" | Range => "range" })
  | SetRangeStartTime(v) => ("SET_RANGE_START_TIME", Float.toString(v))
  | SetRangeEndTime(v) => ("SET_RANGE_END_TIME", Float.toString(v))
  | RestoreModel(_v) => ("RESTORE_MODEL", "")
  | ResetModel => ("RESET_MODEL", "")
  | ApplySongSnapshot => ("APPLY_SONG_SNAPSHOT", "{}")
  }

// --- Model serialization ---

let serializeModel = (model: Types.ipodModel): string => {
  let meta = model.metadata
  let pres = model.presentation
  let inter = model.interaction
  let pb = model.playback

  let viewModeStr = switch pres.viewMode {
  | Flat => "flat" | Focus => "focus" | Preview => "preview" | Ascii => "ascii" | ThreeD => "3d"
  }

  let presetStr = switch pres.hardwarePreset {
  | Classic2007 => "classic-2007" | Classic2008 => "classic-2008"
  | Classic2009 => "classic-2009" | Classic2008Black => "classic-2008-black"
  | Classic2008Silver => "classic-2008-silver"
  }

  let imStr = switch inter.interactionModel {
  | Direct => "direct" | IpodOs => "ipod-os" | IpodOsOriginal => "ipod-os-original"
  }

  let osStr = switch inter.osScreen {
  | Menu => "menu" | NowPlaying => "now-playing"
  }

  let selStr = switch pb.selectionKind {
  | Moment => "moment" | Range => "range"
  }

  let s = Js.Json.string
  let n = (v: float): Js.Json.t => Js.Json.number(v)
  let b = (v: bool): Js.Json.t => if v {Js.Json.boolean(true)} else {Js.Json.boolean(false)}

  let metaObj = Dict.make()
  Dict.set(metaObj, "title", s(meta.title))
  Dict.set(metaObj, "artist", s(meta.artist))
  Dict.set(metaObj, "album", s(meta.album))
  Dict.set(metaObj, "artwork", s(meta.artwork))
  Dict.set(metaObj, "duration", n(meta.duration))
  Dict.set(metaObj, "currentTime", n(meta.currentTime))
  Dict.set(metaObj, "rating", n(Int.toFloat(meta.rating)))
  Dict.set(metaObj, "trackNumber", n(Int.toFloat(meta.trackNumber)))
  Dict.set(metaObj, "totalTracks", n(Int.toFloat(meta.totalTracks)))

  let presObj = Dict.make()
  Dict.set(presObj, "skinColor", s(pres.skinColor))
  Dict.set(presObj, "bgColor", s(pres.bgColor))
  Dict.set(presObj, "viewMode", s(viewModeStr))
  Dict.set(presObj, "hardwarePreset", s(presetStr))

  let interObj = Dict.make()
  Dict.set(interObj, "interactionModel", s(imStr))
  Dict.set(interObj, "osScreen", s(osStr))
  Dict.set(interObj, "menuIndex", n(Int.toFloat(inter.menuIndex)))
  Dict.set(interObj, "osOriginalMenuSplit", n(inter.osOriginalMenuSplit))
  Dict.set(interObj, "isNowPlayingEditable", b(inter.isNowPlayingEditable))
  Dict.set(interObj, "isPlaying", b(inter.isPlaying))
  Dict.set(interObj, "batteryLevel", n(inter.batteryLevel))

  let pbObj = Dict.make()
  Dict.set(pbObj, "currentTime", n(pb.currentTime))
  Dict.set(pbObj, "duration", n(pb.duration))
  Dict.set(pbObj, "selectionKind", s(selStr))
  Dict.set(pbObj, "rangeStartTime", n(pb.rangeStartTime))
  Dict.set(pbObj, "rangeEndTime", n(pb.rangeEndTime))

  let root = Dict.make()
  Dict.set(root, "metadata", Js.Json.object_(metaObj))
  Dict.set(root, "presentation", Js.Json.object_(presObj))
  Dict.set(root, "interaction", Js.Json.object_(interObj))
  Dict.set(root, "playback", Js.Json.object_(pbObj))

  Js.Json.stringify(Js.Json.object_(root))
}

// --- Typed wrappers ---

let defaultModel = (): Types.ipodModel => {
  let json = defaultModelJsonRaw()
  parseIpModel(json)
}

let reduce = (model: Types.ipodModel, event: Types.ipodEvent): Types.dispatchResult => {
  let modelJson = serializeModel(model)
  let (tag, data) = eventToTagData(event)
  let resultJson = reduceModelRaw(modelJson, tag, data)
  parseDispatchResult(resultJson)
}

let authenticFinishes = (): array<Types.appleFinish> => {
  let json = authenticFinishesRaw()
  parseFinishes(json)
}

let deriveWheelColors = (caseHex: string): Types.wheelColors => {
  let json = deriveWheelRaw(caseHex)
  parseWheelColors(json)
}

let marqueeCycleMs = marqueeCycleMsRaw
let marqueeFrame = marqueeFrameRaw
let marqueeNeeded = marqueeNeededRaw
let colorIsDark = colorIsDarkRaw
