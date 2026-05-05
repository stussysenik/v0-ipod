// Apple iPod finishes color picker — swatch grid + custom hex input

open Types

@react.component
let make = (~skinColor, ~dispatch) => {
  let finishes = React.useMemo(() => MoonBitBindings.authenticFinishes(), [])
  let (customHex, setCustomHex) = React.useState(() => skinColor)

  <div className="color-picker">
    <div className="swatch-grid">
      {Belt.Array.mapWithIndex(finishes, (i, f) => {
        let isActive = f.hex == skinColor
        <div
          key={Int.toString(i)}
          className={"swatch" ++ (isActive ? " swatch-active" : "")}
          style={Obj.magic({"backgroundColor": f.hex})}
          title={f.label ++ " " ++ f.hex}
          onClick={_ => dispatch(SetSkinColor(f.hex))}
        />
      })->React.array}
    </div>
    <div className="custom-color">
      <input
        type_="text"
        value=customHex
        placeholder="#000000"
        onChange={e => {
          let target = ReactEvent.Form.target(e)
          setCustomHex(_ => target["value"])
        }}
        onBlur={_ => dispatch(SetSkinColor(customHex))}
        onKeyDown={e => {
          if ReactEvent.Keyboard.key(e) == "Enter" {
            dispatch(SetSkinColor(customHex))
          }
        }}
      />
    </div>
  </div>
}
