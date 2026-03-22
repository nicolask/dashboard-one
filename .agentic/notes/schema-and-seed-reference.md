# Schema & Seed Reference — Retail BI Demo

*Use this document as context when discussing schema extensions with an LLM.*

---

## Project summary

A retail BI dashboard demo built with Next.js 15, Prisma 7 (SQLite), and Tailwind.
It simulates a German multi-format retail chain with 8 stores across 6 categories.
All data is deterministically seeded — no live integrations. The seed runs once;
the app reads from the resulting SQLite database via server-side Prisma queries.

Current capabilities: KPI cards (revenue, orders, basket, conversion), time-series
chart, store ranking, category performance, top products, store benchmarking, and an
insight panel that generates rule-based text from scenario data.

---

## Current Prisma schema

### `Store`
```
id          cuid (PK)
code        String (unique)   — e.g. "BER-01"
name        String            — e.g. "Berlin Mitte"
city        String
region      String            — "Nord" | "Süd" | "Ost" | "West"
format      StoreFormat       — flagship | mall | urban | suburban
sizeBand    SizeBand          — small | medium | large
openedAt    DateTime
isActive    Boolean
```

### `Category`
```
id          cuid (PK)
slug        String (unique)   — electronics | home | fashion | beauty | sports | grocery
name        String
parentId    String? (self-ref) — tree structure, not yet used in seed
sortOrder   Int
```

### `Product`
```
id              cuid (PK)
sku             String (unique)   — e.g. "ELECTRONICS-001"
name            String
categoryId      FK → Category
brand           String?           — not seeded, placeholder
basePrice       Float             — list price
baseCost        Float             — COGS per unit (derived from marginBand: low=28%, med=42%, high=55% of price)
marginBand      MarginBand        — low | medium | high
popularityScore Float (0–1)       — drives weighted random order item selection
isPromoEligible Boolean
isActive        Boolean
```

### `Order`
```
id              cuid (PK)
orderNumber     String (unique)   — "{storeCode}-{YYYYMMDD}-{0001}"
storeId         FK → Store
orderedAt       DateTime
customerType    CustomerType      — new | returning
channel         Channel           — in_store | click_collect | online
itemCount       Int
subtotalAmount  Float
discountAmount  Float
taxAmount       Float             — 19% of subtotal
totalAmount     Float
paymentMethod   String?           — not seeded
status          OrderStatus       — completed | cancelled | returned_partial | returned_full

indexes: [storeId, orderedAt], [orderedAt]
```

### `OrderItem`
```
id              cuid (PK)
orderId         FK → Order
productId       FK → Product
quantity        Int
unitPrice       Float             — basePrice ± 4% noise
unitCost        Float             — product.baseCost (no noise)
discountAmount  Float             — 20% chance of 10% line discount
lineRevenue     Float             — quantity × unitPrice − discount
lineMargin      Float             — lineRevenue − quantity × unitCost

indexes: [orderId], [productId]
```

### `DailyStoreMetric`
The core pre-aggregated table — all dashboard KPIs read from here.
```
id               cuid (PK)
date             DateTime
storeId          FK → Store
revenue          Float             — net revenue after discounts
orders           Int
itemsSold        Int
avgBasketValue   Float             — revenue / orders
avgItemsPerOrder Float
visitors         Int
conversionRate   Float             — orders / visitors
discountRate     Float             — discountAmount / subtotal
returnRate       Float
marginAmount     Float             — revenue × marginRate
marginRate       Float             — random 0.28–0.46 per day (not derived from OrderItem)
scenarioSlug     String?           — which scenario was active on this day, if any

unique: [date, storeId]
indexes: [storeId, date], [date]
```

### `DailyTraffic`
Separate traffic funnel table (seeded stub, not yet used in UI).
```
id              cuid (PK)
date            DateTime
storeId         FK → Store
visitors        Int
sessions        Int
addToCartCount  Int
checkoutCount   Int
purchaseCount   Int

unique: [date, storeId]
```

---

## Seed generator structure

### Store catalog — 8 stores
Each store definition carries base parameters that drive metric simulation:

| Code   | Name                    | City       | Region | Format   | Size   | Traffic/day | Conversion | Basket |
|--------|-------------------------|------------|--------|----------|--------|-------------|------------|--------|
| BER-01 | Berlin Mitte            | Berlin     | Ost    | flagship | large  | 1800        | 4.5%       | €87    |
| HAM-01 | Hamburg Altona          | Hamburg    | Nord   | mall     | large  | 1400        | 5.2%       | €74    |
| MUC-01 | München Maxvorstadt     | München    | Süd    | urban    | medium | 1100        | 4.1%       | €95    |
| LEI-01 | Leipzig Gohlis          | Leipzig    | Ost    | suburban | medium | 700         | 3.8%       | €68    |
| KOE-01 | Köln Ehrenfeld          | Köln       | West   | urban    | medium | 950         | 4.4%       | €79    |
| STU-01 | Stuttgart Mitte         | Stuttgart  | Süd    | mall     | small  | 620         | 3.9%       | €72    |
| DUS-01 | Düsseldorf Flingern     | Düsseldorf | West   | urban    | small  | 580         | 3.6%       | €81    |
| NUE-01 | Nürnberg Gostenhof      | Nürnberg   | Süd    | suburban | small  | 480         | 3.3%       | €65    |

