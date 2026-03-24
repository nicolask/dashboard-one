# Workflow

This repository is worked in a split-agent mode with a human orchestrator coordinating between agents.

The default entry point for a new task is a short instruction such as `Plan T24`. That prompt is expected to be sufficient because the durable task context lives in `.agentic/` and the role responsibilities below define the rest of the workflow.

## Roles

- `planner/reviewer`: shapes tasks, reviews outcomes, records follow-up work, and may fix very small issues directly when that is faster than handing them back
- `implementer/coder`: takes an assigned task from `planned` to `review-requested`; reads the task spec, produces an implementation plan for approval when required, executes the approved work, updates task status, prepares the review handoff, and addresses review feedback that returns the task to implementation
- `human orchestrator`: relays context between agents, approves plans when required, and decides whether work is complete or should loop

The exact model assigned to each role can change. What matters is the role split, not which tool fills it.

## Task Lifecycle

Tasks move through the following states:

```
planned -> in-progress -> review-requested -> review-done -> closed
```

The expected meaning of each state is:

- `planned`: the task spec exists and is ready for implementer pickup
- `in-progress`: the implementer has accepted the task and is actively planning or coding it
- `review-requested`: the implementer believes the task is ready for review and has handed it off with enough context to review efficiently
- `review-done`: the reviewer has completed the review pass, including any very small direct fixes, and has recorded findings or follow-up notes
- `closed`: the human orchestrator considers the task complete and the durable task context has been updated as needed

If review finds issues that should be fixed by the implementer, the task returns from `review-requested` or `review-done` to `in-progress`. A task should not move to `closed` while implementation follow-up is still pending.

## Working Pattern

1. The planner/reviewer turns goals into concrete task specs and creates the task in `planned`
2. The implementer/coder picks up the task, moves it to `in-progress`, reads the spec, and produces an implementation plan when the task requires one
3. The human orchestrator reviews and approves the plan before code is written, unless the task is explicitly small enough to skip that step
4. The implementer/coder executes the work, updates task context, and hands off the result in `review-requested`
5. The planner/reviewer performs the review, records follow-ups, and either marks the review pass as `review-done` or returns the task to `in-progress`
6. The human orchestrator closes the task after review is complete and the task context is in a durable final state

## Escalation: Implementer → Planner

If the implementer/coder considers a task unclear, too large, or technically problematic, it does not proceed with a best guess. Instead:

1. The implementer formulates a structured prompt describing the problem and, where possible, proposes solution options
2. The human orchestrator relays this prompt to the planner/reviewer
3. The planner/reviewer responds with a clarification, a spec amendment, or a task split
4. The human relays the response back to the implementer before implementation continues

There is no direct agent-to-agent channel; the human orchestrator acts as the relay in both directions.

## Handoff Guidance

- keep durable handoff context in `.agentic/`, not only in chat history
- put stable architectural context in `project-context.md` or `decisions.md`
- put deferred or follow-up work in `backlog.md`
- keep temporary observations, review notes, and workflow learnings in `notes.md`
- store per-task review writeups in `.agentic/tasks/` using `T{N}-review.md` when the review belongs to task `T{N}`
- when completing and committing a task, include the code changes together with the relevant task context files: the task file, the review file if present, and any updated `.agentic/` companions such as `backlog.md`, `notes.md`, or `decisions.md`

## Implementer Expectations

- treat the task spec as the source of truth and raise ambiguities before coding
- move the task to `in-progress` when work begins
- produce an implementation plan for approval unless the task is clearly `micro` in scope or the task spec explicitly says to skip the plan step
- keep task-local context current enough that another agent can resume the work if needed
- request review only when code, tests, and task notes are in a coherent reviewable state
- when review feedback requires further work, resume ownership by moving the task back to `in-progress`
- do not consider the task finished at `review-requested`; ownership continues until review feedback is resolved or the human orchestrator closes the task

## Review Expectations

- reviews should prioritize correctness, regressions, missing tests, unclear boundaries, and maintainability risks
- very small opportunistic fixes during review are fine
- larger fixes should usually go back to the implementer/coder as a new task or follow-up
- not every review finding must become an immediate code change; low-signal findings can be discarded or tracked for later
- after a review pass, update the task state to reflect whether the task is ready for closure or needs another implementation pass

## Task Closure

To close a task, complete the following in order:

1. Finish the review pass and ensure the task is in `review-done`, not still waiting on implementation follow-up
2. Record any deferred or newly discovered follow-up work in `backlog.md`
3. Update the task file to its final durable state, including `status: closed`
4. Add a concise completion entry to `completed.md` so the active backlog can stay focused on open work
5. Include the relevant task context updates with the code changes when preparing the final commit

If a task cannot satisfy these closure steps, it should remain in the active workflow rather than being treated as complete.

## Task Metadata

Task specs should use frontmatter fields that make workflow state explicit:

### Task status field

```
status: planned | in-progress | review-requested | review-done | closed
```

This is the canonical state machine for task progress in this repository.

### Task complexity field

```
complexity: micro | standard | exploration
```

`micro` tasks may skip the plan step. `exploration` tasks may require an explicit discovery phase before a full spec can be written.
