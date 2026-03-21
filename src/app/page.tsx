import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";

const foundations = [
  "App Router with route groups for public and protected areas",
  "Tailwind CSS v4 design tokens in globals.css",
  "Domain-first folders under src/features",
  "Space reserved for auth, user management, and integrations",
];

export default function HomePage() {
  return (
    <Shell>
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-sm text-ink-700 shadow-sm backdrop-blur">
            Early architecture scaffold
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink-900 sm:text-6xl">
              A dashboard foundation that can start small and grow without getting tangled.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-ink-700">
              This first cut is set up for a login-first product, with room for user roles,
              OIDC later, and external system data cached locally instead of fetched ad hoc.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-ink-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-700"
              href="/login"
            >
              Open login
            </Link>
            <Link
              className="rounded-full border border-ink-200 bg-white/70 px-5 py-3 text-sm font-medium text-ink-900 transition hover:border-brand-300 hover:bg-white"
              href="/dashboard"
            >
              View dashboard shell
            </Link>
          </div>
        </div>

        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-700">
              Included now
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink-900">Project shape</h2>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-ink-700">
            {foundations.map((item) => (
              <li className="flex gap-3" key={item}>
                <span className="mt-1 size-2 rounded-full bg-brand-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </Shell>
  );
}

