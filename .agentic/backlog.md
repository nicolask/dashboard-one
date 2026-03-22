# Backlog

## Near Term

- implement **T18b** — controlling KPI layer (`getDailyStoreCostSummary`, profit = marginAmount − totalCost) — depends on T18a
- implement **T19** — tier insight narratives into active vs. historical context (underlying scenario work complete with T16)
- add the first follow-on Prisma migration when new auth tables land instead of editing the initial migration in place
- move font loading from CSS imports to `next/font`
- introduce Playwright once login, redirects, and protected-route behavior are stable enough for end-to-end auth coverage
- add a short agent-facing environment reference in `.agentic/` for required variables, seed commands, and local auth expectations
- fix the current repo-wide `tsc --noEmit` blocker in `src/lib/db/retail-seed.test.ts` (`unknown` access errors), which currently prevents a clean global typecheck even though T20-specific checks pass

## Soon After

- scenario timeline interactivity: clicking a scenario band on `ScenarioTimeline` could highlight the corresponding `InsightPanel` card in-page instead of only linking to the store drilldown (requires a Client Component with shared state or URL hash coordination)


- zero-growth display in StoreRankingTable: stores with no previous-period data show `"0.0 %"` which looks like flat growth rather than missing history — consider rendering `"—"` when `revenueGrowth === 0` and the store has no prior data (requires distinguishing zero-growth from no-data in `StoreRankingEntry`)
- period comparison for category mix and top products: evaluate whether to show period-over-period delta for CategoryPerformanceList and TopProductsTable; requires extending the in-memory OrderItem aggregation path and deciding on placement (overview vs. store drilldown only); likely its own task
- category-level insights: extend the insights engine to generate scenario-aware sentences for category performance (e.g. "Beauty showing above-average growth since Promo Week start") — requires OrderItem aggregation by category, separate from DailyStoreMetric path
- document environment variables and local setup
- document the migration path from Railway demo hosting on SQLite to PostgreSQL once multi-instance deployment matters
- plan migration path from local auth to OIDC
- add chart-level "Info" affordances that explain KPI and trend calculation rules in human-readable language
- add auth-specific Prisma models for sessions, external accounts, and verification flows when login behavior is real
- promote the signed-cookie session revocation limitation from backlog into durable auth documentation once the next auth round is implemented
- document SQLite to PostgreSQL migration caveats for IDs, text handling, and indexes
- replace the demo-user bootstrap with a real first-user onboarding or admin creation path
- document Prisma 7 upgrade and regeneration workflow for future agents once more database code exists
- revisit category and top-product query strategy if demo data volume grows beyond the current in-memory aggregation approach

## Later

- migrate from SQLite to PostgreSQL on Railway: change `provider` in schema, swap `PrismaBetterSqlite3` adapter for standard `PrismaClient`, remove `better-sqlite3`, re-run migrations against PG instance, re-seed — ideally before T18a lands on PostgreSQL-backed environments so the new enums/models start cleanly there; Railway injects `DATABASE_URL` directly, Prisma handles the rest



- mobile layout pass: dashboard is designed for desktop; investigate collapsing StoreBenchmarkRow reference lines (three per card → toggle or accordion), KPI grid stacking, and StoreRankingTable horizontal scroll on small screens — scope as a dedicated sprint once the core feature set stabilises
- employee drilldown view: store-level breakdown of headcount, hours worked, and staff cost contribution per role — data will exist after T18a is implemented; natural follow-on to the controlling layer; scope as a dedicated store detail section or separate page
- LLM-generated benchmark narrative: `StoreBenchmark` already carries `storeFormat`, `networkStoreCount`, `formatStoreCount`, `topQuartileStoreCount`, and all snapshot values — use these as a structured prompt payload to generate sentences like "Berlin Flagship liegt 12% über dem Durchschnitt der 8 Flagship-Stores, aber Conversion ist unterdurchschnittlich"; consider whether this extends InsightPanel or becomes a separate narrative block on the store detail page
- add external system integration patterns
- define caching and sync models
- evaluate background job execution options
- move from SQLite to PostgreSQL when justified
- introduce audit and admin tooling
- add `error.tsx` and `not-found.tsx` pages that match the app shell
- add `next/navigation` test mocks when components start using router/pathname hooks

## Open Questions

- how soon background processing will be needed for integration syncs
- whether a root landing page should remain or redirect once auth becomes real
- whether email uniqueness should stay application-normalized or move to a database-backed case-insensitive strategy when PostgreSQL is introduced
- when to move from signed cookie sessions to database-backed sessions or Auth.js

## Completed

See `.agentic/completed.md`.
