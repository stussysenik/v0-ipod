// Marquee scrolling text animation using MoonBit frame math

open Types

@react.component
let make = (~text, ~containerWidth) => {
  let textRef = React.useRef(Nullable.null)
  let (offset, setOffset) = React.useState(() => 0.0)
  let (needsScroll, setNeedsScroll) = React.useState(() => false)
  let animFrameRef = React.useRef(None)
  let cycleRef = React.useRef(0.0)
  let startRef = React.useRef(0.0)

  React.useEffect0(() => {
    let el = Nullable.toOption(textRef.current)

    switch el {
    | None => ()
    | Some(element) => {
        let textWidth = (Obj.magic(element))["offsetWidth"]
        let textWidthF = Int.toFloat(textWidth)

        let gap = MoonBitBindings.marqueeCycleMs(textWidthF, containerWidth, containerWidth *. 0.25)
        let needed = MoonBitBindings.marqueeNeeded(textWidthF, containerWidth)

        setNeedsScroll(_ => needed)

        if needed {
          cycleRef.current = gap
          let start = %raw(`Date.now()`)
          startRef.current = start

          let rec animate = () => {
            let elapsed = Int.toFloat(%raw(`Date.now()`) - start)
            let framePos = MoonBitBindings.marqueeFrame(elapsed, cycleRef.current)
            setOffset(_ => framePos)
            let id = %raw(`requestAnimationFrame(animate)`)
            animFrameRef.current = Some(id)
          }

          let id = %raw(`requestAnimationFrame(animate)`)
          animFrameRef.current = Some(id)
        }
      }
    }

    Some(() => {
      switch animFrameRef.current {
      | Some(id) => ignore(%raw(`cancelAnimationFrame(id)`))
      | None => ()
      }
    })
  })

  if needsScroll {
    <div style={Obj.magic({"overflow": "hidden"})}>
      <div
        ref={ReactDOM.Ref.domRef(textRef)}
        style={Obj.magic({"transform": "translateX(" ++ Float.toString(offset) ++ "px)", "whiteSpace": "nowrap"})}>
        {React.string(text)}
        <span style={Obj.magic({"marginLeft": "60px"})}>
          {React.string(text)}
        </span>
      </div>
    </div>
  } else {
    <span>{React.string(text)}</span>
  }
}
