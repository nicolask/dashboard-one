# Prompt: Browser Spacing Debug

Use this when Nicolas says things like:

- "Die margins in Kachel X sind nicht gut."
- "Irgendwas stimmt mit dem Spacing nicht."
- "Warum kippt das Layout in dieser Karte?"

Use the MCP server `dashboard_browser`.

---

## Goal

Find the most likely reason an element has bad spacing, alignment, or visual rhythm in the local app.

Focus on concrete spacing evidence:

- margin
- padding
- gap
- width
- alignment
- line height
- nested wrappers

## Recommended Steps

1. Open the relevant page.
2. Wait for the target element.
3. Capture a screenshot of the affected state.
4. Inspect computed styles for:
   - outer container
   - inner wrapper
   - value text
   - label or supporting text
5. Use `get_dom()` or `evaluate_js(...)` to confirm nesting if the spacing source is unclear.
6. Compare desktop and mobile if the issue might be responsive.

## Working Rules

- Prefer the smallest set of observations that clearly explain the issue.
- Distinguish whether the problem comes from the container, the content block, or the surrounding layout.
- Call out utility-class stacking or wrapper nesting if that is the real culprit.
- End with the smallest plausible fix, not a redesign.

## Output Format

1. What looks wrong
2. Which spacing values are suspicious
3. Whether the issue comes from container, inner block, or parent layout
4. Most likely root cause
5. Smallest sensible change

## Ready-To-Use Prompt

```text
Nutze den MCP-Server `dashboard_browser`.

Öffne `/dashboard` und untersuche die Kachel [hier das konkrete Element nennen].

Finde heraus, warum die Margins oder Abstände nicht gut wirken.

Arbeite so:
- Seite öffnen
- auf das Element warten
- Screenshot aufnehmen
- Computed Styles für Container, Inner-Wrapper, Zahlenwert und Label prüfen
- DOM-Struktur kurz gegenprüfen

Liefere:
1. Was sichtbar falsch wirkt
2. Welche Margin-/Padding-/Gap-/Alignment-Werte auffällig sind
3. Ob das Problem eher vom Container, vom Textblock oder vom KPI-Layout kommt
4. Die wahrscheinlichste konkrete Ursache
5. Die kleinste sinnvolle Änderung zur Behebung
```
