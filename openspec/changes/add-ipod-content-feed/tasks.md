## 1. Schema & loader

- [x] 1.1 `lib/feed/schema.ts` — Zod `IpodFeed` (meta, theme tokens, menu tree, works[], assets[]), versioned
- [x] 1.2 `lib/feed/load.ts` — validate + normalize to typed model, slug index, field-level errors
- [x] 1.3 `lib/feed/example.ts` — canonical example feed
- [x] 1.4 Map theme tokens → CSS custom properties helper (`lib/feed/theme.ts`)

## 2. Tests

- [x] 2.1 `lib/feed/schema.test.ts` (co-located in the unit project, per repo convention) — valid feed normalizes; invalid feed rejects with field errors; theme tokens emit CSS vars
- [x] 2.2 `pnpm vitest run --project unit lib/feed` green (11/11)

## 3. Gates

- [x] 3.1 `pnpm test` green (399/399) · `pnpm type-check` green · `pnpm lint` 0 errors · `pnpm build` green
