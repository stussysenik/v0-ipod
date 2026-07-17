# Design — render-fidelity launch gate

## Root cause: the two-renderer seam

The live screen is DOM (`<Html transform>`) so Now Playing stays inline-editable; the
export bakes the DOM onto an LCD mesh so captures are WebGL-truthful. That split is
correct and stays. The defect is that the two layers receive *different optical
treatments*: the WebGL side has glass, bezel, and lighting; the DOM side has none of
them, and it composites on top. Every artifact in the screenshot (sticker flatness,
green edge haze) is this seam made visible.

### Options considered

- **A — always-baked WebGL screen.** Render the DOM to texture every frame. Unifies
  optics fully, but kills inline editability (or requires a costly per-interaction
  re-bake) and re-introduces the crawl the bake guard exists to prevent. Rejected.
- **B — matched treatments on the DOM layer (chosen).** Keep the DOM overlay, and give
  it the same optical events the WebGL layer would produce, computed from the same
  state: an inner-shadow recess ring (CSS, constant), and a glass sweep as a CSS
  gradient overlay whose angle/position is a pure function of camera azimuth/elevation
  — the same inputs the WebGL glass plane sees. Deterministic, cheap, testable as a
  pure function (angle in → gradient params out). The WebGL glass plane keeps serving
  the export path, with its params matched to the CSS sweep so live ≈ export.
- **C — hide the seam only.** Clip the WebGL glass/bezel speculars behind the DOM
  rect (fix the green haze) and do nothing else. Necessary but not sufficient — the
  screen still reads pasted. Subsumed by B.

## Shaped light: compositions as data, dials stay sovereign

Follow the existing pattern exactly: `studio-camera-poses.ts` made camera framing
declarative data; `POSE_LIGHT_COMPOSITIONS` does the same for softbox arrangements.
A composition is a named record (softbox positions/scales/intensities shaped to draw
specific highlights: chamfer rake, back-steel horizon card, glass top strip). The
rendered rig remains `pure fn(dials, pose)` — a composition is the pose-keyed default
the dials start from; user dial edits still override (the lighting/color decoupling
from `lighting_color_decoupling` is preserved, never re-coupled).

Why reflection-space design: at product-render scale, realism is dominated by the
*shape of what the surfaces reflect*, not lumens. A long thin Lightformer aligned to
an edge produces the continuous highlight that describes the fillet; a blurry blob
produces the smeared nothing in the screenshot. This is the transferable lesson from
the Blender/Millgate school, encoded as data instead of artist hours.

## Dark-finish response: a table, not a global knob

Raising `envMapIntensity` globally would blow out light finishes. Instead a
finish-aware material table maps finish luminance → per-part params (face, wheel,
ring, glyphs), guaranteeing (a) a floor of env response so no finish reads as void,
and (b) monotonic separation between wheel and face speculars. Pure data, unit-tested
without a GPU.

## Research charter — pre-registered questions, not a survey

A broad literature review is explicitly out of scope: the project's bottleneck is
application, not knowledge. Research happens **attached to the task that consumes
it**, scoped to questions whose answer changes a decision:

1. **Measured material values** (consumed by task 3.1): published IOR/roughness
   ranges for polycarbonate, acrylic, and brushed/polished stainless (Filament /
   glTF material references), so the finish table starts from measured reality
   instead of eyeballed params.
2. **Perceptibility tolerance** (consumed by task 0.1): the ΔE2000 threshold to
   assert hex fidelity against (industry "imperceptible" is ΔE ≈ 1–2; pick and
   document one).
3. **Specular AA tactic** (consumed by task 5.1, only if banding survives the
   shaped env): roughness floors vs. tessellation vs. env resolution for thin
   fillets in WebGL.

The artist half of the loop is not literature at all: a **reference board of real
iPod classic studio photography** (Apple marketing shots, high-quality teardown
photos) is the ground-truth target the golden matrix is scored against. Taste is
trained by comparison against the real object, not by reading.

## Verification split

GPU truth can't run in this environment (Playwright `/3d` canvas limitation). So:
pure-data tests (composition selection, finish table, sweep-gradient fn) run in
vitest now; the golden-pose × finish checklist runs in an explicitly-requested visual
session (chrome-devtools MCP) as the final launch gate. The checklist is the spec's
acceptance instrument, not an afterthought.
