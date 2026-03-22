# T15 Review — Scenario Timeline Strip

## Verdict

**Approved with one minor fix.** The implementation is solid. Codex made two intentional deviations from the spec (SVG bar, legend section) that are actually improvements for the demo. One dead-code issue should be cleaned up.

---

## Issues

### Bugs (blocking)

None.

### Code quality (non-blocking)

**`getScenarioClassName` is dead code — `ScenarioTimeline.tsx:22–31`**

The function is defined and returns Tailwind class strings by slug, but is never called anywhere in the component. The SVG renderer uses `getScenarioFill` instead. The function should be deleted.

```ts
// Dead — never called
function getScenarioClassName(slug: string) {
  if (slug === "promo_week") return "bg-amber-400/80";
  if (slug === "store_slump") return "bg-rose-400/80";
  return "bg-slate-400/80";
}
```

### Cosmetic

None.

---

## Spec deviations (both acceptable)

### 1. SVG timeline bar instead of CSS `absolute` divs

The spec described a CSS-based approach (relative container, absolute child divs per span, `text-[10px]` label inside each band). Codex rendered the bar as an SVG with `viewBox="0 0 1000 40"` and `preserveAspectRatio="none"`.

**Why this is fine:** SVG gives crisp sub-pixel positioning and rounds nicely at all viewport widths without the percentage-rounding artefacts that CSS absolute positioning produces. The separate transparent `Link` overlay layer on top handles interaction correctly. For a demo this is a better choice.

Consequence: the label-inside-band from the spec is gone — labels only appear in the legend section below. See next point.

### 2. Legend section not in spec (bonus feature)

Below the date axis Codex added a `flex-wrap` legend row with colour dots, full labels (including store name), and date ranges as pill chips — linkable for store-scoped spans.

**Why this is fine:** The spec's "label inside band" was always a readability stretch at small band widths. The pill legend is clearer and fits the demo narrative better. No spec constraint is violated by adding it.

---

## Data layer

`scenarios.ts` is clean and matches the spec exactly:
- Parallel Prisma queries ✓
- Slug grouping in TypeScript ✓
- `affectedStoreCount === 1` → storeUrl, else null ✓
- Today fallback on empty table ✓
- Sorted by `startDate` ascending ✓
- `toIsoDate` / `titleizeScenarioSlug` helpers are small and correct ✓

One note on `totalMs`: the component adds `+DAY_IN_MS` to the denominator (`timelineEnd − timelineStart + DAY_IN_MS`) rather than using the bare diff as in the spec. This is more correct — without it, a span covering the full window would exceed 100 %. The `totalMs <= 0` guard remains, so division-by-zero is still impossible.

---

## Wire-up

Both page files fetch `getScenarioTimeline` in the existing `Promise.all`, place `<ScenarioTimeline />` immediately before the `DayRangeSelector` container, and import from the correct paths. No barrel-import issues (import is from `@/features/dashboard/ScenarioTimeline`, not a server-only barrel). ✓

---

## Tests

`scenarios.test.ts` — two cases: multi-store grouping + today fallback. Both verify Prisma call shape and full result shape. Good coverage for the data layer.

`ScenarioTimeline.test.tsx` — three cases: empty spans → null, full render with link, single-day collapsed timeline. Covers the key rendering paths. The legend date format assertion (`"1 Mar 26-7 Mar 26"`) implicitly tests `fmtAxisDate`. ✓

---

## Action for Codex

Delete the unused `getScenarioClassName` function from `src/features/dashboard/ScenarioTimeline.tsx` (lines 21–31).
