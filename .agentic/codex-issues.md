# Scaffold issues for Codex

Issues identified during architectural review on 2026-03-21. Fix in order of priority.

Reviewer note on follow-up status:

- not every item in this file was fixed immediately
- several non-blocking items were intentionally moved into `.agentic/backlog.md` for later clean-context follow-up
- treat this file as review input, not as the single source of truth for what remains open

---

## High priority

### 1. `(app)` route group is missing `layout.tsx`

There is no `src/app/(app)/layout.tsx`. This is the correct place for an auth guard — a single layout that protects every future route under `(app)/`. Without it, `/dashboard` is reachable without authentication, and there is no seam to add a session check without touching every page individually.

**Fix:** Create `src/app/(app)/layout.tsx`. For now it can just render children, but add a comment marking it as the auth guard location.

**Status: resolved in commit on 2026-03-21.**

---

### 2. `cn()` is missing `tailwind-merge`

`src/lib/utils/cn.ts` filters falsy values and joins strings. It does not merge conflicting Tailwind utilities. `cn("p-4", "p-8")` produces `"p-4 p-8"` — both classes are present in the DOM and the result is browser-order-dependent. This will produce subtle visual bugs as soon as components accept `className` override props.

**Fix:** Replace the implementation with `clsx` + `tailwind-merge`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Add `clsx` and `tailwind-merge` to dependencies.

**Status: moved to backlog for a focused UI utility pass.**

---

### 3. Fonts are loaded via CSS, not `next/font`

`globals.css` imports Inter and JetBrains Mono via a CSS `@import`. This bypasses Next.js font optimization: no subsetting, no preloading, and layout shift on load.

**Fix:** Load fonts in `src/app/layout.tsx` using `next/font/google` (Inter) and `next/font/local` (JetBrains Mono with a self-hosted woff2). Expose them as CSS variables and reference those variables in the Tailwind design tokens in `globals.css`.

**Status: moved to backlog for a dedicated font-loading pass.**

---

### 4. `DashboardFrame` makes a redundant `getCurrentUser()` DB call on every page load

`(app)/layout.tsx` calls `requireCurrentUser()`, which hits the DB. Then `DashboardFrame` independently calls `getCurrentUser()` — a second hit on the same request. These are not deduplicated automatically.

**Fix:** Wrap `getCurrentUser` with `React.cache()` so repeated calls within the same request share the result:

```ts
// src/lib/auth/current-user.ts
import { cache } from "react";

export const getCurrentUser = cache(async function getCurrentUser() { ... });
```

No call-site changes needed.

**Status: resolved in commit on 2026-03-21.**

---

### 5. `prisma.ts` uses a brittle relative import for the generated client

```ts
import { PrismaClient } from "../../../generated/prisma/client";
```

The `@generated/*` path alias is already configured in `tsconfig.json`. The relative path is fragile if `prisma.ts` ever moves.

**Fix:** Use the configured alias:

```ts
import { PrismaClient } from "@generated/prisma/client";
```

**Status: resolved on 2026-03-21 after confirming the alias works in the script runtime.**

---

### 6. `generated/` is not in `.gitignore`

The Prisma schema outputs the generated client to `generated/prisma/` at the project root. This directory is not gitignored, so it will be committed. If this is intentional (for CI without a generate step), document the decision. If not, add `generated/` to `.gitignore` and add `prisma generate` to the build/CI step.

**Status: already resolved before this review pass. `/generated/prisma` is gitignored.**

---

## Medium priority

### 7. Status comparisons use string literals instead of the generated enum

In `actions.ts` and `current-user.ts`:

```ts
user.status !== "ACTIVE"     // actions.ts
where: { status: "ACTIVE" }  // current-user.ts
```

The generated client exports `UserStatus`. Using the enum value makes refactoring safe and is self-documenting:

```ts
import { UserStatus } from "@generated/prisma/client";

user.status !== UserStatus.ACTIVE
```

**Status: resolved on 2026-03-21.**

---

### 8. `getCurrentUser` uses `findFirst` on a primary key

```ts
prisma.user.findFirst({ where: { id: userId, status: "ACTIVE" } })
```

`findFirst` on a compound filter does not use the PK index as efficiently as `findUnique`. The idiomatic pattern is:

```ts
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user || user.status !== UserStatus.ACTIVE) return null;
return user;
```

**Status: resolved on 2026-03-21.**

---

### 9. `datasource db` in `schema.prisma` has no `url` field

```prisma
datasource db {
  provider = "sqlite"
}
```

The URL is delegated entirely to `prisma.config.ts`. This works for Prisma 7's config-first setup, but the schema is non-standard — developers unfamiliar with `prisma.config.ts` will be confused, and some IDE plugins and schema validators may reject it.

**Fix:** Add a comment in the schema explaining the delegation, or use the conventional `url = env("DATABASE_URL")` and let `prisma.config.ts` override it.

**Status: resolved on 2026-03-21 with an inline schema comment.**

---

### 10. No `.env.example` file

The change introduces two required env vars (`DATABASE_URL`, `AUTH_SECRET`) and optional seeding vars (`DEMO_LOGIN_EMAIL`, `DEMO_LOGIN_PASSWORD`). There is no `.env.example` documenting them. Any new developer or agent who clones this will hit a runtime error with no obvious path forward.

**Fix:** Add `.env.example` with placeholder values and a comment for each variable.

**Status: already resolved before this review pass.**

---

## Low priority

### 11. User widget in `DashboardFrame` shows email twice when `displayName` is null

```tsx
<p className="font-medium text-ink-900">
  {user?.displayName ?? user?.email ?? "Signed in"}
</p>
<p>{user?.email}</p>  {/* always rendered */}
```

When `displayName` is null, both lines render the email address. The second line should only appear when it adds information:

```tsx
{user?.displayName && <p>{user.email}</p>}
```

**Status: resolved on 2026-03-21.**

---

### 12. Session JWT has no revocation mechanism — document the known gap

A disabled user's JWT is valid until expiry (7 days). The current `requireCurrentUser()` flow re-checks `status: "ACTIVE"` in the DB via the `(app)` layout on every request, which mitigates this. But the guarantee only holds for pages that go through that layout. Future Server Actions or API routes that skip the layout will need their own status check or they will silently accept disabled sessions.

**Fix:** Add a note to `decisions.md` describing this gap and the expected mitigation pattern, before more Server Actions are added.

**Status: resolved on 2026-03-21 in `.agentic/decisions.md`.**

---

### 13. Scrypt cost parameters use Node.js defaults without documentation

`scryptSync(password, salt, 64)` uses Node's defaults (N=16384, r=8, p=1). These are reasonable but invisible. Future changes to the hashing logic may inadvertently alter them.

**Fix:** Pass cost parameters explicitly and add a comment documenting the chosen values and the rationale.

**Status: resolved on 2026-03-21.**

---

### 14. `next/navigation` is not mocked in vitest setup

`vitest.setup.ts` mocks `next/link` but not `next/navigation`. Any component that calls `usePathname()` or `useRouter()` (e.g. for active nav state in `DashboardFrame`) will throw in tests.

**Fix:** Add to `vitest.setup.ts`:

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));
```

**Status: kept in backlog for when router hooks actually land in components.**

---

### 15. Root `src/app/page.tsx` is a developer scaffold page

The home route renders a "what's included" overview. This should be replaced with a redirect to `/login` or `/dashboard` before any real usage.

**Fix:** Replace with a redirect or a real landing page when appropriate. Track in backlog.

**Status: tracked as an open product decision in backlog/open questions.**
