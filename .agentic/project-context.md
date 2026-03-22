# Project Context

## Summary

This repository now contains a working first version of the dashboard application.

The near-term goal is to strengthen that first version into a more complete authenticated product shell.
The longer-term goal is to support richer dashboard features, user management, and data pulled from external systems.
It also serves as a lightweight reference project for evaluating agentic coding in day-to-day development, including work done in short, interrupted sessions.

## Current Direction

- start with Next.js
- use Tailwind CSS for UI styling
- begin with a simple login flow
- use Prisma as the first ORM and schema tool
- use SQLite as the first database in development
- preserve a smooth migration path to PostgreSQL later
- keep room for future OIDC-based authentication
- expect external API data to be cached locally instead of fetched live on every page load

## Current Repository Shape

- Next.js App Router scaffold created under `src/app`
- Tailwind CSS v4 configured through `globals.css` and PostCSS
- public login route at `/login` backed by a local credentials flow
- protected route group under `src/app/(app)` guarded by a shared layout auth check
- dashboard route at `/dashboard`
- store detail route at `/stores/[storeId]`
- placeholder protected routes at `/users`, `/integrations`, and `/settings`
- retail BI schema added to Prisma for stores, catalog, orders, daily metrics, traffic, and scenario-tagged alerts
- deterministic retail seed simulator added under `prisma/seed.ts`
- dashboard overview now shows KPI tiles, store ranking, category mix, top products, and an insight panel
- alert rows have already been replaced by explainable insight cards built from deterministic rules
- store detail pages now show store-scoped KPIs, benchmark comparisons, top products, and scoped insights
- shared UI and layout components under `src/components`
- dashboard-specific UI components live under `src/features/dashboard`
- store-specific UI components live under `src/features/stores`
- domain-first expansion path documented under `src/features`
- shared infrastructure area documented under `src/lib`
- dependencies installed with npm
- lint, typecheck, and production build verified successfully
- Vitest and React Testing Library configured for unit and component tests
- API route for KPI timeseries data protected by auth and used by the dashboard chart
- Prisma 7 configured with `prisma.config.ts`, explicit client generation, and a SQLite driver adapter
- first `User` model added for local-auth-first development
- retail KPI query helpers added under `src/lib/kpi`
- KPI date/calculation and formatting helpers covered by unit tests
- local credentials login implemented with a signed session cookie
- demo user seed script added for local development

## Current Working Baseline

- local login redirects authenticated users into the protected app area
- protected pages and protected KPI API reads re-check current user state before serving data
- the seeded retail dataset is rich enough to exercise dashboard and store-detail flows consistently
- placeholder admin routes exist so navigation structure is already visible, even where product behavior is not yet built
- test coverage currently focuses on auth helpers, KPI logic, API auth behavior, and key UI components

## Architectural Principles

- keep the first version small and understandable
- separate app routing, domain logic, and infrastructure concerns early
- treat authentication as a subsystem that may evolve
- keep persistence access behind a shared Prisma client under `src/lib/db`
- prefer explicit generated-client imports and adapter-backed database access over legacy implicit Prisma setup
- keep the first auth flow intentionally small: local password verification plus cookie session, without introducing a full auth library yet
- re-check user status at protected server entrypoints instead of trusting cookie validity alone
- prefer pre-aggregated daily metrics for top-level dashboard KPIs and reserve order-level reads for drilldowns
- prefer local persistence for dashboard reads when integrating external systems
- avoid introducing a separate NoSQL database until a real need appears

## Likely Future Concerns

- role-based access
- user administration
- separate auth account, session, and verification models once real login lands
- replacing the local session implementation with Auth.js or OIDC-backed flows when needed
- integration credentials and sync scheduling
- background jobs for importing or refreshing external data
- auditability around sync state and authentication events
- selective denormalization or JSON storage for external payloads
- end-to-end coverage once real authentication and workflows exist

## Constraints

- decisions should remain easy to change
- early documentation should guide implementation, not lock it down too tightly
- early schema choices should stay portable between SQLite and PostgreSQL
- process learnings about agentic coding should be easy to capture incrementally and later distill into durable guidance
- in this greenfield reference project, prefer latest stable dependencies unless compatibility constraints or an explicit project decision justify otherwise
