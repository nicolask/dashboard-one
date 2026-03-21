# Notes

Temporary working notes belong here.

Use this file for:

- rough architecture sketches
- short implementation reminders
- transient research notes

Move durable information into `project-context.md`, `decisions.md`, or `backlog.md` when it becomes stable.

## Agentic Coding Learnings

Use this section to capture rough observations while working in the project.
Keep entries short and concrete first; we can later convert them into decisions, backlog items, or a cleaner retrospective.

Suggested format:

- date:
- situation:
- observation:
- impact:
- follow-up:

Current framing for this repository:

- This project is not only a dashboard scaffold, but also a reference project for evaluating agentic coding during normal development.
- Observations are especially valuable when they come from fragmented, real-life work sessions rather than idealized focused blocks.

### Review Quality

- date: 2026-03-21
  situation: using an external review pass and then comparing the output with the actual project state
  observation: review quality depends heavily on project maturity; very early passes produced limited actionable insight and many opinionated findings, but the DB, user-model, and login turn surfaced a few genuinely useful structural follow-ups. A concrete example from a later pass: Claude generated a timeseries route for a chart without putting auth in front of it, and Codex then caught that gap during review.
  impact: review in early greenfield stages is often low-signal, yet it becomes more valuable once real behavior, persistence, and auth seams exist; cross-checking models can expose real security or boundary issues that the generating model left open
  follow-up: use review output selectively in the earliest phase, and expect stronger signal only after the project has concrete flows worth interrogating

- date: 2026-03-21
  situation: review workflow using another model, then manually inspecting the findings, then asking for prioritization before moving items into backlog
  observation: this is still a subjective impression rather than an empirically validated process, but a "second look" from another model seems to surface additional insights, even when some findings are low-priority or opinionated
  impact: multi-step review handling may still be worthwhile because it can reveal useful follow-ups that the main implementation pass did not emphasize, provided the output is filtered carefully
  follow-up: keep treating this as an exploratory workflow and watch whether the extra review signal continues to justify the added review overhead

- date: 2026-03-21
  situation: reviewing a newly added client-side dashboard chart with a URL-driven day-range switch
  observation: the chart looked complete on the happy path, but a state-sync bug remained between server-provided props and client-held metric/data state. The issue only became obvious when reasoning through navigation, rerender, and async response ordering rather than from the isolated feature implementation itself.
  impact: agent-generated UI work can look finished while still missing transition-state behavior across prop changes and async fetches; this kind of bug is easy to miss without explicit review of state boundaries
  follow-up: when adding client components that mix server props, local state, and client fetches, include at least one test for prop changes and one for stale async responses

### Agentic Workflow Evaluation — LOC and Time Analysis

- date: 2026-03-21
  situation: reflecting on the completed retail BI dashboard after ~7 hours of part-time work
  observation: roughly 2.000–2.300 of ~3.100 LOC are genuine feature code (schema, seed, KPI layer, UI); the rest is scaffold and configs. Human contribution was almost entirely orchestration — schema design and KPI logic came from ChatGPT, tidying from Claude Chat, implementation from Codex, review from Claude Code. Even the "design decisions" are standard BI patterns, not original invention.
  impact: the human role in this workflow is product owner + tool router, not developer or architect; speedup vs. a senior developer is roughly 3–5x, but the comparison may be misleading since no deep domain expertise was required on the human side
  follow-up: worth tracking where the workflow genuinely broke down or required real human judgement vs. where it just needed steering — that distinction matters for evaluating the workflow's actual limits

### Tool Behavior

- date: 2026-03-21
  situation: dependency and tooling choices during greenfield setup
  observation: Codex regressed Prisma from version 7 to version 6 without a strong project-specific reason, mainly because the downgrade was operationally convenient
  impact: opportunistic version fallback can weaken the value of a greenfield reference project and drift away from the intended modern baseline
  follow-up: prefer current stable versions by default in new projects, and require explicit justification before downgrading major tooling

- date: 2026-03-21
  situation: initial dependency selection during scaffold setup
  observation: dependencies tended to start out already behind current stable releases unless explicitly guided toward "latest stable"
  impact: extra user intervention is needed to keep the project aligned with the current ecosystem, reducing trust in default setup choices
  follow-up: add an explicit project rule to prefer latest stable dependency versions unless compatibility constraints are documented

- date: 2026-03-22
  situation: discussing repository cleanup and mentioning that `task_data` probably ought to be removed later
  observation: agents can act on a mentioned action too eagerly, even when the statement is only reflective context rather than an explicit instruction. In this case, Claude deleted `task_data` after hearing "I think I should delete `task_data` from the repo", even though the intent was only to point out that it had created tasks there instead of in `.agentic/tasks`
  impact: conversational mentions of possible cleanup or future actions can accidentally turn into immediate destructive changes, which makes collaboration feel brittle in edge cases
  follow-up: treat mentioned cleanup or deletion ideas as non-executable unless the user clearly asks for the action now, especially when files or directories would be removed

- date: 2026-03-21
  situation: adding a client component (KpiChart) that needed types from a server-side KPI module
  observation: the agent imported from the barrel (`@/lib/kpi`), which re-exports `timeseries.ts`, which imports Prisma, which pulls in `better-sqlite3`, which requires `fs` — crashing the client bundle with "Module not found: Can't resolve 'fs'". The barrel looked like the correct import style because every other file in the project used it.
  impact: barrel exports that mix server-only and shared modules are structurally unsafe in Next.js App Router; an agent following local conventions will reliably make this mistake because it cannot distinguish the server/client boundary from import patterns alone
  follow-up: when a module contains server-only code (DB, fs, crypto), either mark it with `import 'server-only'` or keep its types in a separate leaf file that client code can safely import; never re-export server modules from a barrel that client components also use

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
