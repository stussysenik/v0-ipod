// iPod Classic physical shell

open Types

@react.component
let make = (~model, ~dispatch) => {
  let skinColor = model.presentation.skinColor

  <div className="ipod" style={Obj.magic({"backgroundColor": skinColor})->Obj.magic}>
    <div className="screen-frame">
      <IpodScreen model dispatch />
    </div>
    <ClickWheel skinColor dispatch />
    <div className="controls">
      <button onClick={_ => dispatch(ToggleIsPlaying)}>
        {React.string(model.interaction.isPlaying ? "Pause" : "Play")}
      </button>
      <button onClick={_ => dispatch(ResetModel)}>
        {React.string("Reset")}
      </button>
    </div>
    <ColorPicker skinColor dispatch />
    <div className="info-bar">
      {React.string("Powered by MoonBit")}
    </div>
  </div>
}
