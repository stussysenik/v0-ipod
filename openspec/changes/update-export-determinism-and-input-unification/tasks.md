## 1. Investigation
- [x] 1.1 Reproduce export differences for loaded snapshot vs placeholder content in local Chromium.
- [x] 1.2 Document root cause for ghost/clipped shadow artifacts in detached/live capture paths.
- [x] 1.3 Record runtime build/version and export pipeline diagnostics for comparison.

## 2. Implementation
- [x] 2.1 Make export capture deterministic by removing artifact-prone styling during detached capture and enforcing export-safe visuals.
- [x] 2.2 Ensure final exported frame is identical in structure for both placeholder and loaded snapshot artwork paths.
- [x] 2.3 Replace interruptive success toasts with muted inline or low-priority feedback while keeping retryable error messaging.
- [x] 2.4 Unify wheel and editing interactions around pointer-safe behavior across desktop/mobile.
- [x] 2.5 Add fixed-position touch editing surface for metadata/time/track fields.

## 3. Verification
- [x] 3.1 Add or update Playwright coverage for touch editing and export UI state transitions.
- [x] 3.2 Run test suite for interaction/mobile regressions.
- [x] 3.3 Validate manual export behavior in Chrome DevTools and confirm localhost runtime output.
