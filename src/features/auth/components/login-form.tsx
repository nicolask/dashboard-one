import Link from "next/link";

import { Card } from "@/components/ui/card";

type LoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
};

export function LoginForm({ action, errorMessage }: LoginFormProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-700">
            Sign in
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
            Welcome back
          </h1>
          <p className="text-sm leading-6 text-ink-700">
            Sign in with local credentials now, while keeping the app ready for a
            later move to provider-backed auth.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-900">Email</span>
            <input
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-900">Password</span>
            <input
              className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-2xl bg-ink-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-700"
            type="submit"
          >
            Sign in
          </button>
        </form>

        <div className="space-y-3 text-center text-sm text-ink-700">
          <p>
            Use the locally seeded demo account while the full auth and onboarding
            flow is still taking shape.
          </p>
          <Link className="font-medium text-brand-700 hover:text-brand-500" href="/">
            Back to overview
          </Link>
        </div>
      </Card>
    </main>
  );
}
