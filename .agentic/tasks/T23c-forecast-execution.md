---
status: planned
complexity: standard
---

# T23c – Forecast Execution Layer

## Context

The engine (T23b) knows how to produce forecasts. This task adds the layer that
controls *when* the engine runs:

- **On demand** — a user clicks "Run Forecast" in settings and the forecast is
  generated immediately.
- **On data update** — when a fresh seed or daily data import lands, forecasts
  are regenerated automatically for all enabled stores.
- **Inspection** — recent forecast runs are visible in the settings UI so it
  is clear when forecasts were last generated and whether they succeeded.

The execution path is intentionally simple: a `ForecastJob` table tracks runs,
an API route enqueues and executes jobs synchronously, and the seed calls the
engine directly (no HTTP). There is no background worker, no queue service, and
no polling — the event flow is traceable through the code and the DB.

---

## 1. Schema additions

### New enum and model

```prisma
enum ForecastJobStatus {
  pending
  running
  done
  failed
}

model ForecastJob {
  id           String            @id @default(cuid())
  storeId      String?           // null = all enabled stores
  store        Store?            @relation(fields: [storeId], references: [id])
  status       ForecastJobStatus @default(pending)
  triggeredBy  String            // "manual" | "seed" | "data_update"
  modelSlug    String?           // snapshot of model slug used
  pointsWritten Int?             // total StoreForecast rows written
  errorMessage String?
  createdAt    DateTime          @default(now())
  startedAt    DateTime?
  completedAt  DateTime?

  @@index([storeId, createdAt])
  @@index([createdAt])
}
```

### Reverse relation on `Store`

```prisma
forecastJobs ForecastJob[]
```

### Migration

```bash
npx prisma migrate dev --name add-forecast-job
```

---

## 2. Job runner (`src/lib/forecast/runner.ts`)

The single function that both the API route and the seed call.

```ts
export type RunJobOptions = {
  storeId?: string;        // undefined = all enabled stores
  triggeredBy: string;
};

export type RunJobResult = {
  jobId: string;
  status: "done" | "failed";
  pointsWritten: number;
  errorMessage?: string;
};

export async function runForecastJob(
  options: RunJobOptions,
): Promise<RunJobResult>
```

**Steps:**

1. Create a `ForecastJob` row with `status: "pending"`.

2. Update the row to `status: "running"`, `startedAt: new Date()`.

3. Call `runForecastForStore(storeId)` or `runForecastForAllStores()` (from T23b).
   Count total `ForecastPoint` rows across all stores.

4. On success: update row to `status: "done"`, `completedAt: new Date()`,
   `pointsWritten: count`, `modelSlug` (from result).

5. On error: catch the exception, update row to `status: "failed"`,
   `errorMessage: error.message`, `completedAt: new Date()`. Return
   `{ status: "failed", errorMessage }` — do not re-throw.

6. Return `RunJobResult`.

This function is **not** a Next.js route handler — it is plain async TypeScript
and can be called from anywhere (API route, seed, script).

---

## 3. API routes

### `POST /api/forecast/jobs`

`src/app/api/forecast/jobs/route.ts`

Auth-guarded.

Request body:

```ts
type CreateJobBody = {
  storeId?: string;    // omit for "all enabled stores"
};
```

Handler:

```ts
const result = await runForecastJob({
  storeId: body.storeId,
  triggeredBy: "manual",
});
return NextResponse.json(result, { status: result.status === "done" ? 200 : 500 });
```

This is synchronous — the response is returned after the forecast completes.
For a demo with 8 stores and SQLite this is acceptable (sub-second per store
with in-process computation). If this becomes too slow, streaming can be added
later without changing the runner interface.

### `GET /api/forecast/jobs`

Same file, `GET` handler.

Returns the 20 most recent `ForecastJob` rows ordered by `createdAt` descending,
including `store.code` and `store.name` when `storeId` is set.

```ts
const jobs = await prisma.forecastJob.findMany({
  take: 20,
  orderBy: { createdAt: "desc" },
  include: { store: { select: { code: true, name: true } } },
});
return NextResponse.json(jobs);
```

### `GET /api/forecast/results/[storeId]`

`src/app/api/forecast/results/[storeId]/route.ts`

Auth-guarded.

Returns `StoreForecast` rows for the given store, from today through the next
7 days, both targets, ordered by `targetDate` ascending.

```ts
const from = startOfDay(new Date());
const to   = addDays(from, 7);
const rows = await prisma.storeForecast.findMany({
  where: { storeId, targetDate: { gte: from, lte: to } },
  orderBy: [{ targetType: "asc" }, { targetDate: "asc" }],
});
return NextResponse.json(rows);
```

Use `date-fns` (`startOfDay`, `addDays`) — already in the dependency tree.

---

## 4. Settings UI — forecast controls

Extend `StoreSettingsTable` (T22) with two additions.

### Per-store "Run" button

