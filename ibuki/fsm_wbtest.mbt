///|
/// @test basic transition
test "basic transition" {
  let machine = make_machine()
  let state_a = State::{ tag: "A", data: "" }
  let event_go = Event::{ tag: "GO", data: "" }
  let state_b = State::{ tag: "B", data: "" }

  let transition = on("A", "GO", fn(_s : State, _e : Event) {
    (state_b, [Effect::{ tag: "log", data: "switched" }])
  })

  let machine = add_transition(machine, transition)
  let (next, effects) = dispatch(machine, state_a, event_go)

  assert_eq(next.tag, "B")
  assert_eq(effects.length(), 1)
  assert_eq(effects[0].tag, "log")
  assert_eq(effects[0].data, "switched")
}

///|
/// @test no matching transition
test "no transition match" {
  let machine = make_machine()
  let state_a = State::{ tag: "A", data: "" }
  let event_unknown = Event::{ tag: "UNKNOWN", data: "" }

  let (next, effects) = dispatch(machine, state_a, event_unknown)

  assert_eq(next.tag, "A")
  assert_eq(effects.length(), 0)
}

///|
/// @test guard rejects transition
test "guard rejects" {
  let machine = make_machine()
  let state_a = State::{ tag: "A", data: "" }
  let event_go = Event::{ tag: "GO", data: "" }
  let state_b = State::{ tag: "B", data: "" }

  let transition = on_if("A", "GO", fn(_s : State, _e : Event) { false }, fn(
    _s : State,
    _e : Event,
  ) {
    (state_b, [])
  })

  let machine = add_transition(machine, transition)
  let (next, effects) = dispatch(machine, state_a, event_go)

  assert_eq(next.tag, "A")
  assert_eq(effects.length(), 0)
}

///|
/// @test guard allows transition
test "guard allows" {
  let machine = make_machine()
  let state_a = State::{ tag: "A", data: "" }
  let event_go = Event::{ tag: "GO", data: "" }
  let state_b = State::{ tag: "B", data: "" }

  let transition = on_if("A", "GO", fn(_s : State, _e : Event) { true }, fn(
    _s : State,
    _e : Event,
  ) {
    (state_b, [])
  })

  let machine = add_transition(machine, transition)
  let (next, _effects) = dispatch(machine, state_a, event_go)

  assert_eq(next.tag, "B")
}

///|
/// @test multi-step interpretation
test "multi step" {
  let machine = make_machine()
  let state_a = State::{ tag: "A", data: "" }
  let state_b = State::{ tag: "B", data: "" }
  let state_c = State::{ tag: "C", data: "" }

  let t1 = on("A", "GO", fn(_s : State, _e : Event) { (state_b, []) })
  let t2 = on("B", "GO", fn(_s : State, _e : Event) {
    (state_c, [Effect::{ tag: "done", data: "" }])
  })

  let machine = add_transition(add_transition(machine, t1), t2)

  let (s, _) = dispatch(machine, state_a, Event::{ tag: "GO", data: "" })
  assert_eq(s.tag, "B")

  let (s2, eff2) = dispatch(machine, s, Event::{ tag: "GO", data: "" })
  assert_eq(s2.tag, "C")
  assert_eq(eff2[0].tag, "done")
}
