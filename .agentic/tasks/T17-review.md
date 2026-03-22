# T17 Review — Test Coverage Hardening

**Verdict: approved with two forward-looking notes. No blockers.**

All 67 tests pass across 22 test files. Coverage dependency is wired in.
The seed integration test actually runs the full seed against a real isolated
SQLite database — that's the strongest part of this PR.

---

## What's good

- All four required auth modules covered: `password`, `session`, `actions`, `current-user`
- All five KPI modules covered: `revenue`, `conversion`, `categories`, `products`, `stores`
- `retail-seed.test.ts` runs the real seed against a temp SQLite DB and validates
  both counts and KPI invariants (basket/conversion arithmetic) — exactly what the
  spec asked for
- Auth actions test catches email normalisation (` Demo@Example.com ` trim + lowercase)
  — good edge case, not obvious from the spec
- Password test checks malformed hash formats explicitly (`invalid`, `argon2$...`)
- Session test does a real cookie roundtrip through the mock cookie store
- Fake timers used consistently across all date-sensitive tests

---

## Issues

### Non-blocking — note for T14

**`stores.test.ts` references `result.average`, which T14 will rename to `result.networkAverage`**

T14 renames `StoreBenchmark.average` → `networkAverage`. When that lands, this
test will fail on the field name. Low risk since it's caught at test run time,
but worth flagging so Codex knows to update `stores.test.ts` as part of T14.

```ts
// current — will break after T14
expect(result.average.revenue).toBe(195);
expect(result.average.conversionRate).toBeCloseTo(0.115);
```

---

### Non-blocking — note for T18

**`retail-seed.test.ts` hardcodes migration paths**

```ts
const migrationPaths = [
  ".../20260321143000_init_user_foundation/migration.sql",
  ".../20260321222000_add_retail_demo_schema/migration.sql",
];
```

T18 adds a third migration (`add_controlling_layer`). This test will silently
skip it — the seed will run against a schema that doesn't have `Employee`,
`EmployeeWorkLog`, or `DailyStoreCost`, causing the seed step to either error
or produce incomplete data.

**Fix to apply as part of T18:** replace the hardcoded list with a glob:

```ts
import { readdirSync } from "node:fs";

const migrationsDir = path.join(workspaceDir, "prisma", "migrations");
const migrationPaths = readdirSync(migrationsDir)
  .sort()
  .map((dir) => path.join(migrationsDir, dir, "migration.sql"))
  .filter((p) => fs.existsSync(p));
```

This makes the integration test automatically include future migrations.
Add this fix to the T18 acceptance criteria.

---

### Cosmetic

**`stores.test.ts` — shared `findManyMock` across two Prisma models**

```ts
prisma: {
  store:            { findUnique: findUniqueMock, findMany: findManyMock },
  dailyStoreMetric: { findMany: findManyMock, groupBy: groupByMock },
}
```

Both models share the same mock function, so `mockResolvedValueOnce` calls
depend on execution order across both models. Currently correct, but fragile if
call order changes. Not worth fixing now — cosmetic only.

---

## Coverage dependency

`@vitest/coverage-v8` added correctly. Verify locally before T18:

```bash
npm run test -- --coverage
```
