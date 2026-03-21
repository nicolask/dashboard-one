import { Card } from "@/components/ui/card";
import { formatRevenue } from "@/lib/kpi";
import type { CategoryShareEntry } from "@/lib/kpi";

type CategoryPerformanceListProps = {
  entries: CategoryShareEntry[];
};

function formatShare(value: number) {
  return `${(value * 100).toFixed(1)} %`;
}

export function CategoryPerformanceList({ entries }: CategoryPerformanceListProps) {
  return (
    <Card className="space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
          Category Performance
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          Revenue mix by category
        </h2>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.categoryId}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-medium text-ink-900">{entry.categoryName}</p>
                <p className="mt-1 text-sm text-ink-700">{formatRevenue(entry.revenue)}</p>
              </div>
              <p className="text-sm font-medium text-ink-700">{formatShare(entry.revenueShare)}</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-brand-300 to-brand-500"
                style={{ width: `${Math.max(entry.revenueShare * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
