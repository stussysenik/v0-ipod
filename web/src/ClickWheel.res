// Click Wheel — Pointer Events rotation + center button

open Types

@react.component
let make = (~skinColor, ~dispatch) => {
  let wheelRef = React.useRef(Nullable.null)
  let lastAngle = React.useRef(0.0)
  let accumulated = React.useRef(0.0)
  let tracking = React.useRef(false)

  let wheelColors = React.useMemo(() => MoonBitBindings.deriveWheelColors(skinColor), [skinColor])

  let getBoundingClientRect = (el): {
    "left": float,
    "top": float,
    "width": float,
    "height": float,
  } => (Obj.magic(el))["getBoundingClientRect"]()

  let setPointerCapture = (el, id: int): unit =>
    (Obj.magic(el))["setPointerCapture"](id)

  let getCenter = (): (float, float) =>
    switch Nullable.toOption(wheelRef.current) {
    | None => (0.0, 0.0)
    | Some(el) => {
        let rect = getBoundingClientRect(el)
        (rect["left"] +. rect["width"] /. 2.0, rect["top"] +. rect["height"] /. 2.0)
      }
    }

  let normalizeDelta = (delta: float): float =>
    if delta > Js.Math._PI {
      delta -. 2.0 *. Js.Math._PI
    } else if delta < -. Js.Math._PI {
      delta +. 2.0 *. Js.Math._PI
    } else {
      delta
    }

  let onPointerDown = (e: ReactEvent.Pointer.t) => {
    let (cx, cy) = getCenter()
    let angle = Js.Math.atan2(
      ~y=Int.toFloat(ReactEvent.Pointer.clientY(e)) -. cy,
      ~x=Int.toFloat(ReactEvent.Pointer.clientX(e)) -. cx,
      (),
    )
    lastAngle.current = angle
    accumulated.current = 0.0
    tracking.current = true
    switch Nullable.toOption(wheelRef.current) {
    | None => ()
    | Some(el) => setPointerCapture(el, Obj.magic(ReactEvent.Pointer.pointerId(e)))
    }
  }

  let onPointerMove = (e: ReactEvent.Pointer.t) => {
    if tracking.current {
      let (cx, cy) = getCenter()
      let angle = Js.Math.atan2(
        ~y=Int.toFloat(ReactEvent.Pointer.clientY(e)) -. cy,
        ~x=Int.toFloat(ReactEvent.Pointer.clientX(e)) -. cx,
        (),
      )
      let rawDelta = angle -. lastAngle.current
      let delta = normalizeDelta(rawDelta)
      lastAngle.current = angle
      let newAcc = accumulated.current +. delta
      accumulated.current = newAcc
      let degrees = newAcc *. 180.0 /. Js.Math._PI

      if abs_float(degrees) >= 30.0 {
        let steps = Float.toInt(degrees /. 30.0)
        dispatch(CycleOsMenu(steps))
        accumulated.current = newAcc -. Int.toFloat(steps) *. 30.0 *. Js.Math._PI /. 180.0
      }
    }
  }

  let onPointerUp = (_e: ReactEvent.Pointer.t) => {
    tracking.current = false
  }

  let onCenterClick = (_e: ReactEvent.Mouse.t) => {
    dispatch(SetOsScreen(NowPlaying))
  }

  let labelStyle = {"color": wheelColors.labelColor, "fontSize": "11px", "fontWeight": "600"}

  <div
    className="click-wheel"
    ref={ReactDOM.Ref.domRef(wheelRef)}
    onPointerDown
    onPointerMove
    onPointerUp>
    <div className="wheel-btn menu-btn" style={Obj.magic(labelStyle)}>
      {React.string("MENU")}
    </div>
    <div className="wheel-btn prev-btn" style={Obj.magic(labelStyle)}>
      {React.string("MID.")}
    </div>
    <div className="wheel-btn next-btn" style={Obj.magic(labelStyle)}>
      {React.string("MID.")}
    </div>
    <div className="wheel-btn pp-btn" style={Obj.magic(labelStyle)}>
      {React.string("MID.")}
    </div>
    <div
      className="wheel-center"
      onClick=onCenterClick
      style={Obj.magic({"borderColor": wheelColors.centerBorder, "background": wheelColors.centerGradient})}
    />
  </div>
}
