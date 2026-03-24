---
status: closed
complexity: standard
---

# T18a – Controlling Layer: Schema, Migration, Seed

## Context

The dashboard is currently revenue-only. Gross margin exists in `DailyStoreMetric`
but there are no operating costs — no staff, no rent, no profit figure.

This task adds the **data foundation** for the Controlling Layer: three new Prisma
models (`Employee`, `EmployeeWorkLog`, `DailyStoreCost`), the migration, and the
seed logic to populate them deterministically.

The result is a pre-aggregated daily cost row per store (`DailyStoreCost`) that
can be joined with `DailyStoreMetric` at query time to compute profit, cost ratio,
and staff productivity KPIs. That join logic is out of scope here — it is the
subject of T18b.

The pattern deliberately mirrors the existing architecture: `DailyStoreMetric`
is the query layer for revenue; `DailyStoreCost` is the query layer for costs.

---

## 1. Schema additions

Append to `prisma/schema.prisma`. Do not modify any existing model.

### New enums

```prisma
enum EmployeeRole {
  sales
  manager
  cashier
  stock
}

enum ContractType {
  full_time
  part_time
  minijob
}
```

### New models

```prisma
model Employee {
  id           String            @id @default(cuid())
  storeId      String
  store        Store             @relation(fields: [storeId], references: [id])
  role         EmployeeRole
  contractType ContractType
  weeklyHours  Float
  hourlyWage   Float
  isActive     Boolean           @default(true)
  workLogs     EmployeeWorkLog[]
}

model EmployeeWorkLog {
  id          String   @id @default(cuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  date        DateTime
  hoursWorked Float

  @@unique([employeeId, date])
  @@index([employeeId, date])
  @@index([date])
}

model DailyStoreCost {
  id            String   @id @default(cuid())
  date          DateTime
  storeId       String
  store         Store    @relation(fields: [storeId], references: [id])
  staffCost     Float
  rentCost      Float
  otherCost     Float
  totalCost     Float
  staffHours    Float
  employeeCount Int
  scenarioSlug  String?

  @@unique([date, storeId])
  @@index([storeId, date])
  @@index([date])
}
```

### Reverse relations on `Store`

Add to the existing `Store` model:

```prisma
employees       Employee[]
dailyStoreCosts DailyStoreCost[]
```

### Migration

Create a new migration file — do not edit the initial migration in place.

```bash
npx prisma migrate dev --name add-controlling-layer
```

---

## 2. Seed additions (`prisma/seed.ts`)

Append three new seed steps after the existing five. Do not modify steps 1–5.

### Constants to add at module level

```ts
const HEADCOUNT: Record<string, number> = {
  "flagship+large":   11,
  "mall+large":        8,
  "urban+medium":      7,
  "suburban+medium":   3,
  "mall+small":        3,
  "urban+small":       3,
  "suburban+small":    2,
};

// Arbeitgeberkosten (Bruttolohn + ~46 % Lohnnebenkosten).
// Stock entspricht Mindestlohn (12.82 €) × 1.40 ≈ 18 €.
const ROLE_WAGES: Record<string, number> = {
  manager: 28.00,
  sales:   23.00,
  cashier: 21.00,
  stock:   18.00,
};

const CONTRACT_HOURS: Record<string, number> = {
  full_time: 40,
  part_time: 20,
  minijob:   10,
};

// Tägliche Mietpauschale pro Store-Größe.
const RENT_BASE: Record<string, number> = {
  large:  350,
  medium: 150,
  small:   80,
};
```

---

### Step 6 — `seedEmployees(storeMap)`

For each store in `STORE_CATALOG`:

**Headcount** — look up `HEADCOUNT[`${store.format}+${store.sizeBand}`]`.

**Role distribution** — apply these shares to headcount, rounding to integers.
Always guarantee `≥ 1 manager` regardless of rounding.

| role    | share |
|---------|-------|
| manager | 10%   |
| sales   | 65%   |
| cashier | 13%   |
| stock   | 12%   |

Compute counts as `Math.round(headcount × share)`, then adjust the largest
group (sales) to make the total equal `headcount` exactly.

**Contract type** — assign deterministically by index within each role group
(not random):

| role    | distribution                             |
|---------|------------------------------------------|
| manager | full_time (100%)                         |
| sales   | first 60% → full_time, rest → part_time  |
| cashier | alternating: part_time / minijob         |
| stock   | alternating: part_time / minijob         |

**weeklyHours** — from `CONTRACT_HOURS` by contract type.
**hourlyWage** — from `ROLE_WAGES` by role. No randomness.

Use `prisma.employee.upsert` keyed on `storeId + role + index` — or delete-and-recreate
if upsert key is hard to define cleanly. All employees `isActive: true`.

Return a map: `employeeId → { hourlyWage, weeklyHours, storeCode }`.

---

### Step 7 — `seedWorkLogs(employeeMap)`

One row per employee per day for all 120 days (same date range as `DailyStoreMetric`).

