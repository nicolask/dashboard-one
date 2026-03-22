# Prompt: LOC Snapshot (Agentic Audit)

Use this when Nicolas says something like "run the LOC analysis", "update the agentic audit", or "neue Auswertung".

This is a PO task — no Codex, no task spec. Claude does the analysis and applies the data update directly.

---

## Step 1 — Measure

Run these shell commands and record the numbers:

```bash
# Total LOC by category (non-test)
find src/features -name "*.tsx" -o -name "*.ts" | grep -v test | xargs wc -l
find src/app -name "*.tsx" -o -name "*.ts" -o -name "*.css" | grep -v test | xargs wc -l
find src/lib/kpi -name "*.ts" | grep -v test | xargs wc -l
find src/lib/auth -name "*.ts" | grep -v test | xargs wc -l
find src/components -name "*.tsx" -o -name "*.ts" | xargs wc -l
wc -l prisma/seed.ts prisma/schema.prisma

# Tests
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs wc -l

# Config
wc -l package.json tsconfig.json vitest.config.ts next.config.ts postcss.config.mjs

# Git summary
git log --oneline | wc -l
ls .agentic/tasks/T*.md | grep -v review | wc -l
```

## Step 2 — Estimate senior dev time

For each completed task since the last snapshot, estimate how long a competent senior developer
would have needed working solo (without AI). Use these anchors:

- Simple UI component or placeholder route: 0.5–1h
- Non-trivial UI component with state or logic: 2–4h
- Domain logic layer (queries, KPI calculations): 3–6h
- Complex seed script or schema design: 5–8h
- Test coverage pass: 3–6h
- Auth scaffold: 4–6h

Sum those up and add to the previous snapshot total.

## Step 3 — Estimate Nicolas's actual time

Look at the git log and task count. The previous snapshot was at ~7h / 46 commits / 12 tasks.
Estimate based on: each task ≈ 30–60min of actual Nicolas time (prompting, reviewing, light edits).
If the task history or CLAUDE.md review notes suggest otherwise, adjust.

## Step 4 — Compute speedup

`speedup = senior_dev_hours / nicolas_actual_hours`

Round to nearest 0.5x. Express as a range if the senior estimate is a range.

## Step 5 — Update the snapshot data file

Edit `src/features/agentic/snapshot-data.ts` directly (small self-contained fix, no task needed).
Update all numeric fields. Keep the `generatedAt` date to today's date.

## Step 6 — Confirm

Tell Nicolas the updated numbers and what changed since the last snapshot.
No need to write a review file — this is a direct update.

---

## What NOT to do

- Don't create a new task in `.agentic/tasks/` for this — it's a data update, not a feature
- Don't involve Codex — this is analysis and a one-line data edit
- Don't rebuild the page component — only the data file changes
