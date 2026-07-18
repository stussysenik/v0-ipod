# Golden-matrix launch gate — `update-render-fidelity-launch-gate`

The public/ProductHunt link ships **only** after every cell below passes, in a
dedicated visual session (chrome-devtools MCP, user-summoned per testing cadence).
This file is both the **checklist** (§6.1) and the **evidence record** (§6.2): run
the matrix, tick each item, and commit the filled-in result as the launch proof
required by the `launch-readiness` spec. A single failing item blocks launch until
that cell passes on re-check.

> Ground truth for every visual judgement is the reference board assembled in §6.0
> (real iPod classic studio + teardown photography). Compare against the photo, not
> against memory.

## The matrix

Six named camera poses (`lib/studio-camera-poses.ts`) × the two finishes that stress
the render hardest (**black** — the void/separation risk; **silver** — the
highlight-continuity risk). Each pose sits on its shaped light composition
(`POSE_LIGHT_COMPOSITIONS`, `lib/studio-lighting-config.ts`).

| Pose | Azimuth / Elevation | Composition | Black | Silver |
| --- | --- | --- | :---: | :---: |
| Front (`front`) | 0° / 0° | Even Wash | ☐ | ☐ |
| Right (`right`) | 90° / 0° | Right Edge Rake | ☐ | ☐ |
| Back (`back`) | 180° / 0° | Horizon Card | ☐ | ☐ |
| Left (`left`) | −90° / 0° | Left Edge Rake | ☐ | ☐ |
| Top (`top`) | 0° / 70° | Overhead Soft | ☐ | ☐ |
| Hero ¾ (`hero`) | 20° / 12° | Chamfer Rake | ☐ | ☐ |

Tick a cell only when **all** of its per-cell checklist items below pass.

## Per-cell checklist (applied to every cell)

Derived from the four render-fidelity spec deltas. For each pose × finish:

**A. Color pipeline — `3d-color-pipeline` (§0)**
- [ ] A1 Live `/3d` view matches the exported still's tone on this cell (WYSIWYG —
      no lift/crush between screen and capture).
- [ ] A2 On **black**, the body keeps hue and form — it reads as a dark anodized
      surface, **not** a flat void (dark-lift + specular separation doing their job).
- [ ] A3 No blown/clipped highlight on **silver** (the Neutral shoulder compresses
      toward — never to — white).

**B. Screen integration — `3d-screen-integration` (§1–§2)**
- [ ] B1 The screen shows a visible **recess boundary** against the bezel (reads
      inset, not pasted).
- [ ] B2 The **glass sweep** is consistent with the camera azimuth (`resolveGlassSweep`)
      and matches the exported capture's glass treatment.
- [ ] B3 **No seam artifact** — no green edge haze or any WebGL specular/emissive
      leaking past the DOM screen bounds (the 2026-07 mobile regression stays gone).
- [ ] B4 Inline editing still works (tap title/artist/album/rating).

**C. Finish material response — `3d-finish-material-response` (§3)**
- [ ] C1 Wheel / ring / face **separation is legible** — the wheel is never
      illegible against the face on black (env-response floor + fixed separation gap).
- [ ] C2 Glyphs and the select button read at their designed contrast for this finish.

**D. Shaped light + line quality — `3d-shaped-light-compositions` (§4–§5)**
- [ ] D1 The composition's signature highlight is present and correctly placed
      (chamfer rake on hero, horizon card on back, edge rake on the side poses, etc.).
- [ ] D2 Chamfer / wheel / fillet highlights are **continuous** — no visible facet
      banding along a curved edge (bump fillet segment counts if they band, §5.1).

## Export portability — `3d-export-portability` (§7) — run once, not per cell

- [ ] E1 High-res **still** opens on a phone via the share/save sheet (no silent
      synthetic-download failure) — desktop still gets a direct download.
- [ ] E2 **Clip** records and delivers on desktop; on a device that can't encode
      full-res 1080p H.264 it **steps down** (720p/540p) rather than hard-failing
      (`resolveClipCodec` ladder).
- [ ] E3 Honest failure messaging where encoding is genuinely impossible
      ("This device can't encode H.264 clips" / "Clips need Chrome, Edge, or
      Safari 16.4+") — never a black file or a wedged veil.

## Result — sign-off (§6.2)

Fill on completion and commit as the launch evidence.

- **Date run:** _____
- **Build / commit:** _____
- **Device(s) / browser(s):** _____
- **Cells passed:** ___ / 12  · **Export portability:** ___ / 3
- **Failing cells + fixes applied (fix-and-recheck):**
  - _____
- **Verdict:** ☐ LAUNCH APPROVED  ☐ BLOCKED

> Gate rule: launch is approved only when the matrix is 12/12, export portability is
> 3/3, and this block is committed to the change.
