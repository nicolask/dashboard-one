# Project Context

## Summary

This repository now contains the first scaffold of a dashboard application.

The near-term goal is to turn that scaffold into a simple authenticated product shell.
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
- public login placeholder route at `/login`
- public login route at `/login` backed by a local credentials flow
- protected dashboard route at `/dashboard`
- retail BI schema added to Prisma for stores, catalog, orders, daily metrics, traffic, and scenario-tagged alerts
- deterministic retail seed simulator added under `prisma/seed.ts`
- dashboard overview now shows KPI tiles, store ranking, category mix, top products, and an alert panel
- shared UI and layout components under `src/components`
- dashboard-specific UI components live under `src/features/dashboard`
- domain-first expansion path documented under `src/features`
- shared infrastructure area documented under `src/lib`
- dependencies installed with npm
- lint, typecheck, and production build verified successfully
- Vitest and React Testing Library configured for unit and component tests
- Prisma 7 configured with `prisma.config.ts`, explicit client generation, and a SQLite driver adapter
- first `User` model added for local-auth-first development
- retail KPI query helpers added under `src/lib/kpi`
- KPI date/calculation and formatting helpers covered by unit tests
- local credentials login implemented with a signed session cookie
- demo user seed script added for local development

## Architectural Principles

- keep the first version small and understandable
- separate app routing, domain logic, and infrastructure concerns early
- treat authentication as a subsystem that may evolve
- keep persistence access behind a shared Prisma client under `src/lib/db`
- prefer explicit generated-client imports and adapter-backed database access over legacy implicit Prisma setup
- keep the first auth flow intentionally small: local password verification plus cookie session, without introducing a full auth library yet
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
