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
- [ ] 0.2 Switch the canvas and export renderers to `THREE.NeutralToneMapping`;
      keep `toneMapped={false}` on the WYSIWYG surfaces that must stay raw
      (stage backdrop, baked screen); rebalance rig intensities against the new
      shoulder; export continuity tests green
- [ ] 0.3 Centralize the device-render color path: audit (ast-grep) for hardcoded
      hex in material definitions, route survivors through the manifest resolve,
      add the coverage guard test

## 1. Kill the seam (screen artifacts)

- [ ] 1.1 Reproduce the green edge haze: identify which WebGL element (glass plane,
      bezel, or LCD plane catching a Lightformer/spot) leaks past the DOM overlay at
      the failing pose; record the pose params in the change
- [ ] 1.2 Fix the leak (z-order/clip/material cutoff) so no specular escapes the
      screen bounds at any pose; re-check the failing pose
- [ ] 1.3 Verify export captures are unaffected (existing export continuity tests
      stay green)

## 2. Screen recess + glass sweep (DOM treatments)

- [ ] 2.1 Write the pure sweep function: (camera azimuth/elevation) → CSS gradient
      params; vitest red/green on boundary angles
- [ ] 2.2 Apply recess inner-shadow ring and sweep overlay to the DOM screen;
      pointer-events and inline editing unchanged
- [ ] 2.3 Match the WebGL export glass params to the CSS sweep so live ≈ export;
      extend the export continuity test if it can assert params

## 3. Finish material table

- [ ] 3.1 Write the finish table: finish luminance → per-part params (face, wheel,
      ring, glyphs) with documented env-response floor and wheel/face separation
      invariant; vitest asserts floor + monotonic separation across the full color
      manifest (red first against current 0.16/void behavior)
- [ ] 3.2 Wire the table into `three-d-ipod.tsx` materials (replace the hardcoded
      per-part constants); typecheck + oxlint clean

## 4. Per-pose light compositions

- [ ] 4.1 Add `POSE_LIGHT_COMPOSITIONS` to `lib/studio-lighting-config.ts` keyed by
      `studio-camera-poses` ids; selection as pure fn(pose) with vitest coverage
      (unknown pose → default rig)
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
- [ ] 7.4 Clip codec fallback ladder: when WebCodecs H.264 at the requested profile is
      unsupported, step down (profile/resolution/bitrate) before failing, with honest
      messaging instead of a bare "Clips need Chrome/Edge"

## 6. Launch gate

- [ ] 6.0 Assemble the reference board: real iPod classic studio photography
      (marketing + teardown shots) committed to the change as the ground-truth
      comparison target for the matrix
- [ ] 6.1 Write the golden-matrix checklist doc (named poses × black/silver ×
      checklist items from the four spec deltas)
- [ ] 6.2 Run the matrix in a dedicated visual session (chrome-devtools MCP; user-
      summoned per testing cadence); record results in the change; fix-and-recheck
      any failing cell

Dependencies: 0 before everything (materials and compositions must be tuned under
the final transform, or they get tuned twice); 1 before 2 (seam must be gone before
treatments are judged); 3 and 4 are parallel; 5 needs 4's hero composition; 6 is
last and gates the public link.
