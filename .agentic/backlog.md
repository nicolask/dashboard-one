# Backlog

## Near Term

- cache `getCurrentUser()` per request to avoid duplicate auth DB lookups in protected pages
- switch Prisma generated-client imports back to the configured `@generated/*` alias once the seed/runtime path is confirmed clean
- replace auth status string literals with generated Prisma enums and tighten current-user lookup to `findUnique`
- clean up the dashboard user widget so email is not rendered twice when `displayName` is missing
- make scrypt parameters explicit and document the chosen password-hashing settings
- decide whether to upgrade `cn()` to `clsx` + `tailwind-merge` before more shared UI components land
- move font loading from CSS imports to `next/font`
- add a brief schema comment explaining the Prisma 7 config-first datasource setup
- decide when to add Playwright for end-to-end auth coverage
- add a first Prisma migration for any follow-on auth tables instead of changing the initial migration in place

## Soon After

- document environment variables and local setup
- plan migration path from local auth to OIDC
- add auth-specific Prisma models for sessions, external accounts, and verification flows when login behavior is real
- document the signed-cookie session revocation gap and the required status-check pattern for future server actions and API routes
- promote the signed-cookie session revocation limitation from backlog into durable auth documentation once the next auth round is implemented
- document Prisma 7 upgrade and regeneration workflow for future agents once more database code exists
- document SQLite to PostgreSQL migration caveats for IDs, text handling, and indexes
- replace the demo-user bootstrap with a real first-user onboarding or admin creation path

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
