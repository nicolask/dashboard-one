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
