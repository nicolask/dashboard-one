# T14 – Extended Store Benchmarking

## Status

Implemented on 2026-03-22.

The store detail benchmark now compares each KPI against three simultaneous
reference groups: network average, same-format average, and top quartile by
revenue. The data layer also returns `storeFormat` plus the corresponding
store-count fields for future narrative generation.

## Context

`StoreBenchmarkRow` currently compares a store against the equal-weighted average
of all stores in the network. The component is already wired into the store detail
page with a `StoreBenchmark` object that carries `store` and `average` snapshots.

This task extends the benchmark to three reference groups, all displayed
simultaneously per KPI metric:

- **Network average** — equal-weighted average across all active stores
- **Format average** — equal-weighted average across stores of the same format
  (flagship / mall / urban / suburban)
- **Top quartile** — equal-weighted average of the top 25% of stores ranked by
  revenue in the current period

Each reference group also carries a store count, kept in the data layer for future
use (LLM-generated narrative: "12% above the average of 8 Flagship stores").

---

## Changes

### 1. `src/lib/kpi/stores.ts` — extended type and query

#### Type changes

```ts
export type StoreBenchmarkSnapshot = {
  revenue: number;
  orders: number;
  avgBasketValue: number;
  conversionRate: number;
};

export type StoreBenchmark = {
  store: StoreBenchmarkSnapshot;
  networkAverage: StoreBenchmarkSnapshot;   // renamed from "average"
  formatAverage: StoreBenchmarkSnapshot;    // new
  topQuartile: StoreBenchmarkSnapshot;      // new
  storeFormat: string;                      // the format of the focal store
  networkStoreCount: number;                // total stores with data in period
  formatStoreCount: number;                 // stores of same format with data
  topQuartileStoreCount: number;            // stores in top quartile (ceil(N * 0.25))
};
```

#### `getStoreBenchmark` signature change

```ts
export async function getStoreBenchmark(
  storeId: string,
  days: number,
  storeFormat: string,
): Promise<StoreBenchmark>
```

The caller (store detail page) already has `store.format` from `getStoreById` —
pass it directly. This avoids an extra internal query.

#### Query and computation

Fetch metrics for the current period, including store format via the Prisma
relation (`include: { store: { select: { format: true } } }`). Build one
`StoreBenchmarkSnapshot` per store (same logic as the existing
`buildBenchmarkSnapshot` helper), then compute:

**Network average:** `averageSnapshots(allStoreSnapshots)` — unchanged logic,
just renamed.

**Format average:** filter `allStoreSnapshots` to entries whose store format
matches `storeFormat`, then `averageSnapshots(...)`.

**Top quartile:**
1. Sort `allStoreSnapshots` by `revenue` descending.
2. Take the top `Math.ceil(allStoreSnapshots.length * 0.25)` entries.
3. `averageSnapshots(topSlice)`.

Note: the focal store is included in all reference group calculations. This is
analytically correct — a top-quartile store comparing against its own group
reflects its true peer position.

---

### 2. `src/app/(app)/stores/[storeId]/page.tsx` — pass format

The call to `getStoreBenchmark` gains a third argument:

```ts
getStoreBenchmark(storeId, days, store.format),
```

`store` is resolved before the `Promise.all`, so `store.format` is available.

---

### 3. `src/features/stores/StoreBenchmarkRow.tsx` — three reference lines per card

#### Props — no change

The component still receives `benchmark: StoreBenchmark`. Update all field
references from `benchmark.average` to `benchmark.networkAverage`.

#### Card layout

Each of the four KPI cards gains two additional reference lines. Final card
structure per KPI (e.g. Revenue):

```
REVENUE                          ← uppercase label, existing style

€ 142K                           ← store value, text-3xl, existing style

Network avg    €128K    +10.9%   ← three reference lines, text-sm
Format avg     €135K    +5.2%
Top 25%        €165K   −13.9%
```

Each reference line is one row: label in `text-ink-600`, reference value in
`text-ink-800`, delta in coloured text (`text-emerald-600` / `text-rose-600` /
`text-ink-500`). No badge backgrounds on these lines — coloured text only to
keep visual weight below the store value.

Label strings:
- `"Network avg"`
- `"${storeFormat} avg"` — capitalise first letter, e.g. `"Flagship avg"`
- `"Top 25%"`

Delta format: same `formatDelta` helper already in the file (`+10.9%` / `−13.9%`).

**Mobile note:** The four cards already stack to 1–2 columns on small screens via
the existing grid. Taller cards are acceptable. A dedicated mobile layout pass
(collapsing to a single reference group or accordion) is deferred to a future
task.

---

## Constraints

- The `average` field on `StoreBenchmark` is renamed to `networkAverage`. Only
  `StoreBenchmarkRow.tsx` and the store detail page reference this type — both
  are updated in this task.
- `storeFormat` and the three `*StoreCount` fields must be populated even if the
  format group or top-quartile slice has zero members; use `0` and an empty
  snapshot in that case.
- No new Client Components.
- No changes to the Prisma schema or migrations.
- The `include: { store: { select: { format: true } } }` fetch replaces the
  current `findMany` on `allMetrics`; the existing `buildBenchmarkSnapshot`
  helper is reused unchanged.

---

## Verification

```bash
npm run build
npm test
```

- Store detail page renders without errors.
- Benchmark section shows three reference lines per KPI card.
- Format label reflects the focal store's format (e.g. "Flagship avg" for a
  flagship store).
- `topQuartileStoreCount` in the returned object equals
  `Math.ceil(networkStoreCount * 0.25)`.
- No TypeScript errors.

---

## Files that change

- `src/lib/kpi/stores.ts` — extended `StoreBenchmark` type + updated `getStoreBenchmark`
- `src/app/(app)/stores/[storeId]/page.tsx` — pass `store.format` to `getStoreBenchmark`
- `src/features/stores/StoreBenchmarkRow.tsx` — three reference lines per card
- `src/lib/kpi/stores.test.ts` — update `result.average` references to `result.networkAverage`
  (T17 added tests against the current field name; this rename will break them)
