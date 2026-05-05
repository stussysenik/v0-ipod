///|
/// @test default model
test "default model" {
  let m = default_model()
  assert_eq(m.metadata.title, "Strobe")
  assert_eq(m.metadata.duration, 154.0)
  assert_true(m.presentation.viewMode == Flat)
  assert_eq(m.interaction.batteryLevel, 0.85)
}

///|
/// @test normalize clamps
test "normalize clamps" {
  let m = default_model()
  let bad = { ..m.metadata, duration: -5.0, rating: 10, trackNumber: 100 }
  let n = normalize_model({ ..m, metadata: bad })
  assert_eq(n.metadata.duration, 1.0)
  assert_eq(n.metadata.rating, 5)
}

///|
/// @test reduce UPDATE_TITLE
test "reduce title" {
  let (next, effects) = reduce(default_model(), "UPDATE_TITLE", "Electric Feel")
  assert_eq(next.metadata.title, "Electric Feel")
  assert_eq(effects[0], "PERSIST_METADATA")
}

///|
/// @test reduce SET_VIEW_MODE
test "reduce view mode" {
  let (next, effects) = reduce(default_model(), "SET_VIEW_MODE", "ascii")
  assert_true(next.presentation.viewMode == Ascii)
  assert_eq(effects[0], "PERSIST_UI_STATE")
}

///|
/// @test reduce SET_SKIN_COLOR
test "reduce skin color" {
  let (next, _) = reduce(default_model(), "SET_SKIN_COLOR", "#FF0000")
  assert_eq(next.presentation.skinColor, "#FF0000")
}

///|
/// @test reduce TOGGLE_IS_PLAYING
test "reduce toggle play" {
  let (next, _) = reduce(default_model(), "TOGGLE_IS_PLAYING", "")
  assert_true(next.interaction.isPlaying)
}

///|
/// @test reduce RESET_MODEL
test "reduce reset" {
  let (next, _) = reduce(default_model(), "RESET_MODEL", "")
  assert_eq(next.metadata.title, "Strobe")
}

///|
/// @test authentic finishes count
test "authentic finishes" {
  let f = authentic_finishes()
  assert_eq(f.length(), 9)
  assert_eq(f[0].label, "Graphite")
}

///|
/// @test dark wheel derivation
test "wheel dark" {
  let d = derive_wheel("#111111")
  assert_eq(d.labelColor, "#FFFFFF")
}

///|
/// @test marquee no overflow
test "marquee no overflow" {
  let d = get_marquee_cycle_duration_ms(100.0, 200.0, 60.0)
  assert_eq(d, 0.0)
}

///|
/// @test marquee overflow
test "marquee overflow" {
  let d = get_marquee_cycle_duration_ms(500.0, 200.0, 60.0)
  assert_true(d > 0.0)
}

///|
/// @test marquee needs overflow
test "marquee needs" {
  assert_true(needs_marquee(500.0, 200.0))
  assert_true(!needs_marquee(100.0, 200.0))
}

///|
/// @test reduce UPDATE_DURATION parses event data
test "reduce duration numeric" {
  let (next, _) = reduce(default_model(), "UPDATE_DURATION", "200")
  assert_eq(next.metadata.duration, 200.0)
}

///|
/// @test reduce UPDATE_RATING parses event data
test "reduce rating numeric" {
  let (next, _) = reduce(default_model(), "UPDATE_RATING", "4")
  assert_eq(next.metadata.rating, 4)
}

///|
/// @test reduce UPDATE_TRACK_NUMBER parses event data
test "reduce track number numeric" {
  let (next, _) = reduce(default_model(), "UPDATE_TRACK_NUMBER", "5")
  assert_eq(next.metadata.trackNumber, 5)
}

///|
/// @test reduce UPDATE_TOTAL_TRACKS parses event data
test "reduce total tracks numeric" {
  let (next, _) = reduce(default_model(), "UPDATE_TOTAL_TRACKS", "12")
  assert_eq(next.metadata.totalTracks, 12)
}

///|
/// @test reduce SET_BATTERY_LEVEL parses event data
test "reduce battery level" {
  let (next, _) = reduce(default_model(), "SET_BATTERY_LEVEL", "0.5")
  assert_eq(next.interaction.batteryLevel, 0.5)
}

