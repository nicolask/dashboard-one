# dashboard-one

`dashboard-one` is a working retail BI dashboard demo and a reference project
for evaluating agentic software development in a realistic codebase.

It is not just a scaffold anymore. The repository already contains:

- a local credentials login with a protected app shell
- a seeded retail analytics dashboard with KPI cards, charting, insights, and
  store drilldowns
- a controlling layer for profit, cost ratio, and staff productivity KPIs
- an `/agentic` audit page that documents code volume, effort, and estimated
  speedup from agent-supported development
- a durable `.agentic/` workspace used to capture planning, decisions, backlog,
  and workflow learnings

The product surface is a dashboard, but the broader purpose is methodological:
this repo is meant to help evaluate which agentic workflows actually improve
development speed and quality, and where they still create friction, ambiguity,
or hidden costs.

## What This Project Is For

The repository serves two purposes at once:

1. Build a maintainable dashboard application that can grow from local auth and
   seeded demo data toward richer integrations, forecasting, and stronger
   identity management.
2. Act as a practical testbed for human-plus-agent delivery workflows:
   planning, implementation, review, handoff, documentation, and context
   management across interrupted work sessions.

That makes it useful both as a software project and as a working reference for
agentic development practice.

## Current Feature Set

Implemented today:

- local credentials login backed by a signed session cookie
- protected routes under `src/app/(app)`
- dashboard overview with:
  - revenue, orders, basket, and conversion KPIs
  - EBIT-like profit, operating cost, cost ratio, and revenue per staff hour
  - revenue timeseries chart
  - store ranking
  - category performance
  - top products
  - explainable insight narratives
  - scenario timeline
- store detail pages with store-scoped KPIs, benchmarks, top products, and
  insights
- deterministic retail BI seed data in Prisma/SQLite
- agentic audit page at `/agentic`
- unit and component tests with Vitest and React Testing Library

Visible but still intentionally incomplete:

- `/users`
- `/integrations`
- `/settings`

## Technology

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Prisma 7
- SQLite
- `better-sqlite3` Prisma adapter
- Vitest + React Testing Library
- Recharts

The current architecture is intentionally simple, but leaves room for:

- PostgreSQL later
- stronger auth or OIDC later
- cached external data sources
- forecasting and background execution flows

## Why The Agentic Focus Matters

This project is explicitly being used to evaluate agentic development under
realistic conditions.

Questions the repository is meant to help answer include:

- Which tasks are good fits for implementer agents?
- How much structure and specification do agents need to work well?
- When is a fresh context better than continuing an old thread?
- Which review workflows produce useful signal, and which mostly create noise?
- How should durable context be captured so work can continue across short,
  interrupted sessions?

The `.agentic/` directory is part of that experiment, not incidental project
clutter.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed-demo-data
npm run auth:seed-demo
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Local Login

The demo user is seeded from your local `.env`.

- Email: `demo@example.com`
- Password: see `DEMO_LOGIN_PASSWORD` in `.env`

If you change the demo credentials, run:

```bash
npm run auth:seed-demo
```

## Deployment Notes

For the current state of the project, Railway is the simplest hosting path.
The app runs server-side and can continue using SQLite when the database file is
kept on a persistent mounted volume.

### Railway Setup

1. Connect the repository to Railway.
2. Mount a persistent volume, for example at `/data`.
3. Set environment variables:

```bash
DATABASE_URL=file:/data/app.db
AUTH_SECRET=<long-random-secret>
DEMO_LOGIN_EMAIL=demo@example.com
DEMO_LOGIN_PASSWORD=ChangeMe123!
```

`AUTH_SECRET` should be at least 32 characters long.

### Commands

- Build: `npm run build`
- Pre-deploy: `npm run railway:predeploy`
- Start: `npm run railway:start`

`postinstall` runs `prisma generate`. `railway:predeploy` applies migrations.
`railway:start` can self-heal by applying migrations and seeding missing demo
data before starting Next.js.

This setup is optimized for a simple demo deployment, not for long-term
multi-instance production scale.

## Project Context For Humans

The root `README.md` is the human-facing entry point. More detailed agent-aware
project context lives in `.agentic/`.

Useful files there:

- `.agentic/project-context.md` — current product and architecture context
- `.agentic/decisions.md` — short ADR-style notes
- `.agentic/backlog.md` — upcoming work and open questions
- `.agentic/completed.md` — completed task log
- `.agentic/notes.md` — working notes and workflow learnings

If you want an LLM-ready briefing for feature or workflow discussions, see
[`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md).
