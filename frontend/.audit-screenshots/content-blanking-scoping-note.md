# Scoping note: content-blanking on slow connections

Not fixed. Written up for a dedicated session, per explicit instruction not to touch this
during the verification pass that found it.

## What's happening

1. `react-snap` prerendering works correctly — the raw HTML for all 6 marketing routes
   contains full, real content (verified directly in `build/*/index.html`).
2. `src/index.js` mounts the app with `ReactDOM.createRoot(...).render(...)`, not
   `hydrateRoot`. `createRoot` does not reuse existing DOM — it discards whatever is
   already there and renders fresh.
3. Every route in `App.js` is `React.lazy()`-loaded inside `<Suspense fallback={null}>`.

Net effect: the browser paints the prerendered HTML first (good — this is what a crawler
sees). Then React mounts, throws that content away, and shows nothing (`fallback={null}`)
until the route's lazy JS chunk finishes downloading and executing. On a fast connection
this gap is imperceptible. On a slow connection or throttled device it is not: measured
directly (not just Lighthouse's summary number) by sampling `#root` DOM size over time
under Lighthouse's standard mobile throttling profile (4x CPU slowdown, ~1.6 Mbps
network):

- Homepage: full content (59,180 chars) → drops to shell-only (22,220 chars) at ~5s →
  stays blank until ~15s → full content returns (59,215 chars).
- `/about`: same pattern (35,211 → 22,041 chars), confirmed not isolated to the pages
  Lighthouse flagged with high CLS — it's systemic across routes, just with different
  timing depending on chunk size.

This is what's driving the ~0.8 Cumulative Layout Shift scores seen on Home/Services/
For-Suppliers in Lighthouse (anything above 0.25 is "poor"). CLS is a Core Web Vitals
signal Google uses in ranking, so this is a real, user-facing regression risk on slow
connections/devices, not just a synthetic score.

Crawlers are unaffected — Googlebot and other crawlers read the initial HTML response
(the prerendered content), not the post-mount teardown-and-rebuild. This is a real-user/
Core-Web-Vitals problem, not a crawlability problem.

## Options

### Option A — Switch to `hydrateRoot`

Change `src/index.js` from `createRoot(...).render(...)` to `hydrateRoot(...)`. React
would then attach to the existing prerendered DOM instead of discarding it, so content
would stay visible continuously instead of blanking.

- **Trade-off**: this is the exact risk that was deliberately avoided when the
  prerendering work was first built. `createRoot` was chosen specifically *because* it
  sidesteps hydration-mismatch risk — if anything differs between what react-snap
  captured and what the client renders on first pass (timing-dependent content, any
  browser-only API reads during initial render, font-loading-driven layout differences,
  etc.), React logs hydration warnings/errors and can fall back to a client re-render
  anyway, potentially reintroducing some version of the same problem in a harder-to-
  predict way.
- Also, `hydrateRoot` combined with `React.lazy()` + `Suspense` has known rough edges in
  React 18 — if the lazy chunk isn't already resolved when hydration starts, the
  Suspense boundary can still suspend and show its fallback during hydration, which
  wouldn't fully eliminate the gap without additional work (e.g. tuning `Suspense`
  usage, possibly `startTransition`).
- **Effort**: small code change, but needs real cross-browser/cross-connection testing
  to confirm no hydration-mismatch warnings appear on any of the 6 routes before trusting
  it. Rough estimate: half a day including testing.

### Option B — Restructure the lazy-loading strategy

Keep `createRoot`, but change how routes are code-split so the teardown-and-rebuild
doesn't produce a visible blank gap — e.g. preloading the likely route's chunk before/
during the initial paint, or removing `React.lazy()` for the 6 marketing routes
specifically (since they're a small, fixed set, not dozens of rarely-visited admin
screens) so their code ships in the main bundle and is ready by the time React mounts.

- **Trade-off**: increases the main bundle size (some of what's currently deferred per-
  route would load upfront for every visitor, even ones who only look at one page).
  Doesn't carry hydration-mismatch risk the way Option A does.
- **Effort**: comparable to Option A — needs a bundle-size check before/after and a
  repeat of the same throttled-DOM-sampling test used to find this bug, to confirm the
  blank gap is actually gone rather than just shortened.

## Recommendation

Option B first. It avoids reopening the hydration-mismatch risk that `createRoot` was
deliberately chosen to avoid, and the trade-off (larger initial bundle for 6 pages) is
small and easy to measure directly, versus Option A's trade-off (hydration mismatches)
which is harder to fully rule out without extensive real-world testing across browsers
and connection speeds.
