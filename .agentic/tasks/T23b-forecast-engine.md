# T23b – Forecast Engine Core

## Context

This task implements the forecast engine: the strategy interface, the first two
model implementations, and the orchestration layer that reads inputs, runs a
model, and writes `StoreForecast` rows.

The engine is the **replaceable core** of the prediction system. Any future
model — ML-backed, LLM-assisted, or integration-sourced — can be added by
implementing the `ForecastModel` interface and registering it in the model
registry. The rest of the system is model-agnostic.

Prediction targets for this task: **daily revenue** and **daily visitor count**.
Horizon: **next 1 day** and **next 7 days** (seven individual daily rows).

External signals from T23a (weather, school holidays, user-curated) are inputs
to both models. The models apply them differently.

---

## 1. Schema additions

### New enum and model

```prisma
enum ForecastTarget {
  revenue
  visitors
}

model StoreForecast {
  id             String         @id @default(cuid())
  storeId        String
  store          Store          @relation(fields: [storeId], references: [id])
  targetDate     DateTime
  targetType     ForecastTarget
  value          Float          // point forecast
  lowValue       Float          // uncertainty lower bound
  highValue      Float          // uncertainty upper bound
  uncertaintyPct Float          // (highValue - lowValue) / value, expressed as 0–1
  modelSlug      String
  generatedAt    DateTime       @default(now())

  @@unique([storeId, targetDate, targetType, modelSlug])
  @@index([storeId, targetDate])
  @@index([generatedAt])
}
```

### Reverse relation on `Store`

```prisma
forecasts StoreForecast[]
```

### Migration

```bash
npx prisma migrate dev --name add-store-forecast
```

---

## 2. Engine types (`src/lib/forecast/types.ts`)

```ts
export type ForecastTarget = "revenue" | "visitors";

export type ForecastPoint = {
  date: Date;
  target: ForecastTarget;
  value: number;
  lowValue: number;
  highValue: number;
  uncertaintyPct: number; // (highValue - lowValue) / value
};

// Historical data passed to every model.
export type HistoricalSeries = {
  date: Date;
  revenue: number;
  visitors: number;
  scenarioSlug: string | null;
}[];

// Resolved external signals for a single target date.
export type DaySignals = {
  date: Date;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null;     // mm — null if not cached
  condition: string | null;
  isSchoolHoliday: boolean;
  userSignalMagnitude: number;      // sum of ExternalSignal.magnitude for this store+date, clamped [-1, 1]
};

export type ForecastInput = {
  storeId: string;
  storeFormat: string;
  storeSizeBand: string;
  storeCity: string;
  storeState: string | null;
  history: HistoricalSeries;        // most recent 90 days, ordered ascending
  targetDates: Date[];              // 7 dates starting tomorrow
  signals: DaySignals[];            // one entry per targetDate
};

export interface ForecastModel {
  readonly slug: string;
  readonly displayName: string;
  run(input: ForecastInput): Promise<ForecastPoint[]>;
}
```

---

## 3. Model: Simulator (`src/lib/forecast/models/simulator.ts`)

**Slug:** `"simulator"`

**Concept:** Uses the same formulas as the seed generator but treats the last
30 days of historical data as ground truth to calibrate a baseline. Adds a small
controlled deviation to make forecasts distinct from the seed replay.

**Algorithm:**

```
For each targetDate:
  weekdayFactor   = [Mon 0.78, Tue 0.80, Wed 0.88, Thu 0.95, Fri 1.00, Sat 1.18, Sun 0.85]
  recentAvgVisitors = mean of history.visitors for matching weekdays in last 4 weeks
  recentAvgRevenue  = mean of history.revenue  for matching weekdays in last 4 weeks

  weatherAdjustment = 1.0
    if precipitation > 5mm  → +0.04  (indoor retail benefit for mall/suburban)
    if precipitation > 15mm → -0.03  (net negative — people stay home)
    if condition == "snow"  → -0.08

  holidayAdjustment = isSchoolHoliday ? +0.12 : 0.0
    (applies to suburban and mall formats only; urban and flagship: +0.06)

  userAdjustment = userSignalMagnitude × 0.15

  pointVisitors = recentAvgVisitors × (1 + weatherAdjustment + holidayAdjustment + userAdjustment)
  pointRevenue  = recentAvgRevenue  × (1 + weatherAdjustment + holidayAdjustment + userAdjustment)

  // Uncertainty: ±8% base, widened by signal strength
  uncertainty   = 0.08 + abs(weatherAdjustment + holidayAdjustment) × 0.04
  lowVisitors   = pointVisitors × (1 - uncertainty)
  highVisitors  = pointVisitors × (1 + uncertainty)
  (same for revenue)
```

