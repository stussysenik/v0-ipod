# Tasks — update-render-fidelity-launch-gate

## 0. Color pipeline (first — all later tuning happens under this transform)

- [x] 0.1 Port the Neutral formula (three r182 GLSL, closed-form) into
      `lib/three-color-resolve.ts` as a pure CPU function; vitest red/green:
      below-threshold finishes with radiance headroom (peak ≥ 0.5) survive within
      ΔE2000 ≤ 2; every below-threshold finish keeps hue (shared offset ≤0.04, channel
      deltas invariant); above-threshold values compress monotonically toward — never
      to — white. FINDING: the ≤0.04 linear black-level offset is a large *perceptual*
      shift on raw dark albedo (6G black ΔE ≈ 4.6), which is correct radiance behaviour
      — WYSIWYG on darks is carried by `toneMapped={false}` + specular separation, not
      the albedo path. Spec scenario updated to match.
- [x] 0.2a Parity anchor (verifiable without a GPU): pin the CPU port to three r182's
      own `NeutralToneMapping` GLSL (`ShaderChunk.tonemapping_pars_fragment`) so live↔export
      parity is a *formula-equivalence* guard — a three upgrade that retunes Neutral fails
      the test loudly. Red/green (13/13). FINDING that reshapes the mechanism: a plain
      renderer flip to `NeutralToneMapping` does NOT reach the export — three forces
      `NoToneMapping` on render-target renders (`three.module.js:17801`), and applying
      Neutral to the whole buffer in `ColorResolvePass` would wrongly darken the
      `toneMapped={false}` surfaces (ΔE 4–9 on darks). Correct mechanism: inject three's
      OWN `NeutralToneMapping` into the lit-body materials — replace
      `#include <tonemapping_fragment>` with `gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );`
      via `onBeforeCompile`; renderer STAYS `NoToneMapping` (so no double-apply on screen);
      `ColorResolvePass` STAYS a pure sRGB encode. Runs identically on screen + RT → parity
      by construction; `toneMapped={false}` surfaces skip injection → stay literal.
- [ ] 0.2b [visual session — needs a live GPU to confirm the shader links] Wire the
      injection above into the lit-body materials; confirm `/3d` renders with no
      shader-compile errors in the console. Verify the caveat: `NeutralToneMapping` is
      defined by `tonemapping_pars_fragment` — if three omits that chunk when
      `renderer.toneMapping === NoToneMapping`, include it explicitly in the patch.
      Keep `toneMapped={false}` on the WYSIWYG surfaces (stage backdrop, baked screen).
      Rebalance rig intensities against the new shoulder; confirm live ≈ export on a dark
      and a mid finish.
- [x] 0.3 Centralize the device-render color path: audit (ast-grep) for hardcoded
      hex in material definitions, route survivors through the manifest resolve,
      add the coverage guard test. DONE: the audit classified 15 hex hits into
      comment/doc noise, procedural non-finish chrome, and the true-`#000000`/
      `#ffffff` WYSIWYG sentinels (kept literal on purpose). The five genuine
      device-chrome survivors — port recess (`#0a0b0c`), hold-switch slider
      (`#c9cdd1`), screen bezel (`#0a0a0a`), LCD glass tint (`#c8d4c0`), brushed-
      metal base grey (`#7c7c7c`) — are now `device.*` surface tokens in the
      manifest, resolved through a single DOP module `lib/device-chrome.ts`
      (`DEVICE_CHROME` / `deviceChromeColor`), and `three-d-ipod.tsx` reads them
      from there (no inline hex left). Coverage guard `lib/device-chrome.test.ts`
      (4 tests) asserts every token resolves from a real manifest entry (never the
      `#808080` fallback), that the routed hex no longer appear as quoted literals
      in the mesh source, and that the WYSIWYG sentinels stay untokenized. Green +
      `tsc --noEmit` clean + `oxlint` 0/0.

## 1. Kill the seam (screen artifacts)

- [ ] 1.1 Reproduce the green edge haze: identify which WebGL element (glass plane,
      bezel, or LCD plane catching a Lightformer/spot) leaks past the DOM overlay at
      the failing pose; record the pose params in the change
- [ ] 1.2 Fix the leak (z-order/clip/material cutoff) so no specular escapes the
      screen bounds at any pose; re-check the failing pose
