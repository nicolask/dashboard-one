# Decisions

## 2026-03-21

### Tailwind CSS over Bootstrap

Chosen because the project is expected to grow beyond a generic admin look and benefit from a more flexible design system over time.

### Agent documentation entry point

Created `AGENTS.md` as the top-level guide for coding agents and `.agentic/` as the home for durable project context, decisions, and planning notes.

### Manual Next.js scaffold before runtime setup

Created a Next.js App Router project structure with Tailwind CSS, TypeScript, route groups, and shared component areas directly in the repository.

This keeps momentum even though the current shell environment does not yet expose Node.js or npm, which are still needed before the app can be installed and run.

### Vitest as the first testing layer

Added Vitest with React Testing Library for the initial unit and component test setup.

This fits the current Next.js application shape well and gives fast feedback for reusable components and synchronous pages. End-to-end coverage can be added later for authentication and integration flows.

### Prisma with SQLite as the first persistence layer

Added Prisma as the first ORM and schema management layer, backed by SQLite for local development.

This creates a clear path for evolving the data model while keeping the initial setup light. Prisma also preserves a cleaner migration path toward PostgreSQL than ad hoc SQL would at this stage.

### User model starts with auth basics, not a full auth graph

Introduced an initial `User` model with a string primary key, unique email, optional password hash, verification and login timestamps, and a small account status enum.

This supports a local credentials-style login later without forcing a full session, account-provider, or OIDC schema before those flows are implemented. The intentional tradeoff is that external identity tables still need to be added when real auth work begins.

### Prisma 7 conventions over legacy Prisma client setup

Upgraded the project to Prisma 7 and adopted the explicit `prisma-client` generator, `prisma.config.ts`, and the SQLite driver adapter.

This keeps the reference implementation aligned with Prisma's current architecture instead of carrying forward the older implicit `@prisma/client` generation model. The tradeoff is a slightly more explicit setup, but that explicitness is now part of the intended modern baseline.

### Local credentials before Auth.js

Implemented the first login flow with local password verification against the `User` table and an HTTP-only signed session cookie.

This gives the project a real end-to-end auth path without forcing a full Auth.js or OIDC integration before the rest of the app is ready. The deliberate tradeoff is that session persistence and provider-account modeling are still deferred to a later auth expansion.

### Signed cookie sessions require repeated status checks on protected entrypoints

The current signed JWT cookie can remain valid until expiry, even if the corresponding user is later disabled.

The mitigation for now is to re-check the user's active status on every protected page, server action, or API route entrypoint that relies on the session. The tradeoff is some repeated lookup cost, but it keeps disabled accounts from silently retaining access while the project still uses simple cookie-backed sessions.

### Prefer latest stable dependencies in greenfield work

For this repository, the default should be to choose current stable dependency versions and modern runtime baselines instead of older majors picked for short-term convenience.

Because the project is intentionally greenfield and also serves as an agentic-coding reference, avoid opportunistic major-version downgrades unless there is a clear compatibility reason and that reason is documented.

### Shared UI interaction guidance lives in `.agentic/ui-guidelines.md`

Captured the current button, link, hover, focus, motion, and contrast choices in `.agentic/ui-guidelines.md`.

This keeps the visual language reusable as more dashboard components are added, without turning the early project into a heavy design system too soon.

### `cn()` now uses `clsx` plus `tailwind-merge`

Replaced the local truthy-string join helper with a `clsx` plus `tailwind-merge` wrapper before more shared UI components depend on `className` overrides.

This keeps component composition ergonomic while preventing conflicting Tailwind utilities from accumulating silently as the UI surface grows. The added dependency cost is small, and making the change early avoids a noisier migration later.

### Retail BI demo data uses a deterministic Prisma seed

Added a seeded retail simulator under `prisma/seed.ts` that creates stores, categories, products, daily metrics, orders, and scenario-tagged anomalies from a fixed seed value.

This gives the dashboard a reproducible demo dataset for local development and reviews. The tradeoff is that demo realism is limited by the scripted heuristics, but the repeatability is more valuable at this stage.

### Dashboard KPIs read from pre-aggregated daily metrics, not live order joins

Implemented the KPI query layer so revenue, orders, average basket, conversion, rankings, and alerts read primarily from `DailyStoreMetric`, while category and top-product drilldowns still use order-level data.

This keeps top-level dashboard reads simple and fast for the intended BI workflow, while preserving order detail where drilldowns actually need it. The tradeoff is that seed and aggregation consistency matter more, so KPI checks and query boundaries should stay explicit.

### Point-in-time snapshot data lives in a plain data module, not in the component

Introduced `src/features/agentic/snapshot-data.ts` as a React-free data module that drives the Agentic Audit page. All values — LOC counts, time estimates, task breakdowns, conditions text, token estimate — live there. The component only maps over it.

This creates a clean update contract: future LOC snapshots require editing exactly one file (no component knowledge needed), and the data is testable independently of the UI. The tradeoff is that the data is static rather than computed at runtime, which is intentional for a point-in-time audit.

### SVG-based timeline bar instead of CSS absolute positioning

The `ScenarioTimeline` strip renders the coloured scenario bands as SVG `<rect>` elements inside a fixed `viewBox`, with a transparent overlay layer for interactive links.

CSS `absolute` child divs were tried first but produced sub-pixel rounding artefacts in Safari — bands misaligned or disappeared at certain viewport widths. SVG with `preserveAspectRatio="none"` resolves this because the browser scales the coordinate space rather than rounding individual percentage widths. The tradeoff is a slightly more complex component (two rendering layers: SVG for visuals, div overlay for interaction), but the cross-browser consistency is worth it.

### ScenarioTimeline and InsightPanel operate on different time horizons

