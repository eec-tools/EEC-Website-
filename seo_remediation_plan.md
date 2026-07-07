# EECTrade.com — SEO/GEO Remediation Execution Plan
### One-shot instruction set for Claude Code (execute sequentially, do not skip steps)

**Context for the agent:** This site (eectrade.com) is currently a pure client-side-rendered (CSR) app. Fetching the raw HTML returns only `<body>You need to enable JavaScript to run this app.</body>` — no content, no links, no metadata in the initial response. This makes the site invisible to Googlebot's first crawl wave and completely invisible to GPTBot, ClaudeBot, and PerplexityBot, which never execute JavaScript at all. The goal of this plan is to make all public-facing content available in the initial server HTML response, without breaking the existing user experience.

Execute the phases in order. Do not start Phase 2 until Phase 1 is verified. Report back after each phase with what changed and what still needs a human decision (e.g. hosting/deploy provider choice, content copy).

---

## PHASE 0 — Audit (do this first, always)

1. Inspect the repo root: identify the framework (React CRA / Vite / plain React / other), routing library (React Router, etc.), and build tool.
2. Identify how `<title>`, meta description, canonical tags, and Open Graph tags are currently set — grep for `document.title`, `react-helmet`, `<Helmet>`, or any client-side head manipulation.
3. Identify how internal navigation is implemented — grep for `onClick` used for page navigation vs. real `<a href>`/`<Link>` usage.
4. List every route/page currently in the app (from the router config).
5. Run a production build and report the compiled JS bundle size per route.
6. Output a short summary: framework, routing method, current metadata handling, bundle sizes, and total route count. **Stop here and report this before continuing** — this determines the exact migration path in Phase 1.

---

## PHASE 1 — Framework migration to SSR/SSG

1. Scaffold a new Next.js (App Router) project alongside the existing repo, or convert in place if the audit shows it's feasible without a full rewrite.
2. Migrate routes in this order, from highest business priority to lowest:
   - Homepage
   - Core service/offering pages (whatever eectrade.com's sourcing/procurement service pages are)
   - About / company / trust pages
   - Any supplier or category listing pages
   - Contact / quote-request pages
3. Classify each route:
   - **Static, rarely changes** → use Static Site Generation (SSG) — pre-rendered at build time.
   - **Dynamic / data-driven** (e.g. supplier listings, live data) → use Server-Side Rendering (SSR) — rendered per request on the server.
4. For every page, move `<title>`, meta description, canonical URL, and Open Graph tags into server-side metadata generation (Next.js `generateMetadata` or framework equivalent). Confirm none of these are set via client-side JavaScript after page load.
5. Replace any JavaScript-driven internal navigation with real anchor tags (`<Link>` in Next.js, which compiles to real `<a href>`).
6. Rebuild and fetch the raw HTML of each migrated route directly (curl or equivalent, no JS execution) to confirm the actual page content — headings, body text, links — is present in the raw response, not just the shell.
7. **Verification gate:** Do not proceed to Phase 2 until every migrated route passes step 6.

---

## PHASE 2 — Structured data and content signals

1. Add server-rendered JSON-LD structured data in the HTML `<head>` (not injected via a tag manager) for:
   - `Organization` schema on the homepage
   - `Service` schema on each service/offering page
   - `BreadcrumbList` schema on category/listing pages
2. Confirm this JSON-LD appears in the raw HTML fetch (same test as Phase 1 step 6) — if it only appears after JS execution, it's invisible to AI crawlers and must be moved to server rendering.
3. Audit body copy on each migrated page: flag any page with under ~150 words of substantive text, or any page where content only appears after a user interaction (tab click, accordion, "load more"). Report these for a content-writing pass — this plan does not write marketing copy, it flags where copy is missing.

---

## PHASE 3 — Performance and Core Web Vitals

1. Identify the Largest Contentful Paint (LCP) element on each key page (usually a hero image or heading). Ensure it's present in server HTML, not lazy-loaded, and add `fetchpriority="high"` to LCP images.
2. Add explicit `width` and `height` attributes to every image to prevent layout shift (CLS).
3. Find any single script execution task exceeding ~50ms on the main thread (via build/profiling tools available in the repo) and break it into chunks using `requestIdleCallback` or defer non-critical scripts (chat widgets, analytics, trackers) so they don't block initial render.
4. Confirm total initial compressed JS bundle per route is under ~200KB. Flag and code-split anything larger.

---

## PHASE 4 — Bot-facing stopgap (run in parallel with Phase 1, not after)

1. While the full migration is in progress, write an edge middleware (Cloudflare Worker, or Next.js middleware if already on Next.js) that detects known crawler user-agents (Googlebot, GPTBot, ClaudeBot, PerplexityBot, Bytespider) and serves the fully rendered HTML snapshot for already-migrated routes.
2. This is temporary — remove it once all routes are natively SSR/SSG and verified in Phase 1 step 6.

---

## PHASE 5 — Verification tooling (build once, run monthly after)

1. Write a small script (Playwright or Puppeteer) that, for a given list of URLs:
   - Fetches raw HTML (no JS execution)
   - Fetches fully rendered DOM (with JS execution)
   - Diffs word count, link count, and title/canonical values between the two
2. Output a report flagging any route where the raw-HTML word count is significantly lower than the rendered word count — this means content is still hiding from non-rendering crawlers.
3. Add this script to CI (or a scheduled job) so future regressions are caught automatically, not discovered months later.

---

## PHASE 6 — Submission and monitoring (human + agent shared step)

1. Generate/update the XML sitemap to reflect the final route structure and confirm it's accessible at `/sitemap.xml`.
2. Report to the human: sitemap is ready to submit in Google Search Console, and which specific URLs should get a manual "Request Indexing" via URL Inspection first (highest business-value pages).
3. Recommend re-running Phase 5's diff script weekly for the first month post-migration, and monthly after that.

---

## Definition of done for this whole plan
- Every public route returns full page content, correct metadata, and JSON-LD in the raw HTML response (verifiable with a plain `curl`, zero JS execution).
- No route's initial JS bundle exceeds ~200KB compressed.
- No long task exceeds ~50ms on the main thread for key interactions.
- A repeatable script exists to catch any future regression back into CSR-only content.
