// localStorage persistence - raw JS bindings

let getItem = %raw(`
  function(key) {
    try { return localStorage.getItem(key); } catch(e) { return undefined; }
  }
`)

let setItem = %raw(`
  function(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {}
  }
`)

let loadModel = (): option<Types.ipodModel> => {
  switch (getItem("v0-ipod-metadata"), getItem("v0-ipod-ui-state")) {
  | (None, None) => None
  | _ => None
  }
}

let setMetadata = (_meta: Types.songMetadata): unit => ()

let setUiState = (_pres: Types.presentationState, _inter: Types.interactionState): unit => ()
