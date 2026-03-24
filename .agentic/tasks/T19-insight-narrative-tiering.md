---
status: closed
complexity: standard
---

# T19 – Insight Narrative Tiering

## Context

`InsightPanel` currently renders all insights in a single flat list sorted by absolute
deviation (`|deviationPercent|`). This causes a narrative problem: a store can
simultaneously show a historical `promo_week` card (+44%) and a current `store_slump`
card (−45%), both in present tense, with no indication that they refer to different time
windows. To a reader they look like a contradictory single statement about the store.

This task introduces **temporal tiering**: insights are separated into "active" (current
concern) and "historical context" groups, cards carry explicit date ranges, and wording
shifts to past tense for concluded scenarios.

No new data is needed — everything required is already in the alert rows.

---

## Changes

### 1. `src/lib/kpi/insights.ts`

#### 1a. Extend `InsightGroup` — add `latestDate`

`buildInsightGroups` currently tracks `earliestDate`. Also track `latestDate`: the most
recent date in the group's alert rows.

```ts
type InsightGroup = {
  // ... existing fields
  earliestDate: Date;
  latestDate: Date;   // NEW
};
```

In `buildInsightGroups`, compute it alongside `earliestDate`:

```ts
latestDate: groupRows.reduce(
  (latest, row) => (row.date > latest ? row.date : latest),
  groupRows[0].date,
),
```

#### 1b. Extend the `Insight` type — add `isActive` and `dateRangeLabel`

```ts
export type Insight = {
  // ... existing fields
  isActive: boolean;      // NEW — true if the scenario ended ≤ 7 days ago
  dateRangeLabel: string; // NEW — e.g. "Feb 18–24" or "Mar 7–18"
};
```

#### 1c. Add `formatDateRange` helper

```ts
function formatDateRange(from: Date, to: Date): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fromMonth = monthNames[from.getMonth()];
  const toMonth   = monthNames[to.getMonth()];
  const fromDay   = from.getDate();
  const toDay     = to.getDate();

  if (fromMonth === toMonth) {
    return `${fromMonth} ${fromDay}–${toDay}`;
  }
  return `${fromMonth} ${fromDay}–${toMonth} ${toDay}`;
}
```

#### 1d. Compute `isActive` in `buildInsight`

Pass the query window end date (`current.to` from `buildDateRanges`) through to
`buildInsight` so it can be compared against `group.latestDate`.

A scenario is **active** when its latest alert date is within 7 days of the query
window end:

```ts
const ACTIVE_THRESHOLD_DAYS = 7;

function isScenarioActive(latestDate: Date, windowEnd: Date): boolean {
  const msPerDay = 24 * 60 * 60 * 1000;
  return (windowEnd.getTime() - latestDate.getTime()) / msPerDay <= ACTIVE_THRESHOLD_DAYS;
}
```

#### 1e. Update `insightRules` — tense and date range in wording

Both rules receive `isActive` and `dateRangeLabel` via the rule input. Update
`InsightRuleInput`:

```ts
type InsightRuleInput = {
  group: InsightGroup;
  baseline: BaselineSnapshot;
  isActive: boolean;      // NEW
  dateRangeLabel: string; // NEW
};
```

**`store_slump` rule — updated:**

```ts
store_slump: ({ group, baseline, isActive, dateRangeLabel }) => {
  const deviationPercent = getBaselineDeviation(group.scenarioAvgRevenue, baseline.avgRevenue);
  const visitorsStable = ...;  // unchanged
  const visitorClause  = ...;  // unchanged

  const headline = isActive
    ? `${group.storeName} is ${getDeviationText(deviationPercent, "below", "above")} its prior-period average revenue${visitorClause}.`
    : `${group.storeName} was ${getDeviationText(deviationPercent, "below", "above")} its prior-period average revenue during ${dateRangeLabel}${visitorClause}.`;

  const detail = isActive
    ? `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over the last ${group.durationDays} days vs. ${formatRevenue(baseline.avgRevenue)} in the preceding period.`
    : `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over ${group.durationDays} days (${dateRangeLabel}) vs. ${formatRevenue(baseline.avgRevenue)} in the preceding period.`;

  return { affectedMetric: "revenue", deviationPercent, headline, detail };
},
```

**`promo_week` rule — updated:**