`ScenarioTimeline` always queries the full 120-day seeded window, independent of the day-range filter. `InsightPanel` / `getActiveInsights` uses a 30-day rolling window.

This means a historical scenario (e.g. a traffic surge from 60 days ago) can appear in the timeline strip but produce no active insight card — intentionally. The timeline is a historical record; the insight panel is a current-state alert surface. Forcing old scenarios into the 30-day window to generate insight cards would blur that distinction and make the data feel artificially recent.

If a future task wants insight narratives for older scenarios, the right lever is to widen the insight window as a product decision, or add a separate "historical narrative" surface — not to contort seed dates.

### Railway-first demo deployment path keeps the current SQLite setup intact

Prepared the project for simple Railway deployment by relying on a persistent mounted volume for the SQLite database, automatic `prisma generate` during install, and a pre-deploy migration plus demo seed step.

This preserves the current low-friction demo architecture without forcing an early move to PostgreSQL or a larger hosting setup. The tradeoff is that the first hosted demo remains single-instance and SQLite-bound until a future database migration is warranted.

For Railway specifically, the deploy flow is cleaner when migration runs in pre-deploy, but the start command should still be able to self-heal by applying migrations and seeding missing demo data before launching Next.js.

## 2026-03-23

### `/` redirects to `/login`; login page doubles as product landing

The scaffold-era root page is retired. `/` now redirects to `/login`. The login page is
restructured as a two-column layout: intro content on the left (project description, capability
list, compressed agentic teaser), login form on the right.

The intent is that login remains the functional core and entry point. The intro content exists
so the page reads as a product demo rather than a developer scaffold — without exposing any
dashboard data before authentication.



### Forecast engine uses a strategy pattern with a per-store model registry

The forecast engine (T23b) resolves the active prediction algorithm at runtime
from a `StoreForecastConfig.modelSlug` field, via a central `getModel(slug)`
registry. Adding a new model requires implementing `ForecastModel` and one line
in the registry — no changes to the engine orchestrator, the execution layer,
or any API route.

This was chosen over a global config or per-run argument because per-store
selection is the right granularity for a retail tool (different stores may have
different data maturity), and the settings UI surface already exists as T22.

### No message queue — execution path is a DB job table plus a direct function call

The forecast execution layer (T23c) uses a `ForecastJob` table to track run
state and calls the engine function directly from the API route. There is no
background worker, no event bus, and no queue service.

The seed calls the engine function directly (not via HTTP) using
`triggeredBy: "seed"`. A standalone script (`scripts/run-forecasts.ts`) serves
as the hook point for future automation.

This was explicitly chosen to keep the evaluation focused on prediction logic,
not infrastructure. The event flow is traceable through code and DB without
requiring any running service beyond the Next.js app.

### External API data is cached in the local DB, never fetched at request time

Weather (Open-Meteo) and school holiday (ferien-api.de) data is fetched by a
standalone refresh script and written to `WeatherObservation` / `SchoolHoliday`
tables. The engine reads only from these tables. This is consistent with the
existing `project-context.md` principle and avoids latency or rate-limit risk
on dashboard reads.

### `state` (Bundesland) added to `Store` separately from `region`

`Store.region` ("Nord"/"Süd"/"Ost"/"West") is a business-defined sales zone
and cannot be used to look up school holidays. A separate `state` field holds
the two-letter Bundesland abbreviation (e.g. `"BY"`, `"NW"`). Both fields
coexist — they answer different questions.

## 2026-03-22

### Insight cards are split into active and historical tiers with a 7-day threshold

`InsightPanel` separates insights into two display tiers: *active* (scenario's latest alert date within 7 days of the query window end) and *historical context* (older than that). Insight rule wording switches tense accordingly — present tense for active, past tense with an explicit date range for historical. The 7-day constant (`ACTIVE_THRESHOLD_DAYS`) is a product decision, not a technical default, and should not be changed without considering the narrative consequences across all four scenario rules and the fallback.

Section headers ("Active alerts" / "Historical context") are only rendered when both tiers are non-empty; a store with a single insight tier sees no header.

### Profit is defined as gross margin minus operating costs, not revenue minus operating costs

`profit = sum(marginAmount) − sum(totalCost)` throughout the controlling layer.

Using `revenue − totalCost` was rejected because it ignores COGS already captured in `marginAmount`, producing artificially high "profit" figures (55–65% for large stores). The EBIT-equivalent formula keeps the P&L internally consistent: all cost layers are subtracted from gross profit, not from top-line revenue.

Consequence: the `getCostKpis` function joins `DailyStoreCost` with `DailyStoreMetric` and accumulates `marginAmount` alongside cost fields. Any future P&L metric that derives profit must follow this convention.

### Cost KPI deltas are inverted before passing to KpiCard

`KpiCard` colours positive deltas emerald and negative deltas rose, assuming higher = better. Cost metrics invert this: `totalCost` and `costRatio` are passed as `-deltaPercent` / `-delta` so rising costs render as rose and falling costs as emerald. Productivity and profit metrics (`profit`, `revenuePerStaffHour`) use the natural sign.

This convention lives in the page layer, not in `KpiCard` itself. `KpiCard` remains sign-agnostic.

### Operating costs use a second pre-aggregated daily fact table

Added `DailyStoreCost` plus deterministic employee/worklog seed data instead of deriving staff and operating costs ad hoc from transactional rows.

This mirrors the existing `DailyStoreMetric` approach: revenue and gross margin remain pre-aggregated for simple dashboard reads, and operating costs now follow the same pattern so profit and productivity KPIs can be joined in the KPI layer without complex runtime aggregation. The tradeoff is extra seed/model surface area, but the query path stays clearer and more portable across SQLite and PostgreSQL.
