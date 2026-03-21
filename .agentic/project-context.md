# Project Context

## Summary

This repository now contains the first scaffold of a dashboard application.

The near-term goal is to turn that scaffold into a simple authenticated product shell.
The longer-term goal is to support richer dashboard features, user management, and data pulled from external systems.

## Current Direction

- start with Next.js
- use Tailwind CSS for UI styling
- begin with a simple login flow
- use a relational database first, likely SQLite in development
- preserve a smooth migration path to PostgreSQL later
- keep room for future OIDC-based authentication
- expect external API data to be cached locally instead of fetched live on every page load

## Current Repository Shape

- Next.js App Router scaffold created under `src/app`
- Tailwind CSS v4 configured through `globals.css` and PostCSS
- public login placeholder route at `/login`
- protected-area placeholder route at `/dashboard`
- shared UI and layout components under `src/components`
- domain-first expansion path documented under `src/features`
- shared infrastructure area documented under `src/lib`
- dependencies installed with npm
- lint, typecheck, and production build verified successfully
- Vitest and React Testing Library configured for unit and component tests

## Architectural Principles

- keep the first version small and understandable
- separate app routing, domain logic, and infrastructure concerns early
- treat authentication as a subsystem that may evolve
- prefer local persistence for dashboard reads when integrating external systems
- avoid introducing a separate NoSQL database until a real need appears

## Likely Future Concerns

- role-based access
- user administration
- integration credentials and sync scheduling
- background jobs for importing or refreshing external data
- auditability around sync state and authentication events
- selective denormalization or JSON storage for external payloads
- end-to-end coverage once real authentication and workflows exist

## Constraints

- decisions should remain easy to change
- early documentation should guide implementation, not lock it down too tightly
