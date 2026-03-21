import { Card } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  delta: number;
  deltaLabel?: string;
};

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${Math.abs(delta * 100).toFixed(1)} %`;
}

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel = "vs. previous period",
}: KpiCardProps) {
  const deltaClassName =
    delta > 0
      ? "bg-emerald-100 text-emerald-800"
      : delta < 0
        ? "bg-rose-100 text-rose-800"
        : "bg-ink-100 text-ink-700";

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-ink-700">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{value}</p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${deltaClassName}`}
        >
          {formatDelta(delta)}
        </span>
        <span className="text-sm text-ink-700">{deltaLabel}</span>
      </div>
    </Card>
  );
}
