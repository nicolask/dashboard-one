# Backlog

## Near Term

- choose and configure database tooling
- implement a first login flow
- define the initial user model
- add a protected app layout and auth guard seam
- add `src/app/(app)/layout.tsx` as the shared protected-area shell
- decide whether to upgrade `cn()` to `clsx` + `tailwind-merge` before more shared UI components land
- decide when to add Playwright for end-to-end auth coverage

## Soon After

- protect authenticated routes
- document environment variables and local setup
- decide on session strategy
- plan migration path from local auth to OIDC
- document SQLite to PostgreSQL migration caveats once Prisma is introduced
- decide whether login should use a Server Action or an API route when auth is implemented

## Later

- add external system integration patterns
- define caching and sync models
- evaluate background job execution options
- move from SQLite to PostgreSQL when justified
- introduce audit and admin tooling
- add `error.tsx` and `not-found.tsx` pages that match the app shell
- add `next/navigation` test mocks when components start using router/pathname hooks

## Open Questions

- whether to start with custom credentials auth or introduce an auth library immediately
- whether Prisma is the right first ORM choice for the team
- how soon background processing will be needed for integration syncs
- whether a root landing page should remain or redirect once auth becomes real
