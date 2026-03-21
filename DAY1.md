# Day 1 — Agentic Coding in Practice

## What happened

On a single calendar day — roughly seven hours, not focused — a retail BI dashboard was built from scratch on top of an authenticated Next.js scaffold. The human involved was not writing code.

Between tool runs, the time was spent on a bike repair, grilling, and general idleness. In a normal working day those same windows would have gone to email, calendar, and the usual overhead of a management role. The point is the same either way: this was not a focused development session. It was a normal day with a side project running in the background.

## What was built

- Next.js App Router application with Tailwind CSS, TypeScript, Prisma 7, SQLite
- Local credentials auth with signed session cookie, protected routes
- Prisma schema covering stores, catalog, orders, daily metrics, traffic, and scenario-tagged alerts — nine tables
- Deterministic retail seed simulator generating eight stores, six categories, 78 products, two anomaly scenarios, and enough daily metric history to make the dashboard non-trivial
- KPI query layer: revenue, orders, average basket, conversion, store ranking, category performance, top products, active alerts
- Dashboard UI: KPI tiles, day range selector, store ranking table, category mix bars, top products table, alert panel
- Unit tests for KPI helpers and formatters

## The numbers

| Category | LOC |
|---|---|
| Config and tooling | ~180 |
| Generic UI / scaffold | ~110 |
| Auth (custom, domain-agnostic) | ~520 |
| Retail feature (schema, seed, KPI layer, UI, tests) | ~2.300 |
| **Total** | **~3.100** |

The seed script alone is 795 lines — a deterministic fake-data generator with scenarios, seasonality, and weighted distributions. That is not padding. A developer would have written roughly the same thing.

Estimate for a senior developer working alone, knowing the stack: **22–34 hours**. Mid-level: 40–60.

## The actual human contribution

Schema design and KPI logic came from a ChatGPT session. Claude Chat was used to tighten and translate that output into concrete implementation specs. Codex did the implementation. Claude Code reviewed, caught issues, and made small fixes directly.

The human role was:
- Describe the project goal
- Route work between tools
- Steer when output was wrong or incomplete
- Correct dependency versions that drifted below current stable
- Decide what was good enough to move on

That is closer to a product owner or a tech lead in a code review than to a developer. The intellectual content of the domain — retail KPIs, a Prisma schema for a BI use case — is well-represented in LLM training data. There was no original invention here. Standard stuff, well executed.

## Honest limits of this observation

This was a greenfield project with no legacy, no integration constraints, no deployment, no real users, and no ambiguity about what "done" means. The domain knowledge required was shallow. The stack choices were conventional.

None of those conditions reflect most real software work.

What was not tested:
- debugging a subtle production issue across a system the agent did not build
- navigating an existing codebase with inconsistent conventions
- making a non-obvious architectural decision with real tradeoffs
- coordinating changes across teams or across systems with unclear ownership
- anything requiring taste built from years of seeing things go wrong

The workflow also has friction that is easy to undercount in retrospect: writing task prompts takes time, reviewing agent output requires enough understanding to spot what is wrong, and there are moments where typing the code directly would have been faster than explaining it.

## What this suggests

The speedup is real — probably 3–5x on well-scoped greenfield work in familiar territory. The more important shift is qualitative: the bottleneck moves from implementation capacity to clarity of thought. If you can describe what you want precisely enough, the code appears. If you cannot, the output is wrong in ways that are sometimes subtle.

That is not a lower bar. It is a different bar.

The role that remains irreducibly human in this workflow is judgment: knowing what to build, recognising when the output is subtly wrong, and deciding when good enough is actually good enough. Those are not things that got easier. They just became more of the job.
