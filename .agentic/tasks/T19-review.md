# T19 Review – Insight Narrative Tiering

## Verdict

Approved. All spec requirements are met, types are correct, and the test suite covers the critical paths well.

---

## Spec compliance

| Requirement | Status |
|---|---|
| `latestDate` added to `InsightGroup` | ✅ |
| `isActive` + `dateRangeLabel` on `Insight` type | ✅ |
| `formatDateRange` helper (locale-independent) | ✅ |
| `ACTIVE_THRESHOLD_DAYS = 7` constant | ✅ |
| `isScenarioActive` function | ✅ |
| `InsightRuleInput` extended | ✅ |
| `store_slump` tense switching | ✅ |
| `promo_week` tense switching | ✅ |
| Fallback rule tense switching | ✅ |
| `buildInsight` receives `windowEnd` | ✅ |
| Two-level sort (active first, then priority) | ✅ |
| Section headers only when both tiers non-empty | ✅ |
| `dateRangeLabel` in duration chip | ✅ |
| No new Client Components | ✅ |
| No new DB queries | ✅ |

---

## Issues

### Cosmetic (non-blocking)

**1. `traffic_surge` and `competitor_opening` rules — tense treatment** → **Fixed in follow-up**

Both rules now have full tense differentiation:
- `traffic_surge` active: "is seeing a X% conversion drop … during the traffic surge"
  historical: "During the traffic surge (dateRange), … saw a X% conversion drop …"
- `competitor_opening` active: "revenue is X% below baseline since a competitor opened nearby"
  historical: "After a competitor opened nearby (dateRange), … revenue ran X% below baseline"

Wording is natural and consistent with the other rules. Tests updated accordingly.

**2. Single-day `dateRangeLabel` shows repeated day number** → **Fixed in follow-up**

`formatDateRange` now special-cases identical from/to dates and returns `"Mar 18"` instead of `"Mar 18–18"`. Test updated to `dateRangeLabel: "Mar 18"`.

**3. Panel H2 title no longer matches content** → **Fixed in follow-up**

Title changed to *"Explainable performance signals"* — neutral enough for mixed active/historical content.

---

## Code quality observations (informational)

- `promo_week` detail text is identical for active and historical paths — the spec had a redundant ternary and the implementation correctly collapsed it to a single string. Clean call.
- `InsightCard` extracted as a local component as requested; not exported. Correct.
- `showTierHeaders` boolean is a clean extraction that avoids repeating the condition.
- The `storeId: { in: [...] }` order in the baseline query depends on `Map` insertion order — correct and stable in V8, but the test hardcodes the order. Acceptable for unit tests of this type.

---

## No blocking bugs found.
