---
status: closed
complexity: standard
---

# T20 – Agentic Audit Page

## Context

This project doubles as a reference project for evaluating agentic development. We want a
dedicated dashboard page that surfaces a point-in-time analysis of the codebase: how many
lines of code, what the breakdown looks like, how long this would have taken a human developer,
and what the measured speedup is.

The page will be updated periodically by Claude (as PO, not Codex) following the prompt template
at `.agentic/prompts/loc-snapshot.md`. Codex builds the page structure once; the data file is
updated separately as a small direct edit whenever a new snapshot is needed.

The visual reference is `.agentic/po/loc-and-agentic-advantages/loc-analyse.html` — adapt the
structure and information hierarchy, but use Tailwind and the app's existing light/frosted-glass
design language instead of the dark theme of the standalone HTML.

---

## Changes

### 1. `src/features/agentic/snapshot-data.ts`

Create a plain data file — no React, no imports from the app. This is the only file Claude will
touch on future snapshot runs.

```ts
export const snapshot = {
  generatedAt: "2026-03-22",
  actualHours: 14,
  commitCount: 46,
  completedTaskCount: 12,

  locTotal: 6059,           // src + prisma + config, incl. tests
  locNonTest: 3809,         // src (non-test) + prisma
  locTests: 1924,

  locBreakdown: [
    { label: "Retail Feature / KPI Domain", loc: 2466, role: "feature" },
    { label: "Data Layer (Schema + Seed)",  loc: 993,  role: "feature" },
    { label: "Auth Scaffold",               loc: 228,  role: "scaffold" },
    { label: "Tests",                       loc: 1924, role: "tests" },
    { label: "Config & Layout",             loc: 448,  role: "config" },
  ],

  seniorDevHoursLow: 60,
  seniorDevHoursHigh: 90,
  midDevHoursLow: 100,
  midDevHoursHigh: 150,

  speedupLow: 4,
  speedupHigh: 6,

  footerNote: "Struktur sauber · Tests vorhanden · Seed-Script deterministisch",
  stack: "Next.js · Prisma · Tailwind · Vitest",

  // Rendered verbatim as prose in the "Conditions" section — edit the text here, not in the component
  conditions: [
    {
      heading: "Greenfield — keine bestehende Codebasis",
      body: "Das Projekt startete auf der grünen Wiese. Kein Legacy-Code, keine gewachsene Architektur, keine technische Schuld, die zuerst verstanden oder umgebaut werden musste. Agentic Development profitiert davon erheblich: der Agent muss keine impliziten Abhängigkeiten rekonstruieren, keinen undokumentierten Kontext erraten, und macht keine Fehler durch fehlendes Domänenwissen über bestehende Systeme.",
    },
    {
      heading: "Keine sicherheitskritischen Anforderungen",
      body: "Die Applikation enthält Demo-Daten, eine lokale Credential-Auth und keine echten Nutzer. Penetrationstests, Datenschutz-Folgenabschätzungen, Compliance-Anforderungen oder sicherheitskritische Review-Prozesse lagen außerhalb des Scope. In produktiven Kontexten mit echten Daten und regulatorischen Vorgaben verschiebt sich das Verhältnis — dort ist menschliche Prüfung nicht optional.",
    },
    {
      heading: "Anforderungsanalyse war kollaborativ, nicht autonom",
      body: "Die Produktentscheidungen entstanden nicht allein durch den Agenten. Scope, Priorisierung und Feature-Design wurden gemeinsam mit ChatGPT und Claude Chat erarbeitet — als Sparringspartner für Ideen, nicht als ausführendes System. Codex hat implementiert, was bereits klar spezifiziert war. Der Aufwand für dieses Alignment ist in den 14h enthalten, aber die Qualität der Spezifikation war eine Voraussetzung für die Geschwindigkeit der Umsetzung.",
    },
    {
      heading: "Was dieser Vergleich nicht aussagt",
      body: "4–6× schneller auf einem Greenfield-Projekt unter idealen Bedingungen ist kein allgemeingültiger Wert für agentic Development. Dieser Vergleich misst einen spezifischen Kontext: ein neues Projekt, ein einzelner Entwickler als PO, gut strukturierte Aufgaben, keine sicherheitskritischen Anforderungen. Legacy-Migrationen, Team-Alignment, Compliance-Reviews und explorative Architekturentscheidungen skalieren anders.",
    },
  ],
};
```

