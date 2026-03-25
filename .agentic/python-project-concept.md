# Python Project — Concept Note

**Status: Idea / WIP — not part of the active agentic workflow. No planning, no tasks.**

---

## Core idea

Build a production-ready counterpart to this project using Python as the primary language. This project (Next.js) remains the feature playground and agentic workflow testbed. The Python project would be a separate repository and serve a dual purpose:

1. **Production-ready BI platform** — better suited for teams with Python expertise, ML work, and operational knowledge
2. **Autonomous development test balloon** — a more ambitious agentic experiment with higher agent autonomy and an orchestrator layer

---

## Why Python

- Primary driver: team expertise, operational familiarity, and ecosystem fit
- ML/forecasting work (statsmodels, prophet, scikit-learn) is natural in Python — no TS workarounds
- FastAPI is a strong fit for this API surface: async-native, Pydantic validation, OpenAPI out of the box
- Deployment and ops patterns are well-understood in Python contexts

---

## Frontend — open question

React is not preferred (experienced as cumbersome) but not fully excluded. Leading candidate is **Svelte** — less boilerplate, no hook rules, more natural reactivity, accessible to Python-primary developers. Vue/Nuxt is a fallback. A final decision should factor in Codex/agent familiarity with the chosen framework.

No decision needed now.

---

## Agentic architecture — more ambitious

The interesting hypothesis for the Python project: push agent autonomy significantly further than this project.

- **Orchestrator layer**: an agent that manages tasks, picks up backlog items, spawns implementation and review sub-agents, and closes the loop with minimal human input
- **Reduced human bottleneck**: in this project, Nicolas as human-in-the-loop was the limiting factor. The Python project would test how far that can be pushed back
- **Autonomous development cycle**: spec → implement → review → merge → update docs, with human intervention only at approval gates or blockers

This makes the Python project as much a methodology experiment as a product.

---

## Effort calibration

Anchored to this project: ~9.300 LOC (production + tests), ~15 tasks, **16 human hours** total.

### Scenario 1 — Human orchestrator (same model as this project)

Architecture decisions are already made, domain is known. New stack (FastAPI, SQLAlchemy, Alembic) adds some setup overhead but removes exploration cost.

**Estimate: 8–12 human hours** (1–1.5 days). Less than this project because re-implementing a known design with clear specs is faster than greenfield exploration.

### Scenario 2 — 3–4 agents, human at approval gates only

Setup: Orchestrator → PO agent (specs) → Codex (implementation) → Review agent → human approves or unblocks.

What the human still does:
- Set initial direction ("build auth, then dashboard core")
- ~15 approval gates ("looks good, continue")
- Resolve genuine blockers (framework conflict, design ambiguity)

**Estimate: 2–4 human hours** for equivalent scope. Calendar time is longer because agent tasks run sequentially.

### The hidden cost: building the orchestrator itself

A reliable orchestrator that autonomously picks up backlog items, writes specs, commissions Codex, validates output, replays review findings, and decides when to escalate — is itself a non-trivial project.

| Approach | One-time design cost |
|---|---|
| Simple script orchestrator (Claude API, linear loop) | 4–8h |
| Robust agent with state, retry logic, escalation | 1–2 days |
| Production-grade autonomous loop | separate project |

The first run will have debugging overhead regardless of approach.

**Break-even**: The orchestrator investment pays off at the second or third project it runs. For a single rewrite it's a net cost; as reusable infrastructure it's a net gain.

### Summary

| Scenario | Human effort | Calendar time | Maturity |
|---|---|---|---|
| Human orchestrator (proven model) | 8–12h | 1.5–2 weeks | Proven |
| 3–4 agents, approval gates | 2–4h | Longer (sequential) | Experimental |
| + Orchestrator build (one-time) | +4–16h | — | New work |

---

## Relationship to this project

| This project (Next.js) | Python project |
|---|---|
| Feature playground | Production-ready target |
| Agentic workflow reference | Autonomous dev test balloon |
| Dashboard BI experimentation | ML-capable BI platform |
| Human orchestrated | Agent-orchestrated |

Features proven here can be ported. Decisions made here inform the Python architecture. The two projects run in parallel, not in sequence.

---

## Recommended start: orchestrator first

Don't start the Python project by building the BI dashboard. Start by building the orchestrator.

Reasons:
- The orchestrator is small enough to be a first test of autonomous agentic loops without a large blast radius
- It immediately becomes the infrastructure that builds everything else — the BI dashboard becomes its first real task
- If the orchestrator fails or needs redesign, very little is lost; if it succeeds, all subsequent work runs faster
- It forces early decisions on agent architecture (state, escalation, tool access) before those decisions are expensive to change

Concrete first milestone: an orchestrator that can read `.agentic/backlog.md`, pick a task, write a spec, commission an implementer agent, and hand the result to a review agent — with a human approval gate at the end.

---

## This project as PO reference

A key structural advantage: the PO agent in the Python project doesn't start from scratch. It can read this repository — specifically `.agentic/` — as a living reference.

What the PO agent gains from this:

- **`.agentic/decisions.md`** — architectural decisions already made (profit formula, pre-aggregation strategy, auth model, cost inversion). The Python PO doesn't re-derive these; it ports or consciously overrides them.
- **`.agentic/tasks/`** — 15+ completed task specs as worked examples of scope, acceptance criteria, and edge case documentation. The PO agent can use these as few-shot examples when writing new specs.
- **`.agentic/project-context.md`** — goals, constraints, and architectural principles that transfer directly to the Python project with minor adaptation.
- **`.agentic/backlog.md`** — open items and follow-up work that can seed the Python backlog directly.
- **`prisma/schema.prisma`** — the full data model as a concrete starting point for SQLAlchemy/SQLModel schema design.

This means the Python PO agent starts with institutional knowledge rather than a blank slate — substantially reducing the early-task ambiguity that usually causes the most human intervention. The human bottleneck shrinks further because the PO agent has answers to questions it would otherwise escalate.

---

## Open questions (not blocking)

- Svelte vs. Vue vs. React vs. something else for frontend
- Which orchestration framework for the agent layer (LangGraph, custom, Claude Agent SDK, etc.)
- How much of the schema and domain model to carry over vs. redesign
- Whether to start the Python project from scratch or generate a scaffold from this project's structure

---

*Revisit when: a concrete opportunity or team capacity arises to start the Python project.*
