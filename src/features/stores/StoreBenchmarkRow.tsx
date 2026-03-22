import { Card } from "@/components/ui/card";
import { formatBasket, formatConversion, formatOrders, formatRevenue } from "@/lib/kpi";
import type { StoreBenchmark } from "@/lib/kpi";

type StoreBenchmarkRowProps = {
  benchmark: StoreBenchmark;
};

type BenchmarkBlock = {
  label: string;
  storeValue: number;
  references: Array<{
    label: string;
    value: number;
  }>;
  format: (value: number) => string;
};

function formatDelta(deltaPercent: number) {
  const sign = deltaPercent > 0 ? "+" : "";
  return `${sign}${(deltaPercent * 100).toFixed(1)}%`;
}

function capitalize(value: string) {
  return value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

export function StoreBenchmarkRow({ benchmark }: StoreBenchmarkRowProps) {
  const formatLabel = `${capitalize(benchmark.storeFormat)} avg`;
  const blocks: BenchmarkBlock[] = [
    {
      label: "Revenue",
      storeValue: benchmark.store.revenue,
      references: [
        { label: "Network avg", value: benchmark.networkAverage.revenue },
        { label: formatLabel, value: benchmark.formatAverage.revenue },
        { label: "Top 25%", value: benchmark.topQuartile.revenue },
      ],
      format: formatRevenue,
    },
    {
      label: "Orders",
      storeValue: benchmark.store.orders,
      references: [
        { label: "Network avg", value: benchmark.networkAverage.orders },
        { label: formatLabel, value: benchmark.formatAverage.orders },
        { label: "Top 25%", value: benchmark.topQuartile.orders },
      ],
      format: formatOrders,
    },
    {
      label: "Avg Basket",
      storeValue: benchmark.store.avgBasketValue,
      references: [
        { label: "Network avg", value: benchmark.networkAverage.avgBasketValue },
        { label: formatLabel, value: benchmark.formatAverage.avgBasketValue },
        { label: "Top 25%", value: benchmark.topQuartile.avgBasketValue },
      ],
      format: formatBasket,
    },
    {
      label: "Conversion",
      storeValue: benchmark.store.conversionRate,
      references: [
        { label: "Network avg", value: benchmark.networkAverage.conversionRate },
        { label: formatLabel, value: benchmark.formatAverage.conversionRate },
        { label: "Top 25%", value: benchmark.topQuartile.conversionRate },
      ],
      format: formatConversion,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {blocks.map((block) => {
        return (
          <Card className="space-y-3" key={block.label}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-ink-700">
              {block.label}
            </p>
            <div>
              <p className="text-3xl font-semibold tracking-tight text-ink-900">
                {block.format(block.storeValue)}
              </p>
            </div>
            <div className="space-y-2">
              {block.references.map((reference) => {
                const deltaPercent =
                  reference.value !== 0 ? (block.storeValue - reference.value) / reference.value : 0;
                const deltaTone =
                  deltaPercent > 0
                    ? "text-emerald-600"
                    : deltaPercent < 0
                      ? "text-rose-600"
                      : "text-ink-500";

                return (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 text-sm" key={reference.label}>
                    <p className="truncate text-ink-600">{reference.label}</p>
                    <p className="font-medium text-ink-800">{block.format(reference.value)}</p>
                    <p className={`font-medium ${deltaTone}`}>{formatDelta(deltaPercent)}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
