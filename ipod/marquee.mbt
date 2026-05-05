///|
/// Marquee animation math — pure functions for computing scroll positions.
/// These mirror the `getMarqueeFrame`, `getMarqueeCycleDurationMs`, and
/// `getMarqueeGapWidth` functions from the original lib/marquee.ts.

///|
/// Get the marquee scroll X offset in pixels at a given elapsed time (ms).
/// Returns 0 if the total duration is invalid or zero.
pub fn get_marquee_frame(
  elapsed_ms : Double,
  cycle_duration_ms : Double,
) -> Double {
  if cycle_duration_ms <= 0.0 {
    0.0
  } else {
    let progress = elapsed_ms % cycle_duration_ms / cycle_duration_ms
    progress * cycle_duration_ms * -0.05
  }
}

///|
/// Calculate total cycle duration in ms.
/// textWidth: width of text in px
/// containerWidth: width of visible area in px
/// gapWidth: width of gap between text repetitions in px
pub fn get_marquee_cycle_duration_ms(
  text_width : Double,
  container_width : Double,
  gap_width : Double,
) -> Double {
  if text_width <= container_width {
    0.0 // no scrolling needed
  } else {
    let total_scroll = text_width + gap_width
    let speed = 50.0 // pixels per second
    total_scroll / speed * 1000.0
  }
}

///|
/// Get gap width between repeated text instances (typically 60px, or scaled).
pub fn get_marquee_gap_width(container_width : Double) -> Double {
  if container_width <= 0.0 {
    60.0
  } else {
    container_width * 0.25
  }
}

///|
/// Check if text overflows its container (needs marquee).
pub fn needs_marquee(text_width : Double, container_width : Double) -> Bool {
  text_width > container_width
}

///|
/// Calculate display time for export simulation.
pub fn simulate_export_time(elapsed_ms : Double, duration_s : Double) -> Double {
  if duration_s <= 0.0 {
    0.0
  } else {
    let progress = elapsed_ms / (duration_s * 1000.0)
    if progress > 1.0 {
      duration_s
    } else {
      progress * duration_s
    }
  }
}
