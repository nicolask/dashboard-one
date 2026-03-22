# Workflow

This repository can be worked in a split-agent mode when that helps maintain clarity and momentum.

## Roles

- `planner/reviewer`: shapes tasks, reviews outcomes, records follow-up work, and may fix very small issues directly when that is faster than handing them back
- `implementer/coder`: focuses on implementing the requested change, verifying behavior, and keeping code and tests in good shape

The exact model assigned to each role can change. What matters is the role split, not which tool fills it.

## Working Pattern

- the planner/reviewer turns goals into concrete tasks or reviewable scopes
- the implementer/coder executes that scope in code
- the planner/reviewer reviews the result, captures follow-ups, and decides whether work is complete or should be returned for another implementation pass
- review passes may include small direct code edits from the reviewer when that is faster than a handback; the final implementation state is the combined result of implementer and reviewer edits, so commit preparation must account for both

## Handoff Guidance

- keep durable handoff context in `.agentic/`, not only in chat history
- put stable architectural context in `project-context.md` or `decisions.md`
- put deferred or follow-up work in `backlog.md`
- keep temporary observations, review notes, and workflow learnings in `notes.md`
- store per-task review writeups in `.agentic/tasks/` using `T{N}-review.md` when the review belongs to task `T{N}`
- when completing and committing a task, include the code changes together with the relevant task context files: the task file, the review file if present, and any updated `.agentic/` companions such as `backlog.md`, `notes.md`, or `decisions.md`

## Review Expectations

- reviews should prioritize correctness, regressions, missing tests, unclear boundaries, and maintainability risks
- very small opportunistic fixes during review are fine
- larger fixes should usually go back to the implementer/coder as a new task or follow-up
- not every review finding must become an immediate code change; low-signal findings can be discarded or tracked for later
