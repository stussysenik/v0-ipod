///|
/// Finite State Machine library (ibuki)
/// Pure, side-effect-free. Effects are returned as data for the host to execute.

///|
/// A state in the FSM.
pub(all) struct State {
  tag : String
  data : String
}

///|
/// An event triggering a transition.
pub(all) struct Event {
  tag : String
  data : String
}

///|
/// A side effect produced by a transition.
pub(all) struct Effect {
  tag : String
  data : String
}

///|
/// A machine holds an ordered list of transition functions.
pub struct Machine {
  transitions : Array[(State, Event) -> (State, Array[Effect])?]
}

///|
/// Create a new empty machine.
pub fn make_machine() -> Machine {
  { transitions: [] }
}

///|
/// Add a transition function to the machine.
pub fn add_transition(
  machine : Machine,
  transition : (State, Event) -> (State, Array[Effect])?,
) -> Machine {
  { transitions: machine.transitions + [transition] }
}

///|
/// Dispatch an event against the current state through the machine.
pub fn dispatch(
  machine : Machine,
  state : State,
  event : Event,
) -> (State, Array[Effect]) {
  for i = 0; i < machine.transitions.length(); i = i + 1 {
    let f = machine.transitions[i]
    match f(state, event) {
      Some((next, effects)) => return (next, effects)
      None => 0 |> ignore
    }
  }
  (state, [])
}

///|
/// Create a simple transition: from `from_tag` on `event_tag`, execute `action`.
pub fn on(
  from_tag : String,
  event_tag : String,
  action : (State, Event) -> (State, Array[Effect]),
) -> (State, Event) -> (State, Array[Effect])? {
  fn(s : State, e : Event) -> (State, Array[Effect])? {
    if s.tag == from_tag && e.tag == event_tag {
      Some(action(s, e))
    } else {
      None
    }
  }
}

///|
/// Create a guarded transition.
pub fn on_if(
  from_tag : String,
  event_tag : String,
  predicate : (State, Event) -> Bool,
  action : (State, Event) -> (State, Array[Effect]),
) -> (State, Event) -> (State, Array[Effect])? {
  fn(s : State, e : Event) -> (State, Array[Effect])? {
    if s.tag == from_tag && e.tag == event_tag && predicate(s, e) {
      Some(action(s, e))
    } else {
      None
    }
  }
}

///|
/// Create a wildcard transition: matches any state on the given event tag.
pub fn on_any(
  event_tag : String,
  action : (State, Event) -> (State, Array[Effect]),
) -> (State, Event) -> (State, Array[Effect])? {
  fn(s : State, e : Event) -> (State, Array[Effect])? {
    if e.tag == event_tag {
      Some(action(s, e))
    } else {
      None
    }
  }
}
