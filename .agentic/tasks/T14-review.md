# T14 Review — Extended Store Benchmarking

**Verdict: approved with one cosmetic fix**

---

## Spec compliance

All four files changed, all spec requirements met:

- `StoreBenchmark` type extended with `networkAverage`, `formatAverage`, `topQuartile`, and the three `*StoreCount` fields ✓
- `getStoreBenchmark` accepts `storeFormat` as a third argument; caller passes `store.format` ✓
- `include: { store: { select: { format: true } } }` on the allMetrics query ✓
- Focal store included in all reference groups (no exclusion) ✓
- Top quartile uses `Math.ceil(n * 0.25)` ✓
- Empty snapshots and zero counts returned when groups have no members ✓
- No new Client Components, no schema changes ✓
- Tests cover all three reference groups, counts, and the empty case ✓

Test assertions were verified manually against the fixture data — all expectations are arithmetically correct.

---

## Issues

### Cosmetic (non-blocking)

**`src/app/(app)/stores/[storeId]/page.tsx:79`** — the description text in the time-range panel is now stale:

> "Compare this store against its own previous period and the current all-store average."

With T14 the benchmark section now shows network, format, and top-quartile references. Suggested replacement:

```
Compare this store against its own previous period and three peer benchmarks: network average, format average, and top-quartile.
```

This can be applied directly — no need to go back to Codex.

---

## No bugs found

Data layer logic, component rendering, and test coverage are all solid.
