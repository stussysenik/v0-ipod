// Side-effect executor — runs effect strings returned by MoonBit

let run = (effects: array<string>, _model: Types.ipodModel): unit => {
  Belt.Array.forEach(effects, e => {
    switch e {
    | "PERSIST_METADATA" => Storage.setMetadata(_model.metadata)
    | "PERSIST_UI_STATE" =>
      Storage.setUiState(_model.presentation, _model.interaction)
    | _ => () // Unknown effects silently ignored
    }
  })
}
