# T9 – KPI Layer: Store-scoped queries + benchmark

## Context

The existing KPI query layer (`src/lib/kpi/`) already supports an optional `storeId`
on `getMetricsTimeSeries` and the revenue/orders/basket/conversion functions.
The store detail page (T10) needs four additional capabilities:

1. `getTopProducts` filtered by store
2. `getActiveAlerts` filtered by store
3. `getStoreById` for store metadata (header)
4. `getStoreBenchmark` comparing one store against the average of all stores

## Changes

### `src/lib/kpi/products.ts`

Add optional `storeId` to `getTopProducts`:

```ts
export async function getTopProducts(days: number, storeId?: string): Promise<TopProductEntry[]>
```

When `storeId` is provided, scope the `OrderItem` query through its parent `Order`:

```ts
where: {
  order: {
    storeId: storeId ?? undefined,
    date: { gte: from, lte: to },
  },
}
```

Existing call sites without `storeId` must continue to work unchanged.

---

### `src/lib/kpi/alerts.ts`

Add optional `storeId` to `getActiveAlerts`:

```ts
export async function getActiveAlerts(days: number, storeId?: string): Promise<AlertEntry[]>
```

Add to the `where` clause when present:

```ts
where: {
  storeId: storeId ?? undefined,
  scenarioSlug: { not: null },
  date: { gte: cutoff },
}
```

---

### `src/lib/kpi/stores.ts`

**New function `getStoreById`:**

```ts
export async function getStoreById(storeId: string): Promise<StoreDetail | null>

export type StoreDetail = {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
  format: string;
  sizeBand: string;
  openedAt: Date;
  isActive: boolean;
};
```

Implementation: `prisma.store.findUnique({ where: { id: storeId } })`, map to `StoreDetail`.

---

**New function `getStoreBenchmark`:**

```ts
export async function getStoreBenchmark(storeId: string, days: number): Promise<StoreBenchmark>

export type StoreBenchmark = {
  store: { revenue: number; orders: number; avgBasketValue: number; conversionRate: number };
  average: { revenue: number; orders: number; avgBasketValue: number; conversionRate: number };
};
```

Implementation:
1. Fetch `DailyStoreMetric` rows for `storeId` in the period → sum `revenue` and `orders`,
   compute `avgBasketValue = revenue / orders` and `AVG(conversionRate)`.
2. Fetch `DailyStoreMetric` for **all** stores in the same period → group by `storeId` in
   TypeScript, compute per-store aggregates, then average those across stores.
3. Use `buildDateRanges(days)` from `src/lib/kpi/types.ts` for the date window.
   Do all grouping in TypeScript — no raw SQL.

Export `StoreBenchmark` type so T10 can import it.

---

### `src/lib/kpi/revenue.ts` / `conversion.ts` (if needed)

If `getRevenueKpi`, `getOrdersKpi`, `getAvgBasketKpi`, or `getConversionKpi` do not yet
accept a `storeId` parameter, add it as an optional second parameter and include it in the
`DailyStoreMetric` `where` clause. Existing callers must remain unaffected.

## Verification

```bash
npm run build
```

Build passes with no TypeScript errors. Existing dashboard page must still render correctly.

## Files that change

- `src/lib/kpi/products.ts` — optional `storeId` parameter
- `src/lib/kpi/alerts.ts` — optional `storeId` parameter
- `src/lib/kpi/stores.ts` — two new exports: `getStoreById`, `getStoreBenchmark`
- `src/lib/kpi/revenue.ts` / `conversion.ts` — optional `storeId` if not already present
