# Schema & Seed Reference — Retail BI Demo

*Use this document as lightweight context when discussing schema changes, seed
extensions, or new BI features with an LLM.*

---

## Project summary

A retail BI dashboard demo built with Next.js 16, Prisma 7 on SQLite, and
Tailwind CSS.

The app combines:

- a local credentials login backed by a `User` table
- a protected dashboard shell
- seeded retail BI data for overview and store-detail pages
- a controlling layer for cost, profit, and staff-productivity KPIs

All business data is deterministically seeded. There are no live integrations in
the current implementation.

Current implemented UI capabilities include:

- KPI cards for revenue, orders, basket, conversion, profit, cost ratio, and
  revenue per staff hour
- revenue timeseries chart
- store ranking, category performance, and top products
- store benchmark comparison
- explainable insight narratives
- scenario timeline

---

## Current Prisma schema

### `User`
Used for local auth only.

```
id              cuid (PK)
email           String (unique)
displayName     String?
passwordHash    String?
emailVerifiedAt DateTime?
lastLoginAt     DateTime?
status          UserStatus       — ACTIVE | DISABLED
createdAt       DateTime
updatedAt       DateTime
```

### `Store`
Retail locations used across all BI views.

```
id          cuid (PK)
code        String (unique)   — e.g. "BER-01"
name        String
city        String
region      String            — business region: "Nord" | "Süd" | "Ost" | "West"
format      StoreFormat       — flagship | mall | urban | suburban
sizeBand    SizeBand          — small | medium | large
openedAt    DateTime
isActive    Boolean
createdAt   DateTime
updatedAt   DateTime
```

Relations:

- `orders`
- `dailyMetrics`
- `dailyTraffic`
- `employees`
- `dailyStoreCosts`

### `Category`

```
id          cuid (PK)
slug        String (unique)
name        String
parentId    String?            — self-reference, tree-capable
sortOrder   Int
createdAt   DateTime
```

### `Product`

```
id              cuid (PK)
sku             String (unique)
name            String
categoryId      FK → Category
brand           String?
basePrice       Float
baseCost        Float
marginBand      MarginBand     — low | medium | high
popularityScore Float          — 0..1, drives weighted sampling
isPromoEligible Boolean
isActive        Boolean
createdAt       DateTime
```

### `Order`

```
id             cuid (PK)
orderNumber    String (unique)   — "{storeCode}-{YYYYMMDD}-{0000}"
storeId        FK → Store
orderedAt      DateTime
customerType   CustomerType      — new | returning
channel        Channel           — in_store | click_collect | online
itemCount      Int
subtotalAmount Float
discountAmount Float
taxAmount      Float
totalAmount    Float
paymentMethod  String?
status         OrderStatus       — completed | cancelled | returned_partial | returned_full
createdAt      DateTime

indexes: [storeId, orderedAt], [orderedAt]
```

### `OrderItem`

```
id             cuid (PK)
orderId        FK → Order
productId      FK → Product
quantity       Int
unitPrice      Float
unitCost       Float
discountAmount Float
lineRevenue    Float
lineMargin     Float

indexes: [orderId], [productId]
```

### `DailyStoreMetric`
Main pre-aggregated daily fact table for commercial KPIs.

```
id               cuid (PK)
date             DateTime
storeId          FK → Store
revenue          Float
orders           Int
itemsSold        Int
avgBasketValue   Float
avgItemsPerOrder Float
visitors         Int
conversionRate   Float
discountRate     Float
returnRate       Float
marginAmount     Float
marginRate       Float
scenarioSlug     String?
createdAt        DateTime

unique: [date, storeId]
indexes: [storeId, date], [date]
```

### `DailyTraffic`
Secondary daily funnel table. Seeded and available, but not yet a primary UI
surface.

```
id             cuid (PK)
date           DateTime
storeId        FK → Store
visitors       Int
sessions       Int
addToCartCount Int
checkoutCount  Int
purchaseCount  Int
createdAt      DateTime

unique: [date, storeId]
indexes: [storeId, date]
```

