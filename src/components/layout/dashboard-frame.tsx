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

              <div className="flex items-center gap-4 self-start rounded-[1.75rem] border border-ink-200 bg-white/85 px-5 py-4 text-sm text-ink-700 shadow-[0_12px_28px_rgb(15_23_42_/_0.06)]">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">
                    {user?.displayName ?? user?.email ?? "Signed in"}
                  </p>
                  <p>{user?.email}</p>
                </div>
                <form action={logout}>
                  <button
                    className="whitespace-nowrap rounded-full border border-brand-300 bg-brand-100 px-4 py-2.5 font-medium text-ink-900 shadow-[0_8px_20px_rgb(8_145_178_/_0.08)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500 hover:text-white hover:shadow-[0_16px_30px_rgb(8_145_178_/_0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
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
