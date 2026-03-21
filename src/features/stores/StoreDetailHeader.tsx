import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { StoreDetail } from "@/lib/kpi";

type StoreDetailHeaderProps = {
  store: StoreDetail;
};

export function StoreDetailHeader({ store }: StoreDetailHeaderProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4">
          <Link
            className="inline-flex items-center text-sm font-medium text-ink-700 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            href="/dashboard"
          >
            ← All Stores
          </Link>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900">{store.name}</h2>
            <p className="mt-2 text-sm text-ink-700">
              {store.code} · {store.city}, {store.region} · {store.format} · {store.sizeBand}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
              store.isActive ? "bg-mint-100 text-mint-800" : "bg-ink-100 text-ink-700",
            ].join(" ")}
          >
            {store.isActive ? "Active" : "Inactive"}
          </span>
          <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-ink-900">
            Open since {store.openedAt.getFullYear()}
          </span>
        </div>
      </div>
    </Card>
  );
}
