import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { logout } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";

type DashboardFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  activePath?: string;
};

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/users", label: "Users" },
  { href: "/integrations", label: "Integrations" },
  { href: "/settings", label: "Settings" },
];

export async function DashboardFrame({
  eyebrow,
  title,
  description,
  children,
  activePath,
}: DashboardFrameProps) {
  const user = await getCurrentUser();

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-panel backdrop-blur">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-700">
                Dashboard One
              </p>
              <h2 className="mt-2 text-xl font-semibold text-ink-900">Navigation</h2>
            </div>
            <nav className="space-y-2 text-sm text-ink-700">
              {navLinks.map(({ href, label }) => (
                <Link
                  className={[
                    "block rounded-2xl px-4 py-3 transition-colors",
                    activePath === href
                      ? "bg-brand-100 text-ink-900"
                      : "text-ink-700 hover:bg-white/60 hover:text-ink-900",
                  ].join(" ")}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/70 pt-4">
              <p className="text-sm font-medium text-ink-900">
                {user?.displayName ?? user?.email ?? "Signed in"}
              </p>
              {user?.displayName ? (
                <p className="mt-0.5 text-xs text-ink-700">{user.email}</p>
              ) : null}
              <form action={logout} className="mt-3">
                <button
                  className="w-full rounded-xl border border-brand-300 bg-brand-100 px-3 py-2 text-sm font-medium text-ink-900 transition-all duration-200 ease-out hover:border-brand-500 hover:bg-brand-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-panel backdrop-blur">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-700">
                {eyebrow}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                {title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-ink-700">{description}</p>
            </div>
          </header>
          {children}
        </section>
      </div>
    </Shell>
  );
}
