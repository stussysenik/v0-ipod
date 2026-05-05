// Top-level component — owns FSM state via useReducer
// Matches the (model, event) -> (model, effects) pattern

open Types

@react.component
let make = () => {
  let initialModel = switch Storage.loadModel() {
  | Some(m) => m
  | None => MoonBitBindings.defaultModel()
  }

  let (model, dispatch) = React.useReducer(
    (state: Types.ipodModel, action: Types.ipodEvent) => {
      let result = MoonBitBindings.reduce(state, action)
      Effects.run(result.effects, result.model)
      result.model
    },
    initialModel,
  )

  <IpodDevice model dispatch />
}