### `Employee`
Store-level employee master data for the controlling layer.

```
id           cuid (PK)
storeId      FK → Store
role         EmployeeRole      — sales | manager | cashier | stock
contractType ContractType      — full_time | part_time | minijob
weeklyHours  Float
hourlyWage   Float
isActive     Boolean
```

### `EmployeeWorkLog`
Daily staff effort facts.

```
id          cuid (PK)
employeeId  FK → Employee
date        DateTime
hoursWorked Float

unique: [employeeId, date]
indexes: [employeeId, date], [date]
```

### `DailyStoreCost`
Daily pre-aggregated operating-cost fact table aligned to `DailyStoreMetric`.

```
id            cuid (PK)
date          DateTime
storeId       FK → Store
staffCost     Float
rentCost      Float
otherCost     Float
totalCost     Float
staffHours    Float
employeeCount Int
scenarioSlug  String?

unique: [date, storeId]
indexes: [storeId, date], [date]
```

---

## Seed generator structure

### Store catalog — 8 stores

The seed simulates 8 stores across Germany.

| Code   | Name                | City       | Region | Format   | Size   | Traffic/day | Conversion | Basket |
|--------|---------------------|------------|--------|----------|--------|-------------|------------|--------|
| BER-01 | Berlin Mitte        | Berlin     | Ost    | flagship | large  | 1800        | 4.5%       | €87    |
| HAM-01 | Hamburg Altona      | Hamburg    | Nord   | mall     | large  | 1400        | 5.2%       | €74    |
| MUC-01 | München Maxvorstadt | München    | Süd    | urban    | medium | 1100        | 4.1%       | €95    |
| LEI-01 | Leipzig Gohlis      | Leipzig    | Ost    | suburban | medium | 700         | 3.8%       | €68    |
| KOE-01 | Köln Ehrenfeld      | Köln       | West   | urban    | medium | 950         | 4.4%       | €79    |
| STU-01 | Stuttgart Mitte     | Stuttgart  | Süd    | mall     | small  | 620         | 3.9%       | €72    |
| DUS-01 | Düsseldorf Flingern | Düsseldorf | West   | urban    | small  | 580         | 3.6%       | €81    |
| NUE-01 | Nürnberg Gostenhof  | Nürnberg   | Süd    | suburban | small  | 480         | 3.3%       | €65    |

Each store also carries a `categoryBias` map that skews category demand
sampling.

### Category catalog — 6 categories

| Slug        | Name             | Price range | Avg qty/item | Margin band | Demand base | Promo sensitivity |
|-------------|------------------|-------------|--------------|-------------|-------------|-------------------|
| electronics | Electronics      | €49–899     | 1.1          | low         | 0.7         | 0.8               |
| home        | Home & Living    | €12–249     | 1.8          | medium      | 0.9         | 1.1               |
| fashion     | Fashion          | €19–199     | 2.0          | high        | 0.85        | 1.4               |
| beauty      | Beauty & Care    | €8–89       | 2.3          | high        | 1.0         | 1.2               |
| sports      | Sports & Outdoor | €24–349     | 1.4          | medium      | 0.75        | 1.0               |
| grocery     | Grocery & Food   | €2–38       | 4.5          | low         | 1.2         | 0.9               |

There are 13 named products per category, for 78 SKUs in total.

### History window

- `DAYS_HISTORY = 120`
- `getHistoryDates()` produces 121 daily dates including today

This means all daily fact tables, work logs, and scenario overlays span the same
rolling history window.

### Daily KPI simulation

For each store-day:

```text
visitors        = trafficBase × weekdayFactor × dailyNoise × scenario traffic multiplier
conversionRate  = conversionBase × noise × scenario conversion multiplier
orders          = visitors × conversionRate
basket          = basketBase × noise × scenario basket multiplier
subtotal        = basket × orders
discountRate    = 5% base + scenario boost + noise
revenue         = subtotal − discount
marginRate      = random daily draw between 28% and 46%
marginAmount    = revenue × marginRate
returnRate      = base return rate + scenario boost + noise
```

