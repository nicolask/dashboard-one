# T21 Review

## Verdict: Approved (one cosmetic fix applied directly)

---

## Fix applied directly

**`src/lib/kpi/index.ts`: redundant explicit exports**

`formatCostRatio` and `formatRevenuePerStaffHour` were already covered by
`export * from "./format"` (line 2) and then unnecessarily re-exported on line 15.
Similarly the costs exports were split across two lines. Consolidated to:

```ts
export { getDailyStoreCostSummary, getCostKpis } from "./costs";
export type { CostSummary, CostKpis } from "./costs";
```

The `export * from "./format"` on line 2 covers the two new formatters — no
explicit re-export needed.

---

## All checks passed

### `src/lib/kpi/costs.ts`
- `fetchCostSummaryForRange` private helper extracted cleanly — same logic,
  accepts `DateRange` instead of computing it internally ✓
- `getDailyStoreCostSummary` now delegates to helper — no behaviour change,
  existing T18b tests unaffected ✓
- `CostKpis` type correct (4 × `KpiValue`) ✓
- `getCostKpis` fetches both periods in parallel, returns `calcKpi` for each
  metric ✓

### `src/lib/kpi/costs.test.ts`
New test `"builds KPI deltas for current versus previous periods"`:
- Mock call order verified: `fetchCostSummaryForRange(current)` runs first
  (costMock[0] + metricMock[0]), `fetchCostSummaryForRange(previous)` second
  (costMock[1] + metricMock[1]) — matches `mockResolvedValueOnce` queuing ✓
- Numbers verified:
  - current: profit=400, costRatio=0.3, rev/h=100 ✓
  - previous: profit=100, costRatio=0.4, rev/h=100 ✓
  - `calcKpi` outputs including floating-point `delta: -0.100…3` for costRatio ✓

### `src/lib/kpi/format.ts`
- `formatCostRatio`: `(value * 100).toFixed(1) %` — 1 decimal (vs. 2 for
  `formatConversion`), matches spec ✓
- `formatRevenuePerStaffHour`: EUR, 2 decimal places ✓

### `src/app/(app)/dashboard/page.tsx`
- `getCostKpis(days)` added to `Promise.all` ✓
- P&L grid inserted after existing KPI row, before `<KpiChart>` ✓
- Delta inversions: `totalCost` → `-deltaPercent`, `costRatio` → `-delta` with
  `deltaMode="pp"` ✓
- Profit and Rev/Staff Hour use natural (non-inverted) delta ✓

### `src/app/(app)/stores/[storeId]/page.tsx`
- `getCostKpis(days, storeId)` — store-scoped ✓
- Identical card structure and delta logic ✓
- Positioned before `<KpiChart>` ✓
