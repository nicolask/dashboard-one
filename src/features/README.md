# Features

Feature folders should hold domain-specific logic.

Use this area for modules such as:

- `auth`
- `users`
- `dashboard`
- `integrations`
- `caching`

Each feature can later contain:

- `server/` for server-side actions, queries, and orchestration
- `ui/` for feature-specific components
- `validation/` for schemas and input rules
- `types/` for feature-local types when shared types are not needed globally

