# T18a Review

## Verdict: Approved (one fix applied directly)

---

## Bug — applied directly

**`src/lib/db/retail-seed.test.ts`: hardcoded migration paths**

Codex added the new migration to the hardcoded list instead of implementing the
dynamic `readdirSync` glob specified in section 3 of the task. The test passes
now, but would break again on every future migration without the dynamic pattern.

Fix applied directly (self-contained string swap, no logic change):

```ts
// before
const migrationPaths = [
  path.join(workspaceDir, "prisma", "migrations", "20260321143000_init_user_foundation", "migration.sql"),
  path.join(workspaceDir, "prisma", "migrations", "20260321222000_add_retail_demo_schema", "migration.sql"),
  path.join(workspaceDir, "prisma", "migrations", "20260322120000_add_controlling_layer", "migration.sql"),
];

// after
const migrationsDir = path.join(workspaceDir, "prisma", "migrations");
const migrationPaths = fs
  .readdirSync(migrationsDir)
  .sort()
  .map((dir) => path.join(migrationsDir, dir, "migration.sql"))
  .filter((p) => fs.existsSync(p));
```

---

## All checks passed

### Schema
- `EmployeeRole` and `ContractType` enums: correct values ✓
- `Employee`, `EmployeeWorkLog`, `DailyStoreCost` models: all fields, FKs, and
  indexes match spec ✓
- Reverse relations `employees` and `dailyStoreCosts` on `Store` ✓

### Migration
- New migration `20260322120000_add_controlling_layer` creates all three tables ✓
- FK constraints to `Store` and `Employee` correct ✓
- All `@@unique` and `@@index` directives reflected in SQL ✓
- Existing tables untouched ✓

### Seed constants
- `HEADCOUNT`, `ROLE_WAGES`, `CONTRACT_HOURS`, `RENT_BASE` all match calibrated
  spec values (28/23/21/18 €, rent 350/150/80, headcount 11/8/7/3/3/3/2) ✓

### Helper functions
- `buildRoleCounts`: correct `Math.round` per share, `clampMin(manager, 1)`,
  sales adjusted to make total equal headcount exactly ✓
- `assignContractType`: manager → full_time; sales → first 60% full_time, rest
  part_time; cashier/stock → alternating part_time / minijob by index ✓
- `getScenarioWorklogMultiplier`: promo_week → 1.15, store_slump → 0.85,
  all others (including `competitor_opening`, `traffic_surge`) → 1.0 ✓
- `getHistoryDates`: 121 dates (offset 120..0), same range as `generateDailyMetrics` ✓

### seedEmployees
- Delete-and-recreate pattern (acceptable per spec) ✓
- Deletes WorkLogs before Employees (correct cascade order) ✓
- Returns `employeeId → { hourlyWage, weeklyHours, storeCode }` ✓
- All employees `isActive: true` ✓

### seedWorkLogs
- `baseHours = weeklyHours / 5` ✓
- PRNG namespace `worklog::${employeeId}::${isoDate}` ✓
- Noise ±5% via `.between(0.95, 1.05)` ✓
- `hoursWorked = clampMin(... , 0)` — never negative ✓
- Upsert keyed on `@@unique([employeeId, date])` ✓

### seedDailyStoreCosts
- Single `findMany` per store, grouped by date in TypeScript — no N+1 ✓
- `staffCost = Σ(hoursWorked × hourlyWage)` ✓
- `otherCost = rentCost × 0.08 × normal(1, 0.2)`, clamped to min 0.01 ✓
- `employeeCount` = distinct employees via `Set` ✓
- `scenarioSlug` from `activeScenario` ✓
- Upsert keyed on `@@unique([date, storeId])` ✓

### Execution order and logging
- `main()` calls steps 6–8 in correct order, using return value of `seedEmployees` ✓
- Log output lists all three new steps ✓

### Test assertions
- Counts for `employees`, `workLogs`, `dailyStoreCosts`, `scenarioCosts` ✓
- `totalCost = staffCost + rentCost + otherCost` spot-check (tolerance 0.02) ✓
- LEI-01 `store_slump` rows present with `staffHours > 0` ✓
