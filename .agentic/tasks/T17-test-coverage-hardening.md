---
status: closed
complexity: standard
---

# T17 – Test Coverage Hardening Before Seed + Controlling Expansion

## Context

The current test suite is healthy and fast, but it does not yet cover the highest-risk parts of the codebase strongly enough for the next planned step:

- expanding the retail seed generator
- shifting the dashboard from a mostly revenue-led view toward broader controlling metrics

At the moment, the suite covers several important helpers and UI components well, but key business logic and integration paths are still only lightly or indirectly protected.

Current observed state:

- `npm run test` passes with 13 test files and 45 tests
- no coverage report is currently available because `npx vitest run --coverage` fails without `@vitest/coverage-v8`
- auth/session happy paths are only partially covered
- several KPI aggregation modules have no direct tests
- the Prisma integration test still only validates the initial user-foundation migration, not the current retail BI schema plus seed flow

This task is about improving confidence before feature pressure increases.

## Goal

Raise confidence in the current implementation by covering the highest-risk logic and integration boundaries first, without turning the project into a heavyweight test harness.

The main goal is not a specific percentage target. The goal is to protect the areas most likely to break when:

- seed logic becomes richer
- dashboard metrics expand beyond the current baseline
- KPI semantics become more business-critical

## Changes

### 1. Enable coverage reporting

Add the missing Vitest coverage dependency and make coverage runnable locally.

Expected outcome:

- `npm run test -- --coverage` or an equivalent documented command works
- coverage output is available for future gap analysis

Do not introduce strict coverage gates yet unless the implementation clearly stays simple.

---

### 2. Add direct tests for KPI aggregation modules

Add focused tests for the modules that currently contain important logic but no direct assertions:

- `src/lib/kpi/revenue.ts`
- `src/lib/kpi/conversion.ts`
- `src/lib/kpi/products.ts`
- `src/lib/kpi/categories.ts`
- `src/lib/kpi/stores.ts`

Cover at least:

- current vs previous aggregation behavior
- zero-safe calculations
- optional `storeId` scoping where supported
- ranking / benchmark semantics where relevant
- deterministic sort behavior for returned lists

These should remain unit-style tests with mocked Prisma access unless an integration test is clearly the better fit.

---

### 3. Add direct tests for auth server-side behavior

Add direct tests for:

- `src/lib/auth/actions.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/password.ts`

Cover at least:

- successful login path
- invalid login redirect behavior
- disabled-user rejection
- logout redirect behavior
- password hash / verify roundtrip
- invalid password-hash format handling
- session token creation + read roundtrip
- invalid or tampered token returning `null`

Mock framework boundaries where appropriate (`redirect`, cookies, Prisma).

---

### 4. Add a stronger database/seed integration check

Introduce a test that validates the current retail BI schema and demo seed path more realistically than the current Prisma test.

It does not need to be a full end-to-end test, but it should exercise enough of the current data model to catch structural breakage.

Good target:

- create an isolated SQLite test database
- apply the current schema shape needed for the retail BI models
- run the retail seed logic or a representative subset of it
- assert a few durable invariants, for example:
  - stores exist
  - categories exist
  - products exist
  - daily metrics exist
  - scenario-tagged metrics exist
  - seeded data is internally consistent enough for KPI queries to run

If the current migration/test setup makes full-seed execution awkward, capture the tradeoff clearly and implement the strongest lightweight version that still protects against schema drift.

---

### 5. Keep scope pragmatic

This task is meant to harden confidence, not to freeze the project in test code.

Prefer:

- targeted tests around real business rules
- integration checks where schema or seed drift is likely
- readable tests that explain KPI assumptions

Avoid:

- snapshot-heavy testing of dashboard markup
- brittle tests tied to incidental styling or exact render structure
- chasing a vanity coverage number

## Verification

```bash
npm run test
npm run test -- --coverage
```

Expected outcomes:

- all tests pass
- coverage runs successfully
- newly added tests protect KPI, auth, and seed-sensitive logic
- no existing behavior regresses

## Why This Matters Now

Without this hardening, the next product step is risky in exactly the areas that are about to change:

- seed/data-shape evolution
- KPI semantics
- broader controlling views
- auth/session assumptions around protected behavior

This is a good moment to improve confidence while the codebase is still compact and understandable.
