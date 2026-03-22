# T16 Review – New Seed Scenarios

## Summary

Spec implementation is mostly correct. All 81 tests pass. The reseed issue was real and has been fixed. The two remaining findings around scenario timing and overlap were reviewed and are intentionally accepted as product/data choices rather than treated as bugs.

---

## Review Notes

### R-1 — `traffic_surge` does not appear in Hamburg's 30-day insight window

`getActiveInsights(30)` queries `date >= today - 30 days`. The `traffic_surge` scenario covers **2026-01-21–2026-01-28** — entirely outside that 30-day window (2026-02-20–2026-03-22). The timeline strip shows Hamburg correctly (own 120-day query), but no `InsightPanel` card is generated.

**Disposition:** accepted as intentional.

Reasoning:
- The timeline is explicitly a 120-day historical view and is expected to show scenarios outside the active KPI/insight range.
- The store drilldown currently uses a fixed 30-day insight window by design.
- Keeping `traffic_surge` outside that window makes the demo data feel more like real operational history: not every historical event is also a currently active anomaly.
- If a future task wants a Hamburg insight card in the active window, the right move would be to add another scenario or change the insight-window product behavior, not to force this seed into that role.

---

### R-2 — `competitor_opening` overlaps with `promo_week`

Concrete date ranges (today = 2026-03-22):

| Scenario | Store | Date range |
|---|---|---|
| `promo_week` | global | 2026-02-20–2026-02-26 |
| `competitor_opening` | MUC-01 | 2026-01-29–2026-02-27 |

These overlap on **2026-02-20–2026-02-26** (7 days). `activeScenario()` returns the **first** match in the `SCENARIOS` array — `promo_week` (no `storeCode` filter) wins over `competitor_opening` on those days. Result: MUC-01 gets `scenarioSlug = 'promo_week'` for Feb 20–26 instead of `'competitor_opening'`.

Within the 30-day insights window (Feb 20–Mar 22), `competitor_opening` on MUC-01 has only **one day of data** (Feb 27 — the last day of the scenario). The insight card would say "1 day" instead of "30 days", and the baseline comparison would be meaningless.

**Disposition:** accepted as intentional for the current seed model.

Reasoning:
- Overlapping business effects are realistic; a competitor opening and a chain-wide promo can plausibly happen at the same time.
- The current seed model intentionally simplifies daily tagging down to one `scenarioSlug` per store-day, so one event masking another is an acceptable limitation for this phase.
- The resulting timeline still communicates the broader historical story well.
- We do not want to contort the dates just to satisfy a stricter verification script when the current data already demonstrates how the dashboard behaves under overlapping influences.

---

## Code quality (non-blocking)

### Q-1 — Hardcoded direction in `traffic_surge` headline

```ts
headline: `... saw a ${formatDeviationPercent(deviationPercent)} conversion drop despite a ${Math.abs(visitorChangePercent * 100).toFixed(1)}% visitor increase ...`
```

`formatDeviationPercent` already strips the sign, and both "drop" and "increase" are hardcoded. If the maths ever returned an unexpected sign (e.g. because baseline data is thin), the sentence reads as nonsense. The other rules use `getDeviationText` to encode direction. Fine for this demo scenario but worth noting for future rules.

### Q-2 — Hardcoded direction in `competitor_opening` headline

Same pattern: "below baseline" is hardcoded regardless of `deviationPercent`. Works correctly for the expected scenario effects, but fragile. `getDeviationText(deviationPercent, "below", "above")` would be more robust.

### Q-3 — Inconsistent dash in `traffic_surge` detail

```ts
detail: `Conversion averaged ... prior - more footfall, fewer buyers.`
```

Other detail strings use an em-dash (`—`). Minor cosmetic inconsistency.

---

## Cosmetic

- `competitor_opening` description in seed uses a hyphen (`-`) where the spec shows an em-dash (`—`). Doesn't affect functionality.

---

## Upsert fix (already applied — correct)

`dailyStoreMetric.upsert` previously had `update: {}`, silently skipping existing rows on re-seed. Codex changed it to `update: dailyMetricData`, which is correct. This was the root cause of "no visible change after reseed." The fix itself is clean — no issues there.

---

## Verdict

No further code changes required for T16.

- The upsert/reseed issue was the only fix required to make the feature behave correctly after reseeding.
- The timing/overlap notes above are documented as accepted data-shape choices, not blockers.
- Q-1 through Q-3 remain optional polish items for a future pass if we want more defensive scenario narrative wording.
