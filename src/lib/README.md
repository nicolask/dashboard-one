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

