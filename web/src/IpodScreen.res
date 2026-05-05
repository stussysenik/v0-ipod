// iPod screen — now-playing view, status bar, progress, time, rating

open Types

@react.component
let make = (~model, ~dispatch) => {
  let meta = model.metadata
  let inter = model.interaction
  let pb = model.playback

  let formatTime = (secs: float): string => {
    let m = Float.toInt(secs /. 60.0)
    let s = Float.toInt(mod_float(secs, 60.0))
    let sStr = if s < 10 {"0" ++ Int.toString(s)} else {Int.toString(s)}
    Int.toString(m) ++ ":" ++ sStr
  }

  let batteryPct = Float.toInt(inter.batteryLevel *. 100.0)
  let batteryBars = Float.toInt(inter.batteryLevel *. 5.0)
  let batteryColor = batteryPct > 20 ? "#4CAF50" : "#f44336"
  let bars = Belt.Array.reduce(Belt.Array.makeBy(batteryBars, _ => "|"), "", (a, b) => a ++ b)

  let progressPct = if pb.duration > 0.0 {pb.currentTime /. pb.duration *. 100.0} else {0.0}

  let stars = Belt.Array.reduce(Belt.Array.makeBy(meta.rating, _ => "*"), "", (a, b) => a ++ b)

  <div className="screen">
    <div className="status-bar">
      <span>{React.string("Now Playing")}</span>
      <span className="battery" style={Obj.magic({"color": batteryColor})}>
        {React.string(bars ++ " " ++ Int.toString(batteryPct) ++ "%")}
      </span>
    </div>
    <div className="now-playing">
      {meta.artwork == ""
        ? <div className="artwork-placeholder">{React.string("🎵")}</div>
        : <img className="artwork-img" src=meta.artwork alt="Album Art" />
      }
      <div className="song-title">
        <Editors field="title" value=meta.title dispatch event={v => UpdateTitle(v)} />
      </div>
      <div className="song-artist">
        <Editors field="artist" value=meta.artist dispatch event={v => UpdateArtist(v)} />
      </div>
      <div className="song-album">
        <Editors field="album" value=meta.album dispatch event={v => UpdateAlbum(v)} />
      </div>
      <div className="meta-row">
        {React.string(stars ++ " " ++ Int.toString(meta.rating) ++ "/5 - Track " ++ Int.toString(meta.trackNumber) ++ " of " ++ Int.toString(meta.totalTracks))}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={Obj.magic({"width": Float.toString(progressPct) ++ "%"})} />
      </div>
      <div className="time-row">
        <span>{React.string(formatTime(pb.currentTime))}</span>
        <span>{React.string("-" ++ formatTime(pb.duration -. pb.currentTime))}</span>
      </div>
    </div>
  </div>
}
