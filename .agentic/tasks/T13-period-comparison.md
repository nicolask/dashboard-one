---
status: closed
complexity: standard
---

# T13 – Period Comparison

## Context

KPI tiles on both the overview dashboard and store detail pages already carry
period-over-period delta data (`KpiValue.delta`, `KpiValue.deltaPercent`,
`buildDateRanges`), and `KpiCard` renders a delta badge. Three gaps remain:

1. The badge label reads "vs. previous period" — no indication of how many days.
2. Conversion delta is shown as a relative percentage change (`deltaPercent`),
   but a rate metric should display the absolute change in percentage points (pp).
3. `StoreRankingTable` shows only absolute current-period values; there is no
   per-store growth indicator, making it impossible to spot which stores are
   accelerating or lagging.

This task closes all three gaps.

---

## Changes

### 1. `src/features/dashboard/KpiCard.tsx` — delta label and conversion mode

#### Prop additions

```ts
type KpiCardProps = {
  label: string;
  value: string;
  delta: number;        // existing — deltaPercent for most KPIs, absolute pp for conversion
  deltaLabel?: string;  // existing — now always supplied by callers
  deltaMode?: "percent" | "pp";  // new, defaults to "percent"
};
```

#### `formatDelta` update

```ts
function formatDelta(delta: number, mode: "percent" | "pp" = "percent") {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  if (mode === "pp") {
    return `${sign}${Math.abs(delta * 100).toFixed(2)} pp`;
  }
  return `${sign}${Math.abs(delta * 100).toFixed(1)} %`;
}
```

Two decimal places for pp (matches `formatConversion`'s precision).

---

### 2. Dashboard overview page — `src/app/(app)/dashboard/page.tsx`

Pass `deltaLabel` and `deltaMode` explicitly on all four KpiCard instances:

```tsx
<KpiCard
  delta={revenue.deltaPercent}
  deltaLabel={`vs. previous ${days}d`}
  label="Revenue"
  value={formatRevenue(revenue.value)}
/>
<KpiCard
  delta={orders.deltaPercent}
  deltaLabel={`vs. previous ${days}d`}
  label="Orders"
  value={formatOrders(orders.value)}
/>
<KpiCard
  delta={basket.deltaPercent}
  deltaLabel={`vs. previous ${days}d`}
  label="Avg Basket"
  value={formatBasket(basket.value)}
/>
<KpiCard
  delta={conversion.delta}       // absolute delta in rate units (0–1 scale)
  deltaLabel={`vs. previous ${days}d`}
  deltaMode="pp"
  label="Conversion"
  value={formatConversion(conversion.value)}
/>
```

Note: `conversion.delta` is the absolute difference of two rate values on the 0–1
scale (e.g. 0.002 for +0.2 pp). `formatDelta` in pp mode multiplies by 100 and
appends "pp", giving the correct display.

---

### 3. Store detail page — `src/app/(app)/stores/[storeId]/page.tsx`

Identical changes to the four KpiCard instances, same props as above.

---

### 4. `src/lib/kpi/stores.ts` — extend `StoreRankingEntry` and `getStoreRanking`

#### Type change

```ts
export type StoreRankingEntry = {
  storeId: string;
  storeCode: string;
  storeName: string;
  revenue: number;
  orders: number;
  avgBasketValue: number;
  conversionRate: number;
  revenueRank: number;
  revenueGrowth: number;  // new — signed deltaPercent vs. previous period (0.084 = +8.4 %)
};
```

#### `getStoreRanking` query change

Fetch both current and previous period in parallel using `buildDateRanges`:

```ts
export async function getStoreRanking(days: number): Promise<StoreRankingEntry[]> {
  const { current, previous } = buildDateRanges(days);

  const [currentMetrics, previousMetrics] = await Promise.all([
    prisma.dailyStoreMetric.groupBy({
      by: ["storeId"],
      where: { date: { gte: current.from, lte: current.to } },
      _sum: { revenue: true, orders: true, visitors: true },
      orderBy: { _sum: { revenue: "desc" } },
    }),
    prisma.dailyStoreMetric.groupBy({
      by: ["storeId"],
      where: { date: { gte: previous.from, lte: previous.to } },
      _sum: { revenue: true },
    }),
  ]);
  // ... rest of query unchanged
}
```

Build a lookup map from `previousMetrics` keyed by `storeId`. For each entry in
`currentMetrics`, compute:

```ts
const prevRevenue = previousByStoreId.get(entry.storeId)?._sum.revenue ?? 0;
const revenueGrowth =
  prevRevenue !== 0 ? (revenue - prevRevenue) / prevRevenue : 0;
```

---

### 5. `src/features/dashboard/StoreRankingTable.tsx` — two-row display

Replace the single-line revenue cell with a two-line layout. The second line
shows the growth delta badge. Apply the same treatment for the other three
KPI columns (Orders, Avg Basket, Conversion) — **revenue growth only** for now,
since the other metrics do not return previous-period data from the query. Only
the Revenue column gains the delta indicator in this task.

```tsx
<td className="px-6 py-4">
  <p className="text-sm text-ink-900">{formatRevenue(entry.revenue)}</p>
  <p className={`mt-0.5 text-xs font-medium ${growthClass}`}>
    {formatGrowth(entry.revenueGrowth)}
  </p>
</td>
```

Where:

```ts
function formatGrowth(delta: number) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta * 100).toFixed(1)} %`;
}
```

Growth text colour:
- `delta > 0` → `text-emerald-600`
- `delta < 0` → `text-rose-600`
- `delta === 0` → `text-ink-500`

No badge background on the second line — coloured text only, so it does not
visually compete with the primary value. This is the key constraint for keeping
the two-row layout scannable.

---

## Constraints

- `deltaMode="pp"` and `deltaLabel` changes must not affect the default KpiCard
  rendering (existing callers that omit these props must still work).
- `revenueGrowth` must be populated for every row; use `0` when the previous
  period has no data for a store.
- No new Client Components.
- Existing tests for `KpiCard` must continue to pass; add or update tests for
  the `formatDelta` change (pp mode).
- The `getStoreRanking` change adds one extra `groupBy` query — keep it as a
  parallel `Promise.all`, not sequential.

---

## Verification

```bash
npm run build
npm test
```

- Overview dashboard: all four KPI tiles show "vs. previous Nd" label.
- Conversion tile shows "±X.XX pp" instead of "±X.X %".
- Store ranking: each row's Revenue cell has a second line with a coloured
  growth percentage. Positive stores → emerald, negative → rose.
- No TypeScript errors.
- All existing tests pass; new `formatDelta` pp-mode test passes.

---

## Files that change

- `src/features/dashboard/KpiCard.tsx` — `deltaMode` prop + updated `formatDelta`
- `src/app/(app)/dashboard/page.tsx` — explicit `deltaLabel` and `deltaMode="pp"` on conversion
- `src/app/(app)/stores/[storeId]/page.tsx` — same
- `src/lib/kpi/stores.ts` — `StoreRankingEntry` type + previous-period query in `getStoreRanking`
- `src/features/dashboard/StoreRankingTable.tsx` — two-row revenue cell with growth delta
