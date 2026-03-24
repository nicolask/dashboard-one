---
status: planned
complexity: standard
---

# T22 – Store Settings Surface

## Context

The `/settings` route is a placeholder. This task fills it with a functional
settings surface for store-level configuration.

Two things need a settings home before the forecast engine can work:

1. **`state` field on `Store`** — German Bundesland abbreviation (e.g. `"BY"`,
   `"BE"`, `"NW"`), required for school holiday lookup in T23a. The existing
   `region` field ("Nord"/"Süd"/"Ost"/"West") is a business-defined zone and
   cannot serve this purpose.

2. **`StoreForecastConfig` model** — per-store record that controls which
   forecast model is active and whether forecasts are enabled for that store.
   This is the configuration contract the engine (T23b) reads from.

The settings UI is the management surface for both. Adding a new store is
deliberately out of scope — it surfaces as a follow-up in the backlog.

---

## 1. Schema additions

### Field addition on `Store`

Add a new optional field after `isActive`:

```prisma
state String?   // German Bundesland abbreviation, e.g. "BY", "BE", "NW"
```

Optional initially so existing rows are not broken before migration. The seed
will populate all known stores; after T23a lands it can be tightened.

### New model

```prisma
model StoreForecastConfig {
  id         String   @id @default(cuid())
  storeId    String   @unique
  store      Store    @relation(fields: [storeId], references: [id])
  modelSlug  String   @default("none")  // "none" | "simulator" | "naive_seasonal"
  enabled    Boolean  @default(false)
  updatedAt  DateTime @updatedAt
}
```

### Reverse relation on `Store`

Add to the `Store` model:

```prisma
forecastConfig StoreForecastConfig?
```

### Migration

```bash
npx prisma migrate dev --name add-store-settings
```

---

## 2. Seed additions (`prisma/seed.ts`)

### Add `state` to `STORE_CATALOG`

Extend each store definition with the correct Bundesland:

| Code   | City        | state |
|--------|-------------|-------|
| BER-01 | Berlin      | `BE`  |
| HAM-01 | Hamburg     | `HH`  |
| MUC-01 | München     | `BY`  |
| LEI-01 | Leipzig     | `SN`  |
| KOE-01 | Köln        | `NW`  |
| STU-01 | Stuttgart   | `BW`  |
| DUS-01 | Düsseldorf  | `NW`  |
| NUE-01 | Nürnberg    | `BY`  |

Pass `state` into the `prisma.store.upsert` call in `seedStores()`.

### New step — `seedForecastConfigs(storeMap)`

After `seedDailyStoreCosts`:

```ts
for (const store of storeMap.values()) {
  await prisma.storeForecastConfig.upsert({
    where: { storeId: store.id },
    update: {},  // do not overwrite if already manually edited
    create: { storeId: store.id, modelSlug: "none", enabled: false },
  });
}
```

Add `seedForecastConfigs(storeMap)` to the `main()` execution order and log output.

---

## 3. Settings page (`src/app/(app)/settings/page.tsx`)

### Data fetch

Server component — no `"use client"`. Fetch stores and their configs in parallel:

```ts
const stores = await prisma.store.findMany({
  where: { isActive: true },
  orderBy: { code: "asc" },
  include: { forecastConfig: true },
});
```

### Layout

Page header: **"Settings"** with subtitle **"Store configuration"**.

Render a `<StoreSettingsTable>` Client Component (see section 4) below the header.
Pass `stores` as a prop serialised from the server fetch — include only the fields
the component needs (`id`, `code`, `name`, `city`, `state`, `format`,
`forecastConfig`).

---

## 4. Client component — `src/features/settings/StoreSettingsTable.tsx`

`"use client"` component. Renders an HTML table with one row per store.

### Columns

| Column | Content |
|--------|---------|
| Code | `store.code` (read-only) |
| Name | `store.name` (read-only) |
| City | `store.city` (read-only) |
| State | Editable text input, 2-char uppercase, `store.state ?? ""` |
| Format | `store.format` (read-only) |
| Forecast Model | `<select>` with options: `none` / `simulator` / `naive_seasonal` |
| Enabled | `<input type="checkbox">` |
| Action | **Save** button per row |

### Behaviour

Each row is independently editable. Clicking **Save** on a row calls
`PATCH /api/settings/stores/[storeId]` with the changed fields.

While saving: button shows `Saving…` and is disabled.
On success: show an inline `✓ Saved` message that fades after 2 s.
On error: show `Error — try again` in rose text.

No full-page reload. No toast library required — inline feedback only.

State field: `onChange` — uppercase and truncate to 2 chars.

---

## 5. API route — `src/app/api/settings/stores/[storeId]/route.ts`

### `PATCH`

Auth-guarded (reuse existing session check pattern).

Accepts JSON body:

```ts
type StoreSettingsPatch = {
  state?: string;          // max 2 chars, uppercase
  modelSlug?: string;      // "none" | "simulator" | "naive_seasonal"
  enabled?: boolean;
};
```

Validation:
- `state`: if present, must match `/^[A-Z]{2}$/`
- `modelSlug`: if present, must be one of the three valid values
- Unknown fields: ignored

Operations:
- If `state` is present → `prisma.store.update({ where: { id: storeId }, data: { state } })`
- If `modelSlug` or `enabled` is present → `prisma.storeForecastConfig.upsert` keyed on `storeId`

Returns `200 { ok: true }` on success, `400 { error: "…" }` on validation failure,
`404` if the store does not exist, `401` if not authenticated.

---

## 6. Navigation

Update the existing sidebar/nav to change the `/settings` link label from its
current placeholder text to **"Settings"** if not already done. No structural
nav changes — the route already exists.

---

## 7. Verification

```bash
npx prisma migrate dev --name add-store-settings
npx tsx prisma/seed.ts
npm run build
npm test
```

- [ ] Migration applies without touching existing tables
- [ ] `Store.state` is populated for all 8 stores after seed (spot-check: MUC-01 → `"BY"`)
- [ ] `StoreForecastConfig` rows exist for all 8 stores with `enabled: false`
- [ ] Settings page renders at `/settings` without errors
- [ ] Each row shows correct read-only values and editable fields
- [ ] Changing state to `"HH"` and saving → `PATCH` returns 200 → DB reflects change
- [ ] Invalid state (e.g. `"Bayern"`) → 400 response, error shown inline
- [ ] Changing model to `"simulator"` and enabling → config updated in DB
- [ ] Build passes with no TypeScript errors

---

## Files that change

- `prisma/schema.prisma` — `Store.state`, new `StoreForecastConfig` model, reverse relation
- `prisma/migrations/<timestamp>_add_store_settings/migration.sql` — new migration
- `prisma/seed.ts` — `state` in `STORE_CATALOG`, `seedForecastConfigs` step
- `src/app/(app)/settings/page.tsx` — replaces placeholder with real server page
- `src/app/api/settings/stores/[storeId]/route.ts` — new PATCH route
- `src/features/settings/StoreSettingsTable.tsx` — new Client Component

## Dependency

None. Self-contained. T23a and T23b depend on this task being merged (they read
`Store.state` and `StoreForecastConfig`).
