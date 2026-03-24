---
status: closed
complexity: standard
---

# T12 – Explainable Insights (AlertPanel → InsightPanel)

## Context

`AlertPanel` currently renders a flat, collapsible list of raw daily alert rows tagged
with a `scenarioSlug`. Each row carries little context beyond the store name, date, and
badge colour.

This task replaces that list with an **InsightPanel**: one card per active scenario+store
combination, each containing a generated headline, supporting detail sentence, deviation
from baseline, duration, and a link to the store drilldown page.

The insight text is **fully rule-based and deterministic** — no LLM. AlertPanel and its
supporting `getActiveAlerts` call are superseded by the new layer; both can be removed
once InsightPanel is wired in.

---

## Changes

### 1. `src/lib/kpi/insights.ts` — new file

#### Type

```ts
export type Insight = {
  id: string;                // `${scenarioSlug}:${storeId}`
  scenarioSlug: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  headline: string;          // one punchy sentence
  detail: string;            // one supporting sentence with metric context
  priority: number;          // higher = show first; derive from Math.abs(deviationPercent)
  durationDays: number;      // how many days this scenario has been active
  deviationPercent: number;  // signed: negative = below baseline, positive = above
  affectedMetric: "revenue" | "conversion";
  storeUrl: string;          // `/stores/${storeId}`
};
```

#### `getActiveInsights(days: number, storeId?: string): Promise<Insight[]>`

**Step 1 — fetch alert rows**

Same query as `getActiveAlerts` (reuse or inline). Include `visitors` in the returned
fields (it's on `DailyStoreMetric`).

**Step 2 — group by `scenarioSlug + storeId`**

Produce one group per unique combination. From each group extract:
- `durationDays`: number of rows in the group
- `scenarioAvgRevenue`: mean `revenue` across group rows
- `scenarioAvgConversion`: mean `conversionRate` across group rows
- `scenarioAvgVisitors`: mean `visitors` across group rows
- earliest `date` in the group (used to fetch baseline)

**Step 3 — fetch baseline for each group**

For each unique `storeId` seen in the groups, query `DailyStoreMetric` for the 30 days
immediately before the earliest alert date in that store's group. Compute:
- `baselineAvgRevenue`
- `baselineAvgConversion`
- `baselineAvgVisitors`

Fetch all baseline stores in one `findMany` (filter by `storeId IN [...]` and date range)
and group in TypeScript — avoid N+1 queries.

**Step 4 — apply rules per `scenarioSlug`**

Define a rule map. Each rule receives the group aggregates and baseline, and returns
`{ headline, detail, affectedMetric, deviationPercent }`.

**`store_slump` rule:**
- `affectedMetric`: `"revenue"`
- `deviationPercent`: `(scenarioAvgRevenue - baselineAvgRevenue) / baselineAvgRevenue`
- Visitor context: if `scenarioAvgVisitors` within ±10 % of `baselineAvgVisitors`
  → "with stable visitor numbers"; otherwise omit the visitor clause
- `headline`: `"{storeName} is {X}% below its prior-period average revenue{visitor clause}."`
- `detail`: `"Revenue averaged {€X} over the last {N} days vs. {€Y} in the preceding period."`

**`promo_week` rule:**
- `affectedMetric`: `"revenue"`
- `deviationPercent`: `(scenarioAvgRevenue - baselineAvgRevenue) / baselineAvgRevenue`
- `headline`: `"{storeName} is showing {X}% above-average revenue since Promo Week began."`
- `detail`: `"Revenue averaged {€X} over {N} days — up from {€Y} in the prior period."`

**Fallback rule** (any unknown slug):
- `affectedMetric`: `"revenue"`
- `deviationPercent`: `(scenarioAvgRevenue - baselineAvgRevenue) / baselineAvgRevenue`
- `headline`: `"{storeName} has an active alert: {scenarioSlug} ({N} days)."`
- `detail`: `"Revenue averaged {€X} vs. a prior-period baseline of {€Y}."`

**Step 5 — sort by `priority` descending** (i.e. largest absolute deviation first).

Use `formatRevenue` from `src/lib/kpi/format.ts` for all currency values in the generated
strings. Format `deviationPercent` as `Math.abs(deviationPercent * 100).toFixed(1)`.

---

### 2. `src/features/dashboard/InsightPanel.tsx` — new file

Server Component. Replaces `AlertPanel`.

```ts
type InsightPanelProps = {
  insights: Insight[];
};
```

**When `insights.length === 0`:** render a single card with "No active anomalies detected."

**When insights exist:** render one card per insight. Each card contains:

```
[Scenario badge]                          [Duration chip e.g. "12 days"]
Headline (medium weight, ink-900)
Detail (small, ink-700)
[Deviation badge: e.g. "−18.3 %"]        [→ View store  (link)]
```

- Scenario badge: reuse the colour logic from the old `AlertPanel`
  (`store_slump` → red, `promo_week` → amber, fallback → grey)
- Deviation badge: red if negative, green if positive
- "View store" is a `next/link` to `insight.storeUrl`
- No collapse behaviour — the old collapsible list is gone; cards are always visible

---

### 3. Wire up

**`src/app/(app)/dashboard/page.tsx`**

- Replace `getActiveAlerts(30)` with `getActiveInsights(30)`
- Replace `<AlertPanel alerts={alerts} />` with `<InsightPanel insights={insights} />`

**`src/app/(app)/stores/[storeId]/page.tsx`**

- Replace `getActiveAlerts(30, storeId)` with `getActiveInsights(30, storeId)`
- Replace `<AlertPanel alerts={alerts} />` with `<InsightPanel insights={insights} />`

---

### 4. Remove `AlertPanel`

Delete `src/features/dashboard/AlertPanel.tsx`. Remove all imports of it.
`getActiveAlerts` in `src/lib/kpi/alerts.ts` can be kept (it's used internally by
`getActiveInsights`) or inlined — either is fine.

---

## Constraints

- Rule functions must be **pure**: given the same inputs they return the same strings.
  No randomness, no external calls.
- All monetary values formatted via `formatRevenue`. Percentages always one decimal place.
- No new Client Components. InsightPanel is a Server Component.
- The store link (`/stores/{storeId}`) must use the database `id`, not the store `code`.

## Verification

```bash
npm run build
```

- Dashboard and store detail pages build without errors
- InsightPanel renders in place of AlertPanel on both pages
- With seeded data: `store_slump` produces a negative-deviation card for Leipzig,
  `promo_week` produces a positive-deviation card
- Each card has a working "View store" link
- No TypeScript errors

## Files that change

- `src/lib/kpi/insights.ts` — new
- `src/features/dashboard/InsightPanel.tsx` — new
- `src/features/dashboard/AlertPanel.tsx` — deleted
- `src/app/(app)/dashboard/page.tsx` — swapped imports and component
- `src/app/(app)/stores/[storeId]/page.tsx` — swapped imports and component
