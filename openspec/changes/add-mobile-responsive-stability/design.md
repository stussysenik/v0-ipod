## Context

The workbench renders the iPod at native pixel dimensions inside a wrapper that applies a single CSS `transform: scale(previewScale)` (so export framing stays pixel-exact). `previewScale` is recomputed from `window.innerWidth/innerHeight` on every `resize`/`orientationchange`. Because a portrait phone makes the device **height-constrained** only with a thin margin, the scale tracks `innerHeight` almost 1:1 — and mobile browsers change `innerHeight` constantly (URL bar, soft keyboard, Android viewport resize). The result is the observed "collapse/jump".

Reproduced (390px-wide mobile emulation):
- `innerH 844` → scale `0.809`, shell `280×469`
- `innerH 440` → scale `0.438`, shell `152×254`

The `/3d` route is a separate full-screen layout whose floating controls are positioned with assumptions that only hold in portrait; in landscape they overflow the short axis and the narrow-tall control widths overflow horizontally.

## Goals / Non-Goals

- **Goals**
  - Device scale on a portrait phone is *stable* against viewport-height changes (no rescale on URL bar / keyboard).
  - Every control is reachable at every supported viewport (no off-screen clipping, scroll where needed).
  - `/3d` is fully usable in both orientations; the model is never overlapped or clipped by chrome.
  - Meet a mobile a11y baseline (zoom, reduced-motion, 44px targets, no iOS input-zoom).
- **Non-Goals**
  - No change to export pixel-exactness or the export pipeline.
  - No change to the 3D camera control *semantics* (`getCameraPose`/`setCameraGoal`); only their on-screen layout.
  - No redesign of desktop/tablet layouts beyond what falls out of the shared code.

## Decisions

- **Decision: Portrait width-lock for the workbench device.** When `isCompactToolbox` (viewport < 768) AND portrait (`height >= width`), `previewScale = min(widthScale, 1)` — independent of height. The container scrolls vertically if the device exceeds the viewport, rather than shrinking it.
  - *Why:* On a real portrait phone the width-fit device already fits the height with margin, so the common case is visually identical but now immune to `innerHeight` oscillation. The pathological case (keyboard open) keeps the screen visible and lets the wheel scroll under the keyboard — which is the desired editing posture.
  - *Alternatives considered:* (a) Debounce/quantize the scale — reduces jitter but still collapses on keyboard. (b) Use `100dvh` CSS sizing only — loses export pixel-exactness. (c) `visualViewport`-based height — more correct but more code and platform-variant; width-lock is simpler and sufficient.
- **Decision: Landscape keeps fit-to-both.** A tall device in a short landscape window must shrink to fit the short axis; width-lock there would force a huge scroll. Landscape is detected as `width > height`.
- **Decision: Bounded, scrollable compact toolbox.** The compact panel gets `max-height` tied to the safe viewport with `overflow-y-auto`, so it never overflows the screen.
- **Decision: `/3d` controls are viewport-bounded and orientation-aware.** Control rows get `max-width: 100vw` with internal scroll/wrap; in landscape the orbit pad and tab bar reflow (e.g., side-docked / compacted) so they don't stack over the model. Driven by the existing matchMedia/orientation signals.
- **Decision: a11y baseline is additive and low-risk.** Re-enable zoom in the viewport export; add a global reduced-motion rule that also neutralizes `animate-*`/marquee; bump specific small targets to ≥44px; set inputs to ≥16px. The wheel already sets `touch-action: none`, so re-enabling page zoom will not hijack wheel drags.

## Risks / Trade-offs

- **Risk: width-locked device overflows vertically on very short portrait windows.** → Mitigation: container scroll + `my-auto` centering so it centers when it fits and scrolls when it doesn't (no clipped ends).
- **Risk: enabling zoom lets users zoom the capture surface mid-export.** → Mitigation: export already runs in a controlled capture path; zoom affects only the live viewport, not the exported bitmap.
- **Risk: `/3d` landscape reflow regresses portrait.** → Mitigation: changes gated behind orientation/`matchMedia`; portrait layout untouched. Verified at both `390×844` and `844×390`.

## Migration Plan

Pure front-end behavior change; no data/state migration. Land behind the existing compact/orientation signals. Rollback = revert the workbench scale + layout edits.

## Open Questions

- Should the workbench also offer a "fit height" toggle for users who prefer the whole device visible in landscape portrait-locked mode? (Deferred — not demo-critical.)
