---
status: closed
complexity: micro
---

# T16 – New Seed Scenarios

## Context

The current seed has two scenarios (`promo_week`, `store_slump`). This task adds
two more to give the demo a richer narrative and make the `ScenarioTimeline`
(T15) and `InsightPanel` more interesting to walk through.

The two new scenarios are:

| Slug | Store | Story |
|---|---|---|
| `traffic_surge` | Hamburg Altona (HAM-01) | A local event drives 45% more footfall but dilutes conversion — visitors up, baskets smaller |
| `competitor_opening` | München Maxvorstadt (MUC-01) | A competing store opens nearby; sustained traffic and conversion pressure for 30 days |

Both scenarios sit in a part of the 120-day window that doesn't overlap with
`promo_week` or `store_slump`, keeping the timeline readable.

---

## Changes

### `prisma/seed.ts` — extend `SCENARIOS`

Add two entries to the `SCENARIOS` array. No other changes to the seed file
are needed; the simulation loop already applies effects per scenario.

```ts
{
  slug: "traffic_surge",
  description:
    "Hamburg: lokales Event treibt Traffic, verdünnt Conversion und Basket-Wert",
  startDaysAgo: 60,
  durationDays: 8,
  storeCode: "HAM-01",
  effects: {
    trafficMultiplier: 1.45,
    conversionMultiplier: 0.81,
    basketMultiplier: 0.91,
  },
},
{
  slug: "competitor_opening",
  description:
    "München: neuer Wettbewerber in der Nähe — anhaltender Traffic- und Conversion-Druck",
  startDaysAgo: 52,
  durationDays: 30,
  storeCode: "MUC-01",
  effects: {
    trafficMultiplier: 0.79,
    conversionMultiplier: 0.87,
    basketMultiplier: 0.97,
  },
},
```

### `src/lib/kpi/scenarios.ts` — extend label map

Add the two new slugs to `SCENARIO_LABELS`:

```ts
const SCENARIO_LABELS: Record<string, string> = {
  promo_week: "Promo Week",
  store_slump: "Store Slump",
  traffic_surge: "Traffic Surge",        // add
  competitor_opening: "Competitor Opening", // add
};
```

If T15 has not yet been merged when this task runs, note this change as
pending and apply it immediately after T15 lands.

### `src/lib/kpi/insights.ts` — extend rule map

Add insight rules for the two new slugs so `InsightPanel` generates meaningful
text instead of falling back to the generic rule.

**`traffic_surge` rule:**
- `affectedMetric`: `"conversion"`
- `deviationPercent`: `(scenarioAvgConversion - baselineAvgConversion) / baselineAvgConversion`
- `headline`: `"{storeName} saw a {X}% conversion drop despite a {Y}% visitor increase during the traffic surge."`
  where Y = `((scenarioAvgVisitors - baselineAvgVisitors) / baselineAvgVisitors * 100).toFixed(1)`
- `detail`: `"Conversion averaged {C}% over {N} days vs. {B}% prior — more footfall, fewer buyers."`

**`competitor_opening` rule:**
- `affectedMetric`: `"revenue"`
- `deviationPercent`: `(scenarioAvgRevenue - baselineAvgRevenue) / baselineAvgRevenue`
- `headline`: `"{storeName} revenue is {X}% below baseline since a competitor opened nearby."`
- `detail`: `"Revenue averaged {€X} over {N} days vs. {€Y} in the preceding period."`

### Re-seed

After the code changes above, drop and re-seed the database:

```bash
npx tsx prisma/seed.ts
```

The seed is deterministic (`SEED_VALUE = "retail-demo-v1"`), so re-running it
produces identical numbers for all existing scenarios while adding the new ones.

---

## Constraints

- No Prisma schema or migration changes — `scenarioSlug` is already on
  `DailyStoreMetric`.
- `startDaysAgo` for new scenarios must not overlap with existing scenarios on
  the same store. Current conflicts to avoid:
  - `promo_week`: days 23–30 ago (global)
  - `store_slump`: days 2–14 ago on LEI-01
  - New scenarios: HAM-01 days 52–60 ago, MUC-01 days 22–52 ago — no overlap.
- The insight rule functions must remain pure (no randomness, no external calls).
- Format deviation percentages to one decimal place. Use `formatRevenue` for
  currency values.

---

## Verification

```bash
npx tsx prisma/seed.ts
npm run build
npm test
```

- Seed output lists four scenarios.
- `ScenarioTimeline` (T15) shows four bands on the Overview: amber Promo Week,
  rose Store Slump, and two new bands for Hamburg and München.
- `InsightPanel` generates specific headline/detail cards for `traffic_surge`
  and `competitor_opening` (not the fallback rule).
- Store Drilldown for Hamburg shows `traffic_surge` band and insight card.
- Store Drilldown for München shows `competitor_opening` band and insight card.
- No TypeScript errors.

---

## Dependency

T15 (Scenario Timeline) should be completed before this task, as `scenarios.ts`
and `SCENARIO_LABELS` originate there. If T15 is not yet merged, the label-map
change is the only addition needed from T15 — note this in the implementation.

---

## Files that change

- `prisma/seed.ts` — two new entries in `SCENARIOS`
- `src/lib/kpi/scenarios.ts` — two entries in `SCENARIO_LABELS`
- `src/lib/kpi/insights.ts` — two new rules in the rule map
