open Types

@react.component
let make = (~skinColor, ~dispatch) => {
  let finishes = React.useMemo0(() => MoonBitBindings.authenticFinishes())

  <div className="color-picker">
    <div className="swatch-grid">
      {Belt.Array.map(finishes, f => {
        let active = f.hex == skinColor
        <div
          key=f.hex
          title=f.label
          className={active ? "swatch swatch-active" : "swatch"}
          style={Obj.magic({"backgroundColor": f.hex})}
          onClick={_ => dispatch(SetSkinColor(f.hex))}
        />
      })->React.array}
    </div>
  </div>
}