- [ ] 1.3 Verify export captures are unaffected (existing export continuity tests
      stay green)

## 2. Screen recess + glass sweep (DOM treatments)

- [x] 2.1 Write the pure sweep function: (camera azimuth/elevation) → CSS gradient
      params; vitest red/green on boundary angles. DONE: `lib/three-glass-sweep.ts` —
      `resolveGlassSweep({azimuth, elevation}) → {angle, position, intensity, spread}`,
      a pure fn with no three/DOM/dial dependency. Model: the glass catches the env
      strip strongest dead-on (the composed hero, peak 0.5) and fades by a Gaussian
      falloff (σ 42°) as the camera orbits away to reflect the darker surround, floored
      at 0.05 (glass keeps a faint sheen); the band position tracks orbit (azimuth
      horizontal, elevation vertical) and the gradient axis tilts with the camera so the
      streak rotates. `glassSweepGradientCss` renders params → a stops-ordered, 0–100%-
      clamped `linear-gradient` for §2.2 to paint. Red/green 9/9 on the boundary angles
      (dead-on centred/un-tilted/peak, azimuth mirror symmetry, monotonic fade, angle
      tilt sign, elevation shift, extreme-pose clamp, determinism, CSS stop ordering).
      Constants are the documented starting shape — §2.3's visual session matches the
      WebGL export glass to these numbers (live ≈ export). typecheck + oxlint clean.
- [ ] 2.2 Apply recess inner-shadow ring and sweep overlay to the DOM screen;
      pointer-events and inline editing unchanged
- [ ] 2.3 Match the WebGL export glass params to the CSS sweep so live ≈ export;
      extend the export continuity test if it can assert params

## 3. Finish material table

- [x] 3.1 Write the finish table: finish luminance → per-part params (face, wheel,
      ring, glyphs) with documented env-response floor and wheel/face separation
      invariant; vitest asserts floor + monotonic separation across the full color
      manifest (red first against current 0.16/void behavior). Pure module
      `lib/finish-material-table.ts` — `darkBoost(luminance)` (0 at ≥0.35, →1 at black)
      lifts env response (`ENV_RESPONSE_FLOOR` 0.2, cleared with margin on darks) and
      sharpens roughness while holding a fixed `SEPARATION_EPSILON` 0.06 gap
      (wheel ‹ ring ‹ face) at every luminance. 33/33 across the full manifest corpus,
      red-probed (legacy flat 0.16/equal-roughness → 48 failing).
- [x] 3.2 Wire the table into `three-d-ipod.tsx` materials (replace the hardcoded
      per-part constants); typecheck + oxlint clean. DONE: `resolveFinishMaterial`
      drives the three lit specular parts — touch ring (`ringMat`), select button
      (`selectMat`), anodized face (`faceMat`) — each keyed on its own rendered
      colour luminance, replacing the flat 0.16/0.18 envMapIntensity + fixed
      roughness constants with the floor + dark-lift response. `roughnessMap` on the
      face is kept (scalar swap only). typecheck + oxlint clean; 572 unit tests green.
      Visual confirmation of the darks-clear-the-void behaviour rides the §6.2 session.

## 4. Per-pose light compositions

- [x] 4.1 Add `POSE_LIGHT_COMPOSITIONS` to `lib/studio-lighting-config.ts` keyed by
      `studio-camera-poses` ids; selection as pure fn(pose) with vitest coverage
      (unknown pose → default rig). Each named pose has one composition (Chamfer Rake /
      Even Wash / Horizon Card / Right·Left Edge Rake / Overhead Soft); `selectPoseComposition`
      is a pure fn(poseId) → composition|null (unknown/free-orbit → null = default rig), and
      `composeRigForPose` swaps only `env.softboxes`, immutable, reading no finish colour —
      the "(dials, pose) → rig with no coupling to finish" guarantee, tested. 17 new specs.
      NOTE: the reflection-space panel geometry here is the documented starting shape; §4.2
      fine-tunes the exact panels visually under the final colour transform.
- [ ] 4.2 Shape the hero ¾, front, and back compositions in reflection space
      (chamfer rake / glass strip / horizon card); dials remain the override layer
- [ ] 4.3 Surface the active composition in the lighting cockpit (read-only name +
      reset-to-composition), reusing existing cockpit controls

## 5. Line-quality audit

