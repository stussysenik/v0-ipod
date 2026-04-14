# Component Audit — Figma Dev-Mode Bridge

Source of truth for satori compatibility. Every in-scope component is classified
as `satori`, `raster`, or `exclude`. This file is referenced by:

- `parameters.compat` on every CSF3 story (`stories/*.stories.tsx`)
- The HMR render loop (`scripts/render-story.ts` skips `exclude`, warns on `raster`)
- CI story coverage check (`scripts/check-story-coverage.ts`)
- The `Not In Scope` Storybook docs page (`stories/NotInScope.mdx`)

## In Scope — `satori`

Components that render cleanly through satori's vector pipeline. These
participate in Phase 2 HMR and are pushed to Figma as editable vector frames.

| Component                                   | File                                       | Notes                                                               |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `ipod-device-shell`                          | `components/ipod/ipod-device-shell.tsx`    | Nested `linear-gradient` stacks resolve cleanly through satori.     |
| `ipod-screen`                                | `components/ipod/ipod-screen.tsx`          | Requires flattened artwork; `ImageUpload` is swapped for an `img`.  |
| `click-wheel`                                | `components/ipod/click-wheel.tsx`          | Pointer handlers are no-ops in satori; visual output is fine.       |
| `editable-text`                              | `components/ipod/editable-text.tsx`        | Input variant is excluded; display variant renders.                 |
| `editable-duration`                          | `components/ipod/editable-duration.tsx`    | Static time string, vector text.                                    |
| `editable-time`                              | `components/ipod/editable-time.tsx`        | Same.                                                               |
| `editable-track-number`                      | `components/ipod/editable-track-number.tsx`| Static text. Editing state excluded.                                |
| `progress-bar`                               | `components/ipod/progress-bar.tsx`         | Fill gradient renders as a linear-gradient.                         |
| `screen-battery`                             | `components/ipod/screen-battery.tsx`       | Pure geometry.                                                      |
| `star-rating`                                | `components/ipod/star-rating.tsx`          | Uses unicode `★`; renders as text nodes.                            |
| `marquee-text`                               | `components/ui/marquee-text.tsx`           | Animation is removed by the export pipeline; static phase renders.  |
| `icon-button`                                | `components/ui/icon-button.tsx`            | `lucide-react` icons ship as SVG; satori preserves paths.           |
| `carbon-checkbox`                            | `components/ui/carbon-checkbox.tsx`        | Radix root renders as a `div` in static satori output.              |
| `checkbox`                                   | `components/ui/checkbox.tsx`               | Same.                                                               |
| `switch`                                     | `components/ui/switch.tsx`                 | Same.                                                               |
| `theme-toggle`                               | `components/ui/theme-toggle.tsx`           | Same, static variant only.                                          |
| `hex-color-input`                            | `components/ipod/hex-color-input.tsx`      | Display state only; editing input excluded.                         |
| `grey-palette-picker`                        | `components/ipod/grey-palette-picker.tsx`  | OKLCH ramp converts to hex prior to render.                         |
| `build-version-badge`                        | `components/build-version-badge.tsx`       | Fixed-position visual badge.                                        |
| `revision-spec-card`                         | `components/ipod/revision-spec-card.tsx`   | Static card with text.                                              |
| `Now Playing` composition                    | `stories/now-playing.stories.tsx`          | Shell + screen + wheel assembled into the full device surface.      |

## In Scope — `raster`

Reserved for components that have a meaningful visual but cannot be rendered by
satori without visual regression. These are pushed into Figma during Phase 1 as
rasterized frames **only** and are excluded from the Phase 2 HMR loop.

_None at this time._ Reserved bucket. Any future component that needs
`backdrop-filter`, SVG filters, or `mix-blend-mode` should land here, not in
`satori`.

## Out of Scope — `exclude`

These components cannot be represented in Figma without violating the
vector-first rule. They are documented on the `Not In Scope` Storybook docs
page and on the canonical Figma file's cover.

| Component                  | File                                    | Reason                                                                   |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `three-d-ipod`             | `components/three/three-d-ipod.tsx`     | `@react-three/fiber`. Three.js cannot be serialized to SVG.              |
| `post-processing`          | `components/three/post-processing.tsx`  | Three.js post-processing pass; no vector representation.                 |
| `ascii-ipod`               | `components/ipod/ascii-ipod.tsx`        | Character-grid render that loses meaning when vectorized.                |
| `fixed-editor`             | `components/ipod/fixed-editor.tsx`      | Modal input surface; behavioural, not visual.                            |
| `gif-preview-modal`        | `components/ipod/gif-preview-modal.tsx` | Modal host for a runtime GIF blob.                                       |
| `framed-export-stage`      | `components/ipod/framed-export-stage.tsx` | Export staging container; not a design surface.                        |
| `service-worker-cleanup`   | `components/service-worker-cleanup.tsx` | No DOM output; lifecycle-only.                                           |
| `image-upload`             | `components/ipod/image-upload.tsx`      | File input UI; behaviour, not appearance.                                |

## Audit Process

1. Every in-scope component has a corresponding story under `stories/` with
   `parameters.compat` set to one of the three values above.
2. `scripts/check-story-coverage.ts` fails CI if an in-scope component (by path
   match against the tables above) lacks a story.
3. Any component moved between classifications requires an update to this file,
   the story, the Code Connect mapping, and the operator runbook.
4. The classification is advisory for tooling. Authoritative truth is the
   `parameters.compat` value on the story module. The two must never disagree;
   `check-story-coverage.ts` enforces this.