Add a **Run** button to each store row that is enabled. On click:

```ts
await fetch("/api/forecast/jobs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ storeId }),
});
```

While running: button shows `Running…` and is disabled.
On success: show `✓ Done (N points)` inline.
On error: show `Failed` in rose text.

### Global "Run All" button

Above the table, show a **Run All Forecasts** button. Calls `POST /api/forecast/jobs`
with no body (`storeId` omitted). Same inline feedback pattern.

### Job history panel

Below the store table, add a `<ForecastJobHistory>` Client Component:

```tsx
// Fetches GET /api/forecast/jobs on mount and after each manual run
// Renders a compact table:
// | Time | Store | Model | Status | Points | Duration |
```

Duration = `completedAt - startedAt` in seconds.
Status: green badge for "done", rose for "failed", yellow for "running".
Refresh: a **Refresh** button re-fetches. No auto-polling.

---

## 5. Trigger from seed (`prisma/seed.ts`)

At the end of `main()`, after `seedForecastConfigs` and `seedExternalSignals`,
add:

```ts
import { runForecastJob } from "../src/lib/forecast/runner";

// Run forecasts for all enabled stores
const jobResult = await runForecastJob({ triggeredBy: "seed" });
console.log(`[seed] Forecast job: ${jobResult.status}, ${jobResult.pointsWritten ?? 0} points written`);
```

This means a fresh `npx tsx prisma/seed.ts` produces a fully populated DB
including stored forecast rows — no separate step required.

If no stores are enabled (default after a fresh seed), `runForecastForAllStores`
returns an empty map and `pointsWritten` is 0. The seed should not fail in this case.

---

## 6. Operational script

```bash
npx tsx scripts/run-forecasts.ts
```

`scripts/run-forecasts.ts`:

```ts
import { runForecastJob } from "../src/lib/forecast/runner";

const result = await runForecastJob({ triggeredBy: "data_update" });
console.log(result);
process.exit(result.status === "done" ? 0 : 1);
```

This is the hook point for a future cron job, CI step, or data import pipeline.
Clear exit code, no HTTP server required.

---

## 7. Verification

```bash
npx prisma migrate dev --name add-forecast-job
npx tsx prisma/seed.ts
npm run build
npm test
```

### Manual flow

1. Open `/settings`, enable BER-01 with model `"simulator"`, save.
2. Click **Run** on BER-01 row.
3. `ForecastJob` row written with `status: "done"` — verify in DB.
4. `GET /api/forecast/results/<BER-01-ID>` → 14 rows (7 dates × 2 targets).
5. Job history panel shows the run.

### Script flow

```bash
npx tsx scripts/run-forecasts.ts
```
- Exits 0 if BER-01 is enabled, exits 0 with "0 points" if none are enabled.

### Seed trigger

Re-seed with at least one store enabled → `StoreForecast` rows exist after seed.

### Verification checklist

- [ ] `ForecastJob` table and indexes created by migration
- [ ] `POST /api/forecast/jobs` returns 200 with `pointsWritten > 0` (when a store is enabled)
- [ ] `GET /api/forecast/jobs` returns an array of recent runs
- [ ] `GET /api/forecast/results/[storeId]` returns 14 rows for an enabled store
- [ ] Job record transitions: `pending → running → done` (check timestamps)
- [ ] Failed run: if engine throws (e.g., invalid modelSlug), job status is `"failed"`,
  not an unhandled 500
- [ ] "Run All" button triggers a job for all enabled stores
- [ ] Job history panel renders and refreshes
- [ ] `scripts/run-forecasts.ts` exits 0
- [ ] Seed trigger: `pointsWritten` logged (0 is OK when no stores enabled)
- [ ] Build passes with no TypeScript errors

---

## Files that change / created

- `prisma/schema.prisma` — `ForecastJobStatus` enum, `ForecastJob` model, `Store.forecastJobs` relation
- `prisma/migrations/<timestamp>_add_forecast_job/migration.sql`
- `prisma/seed.ts` — `runForecastJob` call at end of `main()`
- `src/lib/forecast/runner.ts` — new
- `src/lib/forecast/index.ts` — add `runForecastJob` export
- `src/app/api/forecast/jobs/route.ts` — new (POST + GET)
- `src/app/api/forecast/results/[storeId]/route.ts` — new (GET)
- `src/features/settings/StoreSettingsTable.tsx` — Run button, Run All button
- `src/features/settings/ForecastJobHistory.tsx` — new Client Component
- `scripts/run-forecasts.ts` — new

## Dependencies

- **T23b must be merged** — `runForecastForStore`, `runForecastForAllStores`,
  and the `StoreForecast` table are required.
- T22 must also be merged (settings UI is extended here).
- No further tasks depend on T23c in the current backlog. UI integration
  (showing forecasts on the dashboard or a dedicated page) is a natural
  follow-on and will be scoped separately.
