## Context

`/3d` and the workbench position HUD/controls with viewport-relative coordinates and absolute placement. On a phone these collapse onto the device (overlap) and overflow horizontally (clip). A prior change (`add-mobile-responsive-stability`) tried viewport clamping + per-breakpoint repositioning and still fails (live screenshot, 390px). The deeper goal is an embeddable, white-label element that is deterministic at any parent size — which a viewport-coupled layout can never be.

## Goals / Non-Goals

- Goals:
  - Make device/HUD overlap **structurally impossible**, not visually avoided.
  - Make stage layout resolve against the **parent container**, not the viewport, so the same element is correct at 320px and 900px.
  - Keep all existing control semantics (orbit, angles, shots, panels) — change only their spatial home.
- Non-Goals:
  - No new controls or features ("UI/UX solved, no more features").
  - No change to the 3D camera/orbit math, export pipeline, or state machines.
  - Not building the Lit element or manifest here — this change is only the spatial spine they depend on.

## Decisions

- **Decision: CSS Grid stage with named keep-out zone.** The stage is a grid whose center cell is the device; rails occupy the surrounding cells. Because the device owns its own grid cell, no rail can geometrically occupy it. Overlap is impossible by construction, independent of z-index.
- **Decision: Container queries, not viewport units.** Stage root sets `container-type: inline-size` and a locked `aspect-ratio`. Device, screen, rows, and type use `cqi`/`@container`. No `vw/vh`, no `clamp()` keyed to the viewport for stage layout.
- **Decision: Screen UI lives in the device subtree.** The menu/now-playing DOM moves under the device's screen container so it inherits the device transform and stays registered (kills the 2D offset). In `/3d`, the WebGL device reserves a grid cell sized to its projected silhouette so HUD never shares that cell.
- **Decision: Rails reflow, never float.** Narrow containers switch the grid from columns (rails beside device) to rows (rails below device) via a single `@container` breakpoint. Panels dock into a rail; the floating/draggable model is removed.
- **Decision: Pure geometry helper.** `lib/layout/keepout.ts` exposes pure functions (e.g. `rectsOverlap`, `deviceKeepOutRect`, rail-zone tokens) so the no-overlap invariant is **unit-testable without a browser**.

## Alternatives Considered

- **Viewport clamp + per-breakpoint reposition** (the prior approach): rejected — empirically failed in the screenshot; cannot guarantee non-overlap and is not embeddable (viewport-coupled).
- **JS measurement / ResizeObserver collision avoidance**: rejected — nondeterministic, layout-thrash, races on first paint (the offset is worst at load).
- **z-index layering**: rejected — hiding overlap is not removing it; OEM-grade surfaces must not have anything over the cluster.

## Risks / Trade-offs

- **3D silhouette keep-out is approximate.** The device tilts under orbit, so its projected box changes. → Mitigation: reserve a fixed grid cell sized to the device's *maximum* silhouette at the constrained orbit range; HUD lives strictly outside that cell.
- **Retiring floating panels is recently-shipped work.** → Mitigation: preserve every panel's content/behavior; only its placement container changes. Explicitly approved by user.
- **Container-query browser support.** → Mitigation: container queries are baseline in all evergreen targets (verify via MDN MCP during apply); the device aspect-ratio lock degrades gracefully.

## Migration Plan

1. Land pure geometry helper + unit tests (no UI change).
2. Introduce the grid stage + container contexts behind the existing layout, device first.
3. Move screen UI into the device subtree.
4. Move each control rail into its grid zone; delete floating placement.
5. Verify in-browser last (Chrome DevTools MCP) at 320/390/768/desktop.

Rollback: the stage grid is additive CSS + a container wrapper; reverting the wrapper restores prior placement.

## Open Questions

- None blocking. Exact narrow-container breakpoint (`cq` width) tuned during apply against real content.
