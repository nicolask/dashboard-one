---
status: closed
complexity: standard
---

# T21 – Controlling Dashboard Integration

## Context

T18a and T18b added the full data foundation for operating costs and profit:
`DailyStoreCost` is seeded, `getDailyStoreCostSummary` joins it with
`DailyStoreMetric`, and `profit = marginAmount − totalCost` is the EBIT-equivalent
for this data model.

This task wires that data into the UI: a four-card P&L row on both the overview
dashboard and the store detail page, showing profit, total cost, cost ratio, and
revenue per staff hour — each with period-over-period delta, matching the existing
KPI card pattern.

---

## 1. Extend `src/lib/kpi/costs.ts`

### Refactor: extract private helper

The current `getDailyStoreCostSummary` fetches only the current period (via
`buildDateRanges(days).current`). Extract the core aggregation logic into a
private helper so it can be called for both periods:

```ts
async function fetchCostSummaryForRange(
  range: DateRange,
  storeId?: string,
): Promise<CostSummary>
```

This function contains exactly the logic currently inside
`getDailyStoreCostSummary` — same queries, same join, same accumulation — but
accepts a `DateRange` instead of computing it internally.

Update `getDailyStoreCostSummary` to delegate to this helper:

```ts
export async function getDailyStoreCostSummary(
  days: number,
  storeId?: string,
): Promise<CostSummary> {
  const { current } = buildDateRanges(days);
  return fetchCostSummaryForRange(current, storeId);
}
```

No behaviour change — existing callers and tests are unaffected.

### New export: `getCostKpis`

```ts
export type CostKpis = {
  profit: KpiValue;
  totalCost: KpiValue;
  costRatio: KpiValue;
  revenuePerStaffHour: KpiValue;
};

export async function getCostKpis(
  days: number,
  storeId?: string,
): Promise<CostKpis>
```

Fetch both periods in parallel:

```ts
const { current, previous } = buildDateRanges(days);
const [curr, prev] = await Promise.all([
  fetchCostSummaryForRange(current, storeId),
  fetchCostSummaryForRange(previous, storeId),
]);
```

Return using `calcKpi` from `src/lib/kpi/types`:

```ts
return {
  profit:               calcKpi(curr.profit,               prev.profit),
  totalCost:            calcKpi(curr.totalCost,            prev.totalCost),
  costRatio:            calcKpi(curr.costRatio,            prev.costRatio),
  revenuePerStaffHour:  calcKpi(curr.revenuePerStaffHour,  prev.revenuePerStaffHour),
};
```

---

## 2. Add formatters to `src/lib/kpi/format.ts`

```ts
export function formatCostRatio(value: number) {
  return `${(value * 100).toFixed(1)} %`;
}

export function formatRevenuePerStaffHour(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

---

## 3. Export from `src/lib/kpi/index.ts`

```ts
export { getCostKpis } from "./costs";
export type { CostKpis } from "./costs";
export { formatCostRatio, formatRevenuePerStaffHour } from "./format";
```

Add these alongside the existing costs exports (lines 11–12).

---

## 4. Dashboard overview — `src/app/(app)/dashboard/page.tsx`

### Data fetch

Add `getCostKpis` to the `Promise.all`:

```ts
import {
  // existing imports …
  getCostKpis,
  formatCostRatio,
  formatRevenuePerStaffHour,
} from "@/lib/kpi";

const [
  revenue, orders, basket, conversion,
  costKpis,                               // ← new
  insights, storeRanking, …
] = await Promise.all([
  getRevenueKpi(days),
  getOrdersKpi(days),
  getAvgBasketKpi(days),
  getConversionKpi(days),
  getCostKpis(days),                      // ← new
  getActiveInsights(30),
  …
]);
```

### UI — P&L row

Insert directly after the existing four-card KPI grid (after line 136), before
`<KpiChart …>`:

```tsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <KpiCard
    label="Gross Profit"
    value={formatRevenue(costKpis.profit.value)}
    delta={costKpis.profit.deltaPercent}
    deltaLabel={`vs. previous ${days}d`}
  />
  <KpiCard
    label="Operating Cost"
    value={formatRevenue(costKpis.totalCost.value)}
    delta={-costKpis.totalCost.deltaPercent}
    deltaLabel={`vs. previous ${days}d`}
  />
  <KpiCard
    label="Cost Ratio"
    value={formatCostRatio(costKpis.costRatio.value)}
    delta={-costKpis.costRatio.delta}
    deltaLabel={`vs. previous ${days}d`}
    deltaMode="pp"
  />
  <KpiCard
    label="Rev / Staff Hour"
    value={formatRevenuePerStaffHour(costKpis.revenuePerStaffHour.value)}
    delta={costKpis.revenuePerStaffHour.deltaPercent}
    deltaLabel={`vs. previous ${days}d`}
  />
</div>
```

**Delta direction note:** `KpiCard` colours positive deltas emerald and negative
rose. Cost metrics are inverted: a cost increase is bad, so `delta` is negated
before passing it to `KpiCard`. Revenue-like metrics (profit, rev/staff hour) use
the natural sign.

---

## 5. Store detail page — `src/app/(app)/stores/[storeId]/page.tsx`

Same pattern as the overview, scoped to the store:

```ts
getCostKpis(days, storeId),   // added to Promise.all
```

Insert the same four-card grid after the existing KPI row (after line 125),
before `<KpiChart …>`. Pass `storeId` to `getCostKpis`.

---

## 6. Verification

```bash
npm run build
npm test
```

- [ ] Build passes with no TypeScript errors
- [ ] `getDailyStoreCostSummary` tests still pass unchanged
- [ ] Overview dashboard renders four new P&L cards
- [ ] Store detail page renders four new P&L cards scoped to the store
- [ ] Rising costs show rose delta badge; falling costs show emerald badge
- [ ] `Gross Profit` card shows negative value for LEI-01 during `store_slump`
  window (navigate to store detail, set days=7 while slump is active)
- [ ] `Cost Ratio` card uses `pp` delta mode (shows "pp" suffix, not "%")

---

## Files that change

- `src/lib/kpi/costs.ts` — private helper refactor + `getCostKpis` + `CostKpis` type
- `src/lib/kpi/format.ts` — `formatCostRatio`, `formatRevenuePerStaffHour`
- `src/lib/kpi/index.ts` — three new exports
- `src/app/(app)/dashboard/page.tsx` — P&L card row + `getCostKpis` fetch
- `src/app/(app)/stores/[storeId]/page.tsx` — same

## Dependency

T18b must be merged. No other dependencies.
