# Agentic Development Workflow — Blueprint

This document describes the multi-agent development workflow used in this project.
It is intended as a reusable blueprint for other projects, not as active agent guidance.
Agents working in this repository should refer to `.agentic/workflow.md` and `CLAUDE.md` instead.

---

## Overview

A **role-based multi-agent workflow** with clear separation between three actors:
a PO agent (Claude Code), an implementation agent (Codex), and a human orchestrator.

---

## Roles

**PO Agent (Claude Code)**
- Receives feature ideas and translates them into structured task specs
- Evaluates fit against existing architecture and backlog
- Asks clarifying questions until scope, acceptance criteria, and edge cases are clear
- Writes finished specs to `.agentic/tasks/T{N}-<slug>.md`
- Reviews Codex output and writes findings to `.agentic/tasks/T{N}-review.md`
- Keeps project documentation current after every completed task
- Does **not** implement — except for very small, self-contained fixes during review (wrong strings, off-by-one, etc.)

**Implementation Agent (Codex)**
- Receives a task spec and produces an implementation plan for human approval before writing any code
- Executes the approved plan and verifies behaviour (build, tests)
- Reads `.agentic/` as the primary source of project context
- Escalates to the PO agent (via the human orchestrator) when a task is unclear, too large, or technically problematic

**Human Orchestrator**
- Starts tasks with Codex by passing the task file as context
- Reviews and approves Codex's implementation plan before implementation begins
- Relays escalation prompts from Codex to the PO agent, and responses back to Codex
- Plays review findings from the PO agent back to Codex
- Makes approval decisions (merge / iterate)
- Brings feature ideas to the PO agent for specification

---

## Workflow — Step by Step

```
Human → PO Agent
  Describe the idea
  → Clarifying questions until scope is clear
  → Write task spec: .agentic/tasks/T{N}-<slug>.md
  → Flag risks and dependencies

Human → Codex
  Hand over task spec
  → Codex produces an implementation plan (no code yet)

Human reviews plan
  → Approved: Codex proceeds to implementation
  → Not approved: Human relays feedback, Codex revises plan

Codex implements
  → Build + tests green
  → Commit (code + task file + affected .agentic/ files)

  [If Codex hits a blocker]
  → Codex formulates escalation prompt (problem + options)
  → Human relays to PO Agent
  → PO Agent responds with clarification or spec amendment
  → Human relays back to Codex → implementation continues

Human → PO Agent (review mode)
  "Please review T{N}"
  → PO agent reads all changed files against the task spec
  → Findings grouped by severity:
      Bugs (blocking) | Code Quality (non-blocking) | Cosmetic
  → Writes .agentic/tasks/T{N}-review.md

Human → Codex (if needed)
  Pass review file as context
  → Codex fixes blocking issues
  → Another review cycle if necessary

Human (approval)
  → PO agent updates backlog.md, decisions.md, project-context.md
  → Merge
```

---

## Task Spec Format

A task spec (e.g. `T13-period-comparison.md`) contains:

- **Context**: Why this task, what already exists
- **Changes**: Exact code changes with file names, types, function signatures, and pseudocode — precise enough that Codex has no design decisions to make
- **Constraints**: What must not change, backwards compatibility requirements, architectural rules
- **Verification**: Concrete CLI commands and observable behaviour as acceptance criteria
- **Files that change**: Complete list of affected files

---

## Review Format

A review file (e.g. `T13-review.md`) contains:

- **Bugs (blocking)**: Must be fixed before merge
- **Code Quality (non-blocking)**: Recommendations — can be tracked or discarded
- **Cosmetic**: Purely stylistic notes
- **Verification Checklist**: Every acceptance criterion from the spec explicitly checked off
- **Required changes before approval**: Either empty (→ merge-ready) or a concrete fix brief for Codex

---

## Context Hygiene and Persistence

Durable context lives in `.agentic/`, not in chat history:

| File | Contents |
|---|---|
| `project-context.md` | What the project is and where it is going |
| `decisions.md` | Architectural decisions with rationale |
| `backlog.md` | Open tasks, questions, deferred work |
| `tasks/T{N}-*.md` | Task specs and review files |
| `notes.md` / `notes/` | Temporary working notes, reference documents |
| `workflow.md` | Active workflow description for agents |

**Commit rule**: Code changes always land together with the task file, review file,
and relevant `.agentic/` updates in a single commit.

---

## Planned Extensions

The following are not yet implemented but represent the intended next automation steps:

**Task status field** — frontmatter `status: planned | in-progress | review-requested | review-done | closed` to make pipeline state explicit and queryable.

**Task complexity field** — frontmatter `complexity: micro | standard | exploration`. Micro tasks may skip the plan step; exploration tasks may require a discovery phase before a full spec can be written.

---

## Key Properties

- **Human orchestrator as relay** — there is no direct agent-to-agent channel; the human orchestrator routes all communication between PO agent and implementation agent in both directions
- **Plan before code** — the implementation agent produces an explicit plan for human approval before writing any code
- **Specs are intentionally precise** — Codex implements, it does not design
- **Reviewer authority is limited** — the PO agent only commits minimal fixes directly; structural corrections go back to Codex as a new task
- **Backlog is always current** — after every merge the PO agent updates the backlog so the next task starts in the right context
- **Role separation is model-agnostic** — which model fills which role can change; the role logic is encoded in the project's `CLAUDE.md` and `workflow.md`, not in the model
