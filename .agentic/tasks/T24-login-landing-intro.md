---
status: planned
complexity: standard
---

# T24 – Login as Landing Page with Intro Content

## Context

The current `/` is a scaffold-era page that links to `/login` and `/dashboard`. It signals
"development skeleton", not a product. The root question from codex-issues.md is now resolved:

**Decision:** Login becomes the de facto entry point. The login page gets contextual intro content
so it reads as a demo product landing, not a bare auth form. Login remains the functional core —
the intro is framing, not a full marketing page.

---

## Changes

### 1. `src/app/page.tsx`

Replace the entire file with a simple redirect:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
```

The scaffold landing content (foundations list, "View dashboard shell" link) is retired.

### 2. `src/app/(public)/login/page.tsx`

Replace the existing single-column page with a two-column layout. The page handles all positioning;
`LoginForm` drops its own centering wrapper (see change 3).

Layout:
- Full-viewport container, horizontally centered, two columns on `lg:` and above, stacked on smaller screens
- Left column: intro content (`LoginIntro` component, see change 4)
- Right column: login form card (`LoginForm`)
- Both columns vertically centered within the viewport

```tsx
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoginIntro } from "@/features/auth/components/login-intro";
import { getCurrentUser } from "@/lib/auth/current-user";
import { login } from "@/lib/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const errorMessage =
    params?.error === "invalid" ? "Invalid email or password." : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-5xl gap-16 lg:grid-cols-[1fr_auto] lg:items-center">
        <LoginIntro />
        <LoginForm action={login} errorMessage={errorMessage} />
      </div>
    </main>
  );
}
```

### 3. `src/features/auth/components/login-form.tsx`

Remove the outer `<main>` centering wrapper and the "Back to overview" link footer — the page
handles layout, and `/` now redirects back to login anyway.

The form card itself stays unchanged: `Card`, email input, password input, error message,
submit button. Only the wrapping shell and footer section are removed.

Also update the subtitle text inside the card to something concise and demo-appropriate:
- Current: "Sign in with local credentials now, while keeping the app ready for a later move to provider-backed auth."
- New: "Enter your credentials to access the dashboard."

Remove the helper paragraph below the submit button ("Use the locally seeded demo account while
the full auth and onboarding flow is still taking shape.") and the "Back to overview" link.

The resulting component renders just the `Card` with a `w-full max-w-sm` constraint so it sits
neatly in the right column.

### 4. `src/features/auth/components/login-intro.tsx` (new file)

A Server Component — no client-side state. Reads from `snapshot-data.ts` for the agentic teaser.

Structure (top to bottom):

**Eyebrow**
`"Retail Analytics Demo"` — small caps, brand accent or muted ink, same style as other eyebrow
labels in the app (e.g. `text-sm font-medium uppercase tracking-[0.2em] text-ink-700`).

**Headline**
`"Store performance, in one view."` — large, tight, `text-ink-900`. Around `text-4xl` or `text-5xl`.

**Body paragraph**
One short paragraph introducing the demo context — something along the lines of:
> Six stores, twelve weeks of trading data, and a scenario engine that shows what unusual events
> look like in real numbers. Log in to explore KPIs, benchmarks, and narrative insights.

(Codex can use this text verbatim or adapt it to fit naturally.)

**Capability list**
Four short items, each a bullet or small checkmark dot (use the brand dot pattern from the existing
landing page or a similar subtle marker):
- KPI overview — revenue, basket, conversion, and margin across stores and periods
- Store drilldown — ranked views, trend lines, and benchmark comparison
- Scenario timeline — tagged anomalies overlaid on the trading calendar
- Insight narratives — auto-generated context for what the numbers mean

Keep labels concise. This is a preview list, not a feature comparison table.

**Agentic teaser** (bottom of the column, visually lighter)

A small, low-prominence block — not a prominent section header, more of a footnote-style note.
Import the relevant fields from `snapshot-data.ts`:

```ts
import { snapshot } from "@/features/agentic/snapshot-data";
```

Render something like:

> Built with agentic development — ~{snapshot.locNonTest} lines of application code in {snapshot.actualHours} actual hours.
> {snapshot.speedupLow}–{snapshot.speedupHigh}× the speed of solo development.

Style it in small text (`text-sm`), muted ink (`text-ink-500` or `text-ink-600`), with a subtle
separator above it (a thin border or just extra top margin). No link to `/agentic` — authenticated
pages are not reachable from here.

---

## Acceptance Criteria

- [ ] `GET /` returns a redirect to `/login` (302 or similar)
- [ ] `GET /login` renders a two-column layout on `lg:` screens, stacked on smaller
- [ ] Left column shows eyebrow, headline, body, capability list, and agentic teaser
- [ ] Right column shows the login form card
- [ ] Login form functions correctly: valid credentials → redirect to `/dashboard`, invalid → error message rendered in card
- [ ] "Back to overview" link removed from `LoginForm`
- [ ] Scaffold copy ("local credentials", "seeded demo account") removed from form
- [ ] `login-intro.tsx` imports `snapshot` from `snapshot-data.ts` — no hardcoded LOC or hour values
- [ ] No custom CSS — Tailwind only
- [ ] Build, lint, typecheck pass
- [ ] Existing `login-form.test.tsx` still passes (adjust if the outer wrapper change affects selectors)

## Out of scope

- Auth-aware redirect on `/` (i.e. skip login if already authenticated — the current behavior is fine)
- Any changes to the `/dashboard` route or authenticated shell
- Mobile layout pass (covered by the general backlog item)
- Updating the demo credentials shown anywhere — no credential hints should be added to the UI
