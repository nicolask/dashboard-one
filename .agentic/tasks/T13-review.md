# T13 Review — Period Comparison

Overall: clean implementation, spec fully covered. No blocking bugs. Two non-blocking gaps and one cosmetic note below.

---

## Bugs (blocking)

None.

---

## Code quality (non-blocking)

### 1. Zero-growth display for stores with no previous-period data

Per spec, `revenueGrowth` is set to `0` when no previous data exists for a store (e.g. newly opened). `formatGrowth(0)` renders `"0.0 %"` with `text-ink-500`. This is technically correct per spec, but in the demo context a freshly-seeded store showing `"0.0 %"` growth looks like it performed identically to last period rather than signalling missing history.

Consider rendering `"—"` (em dash) instead when `revenueGrowth === 0` to distinguish "no data" from "flat growth". Low priority — the current behaviour meets spec, but it will look odd when demoing.

---

## Cosmetic

### 3. Sign character inconsistency between spec and implementation

The task spec shows `"−"` (U+2212 MINUS SIGN) for negative values in `formatGrowth`, but both `formatGrowth` (StoreRankingTable) and `formatDelta` (KpiCard) use `"-"` (U+002D HYPHEN-MINUS). The two functions are consistent with each other, so this is not a problem in practice. If the spec's use of `"−"` was intentional, it should be applied to both helpers together. No action required unless typography matters here.

---

## Verification checklist

- [x] `deltaMode="pp"` on Conversion KpiCard (both pages)
- [x] `deltaLabel` uses dynamic `${days}d` on all four tiles (both pages)
- [x] `revenueGrowth` computed in `getStoreRanking` via `Promise.all`, keyed by storeId map
- [x] `revenueGrowth: 0` fallback when previous period has no data for a store
- [x] Revenue cell in `StoreRankingTable` shows two-row layout with coloured growth text (no badge background)
- [x] `KpiCard` default props unchanged — existing callers without `deltaMode`/`deltaLabel` unaffected
- [x] No new Client Components introduced
- [x] `stores.test.ts` updated: `revenueGrowth` in expected output, second `groupByMock` call for previous period
- [x] `KpiCard.test.tsx` added: positive pp, negative pp, and default label tests

---

## Required changes before approval

None — all items are optional/cosmetic. T13 kann gemergt werden.
