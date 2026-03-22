# AGENTS.md

This repository is intended to become an agent-friendly dashboard application, likely based on Next.js, with room to grow from a simple login flow into a broader system with integrations, cached external data, and stronger identity management.

This file is the primary entry point for coding agents working in this repo.

## Mission

Build a maintainable dashboard application with:

- a clean initial login experience
- a path from local auth to OIDC later
- a data model that can start simple and evolve toward PostgreSQL
- support for syncing and caching data from external systems
- a structure that stays understandable as features grow

## Current Status

The repository is no longer just a scaffold.

At the moment:

- a Next.js App Router application exists under `src/app`
- a local credentials login flow is implemented with a signed session cookie
- protected app routes exist for dashboard, store detail, users, integrations, and settings
- Prisma 7 is configured with SQLite, migrations, generated client output, and deterministic demo seed data
- the dashboard already renders seeded retail BI data, KPI cards, charts, rankings, insights, and store drilldowns
- lint, typecheck, and automated tests are part of the working baseline
- `.agentic/` remains the primary source of evolving agent context and planning

## Agent Priorities

When making changes, optimize for the following:

1. Keep the project easy to understand for humans first.
2. Prefer a modular structure over short-term convenience.
3. Make early choices that preserve flexibility for auth, data storage, and integrations.
4. Avoid overengineering the first version.
5. Document meaningful architectural decisions as they are made.

## Working Agreement

Agents should:

- read `.agentic/project-context.md` before making significant architecture changes
- update `.agentic/decisions.md` when a notable technical decision is made
- update `.agentic/backlog.md` when new follow-up work becomes clear
- keep documentation concise and current rather than exhaustive
- prefer additive, reversible decisions in early project phases

Agents should not:

- invent a large platform architecture before it is needed
- add new infrastructure without a concrete use case
- scatter project guidance across many root-level files when `.agentic/` is a better home

## Expected Early Stack Direction

Unless the user explicitly redirects, assume this working direction:

- frontend/app framework: Next.js
- language: TypeScript
- styling: Tailwind CSS
- initial database: SQLite
- likely ORM: Prisma
- possible future database: PostgreSQL
- likely future auth direction: OIDC via a standard auth library

These are working assumptions, not rigid constraints.

## Documentation Layout

Agent-oriented project context lives in `.agentic/` and should be treated as the primary durable source for coding agents.
The root `README.md` is for human developer onboarding and local setup, not as the primary source of agent context.

Use the files there as follows:

- `.agentic/project-context.md`: current understanding of goals, constraints, and architectural direction
- `.agentic/decisions.md`: short ADR-style notes for important choices
- `.agentic/backlog.md`: upcoming work, open questions, and deferred ideas
- `.agentic/notes.md`: temporary working notes that may later be folded into other docs

## Implementation Notes

- keep `AGENTS.md` short; durable detail and project-specific learnings belong in `.agentic/`
- do not import client code from barrels that also re-export server-only modules; use leaf imports for shared types and utilities

## Change Discipline

Even while the codebase is still relatively small:

- keep folders purposeful
- prefer a small number of strong conventions
- set up seams for future auth, integrations, and caching work
- avoid premature abstractions unless they clearly reduce future churn

When introducing a major new subsystem, document:

- why it exists
- what problem it solves now
- what future flexibility it preserves
- what complexity it adds

## If You Are Starting New Work

Use this rough sequence:

1. Read this file.
2. Read the relevant files in `.agentic/`.
3. Inspect the current code before proposing structure changes or follow-up work.
4. Make the smallest coherent change that advances the project.
5. Record durable context updates in `.agentic/`.
