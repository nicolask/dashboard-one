# Project Overview

This document is a compact briefing for discussing this repository with ChatGPT, Claude, or other LLMs.

It is meant to provide enough context to:

- evaluate new product features
- discuss architecture and tradeoffs
- explore agentic workflows that could accelerate development
- keep the discussion grounded in the current reality of the codebase

## 1. What this project is

`dashboard-one` is an agent-friendly dashboard application built as a realistic evaluation project for agentic software development.

On the surface, it is a retail BI dashboard:

- authenticated access
- a dashboard overview with KPIs and insights
- store-level drilldowns
- room for integrations, forecasting, settings, and user management

Underneath, the more important goal is methodological:

- evaluate how fast and reliably agentic workflows can produce useful software
- learn which tasks work well with coding agents and which still need tight human steering
- build a reference project that is simple enough to evolve quickly, but rich enough to expose real product and architecture decisions

In short: this is both a dashboard product and a testbed for agentic development workflows.

## 2. Current product shape

The application already goes beyond a scaffold.

Current implemented surface:

- public login page with local credentials
- protected app shell after login
- main dashboard with seeded retail KPI data
- store detail pages with store-specific KPIs and benchmarks
- agentic audit page that documents effort, LOC, and estimated speedup from agent-supported development
- placeholder routes for users, integrations, and settings

Current dashboard content:

- revenue, orders, average basket, and conversion KPIs
- controlling / P&L style KPIs: profit, operating cost, cost ratio, revenue per staff hour
- revenue timeseries chart
- store ranking
- category performance
- top products
- explainable insight cards
- scenario timeline based on seeded events

The data is currently deterministic demo data, not live operational data.

## 3. Main objective

The main objective of the project is not only to ship dashboard features, but to evaluate agentic workflows in a realistic product context.

That includes questions like:

- Which kinds of work can be delegated well to coding agents?
- What level of specification produces the best output?
- How much architectural guidance should be documented up front?
- Which tasks are fast with agents on a greenfield codebase?
- Where do agents still create rework, ambiguity, or hidden risk?

The project is intentionally small enough to stay understandable, while still covering enough real concerns to make the evaluation meaningful.

## 4. Technology stack

Current stack:

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Prisma 7
- SQLite
- better-sqlite3 adapter for Prisma
- Vitest + React Testing Library
- Recharts for charting

Important architectural direction:

- start simple locally, but preserve a path to PostgreSQL later
- start with local auth, but preserve a path to OIDC / Auth.js style auth later
- keep data fetching mostly server-side and explicit
- prefer local persistence and caching over fetching external APIs directly on every request

## 5. Deployment and operating constraints

The current setup is optimized for simple operation and demoability, not for full production scale.

Practical hosting direction today:

- Railway is the simplest deployment target for the current setup
- SQLite can be kept on a persistent mounted volume
- migrations and demo seed scripts are already part of the project workflow

Current operational limitations:

- SQLite is fine for a single-instance demo or evaluation environment, but not the long-term target for a scaled multi-instance setup
- local credential auth is intentionally lightweight and not a final production identity model
- no background job system or queue infrastructure exists yet
- integrations are not yet implemented as real synced external systems

If someone says "Runway", that should currently be interpreted as a deployment constraint discussion around the present Railway-style hosting approach and the limitations of SQLite plus single-instance operation.

## 6. Data model, explained simply

The schema is intentionally richer than a login demo, but still easy to describe at a high level.

Core auth model:

- `User`: local login account with email, password hash, status, and login timestamps

Retail business entities:

- `Store`: a retail location
- `Category`: product category tree
- `Product`: product master data
- `Order`: order header
- `OrderItem`: line items of an order

Daily aggregated BI layer:

- `DailyStoreMetric`: daily KPI snapshot per store
  - revenue
  - orders
  - items sold
  - basket value
  - visitors
  - conversion
  - discount rate
  - margin
- `DailyTraffic`: daily traffic funnel data per store

Controlling layer:

- `Employee`: store employee master data
- `EmployeeWorkLog`: daily hours worked
- `DailyStoreCost`: daily cost snapshot per store
  - staff cost
  - rent
  - other cost
  - total cost
  - staff hours
  - employee count

The overall idea is:

- transactional data exists for drilldowns and realism
- daily aggregate tables make dashboard KPI reads simple and fast
- the model stays small enough to understand, while leaving room for forecasting and integrations later

## 7. Current feature status

Implemented today:

- local credentials login with signed session cookie
- auth checks on protected routes and API reads
- dashboard overview with KPI cards, chart, rankings, insights, and top products
- store detail page with scoped KPIs and benchmark comparisons
- deterministic seeded retail dataset
- controlling KPIs based on daily cost and staff data
- agentic audit page for project meta-analysis
- test coverage for core auth and KPI logic, plus selected UI components

Partially prepared / visible, but not really implemented yet:

- `/users`
- `/integrations`
- `/settings`

Planned next direction from project context and backlog:

- store settings
- external signal caching, for example weather and holidays
- forecast engine and forecast execution flow
- eventually integration patterns and background processing
- later migration path from SQLite to PostgreSQL
- later migration path from local auth to stronger identity / OIDC

## 8. Architectural principles

The project tries to stay disciplined in a few specific ways:

- humans first: code should stay understandable
- modular but not overengineered
- early decisions should remain reversible
- features should create seams for future auth, integrations, and storage changes
- durable project guidance belongs in `.agentic/`
- the repo should remain useful as a reference for agentic coding practice

This is not intended to become a prematurely abstract platform.

## 9. Why this project is useful for LLM discussion

This repository is a good discussion target for ChatGPT or Claude because it has enough reality to make tradeoffs concrete:

- real routes
- real schema
- real UI
- real tests
- real deployment constraints

But it is still early enough that strategic changes are possible without massive migration cost.

Typical discussion themes that fit well:

- which features are worth adding next
- whether forecasting should be productized now or later
- how to structure integrations and cache layers
- when to switch auth architecture
- when SQLite stops being enough
- how to design agentic workflows for task definition, implementation, review, and documentation

## 10. Good prompts to use with this project

Useful prompt framing for ChatGPT or Claude:

- "Given this project overview, what should the next 3 product features be and why?"
- "Which parts of this architecture are solid, and which parts are likely to create migration pain later?"
- "How would you evolve this from SQLite plus local auth into PostgreSQL plus OIDC with minimal churn?"
- "Which development tasks in this codebase are especially suitable for coding agents?"
- "Design an agentic workflow for feature delivery in this project: planning, implementation, review, tests, docs."
- "What metrics should we track if the real goal is evaluating agentic development effectiveness?"
- "What parts of the current schema are sufficient for forecasting, and what is still missing?"

## 11. Important caveats for discussions

Anyone discussing this project should keep these constraints in mind:

- this is currently a greenfield reference project
- speed observations from agentic development are influenced by that greenfield context
- the current auth setup is intentionally minimal
- the current data is deterministic demo data, not messy live enterprise data
- not every planned subsystem exists yet, even if the project already has routes or task notes for it

That matters because architecture advice for this repository should optimize for learning speed and clarity first, not enterprise completeness on day one.

## 12. Short summary

`dashboard-one` is a Next.js + Prisma dashboard project with local auth, seeded retail BI data, store drilldowns, and a growing controlling layer.

Its real purpose is broader than the UI itself: it is a practical vehicle for evaluating agentic workflows, architecture decisions, and human-plus-agent collaboration in software development.
