# Prompt: Browser UI Review

Use this when Nicolas wants a focused visual/interaction review in the local dashboard, for example:

- "Kannst du mal im Dashboard die EBIT-Profit-Kachel ansehen?"
- "Schau dir die Darstellung auf Mobile an."
- "Was ist an der Kachel visuell oder strukturell faul?"

Use the MCP server `dashboard_browser`.

Assume:

- the Next.js dev server is already running locally
- relative paths like `/dashboard` resolve against `http://localhost:3000`
- the agent already knows the repository and can connect browser observations back to likely code locations

---

## Goal

Investigate the named UI element or page in the local app and produce a short, evidence-based assessment with a likely cause and a concrete recommendation.

Stay focused on the requested surface. This is not a generic full-page audit.

## Default Workflow

1. Open the relevant page with `open_page(...)`.
2. Wait until the key UI is visible with `wait_for_selector(...)`.
3. Inspect Desktop first with `set_viewport(1440, 1100)`.
4. Inspect Mobile second with `set_viewport(390, 844)`.
5. Use `get_screenshot()` to confirm visual behavior.
6. Use `get_computed_style(...)`, `get_dom()`, or `evaluate_js(...)` only where they materially support the diagnosis.
7. Check `get_console_logs()` if rendering or client-side behavior looks suspicious.

## Tools To Prefer

- `open_page`
- `wait_for_selector`
- `set_viewport`
- `get_screenshot`
- `get_computed_style`
- `get_dom`
- `evaluate_js`
- `get_console_logs`

## Working Rules

- Base the answer on actual browser observations, not guesses.
- If a selector is unclear, find it via DOM inspection or short JS evaluation.
- Keep the review scoped to the element or concern Nicolas asked about.
- If the problem likely comes from component structure or utility classes, say so and point to the probable code area.
- If a fix is obvious, recommend the smallest coherent change.

## Output Format

1. Short verdict
2. Key observations
3. Most likely cause
4. Concrete recommendation
5. Optional: likely code location to inspect next

## Ready-To-Use Prompt

```text
Nutze den MCP-Server `dashboard_browser`.

Ziel:
Untersuche die UI im lokalen Dashboard und bewerte das konkrete Problem präzise, mit kurzer Ursachenanalyse und klarer Änderungsempfehlung.

Ablauf:
1. Öffne die relevante Seite per relativem Pfad.
2. Warte, bis die zentrale UI sichtbar ist.
3. Prüfe erst Desktop, dann Mobile.
4. Nutze Screenshot, DOM und Computed Styles nur dort, wo sie die Einschätzung belegen.
5. Wenn etwas visuell oder strukturell faul ist, benenne die wahrscheinlichste Ursache im Code oder Layout.
6. Falls sinnvoll, schlage direkt eine konkrete UI-/CSS-/Komponentenänderung vor.

Arbeitsmodus:
- Verwende `open_page`, `wait_for_selector`, `set_viewport`, `get_screenshot`, `get_computed_style`, `get_dom`, `evaluate_js`, `get_console_logs` nach Bedarf.
- Arbeite fokussiert auf das genannte Element, nicht als allgemeiner UI-Audit.
- Beziehe dich auf tatsächliche Beobachtungen aus Browserzustand, nicht auf Vermutungen.
- Wenn ein Selector unklar ist, finde ihn über DOM oder gezielte JS-Auswertung.
- Wenn Login nötig ist, nutze die vorhandene Login-Seite und den bekannten lokalen Testzugang.

Ergebnisformat:
1. Kurzfazit
2. Beobachtungen
3. Wahrscheinlichste Ursache
4. Konkrete Empfehlung
5. Optional: Welche Code-Stelle du als Nächstes prüfen oder ändern würdest
```
