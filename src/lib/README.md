# Lib

Shared infrastructure belongs here.

Likely early modules:

- `db/` for Prisma and persistence helpers
- `auth/` for session and password utilities
- `env/` for environment parsing
- `http/` for API client helpers
- `logging/` for structured logs
- `utils/` for small generic helpers

Keep domain logic in `src/features` unless it is truly cross-cutting.

Current implementation:

- `db/prisma.ts` exports the shared Prisma client singleton for server-side database access
- Prisma Client code is generated explicitly into `generated/prisma`
- `auth/` contains local password and session helpers for the first credentials flow