- [ ] 5.1 Under the hero composition, orbit-sweep silver and black; if chamfer/wheel
      highlights band, raise the specific fillet segment counts until continuous
      (smallest geometry change that passes)

## 7. Export portability (the render must leave the phone people open the link on)

- [x] 7.1 Route the `/3d` still + clip delivery through the app's existing capability-aware
      channel (`deliverExportedBlob` → `planExportDelivery` → share/save/preview on mobile,
      direct download on desktop); stop using the iOS-hostile synthetic `downloadBlob`.
      Pure routing (`planExportDelivery`) unit-tested red/green (mobile never gets a
      synthetic download). FINDING: the app already had a full iOS-aware delivery stack
      (`export-utils.ts`/`export-delivery.ts`) used by 2D exports; the 3D path just bypassed
      it — the fix was wiring, not new infrastructure.
- [x] 7.2 Clamp the offscreen capture target size + MSAA samples to `gl.capabilities`
      (`maxTextureSize` / `maxSamples`) plus a mobile long-edge memory ceiling. Pure clamp
      fn `clampCaptureTarget` (`lib/export-target.ts`, caps → chosen dims/samples, aspect
      preserved) unit-tested 5/5. Applied to the high-res still (`captureHighRes`); the
      1080p clip target rides §7.4 with its codec work.
- [x] 7.3 Guard the still capture on `gl.getContext().isContextLost()` before read-back
      (throws a surfaced, non-fatal error routed through the export machine's FAIL → RESET,
      so a dropped mobile context yields a clean error, not a black file or a wedged veil).
- [x] 7.4 Clip codec fallback ladder: when WebCodecs H.264 at the requested profile is
      unsupported, step down (profile/resolution/bitrate) before failing, with honest
      messaging instead of a bare "Clips need Chrome/Edge". DONE: pure decision layer
      `lib/export/clip-codec-ladder.ts` — `buildClipTargetLadder` derives resolution rungs
      (1 / 0.75 / 0.5 long-edge, even dims, aspect held) with bitrate scaled to pixel count
      and floored at `MIN_CLIP_BITRATE` (2 Mbps); `resolveClipCodec(request, probe)` walks
      rung→profile (widest High 5.2 → Baseline 3.1), returns the first encodable config with a
      `steppedDown` flag, or throws `ClipCodecUnavailableError`. `recordIpodClip` now drives
      the ladder (injecting the real `VideoEncoder.isConfigSupported` probe) and renders/muxes
      at the resolved dims — a phone that can't do full-res 1080p H.264 gets a working 720p/540p
      clip instead of a hard fail. Messaging: the ladder-exhausted case surfaces the honest
      "This device can't encode H.264 clips"; the no-WebCodecs gate now reads "Clips need
      Chrome, Edge, or Safari 16.4+". Ladder is probe-injected → unit-tested red/green 9/9
      (full-res pass, resolution step-down proven by probing the top rung first, profile
      fall-through, throwing-probe resilience, exhaustion → null). typecheck + oxlint clean;
      full unit suite green (3 pre-existing Storybook-browser failures unrelated, measured
      identical without this change).

## 6. Launch gate

- [ ] 6.0 Assemble the reference board: real iPod classic studio photography
      (marketing + teardown shots) committed to the change as the ground-truth
      comparison target for the matrix
- [x] 6.1 Write the golden-matrix checklist doc (named poses × black/silver ×
      checklist items from the four spec deltas). DONE: `golden-matrix.md` in this
      change — a 6-pose × {black, silver} matrix (each pose paired with its
      `POSE_LIGHT_COMPOSITIONS` shape), with per-cell checklist items grouped by the
      four deltas (A color-pipeline/WYSIWYG, B screen recess+sweep+seam, C finish
      separation, D shaped-light + line continuity) plus a run-once export-portability
      block (§7) and a sign-off record. Doubles as the §6.2 evidence artifact: the gate
      rule is 12/12 cells + 3/3 portability committed before the public link ships.
- [ ] 6.2 Run the matrix in a dedicated visual session (chrome-devtools MCP; user-
      summoned per testing cadence); record results in the change; fix-and-recheck
      any failing cell

Dependencies: 0 before everything (materials and compositions must be tuned under
the final transform, or they get tuned twice); 1 before 2 (seam must be gone before
treatments are judged); 3 and 4 are parallel; 5 needs 4's hero composition; 6 is
last and gates the public link.
