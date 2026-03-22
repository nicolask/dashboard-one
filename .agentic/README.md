# .agentic

This folder is reserved for agent-facing project context.

It acts as a lightweight context cache for:

- current product direction
- architecture assumptions
- implementation decisions
- near-term backlog and open questions

The goal is to keep durable project guidance close to the repository without mixing it into application code.
For coding agents, this folder is the primary source of durable project context.
The root `README.md` is the onboarding document for human developers and should not be treated as the main agent brief.

## Files

- `project-context.md`: living summary of what this project is and where it is heading
- `decisions.md`: notable technical decisions with brief rationale
- `backlog.md`: upcoming tasks, open questions, and deferred work
- `notes.md`: temporary working notes and rough thoughts

## Folders

- `tasks/`: numbered task specs (`T{N}-<slug>.md`) ready for implementation by Codex
  Review files for completed or in-progress task reviews should sit alongside them as `T{N}-review.md` when no stronger naming reason exists.
- `po/`: PO staging area — feature ideas from external sources (ChatGPT outputs, stakeholder notes, etc.) that Claude processes into task specs before they become tasks; Codex does not read this folder
- `notes/`: reference documents and working material (e.g. schema summaries for external LLM discussions)

## Maintenance Rules

- prefer short updates over long narratives
- move durable facts into the right file instead of piling everything into notes
- delete or rewrite stale notes when they stop being useful
- keep the root `README.md` lightly in sync when developer onboarding, local setup, or demo access changes materially
- keep this folder human-readable and agent-readable
- commit task work with its local agent context when relevant: code changes should usually land together with the matching task file, review file, and backlog/notes/decision updates that explain the resulting state
