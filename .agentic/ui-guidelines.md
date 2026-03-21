# UI Guidelines

## Purpose

This file captures the current interaction and visual language for the first dashboard surfaces.

Keep it short, practical, and easy to apply when new components are added.

## Interaction Style

- prefer calm, readable interfaces over flashy admin-dashboard patterns
- use motion as a subtle confirmation of interactivity, not as decoration
- make interactive states feel lighter, clearer, and more intentional rather than simply darker
- always preserve strong text contrast in default, hover, and focus states

## Buttons And Links

### Primary actions

- use a dark base with explicit light text
- on hover, shift toward the brand/mint palette instead of a harsher dark tone
- allow a small lift and a softer, brighter shadow on hover
- keep the label color explicit instead of relying on inherited link color

### Secondary actions

- use a light surface with a border and dark text
- on hover, make the control feel fresher and more active with brand-tinted backgrounds or borders
- avoid hover states that reduce readability or make the control feel disabled

### Text links

- keep links undecorated by default only when their affordance remains clear from placement, color, or weight
- define text color at the component level for important links and CTA-like links

## Focus States

- all interactive controls should have a visible `focus-visible` treatment
- prefer a brand-colored outline with offset instead of relying on browser defaults alone

## Shape, Depth, And Motion

- rounded controls should feel deliberate and soft, matching the rounded card language
- shadows should support hierarchy and hover feedback, not dominate the interface
- prefer short transitions and slight vertical lift for interactive controls
- avoid large jumps, springy movement, or heavy glow effects

## Things To Avoid

- implicit text color inheritance on CTA links
- dark-on-dark or low-contrast hover states
- buttons that wrap short labels onto multiple lines
- secondary actions that look inert because their default and hover states are too similar
