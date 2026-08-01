# Tasks — add-workspace-storage-registry

Read `proposal.md` first. The inventory is recorded there and in this file — **do not re-derive
it.** Task 1 lists the original keys; the registry has since grown to **24 declared keys** —
task 1's table plus `ipodStudioDefaultTheme`, `ipodStudioMotions`, and `ipodWorkspaceRestore`
(§7.2). The registry module (`lib/workspace-storage.ts`) is the source of truth.

The rule that shapes this change: **a registry without a gate rots.** Task 6 is not a nicety;
without it the registry is accurate for one month and misleading afterwards, which is worse
than no registry at all.

- [x] 1. `lib/workspace-storage.ts` — declare all 22 keys (21 original + `ipodStudioMotions` from
       the motion shelf + `ipodStudioDefaultTheme` from studio-themes). Inventory as measured on
       2026-07-29, with proposed class:

  | Key | Declared in | Class |
  |---|---|---|
  | `ipodStudioThemes` | `lib/studio-themes.ts:106` | settings |
  | `ipod-theme` | `hooks/use-ipod-theme.tsx:53` | settings |
  | `ipod-3d-camera.v1` | `lib/studio-camera-store.ts:13` | content |
  | `ipod-3d-locked-pose` | `lib/studio-camera-store.ts:15` | legacy |
  | `ipod-3d-studio-shots` | `lib/studio-camera-store.ts:16` | legacy |
  | `ipod-3d-camera-presets` | `lib/studio-camera-store.ts:17` | legacy |
  | `ipodSnapshotMetadata.v2` | `lib/ipod-state/storage.ts:45` | content |
  | `ipodSnapshotUiState` | `lib/ipod-state/storage.ts:46` | content |
  | `ipodSnapshotSongSnapshot` | `lib/ipod-state/storage.ts:47` | content |
  | `ipodSnapshotExportCounter` | `lib/ipod-state/storage.ts:48` | cache |
  | `ipodSnapshotLastBattery` | `lib/ipod-state/storage.ts:49` | cache |
  | `ipodBatteryBirth` | `lib/ipod-state/storage.ts:53` | cache |
  | `ipodSnapshotStudio` | `lib/ipod-state/storage.ts:56` | content |
  | `ipodSnapshotPanelLayout` | `lib/ipod-state/storage.ts:59` | content |
  | `ipodSnapshotCaseCustomColors` | `lib/ipod-state/storage.ts:63` | settings |
  | `ipodSnapshotBgCustomColors` | `lib/ipod-state/storage.ts:63` | settings |
  | `ipodSnapshotRingCustomColors` | `lib/ipod-state/storage.ts:63` | settings |
  | `ipodSnapshotCenterCustomColors` | `lib/ipod-state/storage.ts:63` | settings |
  | `ipod-3d-gesture-coached` | `components/ipod/scenes/ipod-3d-coach-hint.tsx:5` | cache |
  | `ipodSnapshotGreyFamily` | `components/ipod/editors/grey-palette-picker.tsx:57` | settings |
  | `ipodSnapshotDeployVersion` | `components/service-worker-cleanup.tsx:47` | cache |

  - [x] 1.1 **Key strings are preserved verbatim.** Renaming a key silently discards every
        existing user's data. The three naming conventions stay; the registry records the
        inconsistency rather than fixing it. A rename is a migration, and it is not this change.
  - [x] 1.2 Class is a closed union (`as const`), not a string. `STORAGE_CLASSES` drives the type.
  - [x] 1.3 Test: no duplicate key string; every entry has owner and class.
- [x] 2. Move each literal into the registry and import it at all call sites (8 owner files
      verified by audit — `lib/`, `components/`, `hooks/`). Existing suite passes before and after.
- [x] 3. `resetWorkspace(scope)`:
  - [x] 3.1 Clears `content` + `cache`, sweeps `legacy`, clears `settings` only when the scope
        asks. Returns the cleared key list.
  - [x] 3.2 Test against a seeded storage double: every content/cache key gone, settings intact
        under the default scope, and the returned list matches what was removed.
  - [x] 3.3 Test the wide scope clears settings too.
- [x] 4. Legacy sweep in `lib/studio-camera-store.ts` — removes each legacy key after its value
      migrates. Tests present and absent cases; absence does not throw.
- [x] 5. `lib/state-fixtures.ts` — named state fixtures: `fresh`, `noir`, one per hardware preset,
      and `tuned-rig` (Designer Dark with key/fill/rim intensities shifted). Declared as data in
      `STATE_FIXTURES` array.
  - [ ] 5.1 A state-matrix story renders every entry. It reads the array; it does not enumerate
        states itself. (Storybook environment — deferred to story pass.)
  - [x] 5.2 Test: `fresh` builds a model without touching localStorage. Every fixture builds
        without error.
  - [x] 5.3 Test that the matrix covers the list — test iterates `STATE_FIXTURES` rather than
        hardcoding entries, so adding a fixture extends coverage automatically.
- [x] 6. **The gate.** Unit test scanning `lib/`, `components/`, `hooks/`, `app/` for browser
      storage key literals; fails on any key the registry does not declare, naming file and key.
  - [x] 6.1 Prove it fails: self-test fixture confirms `isDeclaredKey("__test_undeclared_key__")`
        is `false`. The gate is observed failing.
  - [x] 6.2 The registry module itself is the only exemption.
- [x] 7. Reset command on the surface. Confirms before clearing, and the confirmation names the
      scope. Command label ≤2 words; icon carries a text label.
  - [x] 7.1 `components/ipod/scenes/ipod-3d-workspace-cockpit.tsx` — cockpit 09 "Workspace" on
        /3d. Reads storage itself: the Stored row is `storedWorkspaceKeys().length` and the
        confirmation names `pendingReset(scope).length` — the same filter the reset walks, so
        the number shown and the number cleared cannot disagree. Two-step confirm in place of a
        dialog: the command is replaced by the scope + Clear/Cancel. Reset / Reset all / Restore
        buttons each carry a glyph + text label. Mounted in the stage with
        `rehydrateFromStorage` (cancel the pending debounced write, then `RESTORE_MODEL` from
        what storage now holds — fresh boot when empty, so the default look shows without a
        reload) and `watch={model}` so the Stored row re-reads once persistence settles.
  - [x] 7.2 A reset is a version, not an erasure: `resetWorkspace` writes a restore point to
        the declared `restore`-class key `ipodWorkspaceRestore` before the first key is
        removed; a capture that cannot be written throws and clears nothing. `restoreWorkspace`
        reinstates the exact image (a declared key absent from the capture is removed) and
        nests points, so consecutive resets walk back through every version. Spec delta gained
        the `restore` class and "A reset is reversible" (5 scenarios); tests in
        `lib/workspace-storage.test.ts` cover capture, exact restore, stowaway removal,
        two-reset chains, empty-reset writes no point, and quota abort.
- [x] 8. Gates: `pnpm vitest run --project unit` (1119/1119, was 1098), `pnpm validate` exit 0
       (board ✓ lint ✓ tsc ✓), `openspec validate add-workspace-storage-registry --strict
       --no-interactive` (valid). Registry now declares 24 keys (23 + `ipodWorkspaceRestore`).
- [ ] 9. **USER:** visual review — the surface gains a reset command and its confirmation.