Each store also has a `categoryBias` map that skews order item category selection
(e.g. Berlin overweights electronics 1.4×, Hamburg overweights beauty 1.4×).

### Category catalog — 6 categories
Each category carries simulation parameters:

| Slug        | Price range | Avg qty/item | Margin band | Demand base | Promo sensitivity |
|-------------|-------------|--------------|-------------|-------------|-------------------|
| electronics | €49–899     | 1.1          | low (28%)   | 0.7         | 0.8               |
| home        | €12–249     | 1.8          | medium (42%)| 0.9         | 1.1               |
| fashion     | €19–199     | 2.0          | high (55%)  | 0.85        | 1.4               |
| beauty      | €8–89       | 2.3          | high (55%)  | 1.0         | 1.2               |
| sports      | €24–349     | 1.4          | medium (42%)| 0.75        | 1.0               |
| grocery     | €2–38       | 4.5          | low (28%)   | 1.2         | 0.9               |

13 named products per category (78 total SKUs).

### Metric simulation — per store per day (120 days)

Daily metrics are generated with deterministic seeded randomness (`rand-seed`):

```
visitors    = trafficBase × weekdayFactor × dailyNoise(±7%) × trafficMultiplier(scenario)
convRate    = conversionBase × noise(±5%) × conversionMultiplier(scenario), clamped 1–15%
orders      = visitors × convRate
basket      = basketBase × noise(±6%) × basketMultiplier(scenario)
subtotal    = basket × orders
discountRate = 5% base + scenario boost + noise(±1.5%), clamped 0–25%
revenue     = subtotal × (1 − discountRate)
marginRate  = random 0.28–0.46 per day
marginAmount = revenue × marginRate
```

Weekday factors: Mon 0.78, Tue 0.80, Wed 0.88, Thu 0.95, Fri 1.00, Sat 1.18, Sun 0.85.

**Note:** `marginRate` in `DailyStoreMetric` is a random daily draw, not derived from
`OrderItem.unitCost`. The two are independent — `OrderItem` carries the ground-truth
COGS, while `DailyStoreMetric.marginRate` is a pre-aggregated approximation.

### Order sampling (15% of days)

Not all days have `Order` records. 15% of store-days are sampled for order detail:
- 1–4 items per order, category weighted by store bias, products weighted by popularity
- `unitPrice` = `basePrice ± 4%`, `unitCost` = exact `baseCost`
- 20% chance of 10% line discount per item
- `customerType`: 38% new, 62% returning
- `channel`: 82% in-store, ~9% click & collect, ~9% online

### Scenario system

Scenarios are defined as a static array in the seed. Each entry applies multipliers
to a store's daily metrics for a date range. The `scenarioSlug` is written to every
`DailyStoreMetric` row where a scenario was active.

Current scenarios (T15/T16 will add more):

```
promo_week       global (all stores)    30 days ago, 7 days
                 trafficMultiplier: 1.35, conversionMultiplier: 1.2,
                 basketMultiplier: 0.93, discountRateBoost: +6%

store_slump      LEI-01 only            14 days ago, 12 days
                 conversionMultiplier: 0.62, basketMultiplier: 0.95,
                 returnRateBoost: +3%
```

A scenario can optionally carry `storeCode` (store-specific) and `categorySlug`
(metadata only — not yet wired into the metric simulation per category).

---

## What already exists for cost/margin

The following cost-related data is already in the schema and seed:

- `Product.baseCost` — unit COGS per SKU, derived from `marginBand`
- `Product.basePrice` — list price
- `OrderItem.unitCost` — ground-truth COGS per line (= `baseCost`, no noise)
- `OrderItem.lineMargin` — `lineRevenue − quantity × unitCost`
- `DailyStoreMetric.marginAmount` — pre-aggregated gross margin in €
- `DailyStoreMetric.marginRate` — pre-aggregated gross margin % (random, not derived)

**What is not modelled at all:**
- Staff / personnel costs (headcount, wages, FTE by store)
- Store fixed costs (rent, utilities, depreciation)
- Purchasing overhead / logistics costs
- Cost centre structure (direct vs. indirect)
- P&L aggregation beyond gross margin

---

## Key constraints to keep in mind

- **SQLite today, PostgreSQL later.** No JSON columns, no arrays, no RETURNING with
  upsert tricks, no enum migration footguns.
- **Seed is deterministic.** Adding new data structures means extending the seed
  generator. Re-seeding wipes and rebuilds everything; that's acceptable for a demo.
- **Pre-aggregation pattern.** Heavy reads go through `DailyStoreMetric` (pre-built
  daily sums per store). OrderItem is granular ground truth but only 15% sampled.
  Any new cost model should follow the same pre-aggregation pattern for query performance.
- **Scenario system is the narrative engine.** New cost structures can optionally be
  scenario-aware (e.g. a hiring surge scenario adds temp staff costs).
