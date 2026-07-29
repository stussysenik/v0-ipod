# Change: Every persisted key is declared in one registry

## Why

The app writes **21 localStorage keys across 7 files**, and nothing anywhere knows that.

Seventeen are declared in three storage modules:

| Module | Keys |
|---|---|
| `lib/studio-themes.ts` | `ipodStudioThemes` |
| `lib/studio-camera-store.ts` | `ipod-3d-camera.v1`, plus three legacy keys read but never swept |
| `lib/ipod-state/storage.ts` | eight named keys, plus four `SAVED_COLORS_KEYS` entries |

Four more are declared inline in components and hooks, outside any storage module:
`ipod-3d-gesture-coached`, `ipodSnapshotGreyFamily`, `ipodSnapshotDeployVersion`, `ipod-theme`.

They follow three different naming conventions — `ipodSnapshot*`, `ipod-3d-*`, `ipod-theme` —
which is the visible symptom of there being no place where a key is decided.

Four consequences, all felt:

- **There is no reset.** Returning to a factory state requires opening devtools and clearing
  keys by hand. A product whose proposition is *dial in a look* has no way back to zero.
- **A fresh boot cannot be tested.** "First-load visitor" is a ratified scenario in
  `3d-studio-presentation`, but no test can construct that state, because no list says what
  must be absent for a boot to be fresh.
- **Legacy keys are read and never removed.** `lib/studio-camera-store.ts` migrates three
  old keys on read and leaves them in storage forever. Every user carries dead data.
- **A new key costs nothing to add and is invisible once added.** That is why there are 21.

The fix is a registry plus the gate that keeps it honest. A registry alone rots — within a
month someone adds a key in a component and it is 22 again, undeclared. So the registry ships
with a test that fails on any `localStorage` key literal outside it. This is the same shape as
`board:check`: derived, then enforced, so staying correct is not a matter of remembering.

## What Changes

- Add `lib/workspace-storage.ts` — one declaration per persisted key, each carrying its key
  string, the module that owns it, and its **class**:
  - `settings` — user intent that survives a reset (theme choice, saved themes)
  - `content` — the current document (snapshot, studio state, panel layout)
  - `cache` — derived or advisory (coach-hint seen, deploy version, battery birth)
  - `legacy` — migrated on read, swept on write
- Every existing key moves its literal into the registry. The owning modules import from it,
  so there is exactly one place a key string is written.
- `resetWorkspace(scope)` — clears `content` and `cache`, optionally `settings`, always sweeps
  `legacy`. Returns the list of keys it cleared, so the caller can state what happened.
- A **named-state fixture set** — `fresh`, `noir`, one per hardware preset, and one tuned-rig
  state — declared as data, so tests and a Storybook story render the device across every
  state from one list rather than by hand.
- Gate: a unit test scans `lib/`, `components/`, `hooks/` and `app/` for `localStorage`
  key literals and fails on any key the registry does not declare.

## Impact

- Affected specs: `workspace-storage-registry` (ADDED). No existing capability owns "every key
  the app writes", so this is an addition rather than a delta. `snapshot-state` keeps its
  contract untouched — it governs the snapshot's shape, not the key it lives under.
- Affected code: `lib/workspace-storage.ts` (new), `lib/ipod-state/storage.ts`,
  `lib/studio-camera-store.ts`, `lib/studio-themes.ts`, `hooks/use-ipod-theme.tsx`,
  `components/ipod/scenes/ipod-3d-coach-hint.tsx`,
  `components/ipod/editors/grey-palette-picker.tsx`, `components/service-worker-cleanup.tsx`.
- Depends on: nothing. Pairs naturally with `update-studio-theme-authoring`, which adds the
  22nd key (`defaultThemeId`) — if that change lands first, its key is declared here.
- **Not the state gallery.** `add-community-state-gallery` (act 5) is about states a person
  shares. The fixture set here is a developer surface for seeing every state the device can be
  in. The registry is the precondition act 5 needs; it is not act 5.
- Reset is a destructive command. The surface gates it behind confirmation, and the
  confirmation names what will be cleared.
