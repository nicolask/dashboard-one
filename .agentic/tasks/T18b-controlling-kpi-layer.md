---
status: closed
complexity: standard
---

# T18b – Controlling KPI Layer: Cost Queries and Profit Calculation

## Context

T18a added `DailyStoreCost` as the pre-aggregated cost fact table, mirroring
`DailyStoreMetric` for revenue. This task adds the **query layer** that joins the
two tables to produce cost and profit KPIs consumable by the dashboard.

`profit` is defined as `sum(marginAmount) − sum(totalCost)`: gross profit (already
in `DailyStoreMetric`) minus operating costs (staff, rent, overhead). This is the
EBIT-equivalent for this data model. It is intentionally not `revenue − totalCost`,
which would ignore COGS.

No UI wiring in this task — that is the subject of the next controlling task.

## Dependency

T18a must be merged and the database re-seeded before this task can be implemented
or verified.

---

## 1. New file: `src/lib/kpi/costs.ts`

### Types

```ts
export type CostSummary = {
  totalCost: number;
  staffCost: number;
  rentCost: number;
  otherCost: number;
  staffHours: number;
  profit: number;              // sum(marginAmount) - sum(totalCost)
  costRatio: number;           // sum(totalCost) / sum(revenue)
  revenuePerStaffHour: number; // sum(revenue) / sum(staffHours)
};
```

### `getDailyStoreCostSummary(days: number, storeId?: string): Promise<CostSummary>`

**Date window** — use `buildDateRanges(days)` from `src/lib/kpi/types` to get
`{ current: { from, to } }`. Apply the same `from`/`to` filter to both queries.

**Fetching** — two parallel `findMany` queries joined in TypeScript on `[storeId, date]`.
SQLite does not support cross-model aggregation in a single Prisma query cleanly.

```ts
const [costs, metrics] = await Promise.all([
  prisma.dailyStoreCost.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(storeId ? { storeId } : {}),
    },
  }),
  prisma.dailyStoreMetric.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(storeId ? { storeId } : {}),
    },
    select: { date: true, storeId: true, revenue: true, marginAmount: true },
  }),
]);
```

Build a lookup map from `metrics` keyed on `${storeId}::${date.toISOString()}`,
then iterate `costs` to accumulate totals. Rows in `costs` with no matching metric
row are skipped (should not occur in a correctly seeded database).

**Computed fields:**

```ts
profit              = sumMarginAmount - sumTotalCost
costRatio           = sumTotalCost / sumRevenue          // guard: return 0 if sumRevenue === 0
revenuePerStaffHour = sumRevenue / sumStaffHours         // guard: return 0 if sumStaffHours === 0
```

---

## 2. Export

Add to `src/lib/kpi/index.ts`:

```ts
export { getDailyStoreCostSummary } from "./costs";
export type { CostSummary } from "./costs";
```

---

## 3. Verification

```bash
npm run build
npm test
```

### Functional checks (can be done via a quick script or test)
- [ ] `getDailyStoreCostSummary(30)` returns a `CostSummary` without throwing
- [ ] `totalCost > 0` and `staffHours > 0` for any 30-day window
- [ ] `costRatio` is between 0 and 1 for network-level aggregation
- [ ] `revenuePerStaffHour` is a plausible positive number

### Profit plausibility (spot-check against seed expectations)
- [ ] Network-level `profit` is positive for a normal 30-day window
- [ ] `getDailyStoreCostSummary(30, leI01StoreId)` during the `store_slump` window
  returns a negative `profit` (gross margin collapses, costs hold)
- [ ] `getDailyStoreCostSummary(30, muc01StoreId)` during the `competitor_opening`
  window returns a `profit` near zero or negative

### Guard checks
- [ ] No division-by-zero errors when called with a `storeId` that has no data
  in the requested window — returns zeroed `CostSummary`
- [ ] TypeScript build passes with no errors

---

## Files that change

- `src/lib/kpi/costs.ts` — new file
- `src/lib/kpi/index.ts` — two new exports
