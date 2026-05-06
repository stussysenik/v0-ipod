open Types

@react.component
let make = (~model, ~dispatch) => {
  let skinColor = model.presentation.skinColor
  
  // Dimensions for Classic 2008 Silver
  let width = "350px"
  let height = "580px"
  let radius = "36px"
  let innerRadius = "35px"
  let paddingX = "18px"
  let paddingTop = "18px"
  let paddingBottom = "28px"

  let shellShadow = "0 20px 48px -28px rgba(0,0,0,0.5), 0 42px 64px -44px rgba(0,0,0,0.38), inset 0 1.5px 0.5px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.12)"

  let shellSurfaceStyle = Obj.magic({
    "backgroundColor": skinColor,
    "backgroundImage": "linear-gradient(158deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 16%, rgba(255,255,255,0) 32%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.06) 100%), radial-gradient(circle at 50% 102%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 40%)",
    "width": width,
    "height": height,
    "borderRadius": radius,
    "paddingLeft": paddingX,
    "paddingRight": paddingX,
    "paddingTop": paddingTop,
    "paddingBottom": paddingBottom,
    "boxShadow": shellShadow,
    "borderColor": "rgba(0,0,0,0.15)",
  })

  <div className="ipod-shell" style={shellSurfaceStyle}>
    /* Rim Highlight / Chamfer */
    <div
      className="pointer-events-none absolute inset-0"
      style={Obj.magic({
        "borderRadius": radius,
        "boxShadow": "inset 0 1px 0 rgba(255,255,255,0.7), inset 1px 0 0 rgba(255,255,255,0.2), inset -1px 0 0 rgba(255,255,255,0.2)",
        "position": "absolute",
        "top": "0",
        "left": "0",
        "right": "0",
        "bottom": "0",
      })}
    />
    /* Subsurface grain */
    <div className="texture-grain" />
    <div
      className="pointer-events-none absolute"
      style={Obj.magic({
        "inset": "2.5px",
        "borderRadius": innerRadius,
        "boxShadow": "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -18px 32px rgba(0,0,0,0.04)",
        "position": "absolute",
        "top": "2.5px",
        "left": "2.5px",
        "right": "2.5px",
        "bottom": "2.5px",
      })}
    />
    /* Top-down environmental reflection */
    <div
      style={Obj.magic({
        "position": "absolute",
        "left": "8%",
        "top": "2.5%",
        "height": "38%",
        "width": "84%",
        "borderRadius": "100px",
        "opacity": "0.4",
        "background": "linear-gradient(166deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 22%, rgba(255,255,255,0) 60%)",
      })}
    />
    /* Bottom reflection */
    <div
      style={Obj.magic({
        "position": "absolute",
        "left": "6%",
        "right": "6%",
        "bottom": "5%",
        "height": "24%",
        "borderRadius": "80px",
        "opacity": "0.2",
        "background": "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.12) 100%)",
      })}
    />
    <div className="screen-gasket" style={Obj.magic({"marginTop": "20px"})}>
      <IpodScreen model dispatch />
    </div>
    <div
      style={Obj.magic({
        "position": "relative",
        "zIndex": "10",
        "marginTop": "-8px",
        "flex": "1",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center",
      })}>
      <ClickWheel skinColor dispatch />
    </div>
    /* Extra UI for development */
    <div className="color-picker" style={Obj.magic({"position": "relative", "zIndex": "20"})}>
      <ColorPicker skinColor dispatch />
      <div className="controls">
        <button onClick={_ => dispatch(ToggleIsPlaying)}>
          {React.string(model.interaction.isPlaying ? "Pause" : "Play")}
        </button>
        <button onClick={_ => dispatch(ResetModel)}> {React.string("Reset")} </button>
      </div>
    </div>
  </div>
}