///|
/// @test reduce SET_BATTERY_LEVEL below min clamped
test "reduce battery level low clamp" {
  let (next, _) = reduce(default_model(), "SET_BATTERY_LEVEL", "-0.1")
  assert_eq(next.interaction.batteryLevel, 0.05)
}

///|
/// @test reduce SET_OS_MENU_INDEX parses event data
test "reduce menu index" {
  let (next, _) = reduce(default_model(), "SET_OS_MENU_INDEX", "3")
  assert_eq(next.interaction.menuIndex, 3)
}

///|
/// @test reduce CYCLE_OS_MENU increments
test "reduce cycle menu forward" {
  let (next, _) = reduce(default_model(), "CYCLE_OS_MENU", "1")
  assert_eq(next.interaction.menuIndex, 1)
}

///|
/// @test reduce CYCLE_OS_MENU decrements
test "reduce cycle menu backward" {
  let (next, _) = reduce(default_model(), "CYCLE_OS_MENU", "-1")
  // clamped to 0 by normalization
  assert_eq(next.interaction.menuIndex, 0)
}

///|
/// @test reduce SET_OS_ORIGINAL_MENU_SPLIT
test "reduce menu split" {
  let (next, _) = reduce(default_model(), "SET_OS_ORIGINAL_MENU_SPLIT", "0.5")
  assert_eq(next.interaction.osOriginalMenuSplit, 0.5)
}

///|
/// @test reduce SET_IS_PLAYING true
test "reduce set playing true" {
  let (next, _) = reduce(default_model(), "SET_IS_PLAYING", "true")
  assert_true(next.interaction.isPlaying)
}

///|
/// @test reduce SET_IS_PLAYING false
test "reduce set playing false" {
  let (next, _) = reduce(default_model(), "SET_IS_PLAYING", "false")
  assert_true(!next.interaction.isPlaying)
}

///|
/// @test reduce TOGGLE_OS_NOW_PLAYING_EDITABLE
test "reduce toggle now playing editable" {
  let (next, _) = reduce(default_model(), "TOGGLE_OS_NOW_PLAYING_EDITABLE", "")
  assert_true(next.interaction.isNowPlayingEditable)
}

///|
/// @test reduce SET_OS_NOW_PLAYING_EDITABLE
test "reduce set now playing editable" {
  let (next, _) = reduce(default_model(), "SET_OS_NOW_PLAYING_EDITABLE", "true")
  assert_true(next.interaction.isNowPlayingEditable)
}

///|
/// @test reduce SET_SELECTION_KIND range
test "reduce selection kind range" {
  let (next, _) = reduce(default_model(), "SET_SELECTION_KIND", "range")
  assert_true(next.playback.selectionKind == Range)
}

///|
/// @test reduce SET_SELECTION_KIND moment
test "reduce selection kind moment" {
  let (next, _) = reduce(default_model(), "SET_SELECTION_KIND", "moment")
  assert_true(next.playback.selectionKind == Moment)
}

///|
/// @test reduce SET_RANGE_START_TIME
test "reduce range start time" {
  let (next, _) = reduce(default_model(), "SET_RANGE_START_TIME", "10.5")
  assert_eq(next.playback.rangeStartTime, 10.5)
}

///|
/// @test reduce SET_RANGE_END_TIME
test "reduce range end time" {
  let (next, _) = reduce(default_model(), "SET_RANGE_END_TIME", "45.0")
  assert_eq(next.playback.rangeEndTime, 45.0)
}

///|
/// @test reduce APPLY_SONG_SNAPSHOT with empty JSON resets to empty model
test "reduce apply song snapshot" {
  let (next, _) = reduce(default_model(), "APPLY_SONG_SNAPSHOT", "{}")
  // empty JSON produces empty strings / zero values
  assert_eq!(next.metadata.title, "")
}

///|
/// @test reduce unknown event noop
test "reduce unknown event" {
  let model = default_model()
  let (next, effects) = reduce(model, "UNKNOWN_EVENT", "")
  assert_eq(next.metadata.title, model.metadata.title)
  assert_eq(effects.length(), 0)
}

///|
/// @test parse double negative
test "parse double negative" {
  let (next, _) = reduce(default_model(), "UPDATE_CURRENT_TIME", "-5.0")
  assert_eq(next.playback.currentTime, 0.0)
}

///|
/// @test parse double positive
test "parse double positive" {
  let (next, _) = reduce(default_model(), "UPDATE_CURRENT_TIME", "30.5")
  assert_eq(next.playback.currentTime, 30.5)
}
