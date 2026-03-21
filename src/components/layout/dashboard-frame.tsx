import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { logout } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";

type DashboardFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export async function DashboardFrame({
  eyebrow,
  title,
  description,
  children,
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
              <Link className="block rounded-2xl bg-brand-100 px-4 py-3 text-ink-900" href="/dashboard">
                Overview
              </Link>
              <div className="rounded-2xl px-4 py-3">Users</div>
              <div className="rounded-2xl px-4 py-3">Integrations</div>
              <div className="rounded-2xl px-4 py-3">Settings</div>
            </nav>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-700">
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-900">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-ink-700">{description}</p>
              </div>

              <div className="flex items-center gap-3 self-start rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm text-ink-700">
                <div>
                  <p className="font-medium text-ink-900">
                    {user?.displayName ?? user?.email ?? "Signed in"}
                  </p>
                  <p>{user?.email}</p>
                </div>
                <form action={logout}>
                  <button
                    className="rounded-full border border-ink-200 px-3 py-2 font-medium text-ink-900 transition hover:border-brand-300 hover:bg-brand-50"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
    </Shell>
  );
}
