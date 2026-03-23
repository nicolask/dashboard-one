# Codex Issues Triage

This file is no longer a raw scaffold-era review log.

It is a triaged handoff for the Claude PO so the remaining points can be handled
appropriately:

- product decisions that need explicit prioritization
- engineering chores that can be folded into nearby work
- historical findings that are already resolved and should not be resurfaced as
  active work

The goal is to prevent old review notes from being mistaken for the current
source of truth.

---

## What the PO should look at

Only a small part of the original review still needs explicit product
prioritization.

### 1. Root route behavior (`/`)

Current state:

- [`src/app/page.tsx`](/Users/nicolas/work/dev/agentic/dashboard-one/src/app/page.tsx)
  is still a scaffold-style landing page
- it links to `/login` and `/dashboard`
- this is not wrong, but it is a product choice that should now be made
  intentionally

Why this needs PO input:

- it affects first impression and navigation model
- it changes whether the app presents itself as a product, a demo, or a dev
  scaffold
- it should align with how we want to evaluate the project going forward

Decision options:

- keep `/` as an intentional landing page
- redirect `/` to `/login`
- redirect `/` to `/dashboard` when authenticated and `/login` otherwise

Recommendation:

- treat this as a small product decision, not as an infra chore
- if no stronger product need exists, prefer the auth-aware redirect path once
  the app is meant to feel less scaffold-like

Status:

- open
- should stay visible for PO prioritization

---

## Can be done opportunistically

These items are still valid, but they do not need standalone PO-level task
splitting unless they happen to fit nearby work.

### 2. Move fonts to `next/font`

Current state:

- [`src/app/layout.tsx`](/Users/nicolas/work/dev/agentic/dashboard-one/src/app/layout.tsx)
  does not yet use `next/font`
- [`src/app/globals.css`](/Users/nicolas/work/dev/agentic/dashboard-one/src/app/globals.css)
  still defines font tokens directly

Why it matters:

- improves font loading behavior and aligns better with Next.js conventions
- reduces the "early scaffold" feel in the app shell

Why this is not a PO priority:

- it does not change product scope
- it is a contained implementation chore
- best handled during a UI polish or shell cleanup pass

Recommendation:

- keep this in backlog / engineering cleanup
- do it alongside other app-shell polish, not as a dedicated roadmap item

Status:

- still open

### 3. Add `next/navigation` test mocks when router hooks appear

Current state:

- [`vitest.setup.ts`](/Users/nicolas/work/dev/agentic/dashboard-one/vitest.setup.ts)
  mocks `next/link`, but not `next/navigation`
- this is only a problem once components start using `useRouter()` or
  `usePathname()`

Why it matters:

- avoids test friction once router-aware client components land

Why this is not a PO priority:

- it is pure test plumbing
- it should be added at the moment the first affected component is introduced

Recommendation:

- do not create a standalone PO task now
- treat it as a just-in-time testing chore

Status:

- open, but intentionally deferred

---

## Do not resurface as active work

These items came from the original early review, but should not be presented to
the PO as current open issues.

### Already resolved

- `(app)` route group layout / auth seam
- duplicate current-user DB read
- Prisma generated client import path
- generated Prisma output in `.gitignore`
- enum usage for `UserStatus`
- `findUnique` vs `findFirst` auth lookup issue
- Prisma schema comment for config-first datasource URL
- `.env.example`
- duplicated email rendering in user widget
- session revocation limitation documented in decisions
- explicit scrypt parameters

### No longer accurate as written

- the old `cn()` finding is stale:
  [`src/lib/utils/cn.ts`](/Users/nicolas/work/dev/agentic/dashboard-one/src/lib/utils/cn.ts)
  already uses `clsx` plus `tailwind-merge`
- the old font note referenced CSS `@import`; that exact wording is no longer
  the right description of the current state, even though the broader
  `next/font` follow-up still exists

Implication:

- these points should not be split into new PO tasks
- if needed, they belong in history, not in active prioritization

---

## Suggested PO handling

If Claude is using this file to decide what to do next, the intended behavior
is:

1. Keep only the root-route decision as a real product-priority question.
2. Fold the font migration into a nearby UI polish / shell cleanup task.
3. Leave the `next/navigation` mock as a just-in-time engineering follow-up.
4. Ignore the already-resolved scaffold findings when planning next work.

---

## Notes

This file intentionally does not duplicate the full backlog.

For active roadmap planning, check:

- [`/Users/nicolas/work/dev/agentic/dashboard-one/.agentic/backlog.md`](/Users/nicolas/work/dev/agentic/dashboard-one/.agentic/backlog.md)
- [`/Users/nicolas/work/dev/agentic/dashboard-one/.agentic/completed.md`](/Users/nicolas/work/dev/agentic/dashboard-one/.agentic/completed.md)
- [`/Users/nicolas/work/dev/agentic/dashboard-one/.agentic/decisions.md`](/Users/nicolas/work/dev/agentic/dashboard-one/.agentic/decisions.md)

This document is only a cleanup layer over an old Codex review artifact.