Weekday factors:

- Mon 0.78
- Tue 0.80
- Wed 0.88
- Thu 0.95
- Fri 1.00
- Sat 1.18
- Sun 0.85

### Order sampling

Only 15% of store-days get detailed transactional orders (`ORDER_SAMPLE_RATE =
0.15`).

Purpose:

- enough realistic transaction detail for product/category drilldowns
- keep the seed smaller than a full transaction-level history for every day

### Employee and cost seeding

The controlling layer is seeded in three stages:

1. `seedEmployees()`
   Creates employees per store based on format/size headcount assumptions.
2. `seedWorkLogs()`
   Creates one daily work-log row per employee across the history window.
3. `seedDailyStoreCosts()`
   Aggregates work logs into daily store cost rows.

Seed assumptions currently include:

- role mix by store
- role-specific hourly wages
- contract-hour profiles (`full_time`, `part_time`, `minijob`)
- fixed rent cost by store size band
- lightly randomized "other cost" on top of rent

The result is a second pre-aggregated daily fact table, parallel to
`DailyStoreMetric`.

---

## Scenario system

Scenarios are defined as a static array in `prisma/seed.ts`. A matching
`scenarioSlug` is written into both `DailyStoreMetric` and `DailyStoreCost` when
the scenario is active.

Current seeded scenarios:

### `promo_week`

- scope: all stores
- starts: 30 days ago
- duration: 7 days
- effects:
  - traffic multiplier `1.35`
  - conversion multiplier `1.2`
  - basket multiplier `0.93`
  - discount-rate boost `+6%`

### `traffic_surge`

- scope: `HAM-01`
- starts: 60 days ago
- duration: 8 days
- effects:
  - traffic multiplier `1.45`
  - conversion multiplier `0.81`
  - basket multiplier `0.91`

### `competitor_opening`

- scope: `MUC-01`
- starts: 52 days ago
- duration: 30 days
- effects:
  - traffic multiplier `0.79`
  - conversion multiplier `0.87`
  - basket multiplier `0.97`

### `store_slump`

- scope: `LEI-01`
- starts: 14 days ago
- duration: 12 days
- effects:
  - conversion multiplier `0.62`
  - basket multiplier `0.95`
  - return-rate boost `+3%`

Special note for staffing:

- `promo_week` increases work-log effort (`1.15×`)
- `store_slump` decreases work-log effort (`0.85×`)

This lets scenarios influence both topline KPIs and operating-cost behavior.

---

## What already exists for cost and profit analysis

The schema now supports more than gross margin alone.

Already available:

- `Product.baseCost`
- `OrderItem.unitCost`
- `OrderItem.lineMargin`
- `DailyStoreMetric.marginAmount`
- `DailyStoreMetric.marginRate`
- `Employee`, `EmployeeWorkLog`
- `DailyStoreCost.staffCost`, `rentCost`, `otherCost`, `totalCost`, `staffHours`

The dashboard currently derives:

- operating cost
- EBIT-like profit
- cost ratio
- revenue per staff hour

Important convention:

- profit is defined as `marginAmount - totalCost`, not `revenue - totalCost`

---

## What is not in the current schema yet

Planned or discussed, but not implemented in `prisma/schema.prisma` yet:

- `Store.state`
- `StoreForecastConfig`
- `WeatherObservation`
- `SchoolHoliday`
- `ExternalSignal`
- `StoreForecast`
- `ForecastJob`
- auth-provider/session/account models beyond the current local `User`

These exist as planned follow-up work in `.agentic/tasks/` and
`.agentic/backlog.md`, not as live schema objects yet.

---

## Key constraints to keep in mind

- SQLite today, PostgreSQL later
- seed is deterministic and can be rebuilt
- top-level dashboard reads should prefer pre-aggregated daily facts
- sampled order detail is for drilldowns, not the main KPI path
- scenario data is part of the narrative layer, not just decoration
- future schema discussions should clearly distinguish current schema from
  planned-but-not-yet-merged task specs
