# T20 Review — Agentic Audit Page

**Verdict: approved with one fix before close.**

The implementation is clean. Data/component separation is exactly right, tests cover both the structural contract and the rendered sections, nav entry correct, no barrel-import issues.

---

## Bug (blocking)

None.

---

## Code quality (non-blocking)

### `timeEstimateRows` lives in the component, not in `snapshot-data.ts`

`AgenticAuditPage.tsx:4-17` — the per-task hour ranges are hardcoded inside the component as a `const`:

```ts
const timeEstimateRows = [
  { label: "Setup & Auth Scaffold", seniorHours: "4-6h" },
  ...
];
```

This breaks the update contract: the LOC snapshot template and CLAUDE.md both say "only touch `snapshot-data.ts`" on future snapshot runs. If a new task is added or estimates shift, someone would have to edit the component file instead — easy to miss, and wrong layer.

**Fix:** Move `timeEstimateRows` into `snapshot-data.ts` as `taskBreakdown`. The component just maps over it. I'll apply this directly.

### `snapshot-data.test.ts` tests current data values, not just structure

`snapshot-data.test.ts:21` asserts `expect(snapshot.actualHours).toBe(14)`. This test will fail the first time I run a snapshot update. The test should validate shape, not a specific value that is meant to change.

Send back to Codex: change `toBe(14)` → `expect(snapshot.actualHours).toBeGreaterThan(0)` (or just drop the value assertion and keep the structural ones).

### Pre-existing TS errors in `retail-seed.test.ts` — not introduced by T20

`tsc --noEmit` shows 6 errors in `src/lib/db/retail-seed.test.ts` (Object of type 'unknown'). These predate this task. Flagging so they don't get lost — they should be cleaned up separately.

---

## Cosmetic

- **Hyphen instead of em-dash in heading:** `"Retail Dashboard - in ~14h"` (`AgenticAuditPage.tsx:64`) — the original used `—`. Small but visible in a page about quality.
- **Speedup display:** `4-6x` (hyphen, lowercase x) vs. the intended `4–6×`. Same issue in the test at line 20.

Both cosmetic items I'll fix directly alongside the `timeEstimateRows` move.

---

## What I'll fix directly

1. Move `timeEstimateRows` to `snapshot-data.ts` as `taskBreakdown`
2. Fix the two typography issues (em-dash in title, `–` and `×` in speedup)

## Send back to Codex

- `snapshot-data.test.ts:21` — replace `toBe(14)` with a shape-only assertion
