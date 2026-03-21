# Notes

Temporary working notes belong here.

Use this file for:

- rough architecture sketches
- short implementation reminders
- transient research notes

Move durable information into `project-context.md`, `decisions.md`, or `backlog.md` when it becomes stable.

## Review Follow-Ups

Notes captured from review feedback on 2026-03-21:

- Strong follow-up: introduce `src/app/(app)/layout.tsx` soon so protected routes have one shared seam for auth and layout concerns.
- Good preventive improvement: consider replacing the local `cn()` helper with `clsx` + `tailwind-merge` before shared UI components become more configurable.
- Good documentation task: record SQLite to PostgreSQL migration caveats once Prisma is added.
- Good future decision point: choose between Server Actions and API routes when implementing login for real.
- Reasonable later task: add app-level `error.tsx` and `not-found.tsx` once the app shell settles.
- Reasonable later test task: mock `next/navigation` when tests start covering components that use router hooks.

Points intentionally not adopted as current action items:

- A `middleware.ts` stub is not required yet. Auth checks can live in layouts or server code first, and middleware should be introduced only if it clearly improves the chosen auth approach.
- Font loading is not currently broken. The app defines font tokens in CSS but does not yet import web fonts. If branded fonts are introduced, `next/font` should be the preferred path.
