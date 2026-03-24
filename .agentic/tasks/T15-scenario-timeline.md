---
status: closed
complexity: standard
---

# T15 – Scenario Timeline Strip

## Context

The seed stores `scenarioSlug` on every `DailyStoreMetric` row. `InsightPanel`
already surfaces active scenarios as text cards. This task makes the simulation
structure visible as a horizontal timeline strip spanning the full 120-day seeded
history — independent of the `days` URL parameter that drives all other charts.

The strip sits above the `DayRangeSelector` block on both the Overview and the
Store Drilldown pages. It shows coloured bands for each scenario, labelled and
clickable (navigates to the relevant store drilldown). A short label makes the
special nature of the window explicit to the viewer.

---

## Data layer

### `src/lib/kpi/scenarios.ts` — new file

#### Types

```ts
export type ScenarioSpan = {
  slug: string;
  label: string;              // human-readable, e.g. "Promo Week"
  startDate: string;          // "YYYY-MM-DD" (inclusive)
  endDate: string;            // "YYYY-MM-DD" (inclusive)
  affectedStoreCount: number; // how many distinct stores have rows with this slug
  storeId: string | null;     // non-null only when affectedStoreCount === 1
  storeName: string | null;   // non-null only when affectedStoreCount === 1
  storeUrl: string | null;    // `/stores/${storeId}` or null
};

export type ScenarioTimelineData = {
  spans: ScenarioSpan[];
  timelineStart: string;      // "YYYY-MM-DD" — earliest date in DailyStoreMetric
  timelineEnd: string;        // "YYYY-MM-DD" — latest date in DailyStoreMetric
};
```

#### `getScenarioTimeline(storeId?: string): Promise<ScenarioTimelineData>`

**Step 1 — fetch scenario rows and timeline bounds in parallel**

```ts
const [scenarioRows, bounds] = await Promise.all([
  prisma.dailyStoreMetric.findMany({
    where: {
      scenarioSlug: { not: null },
      ...(storeId ? { storeId } : {}),
    },
    select: {
      date: true,
      scenarioSlug: true,
      storeId: true,
      store: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  }),
  prisma.dailyStoreMetric.aggregate({
    _min: { date: true },
    _max: { date: true },
  }),
]);
```

**Step 2 — group by `scenarioSlug` in TypeScript**

For each unique `scenarioSlug`, compute:
- `startDate`: minimum `date` in the group
- `endDate`: maximum `date` in the group
- `storeIds`: `Set<string>` of distinct `storeId` values in the group

**Step 3 — build `ScenarioSpan` per slug**

- `label`: use the label map below; fall back to
  `slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())`
- `affectedStoreCount`: `storeIds.size`
- If `storeIds.size === 1`: set `storeId`, `storeName`, `storeUrl`
- Otherwise: all three are `null`

**Label map** (defined as a module-level constant):

```ts
const SCENARIO_LABELS: Record<string, string> = {
  promo_week: "Promo Week",
  store_slump: "Store Slump",
};
```

**Step 4 — timeline boundaries**

```ts
timelineStart = bounds._min.date.toISOString().slice(0, 10);
timelineEnd   = bounds._max.date.toISOString().slice(0, 10);
```

If `bounds._min.date` or `bounds._max.date` is null (empty table), return
`{ spans: [], timelineStart: today, timelineEnd: today }`.

**Sort spans** by `startDate` ascending before returning.

---

## Component

### `src/features/dashboard/ScenarioTimeline.tsx` — new file

Server Component.

```ts
type ScenarioTimelineProps = {
  data: ScenarioTimelineData;
};
```

**When `data.spans` is empty:** render nothing (`return null`).

**Layout** — use the same glass-card container style as the `DayRangeSelector`
block on both pages:

```
rounded-[2rem] border border-white/70 bg-white/55 p-5
shadow-[0_18px_44px_rgb(15_23_42_/_0.08)] backdrop-blur
```

**Header row** (inside the card, above the timeline bar):

```
SCENARIO HISTORY          Full 120-day window · independent of date range filter
```

Left side: `text-sm font-medium uppercase tracking-[0.18em] text-ink-700`
Right side: `text-xs text-ink-500`