```
baseHours    = employee.weeklyHours / 5
dayFactor    = weekdayFactor(date)          // reuse existing function
scenarioMult = look up from SCENARIOS for this store on this date (see below)
noise        = seeded PRNG ±5%             // use makeRng(`worklog::${employeeId}::${isoDate}`)
hoursWorked  = max(0, baseHours × dayFactor × scenarioMult × noise)
```

**Scenario multipliers for hoursWorked:**

| scenarioSlug  | multiplier | scope      |
|---------------|------------|------------|
| `promo_week`  | 1.15       | all stores |
| `store_slump` | 0.85       | LEI-01     |
| *(none)*      | 1.00       | —          |

Use the existing `activeScenario(storeCode, date)` function — do not hardcode
dates or store codes. The employee's store code must be passed through from the
`employeeMap`.

Use `prisma.employeeWorkLog.upsert` keyed on `@@unique([employeeId, date])`.

---

### Step 8 — `seedDailyStoreCosts(storeMap)`

One row per store per day. For each store, fetch all WorkLogs in a single
`findMany` (no N+1 per day) and group by date in TypeScript before writing
`DailyStoreCost` records:

```ts
const logs = await prisma.employeeWorkLog.findMany({
  where: { employee: { storeId } },
  include: { employee: { select: { hourlyWage: true } } },
});

// group by date, then for each date:
staffHours    = Σ log.hoursWorked
staffCost     = Σ (log.hoursWorked × log.employee.hourlyWage)
rentCost      = RENT_BASE[store.sizeBand]
otherCost     = rentCost × 0.08 × noise   // makeRng(`othercost::${storeCode}::${isoDate}`), normal(1, 0.2), clamped > 0
totalCost     = staffCost + rentCost + otherCost
employeeCount = logs.length  // distinct employees active that day
scenarioSlug  = activeScenario(storeCode, date)?.slug ?? null
```

Use `prisma.dailyStoreCost.upsert` keyed on `@@unique([date, storeId])`.

---

### Seed execution order

```
main()
  → seedCatalog()
  → seedStores()        returns storeMap
  → generateDailyMetrics(storeMap)
  → runKpiChecks()
  → generateSampleOrders(storeMap)
  → seedEmployees(storeMap)       ← new, returns employeeMap
  → seedWorkLogs(employeeMap)     ← new
  → seedDailyStoreCosts(storeMap) ← new
```

Add the three new step names to the `main()` log output at the end of the file.

---

## 3. Test fix (`src/lib/db/retail-seed.test.ts`)

Replace the hardcoded migration path list with a dynamic glob so the integration
test automatically includes the new migration:

```ts
import { readdirSync } from "node:fs";

const migrationsDir = path.join(workspaceDir, "prisma", "migrations");
const migrationPaths = readdirSync(migrationsDir)
  .sort()
  .map((dir) => path.join(migrationsDir, dir, "migration.sql"))
  .filter((p) => fs.existsSync(p));
```

Without this fix the seed integration test runs against a schema that is missing
the three new models and will fail or silently skip the new seed steps.

---

## 4. Verification

```bash
npx prisma migrate dev --name add-controlling-layer
npx tsx prisma/seed.ts
npm run build
npm test
```

### Schema
- [ ] Migration applies cleanly without touching existing tables
- [ ] All FK constraints and indexes are present as specified

### Employees
- [ ] Every store has exactly the headcount from the mapping table
- [ ] Role distribution matches shares (±1 rounding tolerance, always ≥ 1 manager)
- [ ] Wages and weeklyHours match spec — no randomness
- [ ] Contract type assignment is deterministic (same result on every seed run)

### WorkLogs
- [ ] Every employee has exactly one WorkLog row per day for all 120 days
- [ ] `hoursWorked` is never negative
- [ ] Scenario multipliers apply to the correct stores and date ranges only
- [ ] Seeded PRNG — identical output on every seed run

### DailyStoreCost
- [ ] Every store has exactly one row per day for all 120 days
- [ ] `staffCost` matches `Σ(hoursWorked × hourlyWage)` for that store+date (spot-check 5 rows)
- [ ] `rentCost` matches `RENT_BASE[sizeBand]` exactly (no noise)
- [ ] `scenarioSlug` matches the value in `DailyStoreMetric` for the same store+date
- [ ] `totalCost = staffCost + rentCost + otherCost`

### Causal chain sanity checks
- [ ] LEI-01 `store_slump` days: staffHours are ~15% lower than adjacent non-scenario days
- [ ] `promo_week` days show ~15% higher staffHours than adjacent non-scenario days for all stores
- [ ] NUE-01 total daily cost exceeds daily rentCost by at least 2× (staff cost present)

---

## Files that change

- `prisma/schema.prisma` — three new models, two new enums, two new Store relations
- `prisma/migrations/<timestamp>_add_controlling_layer/migration.sql` — new migration
- `prisma/seed.ts` — three new seed functions + constants
- `src/lib/db/retail-seed.test.ts` — dynamic migration glob (see section 3)

## Dependency

None. This task is self-contained. T18b depends on T18a being merged and seeded.
