# Design-Engineering Environment — Research Reference

**Date:** 2026-04-14
**Status:** Living reference. Update in place when assumptions change.
**Purpose:** Permanent team knowledge base for the v0-ipod design-engineering environment. Every principle, persona, pattern, gotcha, and source is captured here so no contributor needs to re-derive it from scratch.

---

## 1. Purpose and scope

v0-ipod is a pixel-faithful, vector-first web recreation of the iPod. The project is past prototyping and in the **polishing crystal** phase — the experience has converged and the remaining work is high-fidelity polish. The question is no longer "what should this feel like?" but "does this match the real device down to the millimeter?"

This document captures everything the team needs to know to work inside the design-engineering environment that supports that phase: the principles it enforces, the personas it serves, the Figma conventions it adopts, the token model it uses, the round-trip it performs, and the honest gaps it has to work around.

If you are onboarding to the project, read this document once end-to-end before touching Figma or `design-tokens/`. If you are returning to the project after a break, re-read sections 2, 5, and 9.

---

## 2. Principles (load-bearing)

These nine principles are enforced, not aspirational. Every decision in the environment honors them. If a tool or workflow violates one, the tool or workflow is wrong, not the principle.

1. **Figma owns visual truth.** Every contour, stroke weight, color, radius, spacing, type size, material, and motion spec lives as a Figma Variable or Style. Code never hardcodes a visual value that could be a token.
2. **Code owns execution.** Behavior, state, accessibility, routing, data, platform plumbing — all code. Figma does not attempt to represent them.
3. **Storybook is the mirror.** Every atom, molecule, and organism has a story. The story is visually identical to the Figma frame at matching DPI. Drift is a lint error.
4. **Atomic Design is the language.** Atoms → Molecules → Organisms → Templates → Pages drives page naming, code folder structure, and review process. Atoms cannot depend on organisms. Templates must exist as skeletons before Pages.
5. **The triangle is sacred.** Every component is a triple: Figma component ↔ code file ↔ Storybook story. Any missing corner is a bug (Shopify Polaris's explicit rule).
6. **Parametric shapes, not freeform vectors.** Chrome is built from `RectangleNode`/`EllipseNode`/`LineNode` with bound Variables. `VectorNode` is last resort — it loses binding contracts and the Figma API re-origins coordinates on write.
7. **One-way per property.** Visual properties flow Figma → code. Behavioral properties flow code → Storybook → Figma (mirror only, no write-back). No property is bidirectional — that is where conflicts are born.
8. **Drawing board escape hatch.** When code cannot faithfully express a visual or motion decision, the answer is to return to Figma and iterate upstream, never to prompt an LLM to patch code. The design layer is always upstream of the code layer.
9. **Provenance is mandatory.** Every Variable, Style, component state, motion curve, and dimension carries metadata: which layer authored it, who, when, the Figma node id, the commit sha. Git blame, extended across layers.

The phase adds two more principles specific to polishing crystal:

10. **Real-world millimeters are canonical, pixels are derived.** The iPod's body, wheel, screen, and bezel dimensions are stored in mm sourced from Apple's spec sheets. A `px-per-mm` Variable derives pixels at the current DPI. Change the DPI and every Hardware component reflows proportionally.
11. **Frozen by default for Hardware components.** Once a Hardware component's dimensions are verified against the physical reference, it is marked frozen. Edits require an explicit override with a provenance note citing the reference source (spec sheet page, teardown photo, measured value).

---

## 3. Atomic Design — canonical definitions

Source: Brad Frost, *Atomic Design*, chapter 2 (atomicdesign.bradfrost.com/chapter-2/).

| Level | Definition (Frost, verbatim summary) | Examples | Not this |
|---|---|---|---|
| **Atom** | UI elements that can't be broken down any further. HTML-grade primitives. | Label, input, single button, color swatch, font-size token. | Anything composed of more than one element. A "card." |
| **Molecule** | Relatively simple groups of UI elements functioning together as a unit. | Search form (label + input + button), form field group, breadcrumb, menu item with icon. | A full nav bar. A product card with image + title + CTA + rating (that is already an organism). |
| **Organism** | Relatively complex components that form discrete sections of an interface. | Header, product grid, comment thread, footer, click wheel, Now Playing view. | A bare button. A full page layout. |
| **Template** | Page-level wireframe skeletons that place components into a layout and articulate underlying content structure. | Shell layout skeleton showing where hardware and UI sit, menu-flow skeleton. | Templates with real content or real copy. |
| **Page** | Specific instances of templates with real representative content. | Fully assembled iPod hero scene with real music library, marketing still. | Abstract component showcases. |

**The rule that trips teams up the most:** *atoms are not always components*. An atom like `color/surface/raised` is a Variable, not a Component. Atoms are the *concept* of a primitive; some are values (Variables), some are shapes (Components), some are effects (Styles). See section 5.

**The level most teams skip:** *Templates*. Without Templates, every Page reinvents layout and the system has no canonical skeleton. For v0-ipod, Templates live on dedicated pages so the Hardware/UI split has a documented assembly layer.

---

## 4. Figma file organization — senior conventions

### 4.1 What top design systems do

Studied: Shopify Polaris, IBM Carbon v11, Material 3, Atlassian Design System, Linear, Vercel Geist, Radix Themes, GitHub Primer, Apple HIG. Patterns appearing in three or more:

- Cover page first. Changelog or release notes second. How-to-use third. ([Polaris contributing](https://polaris-react.shopify.com/contributing/figma-ui-kit), [Figma best practices](https://www.figma.com/best-practices/team-file-organization/))
- Foundations pages (color, type, spacing) before component pages. ([Carbon v11](https://carbondesignsystem.com/designing/kits/figma/), Material 3, ADS)
- Two-digit numeric prefixes on page names to force alphanumeric order (`00 Cover`, `01 Foundations`, `99 Archive`). ([Figma organization guidance](https://www.figma.com/best-practices/team-file-organization/))
- Component pages grouped by category when components exceed ~15. ([Lee Munroe, Shopify](https://leemunroe.medium.com/how-we-organize-design-files-and-cover-pages-in-figma-6316e3503220))
- Split libraries (Foundations library and Components library as distinct files) once the system exceeds ~60 components or a second product surface appears. ([ADS Foundations](https://atlassian.design/resources/figma-library), [Carbon variables consolidation](https://medium.com/carbondesign/introducing-figma-variables-and-a-consolidated-all-themes-library-d4893d1b8920))
- Emoji prefixes and `---` separator pages as visual dividers inside a single file.

### 4.2 Variable collection architecture (three-tier)

The senior default is three Variable collections with light/dark modes on the semantic layer only:

| Tier | Collection | Contents | Modes | Example |
|---|---|---|---|---|
| **1** | Primitives | Raw values. Reference-only, never applied to layers directly. | Rarely moded. | `color/blue/500 = #0969DA`, `space/4 = 4`, `radius/lg = 12` |
| **2** | Semantic | Role-based aliases that reference primitives. The layer components bind to. | Light + Dark. Brand modes if multi-brand. | `surface/default → color/white/000 (light) / color/gray/900 (dark)` |
| **3** | Component | Per-component overrides. Only at enterprise scale. | Inherits from semantic. | `button/primary/background → surface/accent` |

Source: [zeroheight, Figma variables & design tokens architecture](https://zeroheight.com/blog/figma-variables-and-design-tokens-part-one-variable-architecture/). Carbon uses a `Theme` collection with four modes (White, Gray 10, Gray 90, Gray 100) — two light, two dark — in a single collection ([Anna Gonzales, IBM Carbon](https://medium.com/carbondesign/introducing-figma-variables-and-a-consolidated-all-themes-library-d4893d1b8920)).

### 4.3 Variants and naming

- Slashes in component names create the Assets panel hierarchy (`Button/Primary/Large`). ([Figma: name and organize](https://help.figma.com/hc/en-us/articles/360038663994))
- Every variant in a set must share the same slash depth or variant properties misalign. ([Figma: creating variants](https://www.figma.com/best-practices/creating-and-organizing-variants/))
- Senior teams use **component sets with boolean + variant properties** rather than slash-only naming. Slashes are for the component *name*; properties handle variance.
- Variant order: Type / Size / State / Icon is the most common. Biggest semantic bucket first.
- Every component has a filled description field linking to code and docs. This is non-negotiable for a senior artifact.

### 4.4 Cover pages and branding

Senior covers carry: logo lockup, library name, version, status pill (Stable / Beta / Deprecated), last-updated date, maintainer handles, links to the code repo and changelog, a three-step "how to use this file" callout. ([Lee Munroe](https://leemunroe.medium.com/how-we-organize-design-files-and-cover-pages-in-figma-6316e3503220))

Junior covers are untitled or carry only a logo. A cover is the first signal of whether a file is a senior artifact or a dump.

### 4.5 v0-ipod file structure (adopted)

Two-digit numeric prefixes. `─────` separator pages as visual dividers. The Hardware/UI split is v0-ipod-specific and is load-bearing for a pixel-faithful device clone: nobody else has to solve the question "is this part of the physical device or part of the screen rendering?"

```
00  Cover
01  Changelog
02  How to Use
─────────────────────────────
03  Foundations / Color
04  Foundations / Type
05  Foundations / Spacing & Radius
06  Foundations / Elevation & Motion
07  Foundations / Materials        ← aluminum, polycarbonate, glass (v0-ipod-specific)
08  Foundations / Dimensions       ← real-world mm, px-per-mm, device reference (polishing crystal)
09  Primitives / Icons             ← Lucide + iPod custom glyphs
10  Primitives / Logos & Marks
─────────────────────────────
11  Atoms / Controls
12  Atoms / Text
13  Atoms / Indicators
─────────────────────────────
14  Molecules / Form Fields
15  Molecules / Menu Items
16  Molecules / Status Rows
─────────────────────────────
17  Hardware / Shell               ← body, bezel, backplate (frozen by default)
18  Hardware / Wheel               ← click wheel with states (frozen by default)
19  Hardware / Screen              ← CRT/LCD frame, scanlines, glass (frozen by default)
─────────────────────────────
20  UI / Navigation
21  UI / Lists
22  UI / Now Playing
23  UI / Controls HUD
─────────────────────────────
24  Templates / Device + Screen
25  Templates / Menu Flow
26  Templates / Now Playing Flow
─────────────────────────────
27  Pages / Hero Scenes
28  Pages / Marketing Stills
─────────────────────────────
90  Playground
98  Docs / Principles
99  Docs / Contribution
─────────────────────────────
99  Archive                        ← date-stamped, quarterly purge
```

---

## 5. Token model — Variables vs Styles vs Components

The question that trips teams up: *what lives as a Variable, what lives as a Style, what lives as a Component?* Figma's own rule ([Update 1: Tokens, variables, and styles](https://help.figma.com/hc/en-us/articles/18490793776023)):

| Property | Container | Example | Bound in code |
|---|---|---|---|
| Hex color (solid fill) | **Variable** (Color) | `color/surface/raised` | `--surface-raised` / Tailwind `bg-surface-raised` |
| Gradient (2+ stops) | **Style** (Paint) | `material/aluminum-brushed` | CSS `background-image` + noise Variable |
| Shadow, elevation, blur | **Style** (Effect) | `elevation/raised` | `box-shadow` CSS variable set |
| Spacing / padding / gap | **Variable** (Number) | `space/inline/sm = 4` | `--space-inline-sm` / Tailwind `gap-1` |
| Corner radius (per corner) | **Variable** (Number) | `radius/lg = 12` | `--radius-lg`, bind each corner separately |
| Stroke weight (per side if needed) | **Variable** (Number) | `stroke/hairline = 1` | `--stroke-hairline` |
| Type family, size, line-height, weight, letter-spacing | **Variable** (String/Number) | `type/body/size = 14` | `--type-body-size` |
| Motion easing + duration + spring config | **Variable** (Number/String) | `motion/spring/menu` | `framer-motion` config import |
| Real-world millimeters | **Variable** (Number) | `device/classic-5g/body/height-mm = 103.5` | `--device-body-height-mm`, derived to px |
| Icons (shape) | **Component** | `Icon/Play` | Lucide + SVGR generated React component |
| Swatches, dividers, logos | **Component** | `Swatch/Surface` | React component |

### The rule of thumb

- If it is a **number or hex**, it is a **Variable**.
- If it is a **shape you drag onto the canvas**, it is a **Component**.
- If it is a **gradient or multi-layer effect**, it is a **Style**.

### Binding gotchas (verified in Figma Plugin API docs)

- `cornerRadius` **shorthand is NOT in the bindable field set**. Bind `topLeftRadius`, `topRightRadius`, `bottomLeftRadius`, `bottomRightRadius` individually. ([Forum: binding variables to corner radius](https://forum.figma.com/ask-the-community-7/correct-way-to-bind-variables-to-corner-radius-20226))
- The complete bindable list is 26 literals: `width, height, characters, itemSpacing, paddingLeft/Right/Top/Bottom, visible, topLeftRadius, topRightRadius, bottomLeftRadius, bottomRightRadius, minWidth, maxWidth, minHeight, maxHeight, counterAxisSpacing, strokeWeight, strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight, opacity, gridRowGap, gridColumnGap`. ([VariableBindableNodeField](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/))
- **Gradient stops cannot be variable-bound.** This is a documented dead-end. Gradients must be Styles, and Style changes break clean round-trips. ([Working with Variables](https://developers.figma.com/docs/plugins/working-with-variables/))
- Colors bind via `figma.variables.setBoundVariableForPaint(paint, 'color', variable)` — only on `SolidPaint`.

---

## 6. Vector fidelity — what breaks, what works

Source: [Figma Plugin API docs](https://developers.figma.com/docs/plugins/api/), forum failure reports, real-world round-trip experiments.

### 6.1 Programmatic shape creation

| API | When to use | When not to |
|---|---|---|
| `createRectangle()` | Any parametric rectangle — body, bezel, screen frame. Bindable corners + stroke. | When the shape is genuinely freeform. |
| `createEllipse()` | Click wheel, center button, dots. Bindable stroke + radius. | |
| `createLine()` | Hairlines, dividers. | |
| `createFrame()` | Containers with auto-layout, backgrounds. | Unbounded freeform vector work. |
| `createVector()` + `vectorPaths` | Last resort freeform contours. | Chrome, icons, anything parametric. `VectorNode` loses bindings and re-origins coordinates on write. |
| `createNodeFromSvg(svg)` | Importing Lucide icons, pre-baked glyphs. | Anything with gradients (parser crashes), masks (silently dropped), or filters (unsupported). |

**Bottom line for v0-ipod:** chrome is built from parametric shapes (Rect + Ellipse + Line) with bound Variables for every dimension. `VectorNode` is used only where genuinely needed (custom glyphs, ornate logo marks) and always as a terminal output, never a canonical source.

### 6.2 `createNodeFromSvg` silent failures

1. **Gradient `userSpaceOnUse` transforms** can trigger `"failed to invert transform" in addGradientPaint (FGSvgParser.cpp)` — parser bug the native paste path does not have. ([Forum #45537](https://forum.figma.com/t/error-in-importing-svg-with-gradient-using-the-plugin-api/45537))
2. **Masks inside `<defs>`** are silently dropped unless lifted to the top level. ([hicks.design](https://hicks.design/journal/exporting-figma-svgs-with-masks))
3. **Angular gradients** export as radials — lossy round-trip. ([svggenie](https://www.svggenie.com/blog/how-to-export-svg-from-figma))
4. **Filters** (blur, drop-shadow inside `<filter>`) have no Figma analog.

### 6.3 SVG export from Figma (`exportAsync`)

Defaults: `svgOutlineText: true`, `svgIdAttribute: false`, `svgSimplifyStroke: true`, `contentsOnly: true`, `useAbsoluteBounds: false`. ([ExportSettings](https://developers.figma.com/docs/plugins/api/ExportSettings/))

For round-trip fidelity, override to: `svgOutlineText: false` (keep `<text>` editable but accept cross-browser drift), `svgSimplifyStroke: false` (preserve exact stroke mask instead of centered approximation), `svgIdAttribute: true`, `useAbsoluteBounds: true`. Pipe through SVGO with `cleanupIds: false` (gradient/clipPath ID collisions break inlined SVGs otherwise) and `prefixIds` using the node name.

### 6.4 Destructive operations — never on canonical geometry

- `outlineStroke()` — destructive. Prior vector network is unrecoverable.
- Boolean operations (`union`, `subtract`, `intersect`, `exclude`) — destructive in the same way.
- Flattening a `FrameNode` group into a `VectorNode` — loses every Variable binding on children.

Use these only on derived exports, never on components in the canonical file.

---

## 7. Personas — who the environment serves

Four senior roles. Each has distinct daily rituals, tools, friction, and needs. The environment must be productive for all four, not just one.

### 7.1 Senior Product Designer

**Daily rituals:** ships end-to-end flows in partnership with PM and engineering. Sketches early ideas with Design Engineers ("iterate together in Figma or code" — [Vercel Design Engineering](https://vercel.com/blog/design-engineering-at-vercel)), runs morning flow reviews in Figma, does Dev Mode walkthroughs before handoff. Does a final review in Dev Mode to see "exactly what developers will see" ([Figma handoff handbook](https://www.figma.com/blog/the-designers-handbook-for-developer-handoff/)) before sharing the link.

**Tools:** Figma (Components, Variables, Branches, Dev Mode), FigJam, Linear, Storybook as live spec, Loom for async review, shipped app for dogfooding.

**Friction:** cluttered files with `Frame 3123`, handoff docs that never match, drift between Figma mockups and shipped code (responsive/a11y/edge cases mockups don't show). ([Smashing Magazine handoff](https://www.smashingmagazine.com/2023/05/designing-better-design-handoff-file-figma/))

**What the environment gives them:** a Jump-to-Figma-frame button on every Storybook story, an atomic-design breadcrumb visible in both tools, a diff ribbon showing Figma-vs-shipped drift. Code Connect cuts context-switching ([Figma blog](https://www.figma.com/blog/)); HP reported 500% ROI from Dev Mode adoption.

### 7.2 Interaction Designer

**Daily rituals:** owns motion, variants, state transitions. Emil Kowalski's public writing (Sonner, Vaul, animations.dev, ex-Vercel) describes the practice: sketch a micro-interaction in Figma with Smart Animate, rebuild in Rive or Framer Motion, tune spring config in a live sandbox, record a Loom, push to a Storybook story. ([emilkowal.ski](https://emilkowal.ski/ui/how-i-built-my-course-platform), [animations.dev](https://animations.dev/))

**Tools:** Figma (Variants, Interactive Components, Smart Animate), Rive for production runtime, Framer Motion / motion.dev, Origami for state machines, Chrome DevTools animation panel.

**Friction:** Figma prototype timing does not match code timing (180ms in Figma ≠ 180ms in production). Spring params are not expressible in Figma and get re-invented in code. Interruptibility cannot be demoed in Figma at all — "springs maintain velocity when interrupted unlike CSS animations that restart from zero."

**What the environment gives them:** one canonical easing/duration/spring token table that Figma, Rive, and Framer Motion all read. A Storybook story that is the motion spec — scrub a timeline, see the same code variable the shipped app uses. An interruption-test harness and a `prefers-reduced-motion` lint.

### 7.3 Industrial / Brand Designer

**Daily rituals:** owns the iPod-as-object metaphor. Studies reference hardware photos, tunes gradients that read as anodized aluminum vs polycarbonate, calibrates the specular highlight on the click wheel, reviews device renders at 1x/2x/3x DPI. Draws on the Rams/Ive lineage: "white in a polymer, in a resin — there's an integrity to that… white is recessive, very clear and very strong and also deferring to form" ([Jonathan Ive interview, Rams Foundation](https://rams-foundation.org/magazine/interviews/jonathan-ive/)).

**Tools:** Figma (gradients, effects, blend modes, Variables for material tokens), Blender / Adobe Substance 3D for material studies ([Adobe Substance for industrial design](https://www.adobe.com/products/substance3d/discover/industrial-designer.html)), Origami for light behavior, color-calibrated display, physical iPod reference unit on the desk. Michael Flarup's *App Icon Book* community shows this discipline as "handcrafted, vibrant" craftwork.

**Friction:** gradients and shadows look right in Figma and wrong in CSS (color space, banding, sub-pixel rendering). No shared vocabulary for "material" as a token — hex codes flatten the finish intent. Craft work (bevels, highlights, grain) is expensive to redo when component APIs change. ([AppleInsider on skeuomorphism's cost](https://appleinsider.com/articles/22/08/23/what-apple-learned-from-skeuomorphism-and-why-it-still-matters))

**What the environment gives them:** material tokens (aluminum-brushed, polycarbonate-white, glass-click-wheel) live once in Figma Styles + Variables, compile to CSS custom properties, render identically in Storybook. A "material inspector" that shows the gradient stack, noise layer, and highlight curve under the cursor. Side-by-side render of Figma frame vs browser paint at matching DPI. A physical-reference pane pinned to the canvas.

### 7.4 Design Engineer

**Daily rituals:** implements designs in code, owns the token pipeline and Storybook. Vercel calls this role "as comfortable in Figma as they are in the codebase" and notes their tool stack includes "GLSL shaders, Three.js, Blender — no fixed toolset" ([Vercel](https://vercel.com/blog/design-engineering-at-vercel)). A day: pull the token export, run Style Dictionary, rebuild Storybook, implement a new organism, wire Code Connect mappings, review a designer's Figma branch, ship via Linear-integrated PR.

**Tools:** Figma (Dev Mode, Variables export, Code Connect), VS Code, Storybook, Tokens Studio, Style Dictionary, GitHub Actions, Chrome DevTools, Linear.

**Friction:** manual token sync (Matthew Rea: "developers barely have time to inspect your Figma file to extract the design details"). Code Connect mappings rot as components refactor. Storybook coverage drifts behind shipped components.

**What the environment gives them:** a CLI that diffs Figma Variables against Style Dictionary output, a Storybook coverage dashboard (% of atoms/molecules with stories), a Code Connect linter flagging unmapped components, a round-trip command that opens the Figma frame, Storybook story, and source file side-by-side in one action.

### 7.5 Shared needs (all four roles)

- **One canonical token graph** (color, space, type, motion, material, dimensions) that Figma Variables and code CSS custom properties both resolve to. No hand-sync.
- **Bidirectional jump links.** Any component in any tool round-trips to its twin in one click: Figma frame ↔ Storybook story ↔ source file ↔ shipped URL.
- **Atomic design enforced as a lint**, not a convention. Atoms cannot depend on organisms. Stories exist for every leaf. Names match across Figma and code.
- **Shipped pixel as ground truth** surfaced as a drift overlay against the Figma frame at matching DPI.
- **Motion, material, and state as first-class tokens**, not inline values re-authored per surface.

---

## 8. Storybook ↔ Figma — state of the art (2025)

### 8.1 What exists off the shelf

- **Figma Code Connect** — one-way snippet publisher. Maps Figma components to React components for the Dev Mode panel via `.figma.tsx` files. Supports prop helpers (`figma.string`, `figma.boolean`, `figma.enum`, `figma.instance`, `figma.children`). Does NOT create Figma nodes from code, does NOT diff pixels. ([Figma Code Connect docs](https://developers.figma.com/docs/code-connect/react/), [github.com/figma/code-connect](https://github.com/figma/code-connect))
- **`@storybook/addon-designs`** — passive Figma frame iframe next to the story. `parameters.design = { type: 'figma', url: '<frame-url-with-node-id>' }`. No diffing. ([docs](https://storybook.js.org/docs/sharing/design-integrations))
- **Storybook Connect Figma plugin** (Chromatic) — opens the live story inside Figma. Pairs with Chromatic Visual Tests for code-to-code diffing. ([Chromatic Figma plugin](https://www.chromatic.com/docs/figma-plugin/))
- **Tokens Studio / TokensBrücke / Styleframe** — bidirectional DTCG ↔ Figma Variables pipelines, preserving aliases. ([Tokens Studio](https://docs.tokens.studio/), [tokens-bruecke](https://github.com/tokens-bruecke/figma-plugin), [styleframe.dev](https://www.styleframe.dev/figma))

### 8.2 Real team pipelines

- **GitHub Primer** — `primer/primitives` holds DTCG JSON. Designers edit Figma Variables, a GitHub Action PRs the JSON, Style Dictionary transforms to CSS vars on merge. ([primer.style](https://primer.style/product/getting-started/figma/))
- **IBM Carbon** — Figma kits with bound Variables, token-transformer + Style Dictionary producing CSS custom properties consumed by the Storybook-powered docs site. ([carbondesignsystem.com](https://carbondesignsystem.com/designing/get-started/))
- **Shopify Polaris** — `polaris-tokens` package, Figma library published alongside. 2025 shift toward Polaris Web Components with tokens as CSS vars. ([polaris-react.shopify.com](https://polaris-react.shopify.com/design/colors/color-tokens))
- **Vercel Geist** — minimalist. No formal design-tokens layer, hand-maintained Figma kit, no public Storybook/Figma sync.

### 8.3 Honest gaps (what does not exist in 2025)

For "every contour in Figma, code executes" there is no off-the-shelf pipeline. v0-ipod must custom-build:

1. **A DOM-to-Figma parametric-shape serializer** — takes a Storybook story, walks computed styles, emits `Rectangle`/`Ellipse`/`Line` nodes with bound Variables. Story.to.Design is the closest prior art but it rasterizes via Satori, which is the path we are explicitly escaping.
2. **A Figma ↔ shipped drift detector** — screenshots both surfaces (Playwright + Figma Images REST API) at matching DPI, pixel-diffs, reports. Chromatic diffs code-to-code, not code-to-Figma.
3. **A Code Connect mapping linter** — every in-scope component must have a live mapping; rot must fail CI.
4. **A jump hub** — one keystroke to open the same component across Figma, Storybook, source, and shipped preview.
5. **Material tokens** — the aluminum/polycarbonate/glass system. Entirely custom. No analog in any shipping design system.

Off-the-shelf tooling gets us ~70%. The last 30% is what makes v0-ipod specifically feasible for polishing crystal.

---

## 9. Polishing crystal — dimensional fidelity

### 9.1 The phase

v0-ipod is past prototyping. The experience has converged. The iPod on screen is a **digital twin** of the physical product, not a loose interpretation. The environment optimizes for verification of fidelity against real device dimensions, not open-ended exploration.

### 9.2 Real-world millimeters are canonical

Every Hardware component stores its dimensions in millimeters, sourced from the physical reference (Apple spec sheets, teardown photos, measured values). Pixels are derived via a `px-per-mm` Variable at the target DPI. A single change to `px-per-mm` reflows every Hardware component proportionally.

Example Variables (values to be filled in from the real reference — see sticky notes):

```
device/classic-5g/body/height-mm       = [STICKY:fill from spec sheet]
device/classic-5g/body/width-mm        = [STICKY:fill from spec sheet]
device/classic-5g/body/depth-mm        = [STICKY:fill from spec sheet]
device/classic-5g/body/corner-radius-mm = [STICKY:fill from spec sheet]
device/classic-5g/wheel/diameter-mm    = [STICKY:fill from spec sheet]
device/classic-5g/wheel/center-button-diameter-mm = [STICKY:fill from spec sheet]
device/classic-5g/screen/diagonal-in   = [STICKY:fill from spec sheet]
device/classic-5g/screen/resolution-w-px = [STICKY:fill from spec sheet]
device/classic-5g/screen/resolution-h-px = [STICKY:fill from spec sheet]
device/classic-5g/bezel/width-mm       = [STICKY:fill from spec sheet]
device/scale/px-per-mm                 = [STICKY:fill from design decision]
```

### 9.3 Frozen Hardware components

Once a Hardware component's dimensions are verified against the physical reference, it receives a `frozen: true` metadata flag enforced by the v0-ipod Figma plugin. Edits to a frozen component trigger a confirm dialog that requires a provenance note citing the reference source. On the code side, Hardware component dimensions are read-only except via the device Variable graph — no `width: 61` hardcodes, only `width: calc(var(--device-body-width-mm) * var(--device-scale-px-per-mm))`.

### 9.4 Physical reference pane

A Storybook decorator pins a reference photo of the iPod behind every Hardware story at matching mm scale, with a draggable ruler that reads mm values. Hovering over the click wheel shows `44.0mm (167px @ 3.78px/mm)`. The mm value is canonical; the px is derived.

### 9.5 Dimensional Fidelity aspect

Alongside Color, Type, Spacing, Motion, Material, etc., **Dimensional Fidelity** is a first-class aspect in the layered architecture. It is the aspect the polishing crystal phase is primarily polishing. Any spec that touches Hardware components must declare how it preserves dimensional fidelity.

---

## 10. Round-trip map — what syncs which way

```
Figma Variables  ──(DTCG export + Plugin API)──▶  design-tokens/*.json
                                                       │
                                        Style Dictionary build
                                                       │
                          ┌────────────────────────────┼────────────────────────────┐
                          ▼                            ▼                            ▼
                  tailwind.config.ts          app/globals.css              framer-motion config

Code components  ──(Lucide + SVGR + parametric shape generator)──▶  Figma components
                                                                           │
                                                                    (custom plugin
                                                                    calling Plugin API,
                                                                    never Satori, never raster)

Storybook stories  ──(Playwright screenshot)──▶  Visual diff report
Figma frames       ──(Images REST API)────────▶  Visual diff report
                                                         │
                                                         ▼
                                                 CI lint: drift > ε fails PR

Every write       ──(provenance stamp)──▶  design-tokens/.provenance.json
                                                 │
                                                 ▼
                                        git blame across layers
```

### Ownership per property

| Property kind | Owner | Source of truth | Conflict rule |
|---|---|---|---|
| Foundations (color, space, radius, type, motion, material, dimensions) | Designer | Figma Variables | Figma wins; code updates to match |
| Component behavior (state, a11y, routing) | Engineer | Code | Code wins; Figma mirrors via Code Connect |
| Component visual appearance | Both | Both (must match) | Drift lint fails PR, humans decide per case |
| Provenance metadata | System | `design-tokens/.provenance.json` | Never edited by hand |

---

## 11. Anti-patterns to avoid

Compiled from Shopify Polaris contribution rules, Nathan Curtis ([configuration collapse](https://nathanacurtis.substack.com/p/configuration-collapse)), and Figma's own guidance.

1. **"Everything is a component" sprawl.** Wrapping color chips and spacing tokens as Components instead of Variables. Result: cannot theme, cannot mode-switch, every change is manual. Fix: values are Variables.
2. **Configuration collapse.** Component property panels with `showIcon`, `hideLabel`, `direction`, `padding`, etc. until the component is unmaintainable. Fix: composition and slots over configuration.
3. **Missing Templates layer.** Jumping from organisms straight to real pages. Every page reinvents layout. Fix: Templates page holds canonical skeletons.
4. **Organisms with no variants.** A header that exists as one frozen instance. Fix: organisms carry the same variant discipline as atoms.
5. **Figma drifting from code.** If a component is in Figma but not in code (or vice versa), the system is lying. Fix: Polaris rule enforced by lint.
6. **Half-variable-ized tokens.** Variables set up but components still use hex fills. Fix: drift analyzer flags hardcoded visual values.
7. **Unbounded Archive.** Archive pages that grow forever. Fix: date-stamp entries, purge quarterly.
8. **One mega-page of 200 frames.** Kills Figma performance. Fix: split at ~50 frames.
9. **Slash-naming doing variant work.** `Button/Primary/Large` instead of proper variant properties. Fix: slashes for name, properties for variance.
10. **Variant explosion in Hardware components.** Every state and DPI and color becomes its own variant instead of being driven by Variables. Fix: bind, don't duplicate.

---

## 12. Sources

### Primary — Atomic Design and Figma

- [Brad Frost — Atomic Design, chapter 2](https://atomicdesign.bradfrost.com/chapter-2/)
- [Figma — Tokens, variables, and styles (Update 1)](https://help.figma.com/hc/en-us/articles/18490793776023)
- [Figma — Name and organize components](https://help.figma.com/hc/en-us/articles/360038663994)
- [Figma — Creating and organizing variants](https://www.figma.com/best-practices/creating-and-organizing-variants/)
- [Figma — Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383)
- [Figma — Team, project, and file organization](https://www.figma.com/best-practices/team-file-organization/)

### Primary — Figma Plugin API and vector fidelity

- [Figma Plugin API — figma global](https://developers.figma.com/docs/plugins/api/figma/)
- [Figma Plugin API — VectorNode](https://developers.figma.com/docs/plugins/api/VectorNode/)
- [Figma Plugin API — VectorPath](https://developers.figma.com/docs/plugins/api/VectorPath/)
- [Figma Plugin API — ExportSettings](https://developers.figma.com/docs/plugins/api/ExportSettings/)
- [Figma Plugin API — VariableBindableNodeField](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)
- [Figma Plugin API — RectangleNode](https://developers.figma.com/docs/plugins/api/RectangleNode/)
- [Figma Plugin API — Working with Variables](https://developers.figma.com/docs/plugins/working-with-variables/)
- [Forum: correct way to bind variables to corner radius](https://forum.figma.com/ask-the-community-7/correct-way-to-bind-variables-to-corner-radius-20226)
- [Forum: createNodeFromSvg gradient "failed to invert transform"](https://forum.figma.com/t/error-in-importing-svg-with-gradient-using-the-plugin-api/45537)
- [hicks.design — exporting mask groups from Figma](https://hicks.design/journal/exporting-figma-svgs-with-masks)

### Primary — top design systems

- [Shopify Polaris — contributing to the Figma UI kit](https://polaris-react.shopify.com/contributing/figma-ui-kit)
- [Shopify Polaris — color tokens](https://polaris-react.shopify.com/design/colors/color-tokens)
- [IBM Carbon — Figma kits](https://carbondesignsystem.com/designing/kits/figma/)
- [Anna Gonzales — Introducing Figma variables (IBM Carbon)](https://medium.com/carbondesign/introducing-figma-variables-and-a-consolidated-all-themes-library-d4893d1b8920)
- [Material 3 Design Kit](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit)
- [Atlassian Design System — Figma library](https://atlassian.design/resources/figma-library)
- [Radix Themes Figma file](https://www.figma.com/community/file/1280428825266545105/radix-themes)
- [Geist Design System — Vercel](https://www.figma.com/community/file/1330020847221146106/geist-design-system-vercel)
- [Linear Design System Figma file](https://www.figma.com/community/file/1360217143064610932/linear-design-system)
- [GitHub Primer — Figma getting started](https://primer.style/product/getting-started/figma/)
- [primer/primitives GitHub](https://github.com/primer/primitives)

### Primary — Storybook and round-trip tooling

- [Figma Code Connect React docs](https://developers.figma.com/docs/code-connect/react/)
- [figma/code-connect GitHub](https://github.com/figma/code-connect)
- [Storybook design integrations](https://storybook.js.org/docs/sharing/design-integrations)
- [Storybook addon-designs GitHub](https://github.com/storybookjs/addon-designs)
- [Chromatic Figma plugin](https://www.chromatic.com/docs/figma-plugin/)
- [Story.to.Design](https://story.to.design/)
- [Announcing Story to Design — divRIOTS](https://divriots.com/blog/announcing-story-to-design)
- [Storybook-to-Figma community plugin](https://www.figma.com/community/plugin/1584927057729601296/storybook-to-figma)
- [Tokens Studio docs](https://docs.tokens.studio/)
- [TokensBrücke Figma plugin](https://github.com/tokens-bruecke/figma-plugin)
- [Styleframe DTCG round-trip](https://www.styleframe.dev/figma)
- [Matthew Rea — Design token automation from Figma to Storybook](https://matthewrea.com/blog/design-token-automation-from-figma-to-storybook/)
- [zeroheight — Figma variables and design tokens architecture](https://zeroheight.com/blog/figma-variables-and-design-tokens-part-one-variable-architecture/)

### Primary — persona grounding

- [Vercel — Design engineering at Vercel](https://vercel.com/blog/design-engineering-at-vercel)
- [Emil Kowalski — How I built my course platform](https://emilkowal.ski/ui/how-i-built-my-course-platform)
- [animations.dev](https://animations.dev/)
- [Jonathan Ive interview — Rams Foundation](https://rams-foundation.org/magazine/interviews/jonathan-ive/)
- [The Design Continuum: Ive & Rams](https://medium.com/design-bootcamp/the-design-continuum-649420ec3a63)
- [AppleInsider — What Apple learned from skeuomorphism](https://appleinsider.com/articles/22/08/23/what-apple-learned-from-skeuomorphism-and-why-it-still-matters)
- [Michael Flarup — App Icon Book](https://www.appiconbook.com)
- [Figma Config 2025 — Schema recap](https://www.figma.com/blog/schema-2025-design-systems-recap/)
- [Figma Dev Mode — design-to-development](https://www.figma.com/dev-mode/)
- [Figma — Designer's handbook for developer handoff](https://www.figma.com/blog/the-designers-handbook-for-developer-handoff/)
- [Smashing Magazine — Designing a better handoff file](https://www.smashingmagazine.com/2023/05/designing-better-design-handoff-file-figma/)
- [Supernova — Storybook for designers](https://www.supernova.io/blog/storybook-for-designers-why-its-more-than-just-a-dev-tool)
- [Nathan Curtis — Configuration collapse](https://nathanacurtis.substack.com/p/configuration-collapse)
- [Lee Munroe — How we organize design files in Figma](https://leemunroe.medium.com/how-we-organize-design-files-and-cover-pages-in-figma-6316e3503220)
- [Design Systems Collective — Multi-brand design system in Figma](https://www.designsystemscollective.com/essential-tips-for-building-a-multibrand-design-system-in-figma-04f1e9150d41)

---

## 13. Glossary

- **Aspect** — a single concern (Color, Type, Motion, Material, Dimensional Fidelity, etc.) that contributes additively to a component. Aspects compose without collision.
- **Atomic Design** — Brad Frost's five-level hierarchy: Atoms → Molecules → Organisms → Templates → Pages.
- **Canonical Figma file** — the single file at `figma.com/design/UEUmBeQrbJd5gjbUennIg3/v0-ipod-design-system`. Source of visual truth.
- **Code Connect** — Figma's one-way publisher that maps Figma components to React components for the Dev Mode panel.
- **Component triangle** — every component is a triple: Figma component ↔ code file ↔ Storybook story. A missing corner is a bug.
- **Dimensional Fidelity** — aspect-layer that stores real-world mm measurements as Variables. Derived to px via a scale Variable.
- **Drawing-board escape hatch** — the ritual of returning to Figma when code cannot faithfully express a design decision.
- **DTCG** — Design Tokens Community Group JSON format. The interchange format for tokens.
- **Drift** — observable difference between the Figma frame and the rendered Storybook story at matching DPI. Always a lint error.
- **Frozen component** — a Hardware component whose dimensions have been verified against the physical reference. Edits require an explicit override.
- **Jump hub** — a keystroke or CLI command that opens the same component across Figma, Storybook, source, and shipped preview.
- **Parametric shape** — `RectangleNode`, `EllipseNode`, or `LineNode` built with bound Variables for every dimension. Preferred over `VectorNode`.
- **Polishing crystal phase** — the project phase where prototyping is done and the work is high-fidelity polish against a physical reference. Current phase as of 2026-04-14.
- **Provenance** — metadata stamped on every visual decision (layer, author, timestamp, Figma node id, commit sha). Stored in `design-tokens/.provenance.json`.
- **Semantic layer** — the middle tier of the Variable architecture. Role-based aliases (`surface/default`, `text/primary`) that reference primitives and carry light/dark modes.
- **Source of truth per property** — Figma for visual properties, code for behavioral properties. Never both for the same property.

---

## 14. Sticky notes — things the user needs to fill in

Grep for `[STICKY:` to find these inline. Collected here for convenience. Every item is something a human needs to decide or provide before it can be resolved.

- [STICKY:device-model] Which iPod model is the canonical reference? Default assumption: iPod Classic 5th Generation (2005), 30GB/60GB, white/black, 2.5" LCD. If wrong, name the target model.
- [STICKY:body-height-mm] Real-world body height in mm for the canonical device.
- [STICKY:body-width-mm] Real-world body width in mm.
- [STICKY:body-depth-mm] Real-world body depth in mm.
- [STICKY:body-corner-radius-mm] Real-world body corner radius in mm.
- [STICKY:wheel-diameter-mm] Click wheel outer diameter in mm.
- [STICKY:wheel-center-button-diameter-mm] Center button diameter in mm.
- [STICKY:wheel-inner-ring-diameter-mm] Inner ring diameter (where the center button sits) in mm.
- [STICKY:screen-diagonal-in] Screen diagonal in inches (likely 2.5 for 5G).
- [STICKY:screen-resolution-w-px] Native screen resolution width in px (likely 320).
- [STICKY:screen-resolution-h-px] Native screen resolution height in px (likely 240).
- [STICKY:bezel-width-mm] Bezel width around the screen in mm.
- [STICKY:target-scale-px-per-mm] Target scale factor for rendering (e.g., 3.78 px/mm for a 1x render).
- [STICKY:reference-photos] Paths or URLs to the canonical reference photos of the device.
- [STICKY:reference-spec-sheet] Source of the real-world dimensions (Apple spec sheet URL or teardown site).
- [STICKY:material-aluminum] Canonical aluminum material token (hex, noise intensity, highlight curve).
- [STICKY:material-polycarbonate] Canonical polycarbonate material token.
- [STICKY:material-glass] Canonical glass (click wheel cover) material token.
- [STICKY:motion-spring-menu] Canonical spring config for menu transitions (stiffness, damping, mass).
- [STICKY:motion-spring-scroll] Canonical spring config for the click wheel scroll momentum.
- [STICKY:type-family-display] Display type family for marketing / hero pages.
- [STICKY:type-family-ui] UI type family for menu items, headers, status rows. Current component code uses specific fonts — confirm or override here.
- [STICKY:brand-colors] Any brand colors beyond the obvious device colors (white, black, silver) — e.g., accent color for the highlight bar in the menu.
- [STICKY:maintainers] Who maintains this file and these specs. Names + GitHub handles + role.
- [STICKY:license] License for the committed reference material (photos, spec sheets).
- [STICKY:scope-generations] Which iPod generations are in scope. Default: 5G Classic only. Add others if wanted.
- [STICKY:scope-peripherals] Are the dock connector, headphone jack, and hold switch in scope as their own components? Default: represented as frozen visual elements on the Shell page but not interactive.

---

**End of research reference.**
