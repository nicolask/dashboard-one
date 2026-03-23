# T23a – External Signal Schema & Cache

## Context

The forecast engine (T23b) adjusts its predictions based on two categories of
external signals:

- **Weather** — daily temperature and precipitation per city, fetched from
  Open-Meteo (free, no API key required). Rain and extreme temperatures
  meaningfully affect retail footfall.
- **School holidays** — German school holiday windows per Bundesland, fetched
  from ferien-api.de (free public API). Holiday periods correlate with footfall
  spikes for formats near residential areas.
- **User-curated signals** — one-off events that store managers know about but
  that no public API covers: a local fair, a road closure, a competitor opening.
  These are entered via a form and stored alongside weather/holiday data.

All external data is cached in the local database. The engine reads from these
tables — it never calls external APIs at query time. Cache freshness is managed
by a dedicated refresh script, not by the request path.

The principle from `project-context.md` applies: "expect external API data to
be cached locally instead of fetched live on every page load."

---

## 1. Schema additions

### New enums

```prisma
enum WeatherCondition {
  sunny
  partly_cloudy
  cloudy
  rain
  heavy_rain
  snow
}
```

### New models

```prisma
model WeatherObservation {
  id          String           @id @default(cuid())
  city        String
  date        DateTime
  tempMax     Float
  tempMin     Float
  precipitation Float          // mm
  condition   WeatherCondition

  @@unique([city, date])
  @@index([city, date])
}

model SchoolHoliday {
  id        String   @id @default(cuid())
  state     String   // Bundesland abbreviation, e.g. "BY"
  name      String
  startDate DateTime
  endDate   DateTime
  year      Int

  @@unique([state, name, year])
  @@index([state, startDate])
}

model ExternalSignal {
  id         String   @id @default(cuid())
  storeId    String
  store      Store    @relation(fields: [storeId], references: [id])
  date       DateTime
  label      String   // e.g. "Stadtfest Ehrenfeld", "Straßensperrung"
  magnitude  Float    // -1.0 to +1.0 — negative = suppresses footfall
  notes      String?
  source     String   @default("user")  // always "user" for now

  @@index([storeId, date])
}
```

### Reverse relation on `Store`

```prisma
externalSignals ExternalSignal[]
```

### Migration

```bash
npx prisma migrate dev --name add-external-signals
```

---

## 2. Fetch services (`src/lib/external/`)

Create three files. None of these functions are called on the request path —
they are called only by the refresh script and the seed.

### `src/lib/external/weather.ts`

```ts
export async function fetchWeatherForCity(
  city: string,
  from: Date,
  to: Date,
): Promise<void>
```

- Maps city name to (latitude, longitude). Hardcode the mapping for the 8 known
  cities (Berlin, Hamburg, München, Leipzig, Köln, Stuttgart, Düsseldorf, Nürnberg).
  Return early with a console warning for unknown cities.
- Calls Open-Meteo daily historical API for past dates and forecast API for
  future dates. Use `fetch` with `next: { revalidate: 0 }` or plain Node fetch.
  Open-Meteo endpoint: `https://api.open-meteo.com/v1/forecast` (works for both
  historical and forecast with the correct parameters).
- Requested fields: `temperature_2m_max`, `temperature_2m_min`,
  `precipitation_sum`, `weathercode`.
- Map WMO weather code to `WeatherCondition` enum:
  - 0–1 → `sunny`
  - 2–3 → `partly_cloudy` / `cloudy`
  - 51–67 → `rain`
  - 71–77 → `snow`
  - 80–82 → `heavy_rain`
  - All others → `cloudy` (safe default)
- Upsert each day using `prisma.weatherObservation.upsert` keyed on
  `@@unique([city, date])`.
- On HTTP error: log and return, do not throw — cache population failures should
  not abort the seed or script.

### `src/lib/external/holidays.ts`

```ts
export async function fetchHolidaysForState(
  state: string,
  year: number,
): Promise<void>
```

- Calls `https://ferien-api.de/api/v1/holidays/${state}/${year}`.
- Maps the response array (each item: `{ name, start, end, stateCode, year }`)
  to `SchoolHoliday` rows.
- Upsert keyed on `@@unique([state, name, year])`.
- On HTTP error: log and return.

### `src/lib/external/index.ts`

```ts
export { fetchWeatherForCity } from "./weather";
export { fetchHolidaysForState } from "./holidays";
```

---

## 3. Signal query helpers (`src/lib/external/signals.ts`)

These are the functions the engine reads from — not the fetch functions.