If fewer than 7 historical matching-weekday samples exist, fall back to the
overall recent mean. If history is empty, return a zero forecast with
`uncertaintyPct: 1.0`.

---

## 4. Model: Naive Seasonal (`src/lib/forecast/models/naive-seasonal.ts`)

**Slug:** `"naive_seasonal"`

**Concept:** Computes a rolling seasonal average without the seed formulas.
Uses only the historical series and external signals. Suitable as a "baseline"
model that can later be replaced by an ML model without touching the interface.

**Algorithm:**

```
For each targetDate:
  // Seasonal window: same weekday ±1 day, last 8 weeks
  window = history rows where abs(dayOfWeek - targetDayOfWeek) <= 1
           AND date >= targetDate - 56 days
  if window.length < 3: use full history

  baseVisitors = median(window.visitors)
  baseRevenue  = median(window.revenue)

  // Apply same signal adjustments as SimulatorModel
  // (shared helper function — do not duplicate the adjustment logic)
  adjustedVisitors = applySignalAdjustments(baseVisitors, signals, storeFormat)
  adjustedRevenue  = applySignalAdjustments(baseRevenue,  signals, storeFormat)

  // Uncertainty: wider than simulator (less informed model)
  uncertainty = 0.12 + abs(adjustments) × 0.05
```

**Shared helper:** Extract signal adjustment math into
`src/lib/forecast/adjustments.ts` so both models call the same function. This
prevents drift between model behaviours when adjustment logic changes.

---

## 5. Model registry (`src/lib/forecast/registry.ts`)

```ts
import { SimulatorModel } from "./models/simulator";
import { NaiveSeasonalModel } from "./models/naive-seasonal";
import type { ForecastModel } from "./types";

const MODELS: Record<string, ForecastModel> = {
  simulator: new SimulatorModel(),
  naive_seasonal: new NaiveSeasonalModel(),
};

export function getModel(slug: string): ForecastModel {
  const model = MODELS[slug];
  if (!model) throw new Error(`Unknown forecast model: "${slug}"`);
  return model;
}

export function listModels(): Array<{ slug: string; displayName: string }> {
  return Object.values(MODELS).map((m) => ({
    slug: m.slug,
    displayName: m.displayName,
  }));
}
```

Adding a new model is one line in this registry — nothing else changes.

---

## 6. Engine orchestrator (`src/lib/forecast/engine.ts`)

```ts
export async function runForecastForStore(
  storeId: string,
  options?: { horizonDays?: number },  // default 7
): Promise<{ points: ForecastPoint[]; modelSlug: string }>
```

**Steps:**

1. **Load config** — fetch `StoreForecastConfig` for the store. If `enabled` is
   false or `modelSlug` is `"none"`, return `{ points: [], modelSlug: "none" }`.

2. **Load store** — fetch `Store` including `city`, `state`, `format`, `sizeBand`.

3. **Load history** — fetch last 90 days of `DailyStoreMetric` rows for this
   store, ordered ascending. Map to `HistoricalSeries`.

4. **Compute target dates** — `horizonDays` consecutive days starting tomorrow
   (UTC date, time stripped to midnight).

5. **Load signals** — for each target date, resolve:
   - `WeatherObservation` for the store's city and date (may be null)
   - `SchoolHoliday` rows for the store's state that overlap the date (may be empty)
   - `ExternalSignal` rows for this store and date — sum magnitudes, clamp [-1, 1]
   - Assemble into `DaySignals[]`