### 2. `src/features/agentic/AgenticAuditPage.tsx`

A React Server Component that reads from `snapshot-data.ts` and renders the analysis.
No client-side interactivity needed.

Sections (top to bottom):

**Header row**
- Eyebrow: `"Agentic Development Audit"`
- Title: `"Retail Dashboard — in ~{actualHours}h"`
- Right side: large `~{actualHours} h` with sub-label "actual build time"

**Three metric cards** (use `Card` from `@/components/ui/card` or a matching div pattern)
- `~{locTotal}` — "Total LOC in repo (excl. node_modules, .next)"
- `~{locNonTest}` — "Application code (non-test)"
- `{locTests}` — "Test coverage lines"

**Conditions / Einordnung** — render after the metric cards, before the bar chart

A clearly labeled section ("Einordnung") that renders `snapshot.conditions` as a list of cards or
prose blocks. Each entry has a `heading` (bold, short) and a `body` (regular weight, full sentences).
This is the most important section on the page — it should not look like a footnote. Give it equal
visual weight to the data sections. Use a two-column grid on wider viewports, single column on narrow.

**LOC breakdown bar chart** — horizontal bars, one per `locBreakdown` entry
- Width proportional to LOC (relative to `locTotal`)
- Color-code by role: `feature` → brand accent color, `tests` → muted green, `scaffold` and `config` → neutral gray
- Show LOC count inside or beside the bar

**Divider**

**Time estimate grid** — two-column grid, mirroring the HTML original
- Rows: Setup & Auth Scaffold, Prisma Schema + Migration, Seed Script (complex), KPI Layer + Tests,
  Dashboard UI (components + pages), Store Detail + Insights, Period Comparison, Benchmarking,
  Scenario Timeline, Test Coverage Pass, Controlling Extension, Narrative Tiering
- Values: reasonable senior dev hour ranges per item (derive from snapshot totals if needed — be consistent)
- Footer row spanning full width: "Senior Dev total: ~{seniorDevHoursLow}–{seniorDevHoursHigh}h · Mid-Level: ~{midDevHoursLow}–{midDevHoursHigh}h"

**Divider**

**Speedup section**
- Large display number: `{speedupLow}–{speedupHigh}×`
- Sub-label: "speedup vs. senior developer — without architectural quality loss"
- Three comparison bars (thin, horizontal):
  - `~{actualHours}h` — Nicolas (agentic), colored with brand accent
  - `~{seniorDevHoursHigh}h` — Senior Dev, muted
  - `~{midDevHoursHigh}h` — Mid-Level Dev, even more muted
  Width proportional; use `{midDevHoursHigh}` as the 100% reference

**Footer text**
- Left: `{footerNote}`
- Right: `{stack}`

Use the app's standard spacing, typography, and frosted-card visual language throughout.
No custom CSS files — Tailwind only.

### 3. `src/app/(app)/agentic/page.tsx`

```tsx
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { AgenticAuditPage } from "@/features/agentic/AgenticAuditPage";

export default function AgenticPage() {
  return (
    <DashboardFrame
      activePath="/agentic"
      description="Point-in-time analysis of code volume, estimated development effort, and the measurable impact of agentic development on this project."
      eyebrow="Meta"
      title="Agentic Audit"
    >
      <AgenticAuditPage />
    </DashboardFrame>
  );
}
```

### 4. `src/components/layout/dashboard-frame.tsx`

Add one entry to `navLinks`:

```ts
{ href: "/agentic", label: "Agentic" },
```

Place it last in the list, after `"Settings"`.

---

## Acceptance Criteria

- [ ] `/agentic` is reachable while authenticated, returns 200
- [ ] Page renders all six sections: header, metrics, conditions/Einordnung, breakdown bars, time grid, speedup
- [ ] All four `conditions` entries are rendered with heading and body text
- [ ] Conditions section has equal visual weight to the data sections — not a footnote
- [ ] LOC bars are proportionally sized relative to total LOC
- [ ] "Agentic" nav link appears in sidebar and highlights correctly when active
- [ ] `snapshot-data.ts` contains no React imports — it is a plain data module
- [ ] No custom CSS — Tailwind only
- [ ] Build, lint, typecheck pass

## Out of scope

- Live LOC computation at runtime
- Any interactivity or client-side state
- Animations (the standalone HTML had grow-in animations — skip for now)
- Mobile layout (follows general backlog item for mobile pass)
