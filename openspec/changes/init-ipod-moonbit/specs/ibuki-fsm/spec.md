## ADDED Requirements

### Requirement: FSM Core Types
The ibuki library SHALL provide generic finite state machine types including `State`, `Event`,
`Transition`, `Guard`, `Action`, and `Interpreter`.

#### Scenario: Define a simple state machine
- **WHEN** a developer defines States `A` and `B`, Event `Go`, and a Transition from `A` to `B` on `Go`
- **THEN** the `Machine` type compiles with `Map[State, List[Transition]]` structure

#### Scenario: Transition with guard
- **WHEN** a Transition includes a `Guard` predicate
- **THEN** the guard receives the current model and event payload and returns `Bool`

#### Scenario: Transition with action
- **WHEN** a Transition includes an `Action` function
- **THEN** the action receives the model and returns a new model

### Requirement: Machine Dispatch
The library SHALL provide a `dispatch` function that evaluates the current state against a
machine definition to find a matching transition.

#### Scenario: Successful dispatch
- **WHEN** `dispatch(machine, state_A, event_Go)` is called with a matching transition
- **THEN** the function returns state_B and the list of effects from the transition

#### Scenario: No matching transition
- **WHEN** `dispatch(machine, state_A, event_Stay)` is called without a matching transition
- **THEN** the function returns the same state with an empty effects list

#### Scenario: Guard rejects transition
- **WHEN** a matching transition exists but its guard returns `false`
- **THEN** the function returns the same state with an empty effects list

### Requirement: Interpreter Loop
The library SHALL provide an `interpreter` function that processes a sequence of events against
a machine, accumulating state changes and effects.

#### Scenario: Multi-step interpretation
- **WHEN** `interpret(machine, initial_state, [event_Go, event_Back])` processes two events
- **THEN** the final state reflects both transitions and all effects are collected

### Requirement: Effects as Data
The machine SHALL represent side effects as data values returned from dispatch, never executed
inside the FSM itself.

#### Scenario: Effect emission
- **WHEN** a transition produces effects `[persist_metadata, play_click]`
- **THEN** these effects are returned as a list of `Effect` values from dispatch

#### Scenario: No impure execution
- **WHEN** any FSM library function is called
- **THEN** no I/O, DOM access, or system calls are performed within MoonBit code
