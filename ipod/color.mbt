///|
/// Color system: Apple iPod finishes, luminance, wheel derivation.
pub(all) struct AppleFinish {
  label : String
  hex : String
}

///|
pub fn authentic_finishes() -> Array[AppleFinish] {
  [
    AppleFinish::{ label: "Graphite", hex: "#111111" },
    AppleFinish::{ label: "Silver", hex: "#C0C0C0" },
    AppleFinish::{ label: "Starlight", hex: "#F0E6D3" },
    AppleFinish::{ label: "Midnight", hex: "#2B2D42" },
    AppleFinish::{ label: "Blue", hex: "#2C5F7C" },
    AppleFinish::{ label: "Pink", hex: "#E8B4B8" },
    AppleFinish::{ label: "Purple", hex: "#5B4A7A" },
    AppleFinish::{ label: "Red", hex: "#B22222" },
    AppleFinish::{ label: "Green", hex: "#4A7C59" },
  ]
}

///|
/// Compute relative luminance from hex (e.g. "#AABBCC").
pub fn relative_luminance(hex : String) -> Double {
  let r = parse_hex_double(hex, 1)
  let g = parse_hex_double(hex, 3)
  let b = parse_hex_double(hex, 5)

  let r = srgb_to_linear(r / 255.0)
  let g = srgb_to_linear(g / 255.0)
  let b = srgb_to_linear(b / 255.0)

  0.2126 * r + 0.7152 * g + 0.0722 * b
}

///|
fn srgb_to_linear(c : Double) -> Double {
  if c <= 0.03928 {
    c / 12.92
  } else {
    (c + 0.055) / 1.055 * ((c + 0.055) / 1.055)
  }
}

///|
fn parse_hex_double(hex : String, pos : Int) -> Double {
  let h = hex_byte(hex, pos)
  let l = hex_byte(hex, pos + 1)
  h.to_double() * 16.0 + l.to_double()
}

///|
fn hex_byte(s : String, pos : Int) -> Int {
  let c = s[pos].to_int()
  if c >= 48 && c <= 57 {
    c - 48 // 0-9
  } else if c >= 65 && c <= 70 {
    c - 55 // A-F
  } else if c >= 97 && c <= 102 {
    c - 87 // a-f
  } else {
    0
  }
}

///|
pub fn is_dark(hex : String) -> Bool {
  relative_luminance(hex) < 0.5
}

///|
pub fn wheel_label_color(case_hex : String) -> String {
  if is_dark(case_hex) {
    "#FFFFFF"
  } else {
    "#333333"
  }
}

///|
pub fn wheel_border_color(case_hex : String) -> String {
  if is_dark(case_hex) {
    "#444444"
  } else {
    "#999999"
  }
}

///|
pub(all) struct Gradient {
  from : String
  via : String
  to : String
}

///|
pub(all) struct WheelDerivation {
  gradient : Gradient
  border : String
  labelColor : String
  centerBorder : String
  centerGradient : Gradient
}

///|
pub fn derive_wheel(case_hex : String) -> WheelDerivation {
  let lum = relative_luminance(case_hex)
  if lum < 0.18 {
    // Dark case — authentic iPod 6G black wheel shader
    WheelDerivation::{
      gradient: Gradient::{ from: "#1C1C1E", via: "#202022", to: "#252527" },
      border: "#2C2C2E",
      labelColor: "#FFFFFF",
      centerBorder: "#3A3A3C",
      centerGradient: Gradient::{ from: "#1C1C1E", via: "#202022", to: "#252527" },
    }
  } else if lum < 0.45 {
    // Mid-dark (charcoal/gunmetal)
    WheelDerivation::{
      gradient: Gradient::{ from: "#4A4A4E", via: "#424246", to: "#3A3A3E" },
      border: "#555558",
      labelColor: "#E0E0E0",
      centerBorder: "#505054",
      centerGradient: Gradient::{ from: "#4E4E52", via: "#46464A", to: "#3E3E42" },
    }
  } else {
    // Light case — iPod 6G Silver wheel colors
    WheelDerivation::{
      gradient: Gradient::{ from: "#F5F5F7", via: "#E8E8EA", to: "#DCDCDC" },
      border: "#D1D1D6",
      labelColor: "#8E8E93",
      centerBorder: "#D1D1D6",
      centerGradient: Gradient::{ from: "#FFFFFF", via: "#F0F0F2", to: "#E5E5EA" },
    }
  }
}
