open Types

@react.component
let make = (~model, ~dispatch) => {
  let meta = model.metadata
  let inter = model.interaction
  let pb = model.playback

  // Dimensions for Classic 2008 Silver Screen
  let frameWidth = "296px"
  let frameHeight = "222px"

  let formatTime = (secs: float): string => {
    let m = Float.toInt(secs /. 60.0)
    let s = Float.toInt(mod_float(secs, 60.0))
    let sStr = if s < 10 {"0" ++ Int.toString(s)} else {Int.toString(s)}
    Int.toString(m) ++ ":" ++ sStr
  }

  let batteryPct = Float.toInt(inter.batteryLevel *. 100.0)
  let batteryBars = Float.toInt(inter.batteryLevel *. 5.0)
  let bars = Belt.Array.reduce(Belt.Array.makeBy(batteryBars, _ => "|"), "", (a, b) => a ++ b)

  let progressPct = if pb.duration > 0.0 {pb.currentTime /. pb.duration *. 100.0} else {0.0}

  <div
    className="screen"
    style={Obj.magic({"width": frameWidth, "height": frameHeight, "backgroundColor": "#fff"})}>
    <div className="status-bar">
      <span> {React.string("Now Playing")} </span>
      <span
        style={Obj.magic({
          "color": inter.batteryLevel > 0.2 ? "#4CAF50" : "#f44336",
          "fontFamily": "monospace",
        })}>
        {React.string(bars ++ " " ++ Int.toString(batteryPct) ++ "%")}
      </span>
    </div>
    <div className="now-playing-content">
      <div className="artwork-column">
        {meta.artwork == ""
          ? <div className="artwork-placeholder"> {React.string("🎵")} </div>
          : <img className="artwork-img" src=meta.artwork alt="Album Art" />}
      </div>
      <div className="track-info">
        <div className="song-title">
          <MarqueeText text=meta.title containerWidth=130.0 />
        </div>
        <div className="song-artist">
          <Editors field="artist" value=meta.artist dispatch event={v => UpdateArtist(v)} />
        </div>
        <div className="song-album">
          <Editors field="album" value=meta.album dispatch event={v => UpdateAlbum(v)} />
        </div>
        <div className="meta-row">
          {React.string(
            "Track " ++
            Int.toString(meta.trackNumber) ++
            " of " ++
            Int.toString(meta.totalTracks),
          )}
        </div>
      </div>
    </div>
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={Obj.magic({"width": Float.toString(progressPct) ++ "%"})}
        />
      </div>
      <div className="time-row">
        <span> {React.string(formatTime(pb.currentTime))} </span>
        <span> {React.string("-" ++ formatTime(pb.duration -. pb.currentTime))} </span>
      </div>
    </div>
    /* Glass Overlay */
    /* Primary surface reflection */
    <div
      className="pointer-events-none absolute"
      style={Obj.magic({
        "position": "absolute",
        "inset": "0",
        "background": "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)",
      })}
    />
    /* Soft top-left window reflection */
    <div
      className="pointer-events-none absolute"
      style={Obj.magic({
        "position": "absolute",
        "left": "5%",
        "top": "4%",
        "height": "40%",
        "width": "50%",
        "borderRadius": "20px",
        "opacity": "0.2",
        "background": "linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0) 65%)",
      })}
    />
    /* Internal "LCD depth" vignette */
    <div
      className="pointer-events-none absolute"
      style={Obj.magic({
        "position": "absolute",
        "inset": "0",
        "boxShadow": "inset 0 1px 4px rgba(0,0,0,0.15)",
      })}
    />
  </div>
}
