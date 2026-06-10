# Scene Inspector Modules

The live inspector shell is split by ownership to keep the OpenSpec rollout incremental and readable.

- `scene-inspector-shell.tsx`: owns the trigger, dock/sheet framing, motion states, and staged placeholder sections.
- `scene-breadcrumbs.tsx`: owns selected-path labeling only.
- `ipod-classic.tsx`: still owns scene state, export state, and the migrated Stage 1 control groups until Stage 2 and Stage 3 move them into dedicated node panels.

Kumo import pattern:

- Prefer granular imports such as `@cloudflare/kumo/components/button` and `@cloudflare/kumo/components/collapsible`.
- The repo now uses Tailwind v4 with `@cloudflare/kumo/styles/tailwind` and an explicit `@source` entry in [app/globals.css](/Users/s3nik/Desktop/v0-ipod/app/globals.css).

Archive convention:

- Frozen reference implementations live under `components/ipod/archive/legacy-toolbox/`.
- Archived files are not imported by the live app unless an explicit debug path is added later.
