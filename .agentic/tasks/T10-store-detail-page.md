---
status: closed
complexity: standard
---

# T10 – Store Detail Page

## Context

T9 adds the necessary query-layer functions. This task builds the route, components, and
navigation for the store detail view. The goal is a drilldown page reachable from the
store ranking table, showing store-scoped KPIs, a time-series chart, benchmark comparison,
top products, and active alerts.

## Changes

### Route: `src/app/(app)/stores/[storeId]/page.tsx`

New Server Component. Reads `params.storeId` and `searchParams.days` (default `30`,
allowed: `7`, `30`, `90`).

Call `getStoreById(storeId)` first. If it returns `null`, call `notFound()` from
`next/navigation`.

Fetch all data in parallel:

```ts
const [revenue, orders, basket, conversion, timeseries, products, alerts, benchmark] =
  await Promise.all([
    getRevenueKpi(days, storeId),
    getOrdersKpi(days, storeId),
    getAvgBasketKpi(days, storeId),
    getConversionKpi(days, storeId),
    getMetricsTimeSeries(days, "revenue", storeId),
    getTopProducts(days, storeId),
    getActiveAlerts(30, storeId),
    getStoreBenchmark(storeId, days),
  ]);
```

Page layout (top to bottom):

```
<StoreDetailHeader store={store} />
<DayRangeSelector days={days} />          ← existing component, URL-based
<KpiCard /> × 4                           ← Revenue, Orders, Avg Basket, Conversion
<KpiChart initialData={timeseries} storeId={storeId} />
<StoreBenchmarkRow benchmark={benchmark} />
<TopProductsTable entries={products} />
<AlertPanel alerts={alerts} />
```

Use the same shell/frame wrapping as `src/app/(app)/dashboard/page.tsx`.

---

### `src/features/stores/StoreDetailHeader.tsx`

New Server Component.

```ts
type StoreDetailHeaderProps = { store: StoreDetail };
```

Renders:
- `← All Stores` link to `/dashboard` (using `next/link`)
- Store name as `<h1>`
- Subtitle line: `{code} · {city}, {region} · {format} · {sizeBand}`
- "Active" (green badge) or "Inactive" (grey badge) from `isActive`
- "Open since {year}" derived from `openedAt`

---

### `src/features/stores/StoreBenchmarkRow.tsx`

New Server Component.

```ts
type StoreBenchmarkRowProps = { benchmark: StoreBenchmark };
```

Renders four side-by-side comparison blocks (Revenue, Orders, Avg Basket, Conversion).
Each block shows:
- Label
- Store value (formatted with helpers from `src/lib/kpi/format.ts`)
- `vs. ø {all-stores average}` in a muted colour
- Delta % (green if store > average, red if below)

---

### `src/features/dashboard/StoreRankingTable.tsx`

Add a link on each row to its store detail page. Wrap either the entire row or add a
"Details →" column. Target URL: `/stores/{entry.storeId}` (use `entry.id` or whichever
field holds the store's database ID — check the `StoreRankingEntry` type).

Use `next/link`. No Client Component conversion needed.

## Verification

```bash
npm run build
```

- `/stores/[valid-id]` renders header, 4 KPI cards, chart, benchmark row, products, alerts
- `/stores/invalid-id` returns 404
- Clicking a row in StoreRankingTable navigates to the correct store
- `DayRangeSelector` on the detail page updates the time range correctly
- No TypeScript errors

## Files that change

- `src/app/(app)/stores/[storeId]/page.tsx` — new
- `src/features/stores/StoreDetailHeader.tsx` — new
- `src/features/stores/StoreBenchmarkRow.tsx` — new
- `src/features/dashboard/StoreRankingTable.tsx` — link added