```ts
promo_week: ({ group, baseline, isActive, dateRangeLabel }) => {
  const deviationPercent = getBaselineDeviation(group.scenarioAvgRevenue, baseline.avgRevenue);
  const performanceText  = ...;  // unchanged
  const directionWord    = ...;  // unchanged

  const headline = isActive
    ? `${group.storeName} is showing ${performanceText} revenue since Promo Week began.`
    : `During Promo Week (${dateRangeLabel}), ${group.storeName} ran ${performanceText} vs. its prior-period average.`;

  const detail = isActive
    ? `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over ${group.durationDays} days — ${directionWord} from ${formatRevenue(baseline.avgRevenue)} in the prior period.`
    : `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over ${group.durationDays} days — ${directionWord} from ${formatRevenue(baseline.avgRevenue)} in the prior period.`;

  return { affectedMetric: "revenue", deviationPercent, headline, detail };
},
```

The fallback rule gets the same tense treatment as `store_slump` (present if active,
past with date range if historical).

#### 1f. Update `buildInsight` signature and sort order

```ts
function buildInsight(group: InsightGroup, baseline: BaselineSnapshot, windowEnd: Date): Insight
```

Compute inside `buildInsight`:

```ts
const active        = isScenarioActive(group.latestDate, windowEnd);
const dateRangeLabel = formatDateRange(group.earliestDate, group.latestDate);
const result        = rule
  ? rule({ group, baseline, isActive: active, dateRangeLabel })
  : buildFallbackInsight({ group, baseline, isActive: active, dateRangeLabel });

return {
  ...existingFields,
  isActive: active,
  dateRangeLabel,
};
```

**Sort order** — replace the existing single sort with a two-level sort:

```ts
.sort((left, right) => {
  // Active insights before historical
  if (left.isActive !== right.isActive) {
    return left.isActive ? -1 : 1;
  }
  // Within each tier: largest absolute deviation first
  return right.priority - left.priority;
})
```

Pass `current.to` from `getActiveInsights` through to `buildInsight`.

---

### 2. `src/features/dashboard/InsightPanel.tsx`

#### 2a. Split insights into two tiers

```ts
const active     = insights.filter((i) => i.isActive);
const historical = insights.filter((i) => !i.isActive);
```

#### 2b. Render section headers when both tiers are non-empty

When only one tier has items, render cards without a section header (no visual change
for the common single-scenario case).

When both tiers have items, render:

```tsx
{/* Active tier */}
{active.length > 0 && historical.length > 0 && (
  <p className="text-xs font-semibold uppercase tracking-widest text-ink-500 px-1">
    Active alerts
  </p>
)}
{active.map((insight) => <InsightCard key={insight.id} insight={insight} />)}

{/* Historical tier */}
{historical.length > 0 && (
  <>
    {active.length > 0 && (
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-500 px-1 pt-2">
        Historical context
      </p>
    )}
    {historical.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
  </>
)}
```

Extract the existing card JSX into a local `InsightCard` component (same file,
not exported) to avoid repeating the card markup in both tiers.

#### 2c. Add `dateRangeLabel` to the duration chip

Replace the existing duration chip:

```tsx
{/* before */}
<span ...>{formatDuration(insight.durationDays)}</span>

{/* after */}
<span ...>{insight.dateRangeLabel} · {formatDuration(insight.durationDays)}</span>
```

This gives the user the exact window at a glance without reading the headline.

---

## Constraints

- No new Client Components.
- No new database queries — all data comes from existing alert rows.
- `formatDateRange` must produce the same string regardless of locale (hard-coded English
  month abbreviations as shown above).
- Section headers must only appear when **both** tiers have at least one insight.
  A store with only one type of insight (very common) should see no header.
- The `isActive` threshold (7 days) is a constant — do not derive it from props or
  environment variables.

---

## Verification

```bash
npm run build
npm test
```

- Build passes with no TypeScript errors.
- With seeded data: `promo_week` card shows past-tense headline and date range in chip;
  `store_slump` card shows present-tense headline.
- If both insights appear for the same store, section headers "Active alerts" and
  "Historical context" are rendered between the two groups.
- If only one type of insight exists, no section header is rendered.
- `dateRangeLabel` on the chip matches the actual earliest–latest dates of the scenario
  window.

## Files that change

- `src/lib/kpi/insights.ts` — extend types, add helpers, update rules and sort
- `src/features/dashboard/InsightPanel.tsx` — tiered rendering, date range in chip
