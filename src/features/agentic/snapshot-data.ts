export const snapshot = {
  generatedAt: "2026-03-22",
  actualHours: 16,
  commitCount: 58,
  completedTaskCount: 15,

  locTotal: 8091,
  locNonTest: 5349,
  locTests: 2742,

  locBreakdown: [
    { label: "Retail Feature / KPI Domain", loc: 2837, role: "feature" },
    { label: "Data Layer (Schema + Seed)", loc: 1381, role: "feature" },
    { label: "Auth Scaffold", loc: 228, role: "scaffold" },
    { label: "Tests", loc: 2742, role: "tests" },
    { label: "Config, Layout & Agentic", loc: 903, role: "config" },
  ],

  seniorDevHoursLow: 65,
  seniorDevHoursHigh: 100,
  midDevHoursLow: 110,
  midDevHoursHigh: 165,

  speedupLow: 4,
  speedupHigh: 6,

  taskBreakdown: [
    { label: "Setup & Auth Scaffold",            seniorHours: "4–6h" },
    { label: "Prisma Schema + Migration",         seniorHours: "5–7h" },
    { label: "Seed Script (complex)",             seniorHours: "6–8h" },
    { label: "KPI Layer + Tests",                 seniorHours: "8–12h" },
    { label: "Dashboard UI (components + pages)", seniorHours: "7–10h" },
    { label: "Store Detail + Insights",           seniorHours: "5–8h" },
    { label: "Period Comparison",                 seniorHours: "4–6h" },
    { label: "Benchmarking",                      seniorHours: "3–4h" },
    { label: "Scenario Timeline",                 seniorHours: "3–5h" },
    { label: "Test Coverage Pass",                seniorHours: "4–6h" },
    { label: "Controlling Extension",             seniorHours: "5–8h" },
    { label: "Narrative Tiering",                 seniorHours: "6–10h" },
    { label: "Agentic Audit Page",                seniorHours: "2–4h" },
    { label: "Controlling Dashboard",             seniorHours: "3–5h" },
  ],

  tokenEstimate: {
    asOf: "2026-03-22",
    completedTasksAtEstimate: 15,
    body: "Über alle Codex-Implementierungen und Claude-Code-Sessions hinweg hat dieses Projekt schätzungsweise 3–4 Millionen Tokens verbraucht — verteilt auf 15 abgeschlossene Tasks, Code-Reviews und PO-Gespräche. Der größte Teil davon entfällt auf den Input: Codex liest das Repository vor jedem Task neu als Kontext, weshalb spätere Tasks mit gewachsener Codebase deutlich mehr Tokens ziehen als frühe. Mit 8.000 LOC als Kontext sind die letzten Tasks deutlich teurer als die ersten. Zum Einordnen: 3–4 Millionen Tokens entsprechen etwa dem, was ein intensiver Tag mit GPT-5 kostet, oder einer Handvoll transkribierter und analysierter Meetings. Für ein Projekt, das einem Developer-Monat an Aufwand entspricht, ist das ein überschaubares Budget.",
  },

  footerNote: "Struktur sauber · Tests vorhanden · Seed-Script deterministisch",
  stack: "Next.js · Prisma · Tailwind · Vitest",

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
      body: "Die Produktentscheidungen entstanden nicht allein durch den Agenten. Scope, Priorisierung und Feature-Design wurden gemeinsam mit ChatGPT und Claude Chat erarbeitet — als Sparringspartner für Ideen, nicht als ausführendes System. Codex hat implementiert, was bereits klar spezifiziert war. Der Aufwand für dieses Alignment ist in den 16h enthalten, aber die Qualität der Spezifikation war eine Voraussetzung für die Geschwindigkeit der Umsetzung.",
    },
    {
      heading: "Was dieser Vergleich nicht aussagt",
      body: "4–6× schneller auf einem Greenfield-Projekt unter idealen Bedingungen ist kein allgemeingültiger Wert für agentic Development. Dieser Vergleich misst einen spezifischen Kontext: ein neues Projekt, ein einzelner Entwickler als PO, gut strukturierte Aufgaben, keine sicherheitskritischen Anforderungen. Legacy-Migrationen, Team-Alignment, Compliance-Reviews und explorative Architekturentscheidungen skalieren anders.",
    },
  ],
} as const;