6. **Build `ForecastInput`** and call `getModel(config.modelSlug).run(input)`.

7. **Persist results** — for each point, upsert into `StoreForecast`:
   ```ts
   prisma.storeForecast.upsert({
     where: { storeId_targetDate_targetType_modelSlug: { storeId, targetDate: point.date, targetType: point.target, modelSlug } },
     update: { value: point.value, lowValue: point.lowValue, highValue: point.highValue, uncertaintyPct: point.uncertaintyPct, generatedAt: new Date() },
     create: { ... all fields ... },
   });
   ```

8. **Return** `{ points, modelSlug }`.

```ts
// Convenience: run for all enabled stores
export async function runForecastForAllStores(
  options?: { horizonDays?: number },
): Promise<Map<string, { points: ForecastPoint[]; modelSlug: string }>>
```

Fetches all stores where `StoreForecastConfig.enabled = true`, runs
`runForecastForStore` for each **sequentially** (not parallel — avoids
overwhelming SQLite with concurrent writes).

---

## 7. Engine index (`src/lib/forecast/index.ts`)

```ts
export { runForecastForStore, runForecastForAllStores } from "./engine";
export { getModel, listModels } from "./registry";
export type { ForecastInput, ForecastPoint, ForecastTarget, DaySignals, HistoricalSeries } from "./types";
```

---

## 8. Unit tests

### `src/lib/forecast/adjustments.test.ts`

- Rain >5mm on a mall store increases visitor estimate
- Rain >5mm on an urban store: same direction
- School holiday on suburban store: larger boost than flagship
- Zero signals → adjustment factor is exactly 1.0
- User magnitude −1.0 → adjustment is negative

### `src/lib/forecast/models/simulator.test.ts`

- Given 4 weeks of seeded history for a Wednesday, returns a point for the next
  Wednesday between the historical min and max × some tolerance
- Empty history → zero forecast, uncertaintyPct = 1.0
- Signal adjustments shift the output in the correct direction

Use in-memory arrays for `HistoricalSeries` — no DB required in unit tests.

---

## 9. Verification

```bash
npx prisma migrate dev --name add-store-forecast
npx tsx prisma/seed.ts
npm run build
npm test
```

- [ ] Migration applies cleanly
- [ ] `StoreForecast` table exists with correct columns
- [ ] `listModels()` returns two entries: `simulator` and `naive_seasonal`
- [ ] `getModel("unknown")` throws with a clear message
- [ ] `runForecastForStore` with a disabled config returns empty array without
  writing to DB
- [ ] Enable BER-01 with model `"simulator"` in settings, run engine manually:
  `npx tsx -e "import { runForecastForStore } from './src/lib/forecast'; runForecastForStore('<BER-01-ID>').then(console.log)"`
  → 14 `StoreForecast` rows (7 days × 2 targets)
- [ ] Re-running upserts, not duplicates
- [ ] Unit tests pass: adjustments, simulator, naive-seasonal

---

## Files that change / created

- `prisma/schema.prisma` — `ForecastTarget` enum, `StoreForecast` model, `Store.forecasts` relation
- `prisma/migrations/<timestamp>_add_store_forecast/migration.sql`
- `src/lib/forecast/types.ts` — new
- `src/lib/forecast/adjustments.ts` — new (shared signal adjustment logic)
- `src/lib/forecast/models/simulator.ts` — new
- `src/lib/forecast/models/naive-seasonal.ts` — new
- `src/lib/forecast/registry.ts` — new
- `src/lib/forecast/engine.ts` — new
- `src/lib/forecast/index.ts` — new
- `src/lib/forecast/adjustments.test.ts` — new
- `src/lib/forecast/models/simulator.test.ts` — new

## Dependencies

- **T22 must be merged** — `StoreForecastConfig` and `Store.state` are required.
- **T23a must be merged** — `WeatherObservation`, `SchoolHoliday`, `ExternalSignal`
  tables and query helpers are required by the engine's signal resolution step.
- T23c depends on this task (it calls `runForecastForStore`).
