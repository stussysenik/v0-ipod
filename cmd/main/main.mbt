///|
/// Public JS exports for the iPod MoonBit module.

///|
/// Create and return the default model as JSON.
pub fn default_model_json() -> String {
  let m = @ipod.default_model()
  @ipod.serialize_model(m.metadata, m.presentation, m.interaction, m.playback)
}

///|
/// Reduce: apply an event to the model, return result as JSON.
pub fn reduce_model(
  model_json : String,
  event_tag : String,
  event_data : String,
) -> String {
  let m = match @ipod.deserialize_model(model_json) {
    Ok(v) => v
    Err(_) => @ipod.default_model()
  }
  let (next, effects) = @ipod.reduce(m, event_tag, event_data)
  let model_json = @ipod.serialize_model(next.metadata, next.presentation, next.interaction, next.playback)
  let effects_json = effects_to_json(effects)
  "{\"model\":" + model_json + ",\"effects\":" + effects_json + "}"
}

///|
/// Get all 9 Apple finishes as JSON array.
pub fn get_authentic_finishes() -> String {
  let f = @ipod.authentic_finishes()
  finish_to_json(f, 0, "[")
}

///|
fn finish_to_json(
  f : Array[@ipod.AppleFinish],
  i : Int,
  acc : String,
) -> String {
  if i >= f.length() {
    acc + "]"
  } else {
    let sep = if i == 0 { "" } else { "," }
    finish_to_json(
      f,
      i + 1,
      acc +
      sep +
      "{\"label\":\"" +
      f[i].label +
      "\",\"hex\":\"" +
      f[i].hex +
      "\"}",
    )
  }
}

///|
fn gradient_to_json(g : @ipod.Gradient) -> String {
  "{\"from\":\"" + g.from + "\",\"via\":\"" + g.via + "\",\"to\":\"" + g.to + "\"}"
}

///|
/// Derive wheel colors from case color, returned as JSON.
pub fn derive_wheel_json(case_hex : String) -> String {
  let d = @ipod.derive_wheel(case_hex)
  "{\"labelColor\":\"" +
  d.labelColor +
  "\",\"border\":\"" +
  d.border +
  "\",\"centerBorder\":\"" +
  d.centerBorder +
  "\",\"gradient\":" +
  gradient_to_json(d.gradient) +
  ",\"centerGradient\":" +
  gradient_to_json(d.centerGradient) +
  "}"
}

///|
/// Get marquee cycle duration in ms.
pub fn marquee_cycle_ms(
  text_width : Double,
  container_width : Double,
  gap_width : Double,
) -> Double {
  @ipod.get_marquee_cycle_duration_ms(text_width, container_width, gap_width)
}

///|
/// Get marquee frame scroll position.
pub fn marquee_frame(elapsed_ms : Double, cycle_duration_ms : Double) -> Double {
  @ipod.get_marquee_frame(elapsed_ms, cycle_duration_ms)
}

///|
/// Check if text needs marquee scrolling.
pub fn marquee_needed(text_width : Double, container_width : Double) -> Bool {
  @ipod.needs_marquee(text_width, container_width)
}

///|
/// Check if a color is dark.
pub fn color_is_dark(hex : String) -> Bool {
  @ipod.is_dark(hex)
}

///|
fn effects_to_json(effects : Array[String]) -> String {
  effects_json(effects, 0, "[")
}

///|
fn effects_json(effects : Array[String], i : Int, acc : String) -> String {
  if i >= effects.length() {
    acc + "]"
  } else {
    let sep = if i == 0 { "" } else { "," }
    effects_json(effects, i + 1, acc + sep + "\"" + effects[i] + "\"")
  }
}
