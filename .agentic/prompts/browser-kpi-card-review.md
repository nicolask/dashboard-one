# Prompt: KPI Card Review

Use this when Nicolas wants feedback on a KPI card such as EBIT, profit, revenue, delta chips, value hierarchy, or large-number formatting.

Use the MCP server `dashboard_browser`.

---

## Goal

Evaluate a KPI card in the live local dashboard with a strong focus on:

- readability of large values
- hierarchy of value, label, and delta
- overflow or awkward wrapping
- spacing and visual balance
- desktop vs. mobile behavior

## Recommended Steps

1. Open the target page, usually `/dashboard`.
2. Wait for the KPI grid or the specific card to render.
3. Inspect at `1440x1100`.
4. Inspect at `390x844`.
5. Capture screenshots for both states.
6. Inspect the card container, value text, label, and delta with `get_computed_style(...)`.
7. Use `get_dom()` or `evaluate_js(...)` if the exact text structure or number formatting needs confirmation.

## What To Look For

- value line too dominant or too cramped
- decimals or separators making the number noisy
- delta and label competing with the main number
- line height, font size, or container width causing ugly wraps
- padding or gap choices making the card feel crowded or empty
- mobile collapse behavior that harms scanability

## Output Format

1. Short verdict on the card quality
2. Desktop observations
3. Mobile observations
4. Most likely layout or styling cause
5. Recommendation for better number presentation
6. Optional: likely component or styling area to change

## Ready-To-Use Prompt

```text
Nutze den MCP-Server `dashboard_browser`.

Öffne `/dashboard` und untersuche die EBIT-/Profit-Kachel.

Prüfe:
- Desktop bei 1440x1100
- Mobile bei 390x844

Achte besonders auf:
- Darstellung großer Zahlen
- Zeilenumbrüche
- visuelle Hierarchie von Wert, Label und Delta
- Padding, Margin, Font-Size, Line-Height und mögliche Overflow-/Wrapping-Probleme

Liefere:
1. Kurzfazit zur Qualität der Darstellung
2. Konkrete Beobachtungen auf Desktop und Mobile
3. Wahrscheinlichste Ursache im Layout oder Styling
4. Empfehlung, wie große Zahlen besser dargestellt werden sollten
5. Falls möglich, die wahrscheinlich betroffene Komponente oder CSS-Stelle
```
