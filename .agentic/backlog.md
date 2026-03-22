# Backlog

## In Progress

- T8: Alert Panel UX — collapsible panel with summary chips, pretty scenario labels with emoji (task: `.agentic/tasks/T8-alert-panel-ux.md`)

## Near Term

- add the first follow-on Prisma migration when new auth tables land instead of editing the initial migration in place
- move font loading from CSS imports to `next/font`
- introduce Playwright once login, redirects, and protected-route behavior are stable enough for end-to-end auth coverage

## Soon After

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
