---
status: closed
complexity: standard
---

# T8 – Alert Panel UX: Collapsible + Pretty Labels

## Context

`src/features/dashboard/AlertPanel.tsx` is currently a static Server Component.
It renders a flat list of alert entries with raw `scenarioSlug` strings as badges.

Two UX improvements are needed:
1. The panel should be collapsible (default closed), showing only a summary when collapsed.
2. The `scenarioSlug` values should be shown with readable labels and emoji instead of raw slug strings.

## Changes

### `src/features/dashboard/AlertPanel.tsx`

Convert to a Client Component and add collapse behaviour.

**Add `"use client"` at the top.**

**Add a slug → display config map:**

```ts
const SCENARIO_CONFIG: Record<string, { label: string; emoji: string }> = {
  store_slump: { label: "Store Slump", emoji: "📉" },
  promo_week:  { label: "Promo Week",  emoji: "🏷️" },
};

function getScenarioDisplay(slug: string): { label: string; emoji: string } {
  return (
    SCENARIO_CONFIG[slug] ?? {
      label: slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      emoji: "⚠️",
    }
  );
}
```

**Replace the raw `{alert.scenarioSlug}` badge text** with `{emoji} {label}` using `getScenarioDisplay`.

**Add collapse state and summary chips:**

```tsx
const [expanded, setExpanded] = useState(false);

// Build summary: count per scenario type
const summary = alerts.reduce<Record<string, { count: number; emoji: string; label: string }>>(
  (acc, alert) => {
    const { emoji, label } = getScenarioDisplay(alert.scenarioSlug);
    if (!acc[alert.scenarioSlug]) acc[alert.scenarioSlug] = { count: 0, emoji, label };
    acc[alert.scenarioSlug].count++;
    return acc;
  },
  {}
);
```

**Collapsed state renders summary chips** (one pill per scenario type, e.g. `📉 3 Store Slumps`).
Pluralise the label by appending `s` when count > 1.

**Header area** always visible, contains:
- The existing "Alert Panel" label and "Active anomalies in the last 30 days" heading
- A toggle button (right-aligned) that shows `▲ Hide` when expanded and `▼ Show` when collapsed
- Use `onClick={() => setExpanded((v) => !v)}`

**Layout:**
```
[header row with toggle]
[when collapsed: summary chips row]
[when expanded: full alert list]
```

When `alerts.length === 0` skip the toggle and summary; show the empty message directly without collapse behaviour.

**Toggle button style:** small, subtle — `text-sm text-ink-700 hover:text-ink-900` with `focus-visible` ring. No background. Chevron or text label is fine.

**Summary chips style:** `inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold` — reuse the same colour classes from `getBadgeClassName`.

## Verification

```bash
npm run build
```

- Panel renders collapsed by default, showing one chip per scenario type with count
- Clicking the toggle expands to the full list
- Badges in the full list show emoji + readable label instead of raw slug
- No TypeScript errors

## Files that change

- `src/features/dashboard/AlertPanel.tsx` (modified — Client Component conversion + collapse logic)
