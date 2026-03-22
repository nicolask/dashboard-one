# T18b Review

## Verdict: Approved — no changes required

---

## All checks passed

### `src/lib/kpi/costs.ts`
- `CostSummary` type matches spec exactly (8 fields) ✓
- `buildDateRanges(days).current` used for date window ✓
- Parallel `Promise.all` for both queries ✓
- Same `buildCostWhere` helper applied to both `dailyStoreCost` and `dailyStoreMetric`
  queries — consistent date range and storeId scope ✓
- Lookup key `${storeId}::${date.toISOString()}` consistent across map write and
  lookup ✓
- Cost rows with no matching metric row: `continue` (skipped, not thrown) ✓
- `profit = totalMarginAmount - totalCost` — correct EBIT formula ✓
- `costRatio` and `revenuePerStaffHour` both guarded against division by zero ✓
- Early return `EMPTY_COST_SUMMARY` when `costs.length === 0` ✓

### `src/lib/kpi/index.ts`
- Named exports (`export { ... }` / `export type { ... }`) instead of `export *`
  for the costs module — correct choice, avoids barrel re-export issues if
  `costs.ts` ever gains server-only imports ✓

### `src/lib/kpi/costs.test.ts`
- Test 1 (main flow): 3 cost rows, 2 metric rows — third cost row has no matching
  metric and is skipped; all accumulations verified: totalCost 500, profit 300,
  costRatio 0.3125, revenuePerStaffHour 1600/15 ✓
- Test 2 (store scoping): confirms `storeId` passed through to both queries ✓
- Test 3 (empty costs): `costs.length === 0` returns zeroed summary ✓
- Test 4 (division guards): revenue=0, staffHours=0 → costRatio=0,
  revenuePerStaffHour=0, profit correctly negative (20−100=−80) ✓
