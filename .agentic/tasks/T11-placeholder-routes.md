---
status: closed
complexity: micro
---

# T11 – Placeholder Routes for Nav Items

## Context

`src/components/layout/dashboard-frame.tsx` has three nav items rendered as plain `<div>`s
with no href: **Users**, **Integrations**, **Settings**. They look like links but go nowhere.

This task creates routes and placeholder pages for all three, and converts the nav items to
real `<Link>` elements with an active-state highlight.

## Changes

### `src/components/layout/dashboard-frame.tsx`

Replace the three inert `<div>` nav items with `<Link>` elements. Add an `activePath` prop
so the current route can be highlighted.

Update the component signature:

```ts
type DashboardFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  activePath?: string; // e.g. "/dashboard", "/users", "/integrations", "/settings"
};
```

Nav link helper (inline, no separate component needed):

```tsx
const navLinks = [
  { href: "/dashboard",    label: "Overview" },
  { href: "/users",        label: "Users" },
  { href: "/integrations", label: "Integrations" },
  { href: "/settings",     label: "Settings" },
];

// Inside nav:
{navLinks.map(({ href, label }) => (
  <Link
    key={href}
    href={href}
    className={`block rounded-2xl px-4 py-3 ${
      activePath === href
        ? "bg-brand-100 text-ink-900"
        : "text-ink-700 hover:bg-white/60"
    }`}
  >
    {label}
  </Link>
))}
```

---

### Three placeholder pages

Create one page per route. All follow the same pattern — a Server Component that renders
`DashboardFrame` with an "under construction" message.

**`src/app/(app)/users/page.tsx`**
**`src/app/(app)/integrations/page.tsx`**
**`src/app/(app)/settings/page.tsx`**

Each page passes the correct `activePath` to `DashboardFrame` and renders a simple card
body:

```tsx
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Card } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <DashboardFrame
      eyebrow="Admin"
      title="Users"
      description="Manage user accounts and access."
      activePath="/users"
    >
      <Card className="p-8 text-center text-ink-700">
        <p className="text-lg font-medium">In Development</p>
        <p className="mt-2 text-sm">This section is coming soon.</p>
      </Card>
    </DashboardFrame>
  );
}
```

Adjust `eyebrow`, `title`, and `description` per page:

| Route | eyebrow | title | description |
|---|---|---|---|
| `/users` | Admin | Users | Manage user accounts and access. |
| `/integrations` | Admin | Integrations | Connect external data sources and tools. |
| `/settings` | Admin | Settings | Configure application preferences. |

---

### Existing `src/app/(app)/dashboard/page.tsx`

Pass `activePath="/dashboard"` to `DashboardFrame` so the Overview item stays highlighted.

### Existing `src/app/(app)/stores/[storeId]/page.tsx` (T10)

Pass `activePath="/dashboard"` — the stores drilldown is part of the dashboard section.

## Verification

```bash
npm run build
```

- All four nav items are clickable `<Link>` elements
- The active item has the `bg-brand-100 text-ink-900` highlight
- `/users`, `/integrations`, `/settings` each render a styled placeholder card
- No TypeScript errors

## Files that change

- `src/components/layout/dashboard-frame.tsx` — `activePath` prop + Link-based nav
- `src/app/(app)/dashboard/page.tsx` — `activePath="/dashboard"` added
- `src/app/(app)/users/page.tsx` — new
- `src/app/(app)/integrations/page.tsx` — new
- `src/app/(app)/settings/page.tsx` — new
- `src/app/(app)/stores/[storeId]/page.tsx` — `activePath="/dashboard"` added (if T10 is done)
