open Types

@react.component
let make = (~skinColor, ~dispatch) => {
  let wheelRef = React.useRef(Nullable.null)
  let lastAngle = React.useRef(0.0)
  let accumulated = React.useRef(0.0)
  let tracking = React.useRef(false)

  let wheelColors = React.useMemo(() => MoonBitBindings.deriveWheelColors(skinColor), [skinColor])

  // Dimensions for Classic 2008
  let size = "222px"
  let centerSize = "79px"
  let menuTopInset = "11%"
  let sideInset = "11%"
  let bottomInset = "12%"
  let labelFontSize = "11px"
  let labelTracking = "0.15em"
  let sideIconSize = "16px"
  let playPauseIconSize = "12px"

  let wheelShadow = "0 14px 18px -18px rgba(0,0,0,0.24), 0 8px 14px -18px rgba(0,0,0,0.14), 0 0 0 1px rgba(92,96,104,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)"

  let wheelSurfaceStyle = Obj.magic({
    "width": size,
    "height": size,
    "backgroundImage": "linear-gradient(180deg, " ++
    wheelColors.gradient.from ++
    ", " ++
    wheelColors.gradient.via ++
    ", " ++
    wheelColors.gradient.to ++
    ")",
    "borderColor": wheelColors.border,
    "borderWidth": "1px",
    "borderStyle": "solid",
    "boxShadow": wheelShadow,
    "position": "relative",
    "borderRadius": "50%",
  })

  let centerShadow = "0 4px 10px -12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(92,96,104,0.04), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(0,0,0,0.03)"

  let centerStyle = Obj.magic({
    "width": centerSize,
    "height": centerSize,
    "backgroundImage": "linear-gradient(180deg, " ++
    wheelColors.centerGradient.from ++
    ", " ++
    wheelColors.centerGradient.via ++
    ", " ++
    wheelColors.centerGradient.to ++
    ")",
    "borderColor": wheelColors.centerBorder,
    "borderWidth": "1px",
    "borderStyle": "solid",
    "boxShadow": centerShadow,
    "position": "absolute",
    "top": "50%",
    "left": "50%",
    "transform": "translate(-50%, -50%)",
    "borderRadius": "50%",
  })

  let getBoundingClientRect = (el): {
    "left": float,
    "top": float,
    "width": float,
    "height": float,
  } => (Obj.magic(el))["getBoundingClientRect"]()

  let setPointerCapture = (el, id: int): unit => (Obj.magic(el))["setPointerCapture"](id)

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
    } else if delta < -.Js.Math._PI {
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

  <div
    className="click-wheel"
    ref={ReactDOM.Ref.domRef(wheelRef)}
    onPointerDown
    onPointerMove
    onPointerUp
    style={wheelSurfaceStyle}>
    /* Fine Wheel Rim Highlight */
    <div
      className="pointer-events-none absolute inset-0"
      style={Obj.magic({
        "position": "absolute",
        "top": "0",
        "left": "0",
        "right": "0",
        "bottom": "0",
        "borderRadius": "50%",
        "boxShadow": "inset 0 1px 0.5px rgba(255,255,255,0.45), inset 0 -0.5px 0.5px rgba(0,0,0,0.05)",
      })}
    />
    /* Subsurface texture */
    <div className="wheel-grain" />
    <div
      className="pointer-events-none absolute"
      style={Obj.magic({
        "position": "absolute",
        "top": "1px",
        "left": "1px",
        "right": "1px",
        "bottom": "1px",
        "borderRadius": "50%",
        "background": "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 70%)",
      })}
    />
    /* Center Button Cavity */
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={Obj.magic({
        "position": "absolute",
        "top": "50%",
        "left": "50%",
        "transform": "translate(-50%, -50%)",
        "width": "calc(" ++ centerSize ++ " + 2px)",
        "height": "calc(" ++ centerSize ++ " + 2px)",
        "borderRadius": "50%",
        "background": "rgba(0,0,0,0.15)",
        "boxShadow": "inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.1)",
      })}
    />
    /* Button Labels */
    <button
      className="wheel-label"
      style={Obj.magic({
        "top": menuTopInset,
        "left": "50%",
        "transform": "translateX(-50%)",
        "color": wheelColors.labelColor,
        "fontSize": labelFontSize,
        "letterSpacing": labelTracking,
      })}
      onClick={_ => dispatch(SetOsScreen(Menu))}>
      {React.string("MENU")}
    </button>
    <button
      className="wheel-label"
      style={Obj.magic({
        "bottom": bottomInset,
        "left": "50%",
        "transform": "translateX(-50%)",
        "color": wheelColors.labelColor,
      })}
      onClick={_ => dispatch(ToggleIsPlaying)}>
      <svg
        viewBox="0 0 24 16"
        fill="currentColor"
        style={Obj.magic({
          "width": "calc(" ++ playPauseIconSize ++ " * 1.5)",
          "height": playPauseIconSize,
        })}>
        <polygon points="1,1 10,8 1,15" />
        <rect x="13" y="1" width="3.5" height="14" rx="0.5" />
        <rect x="19" y="1" width="3.5" height="14" rx="0.5" />
      </svg>
    </button>
    <button
      className="wheel-label"
      style={Obj.magic({
        "top": "50%",
        "left": sideInset,
        "transform": "translateY(-50%)",
        "color": wheelColors.labelColor,
      })}>
      <svg
        viewBox="0 0 24 16"
        fill="currentColor"
        style={Obj.magic({"width": "calc(" ++ sideIconSize ++ " * 1.4)", "height": sideIconSize})}>
        <rect x="1" y="1" width="2.5" height="14" rx="0.5" />
        <polygon points="14,1 5,8 14,15" />
        <polygon points="23,1 14,8 23,15" />
      </svg>
    </button>
    <button
      className="wheel-label"
      style={Obj.magic({
        "top": "50%",
        "right": sideInset,
        "transform": "translateY(-50%)",
        "color": wheelColors.labelColor,
      })}>
      <svg
        viewBox="0 0 24 16"
        fill="currentColor"
        style={Obj.magic({"width": "calc(" ++ sideIconSize ++ " * 1.4)", "height": sideIconSize})}>
        <polygon points="1,1 10,8 1,15" />
        <polygon points="10,1 19,8 10,15" />
        <rect x="20.5" y="1" width="2.5" height="14" rx="0.5" />
      </svg>
    </button>
    <div
      className="wheel-center-button"
      style=centerStyle
      onClick={_ => dispatch(SetOsScreen(NowPlaying))}
    />
  </div>
}