```ts
// Returns weather rows for a city over a date range, ordered by date.
export async function getWeatherForCity(
  city: string,
  from: Date,
  to: Date,
): Promise<WeatherObservation[]>

// Returns school holiday windows that overlap a date range for a given state.
// A date is "in holiday" if it falls within [startDate, endDate] of any row.
export async function getHolidaysForState(
  state: string,
  from: Date,
  to: Date,
): Promise<SchoolHoliday[]>

// Returns user-curated signals for a store over a date range.
export async function getExternalSignalsForStore(
  storeId: string,
  from: Date,
  to: Date,
): Promise<ExternalSignal[]>
```

---

## 4. Cache refresh script (`scripts/refresh-external-signals.ts`)

Standalone executable script. Runnable with:

```bash
npx tsx scripts/refresh-external-signals.ts
```

Logic:

1. Read all active stores from the DB (needs `state` field — depends on T22).
2. Compute date range: 120 days back from today through 7 days forward.
3. For each unique city in the store list → call `fetchWeatherForCity`.
4. For each unique state in the store list → call `fetchHolidaysForState` for
   the current year, and also for the next year if the forward window crosses
   a year boundary.
5. Log progress and any errors to stdout.

This script is also called at the end of `prisma/seed.ts`:

```ts
// At the end of main(), after seedForecastConfigs:
await seedExternalSignals(); // calls the same logic as the refresh script
```

Implement `seedExternalSignals()` in `prisma/seed.ts` by calling the fetch
functions directly (not via HTTP). Add it to the `main()` log output.

If the external APIs are unreachable (e.g. in CI with no network), the seed
should not fail — catch errors per call and log a warning.

---

## 5. User-curated signal UI

Add a collapsible section to the store settings row in `StoreSettingsTable`
(T22) — or, if that becomes too wide, a per-store drawer/dialog. This is
secondary; a simple form is sufficient.

Actually, keep it simple: add a separate page at `/settings/signals/[storeId]`.

### `src/app/(app)/settings/signals/[storeId]/page.tsx`

Server component. Fetches store + existing signals for the next 14 days.
Renders `<ExternalSignalForm>` client component.

### `src/features/settings/ExternalSignalForm.tsx`

`"use client"`. Form fields:

- **Date** — `<input type="date">`, restricted to today + 7 days forward
- **Label** — text, max 80 chars
- **Magnitude** — range slider −1.0 to +1.0, step 0.1, with descriptive labels
  ("Strong negative" / "Neutral" / "Strong positive")
- **Notes** — optional textarea
- **Submit** → `POST /api/settings/signals/[storeId]`

Below the form: a list of existing upcoming signals with a **Delete** button
each → `DELETE /api/settings/signals/[signalId]`.

### API routes

`src/app/api/settings/signals/[storeId]/route.ts` — `POST` only:
- Validates body (date, label required; magnitude clamped to [-1, 1]).
- Creates `ExternalSignal` row.
- Returns `201 { id }`.

`src/app/api/settings/signals/[signalId]/route.ts` — `DELETE` only:
- Deletes by ID.
- Returns `204`.

Both auth-guarded.

---

## 6. Verification

```bash
npx prisma migrate dev --name add-external-signals
npx tsx prisma/seed.ts   # includes seedExternalSignals
npm run build
npm test
```

- [ ] Migration applies cleanly
- [ ] `WeatherObservation`, `SchoolHoliday`, `ExternalSignal` tables exist
- [ ] After seed: `WeatherObservation` rows exist for all 8 cities over the
  120-day range (may be empty if network unavailable — seed must not fail)
- [ ] After seed: `SchoolHoliday` rows exist for all relevant states
- [ ] `fetchWeatherForCity` is idempotent — running twice does not duplicate rows
- [ ] Refresh script runs without crashing: `npx tsx scripts/refresh-external-signals.ts`
- [ ] Signal form at `/settings/signals/BER-01` (by store code lookup): renders,
  submits, creates row in DB
- [ ] Delete button removes the signal row
- [ ] Build passes with no TypeScript errors

---

## Files that change / created

- `prisma/schema.prisma` — new enum, 3 new models, `Store.externalSignals` relation
- `prisma/migrations/<timestamp>_add_external_signals/migration.sql`
- `prisma/seed.ts` — `seedExternalSignals()` step
- `src/lib/external/weather.ts` — new
- `src/lib/external/holidays.ts` — new
- `src/lib/external/signals.ts` — query helpers, new
- `src/lib/external/index.ts` — new
- `scripts/refresh-external-signals.ts` — new
- `src/app/(app)/settings/signals/[storeId]/page.tsx` — new
- `src/features/settings/ExternalSignalForm.tsx` — new
- `src/app/api/settings/signals/[storeId]/route.ts` — new (POST)
- `src/app/api/settings/signals/[signalId]/route.ts` — new (DELETE)

## Dependencies

- **T22 must be merged first** — `Store.state` is required by the holiday fetch
  and by `StoreForecastConfig`. The migration in T22 must be applied before this
  migration.
- T23b and T23c depend on this task.