**Timeline bar** — `relative` div, `h-8`, `w-full`, `rounded-full`,
`bg-ink-100/60 overflow-hidden`, rendered below the header:

Each `ScenarioSpan` is rendered as an `absolute` div inside the bar:

```ts
const totalMs = Date.parse(data.timelineEnd) - Date.parse(data.timelineStart);
const leftPct = ((Date.parse(span.startDate) - Date.parse(data.timelineStart)) / totalMs) * 100;
const widthPct = ((Date.parse(span.endDate) - Date.parse(span.startDate) + 86_400_000) / totalMs) * 100;
// clamp: Math.max(widthPct, 1.5)  — minimum visible width
```

Style each band:
- `position: absolute`, `top: 0`, `bottom: 0`
- `left: ${leftPct}%`, `width: ${Math.max(widthPct, 1.5)}%`
- `rounded-sm`
- Colour by slug:
  - `promo_week` → `bg-amber-400/80`
  - `store_slump` → `bg-rose-400/80`
  - fallback → `bg-slate-400/80`

**Label inside the band** — a `<span>` inside the absolute div:
- `text-[10px] font-medium text-white truncate px-1.5 leading-8`
- Full label: if `storeId` is set, `"{span.label} · {span.storeName}"`; otherwise `"{span.label}"`

**Click behaviour** — if `span.storeUrl` is set, wrap the band div in a
`next/link` with `href={span.storeUrl}`, adding `cursor-pointer` and
`hover:opacity-90 transition-opacity`. If `storeUrl` is null, render a plain
`div` (no link).

**Date axis** — a `flex justify-between` row below the timeline bar, `mt-1`:

```
{data.timelineStart formatted as "D MMM YY"}    {data.timelineEnd formatted as "D MMM YY"}
```

Use a small inline formatter (no date-fns import):

```ts
function fmtAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}
```

Text style: `text-xs text-ink-500`.

---

## Wire up

### `src/lib/kpi/index.ts`

Export `getScenarioTimeline` and the `ScenarioTimelineData` / `ScenarioSpan` types.

### `src/app/(app)/dashboard/page.tsx`

1. Add `getScenarioTimeline()` to the `Promise.all` fetch block (no storeId).
2. Import `ScenarioTimeline` from `@/features/dashboard/ScenarioTimeline`.
3. Place `<ScenarioTimeline data={scenarioTimeline} />` immediately before the
   existing `DayRangeSelector` container div.

### `src/app/(app)/stores/[storeId]/page.tsx`

1. Add `getScenarioTimeline(storeId)` to the `Promise.all` fetch block.
2. Import `ScenarioTimeline`.
3. Place `<ScenarioTimeline data={scenarioTimeline} />` immediately before the
   existing `DayRangeSelector` container div (same position as on Overview).

---

## Constraints

- No new Prisma schema or migration changes — `scenarioSlug` is already on
  `DailyStoreMetric`.
- `ScenarioTimeline` is a Server Component. No `"use client"`. Navigation via
  `next/link` only.
- The timeline window is always derived from the actual data bounds — never
  hardcoded to 120.
- The `days` URL parameter must have no effect on the timeline strip.
- All percentage arithmetic must handle the case where `totalMs === 0` without
  dividing by zero (return `null` early in that case).

---

## Verification

```bash
npm run build
npm test
```

- Overview page renders `ScenarioTimeline` above the `DayRangeSelector` block.
- Strip shows two bands with current seeded data: amber "Promo Week" and rose
  "Store Slump · Leipzig Gohlis".
- "Store Slump" band links to the Leipzig store drilldown.
- "Promo Week" band has no link (global scenario, multiple stores).
- Store Drilldown for Leipzig shows both bands (promo is global; slump is store-scoped).
- Store Drilldown for Berlin shows only the "Promo Week" band.
- Header label reads correctly; date axis shows start and end dates.
- No TypeScript errors.

---

## Files that change

- `src/lib/kpi/scenarios.ts` — new
- `src/features/dashboard/ScenarioTimeline.tsx` — new
- `src/lib/kpi/index.ts` — new exports
- `src/app/(app)/dashboard/page.tsx` — fetch + placement
- `src/app/(app)/stores/[storeId]/page.tsx` — fetch + placement
