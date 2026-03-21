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
              className="rounded-full bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-[0_10px_24px_rgb(15_23_42_/_0.12)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white hover:shadow-[0_18px_36px_rgb(8_145_178_/_0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              href="/login"
            >
              Open login
            </Link>
            <Link
              className="rounded-full border border-ink-200 bg-white/75 px-5 py-3 text-sm font-medium text-ink-900 shadow-[0_10px_24px_rgb(15_23_42_/_0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-100 hover:text-ink-900 hover:shadow-[0_16px_30px_rgb(34_197_94_/_0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
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
