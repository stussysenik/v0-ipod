# Change: iPod Content Feed Manifest (White-Label Substrate)

## Why

For the iPod to be an embeddable, white-label, "RSS-of-design-engineering" artifact, its content must be data, not hardcoded JSX. A single declarative manifest (works, assets, links, theme tokens) lets one element render any portfolio: swap the feed + tokens, get a new branded instance. This is the substrate the browser IA, the Lit element, and `/portfolio` all consume.

## What Changes

- Define a versioned JSON **feed schema** (`IpodFeed`): `meta`, `theme` tokens, `menu` tree, `works[]` (slug, title, summary, cover, body/links — each a self-contained "link-bio preview"), `assets[]`.
- Add a **Zod schema + loader** (`lib/feed/`) that validates a feed and returns a typed, normalized model; invalid feeds fail loudly with field-level errors.
- Ship a canonical example feed used by tests and the default render.
- Theme tokens map to CSS custom properties consumed by the keep-out stage (container-query layer), enabling white-labeling without code changes.

## Impact

- Affected specs: `content-feed` (new capability)
- Depends on: `refactor-stage-keepout-zones` (tokens feed the stage container layer)
- Affected code: `lib/feed/schema.ts`, `lib/feed/load.ts`, `lib/feed/example.ts`, `tests/feed.spec.ts`
