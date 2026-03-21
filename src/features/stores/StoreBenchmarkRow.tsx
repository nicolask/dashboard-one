import { Card } from "@/components/ui/card";
import { formatBasket, formatConversion, formatOrders, formatRevenue } from "@/lib/kpi";
import type { StoreBenchmark } from "@/lib/kpi";

type StoreBenchmarkRowProps = {
  benchmark: StoreBenchmark;
};

type BenchmarkBlock = {
  label: string;
  storeValue: number;
  averageValue: number;
  format: (value: number) => string;
};

function formatDelta(deltaPercent: number) {
  const sign = deltaPercent > 0 ? "+" : "";
  return `${sign}${(deltaPercent * 100).toFixed(1)}%`;
}

export function StoreBenchmarkRow({ benchmark }: StoreBenchmarkRowProps) {
  const blocks: BenchmarkBlock[] = [
    {
      label: "Revenue",
      storeValue: benchmark.store.revenue,
      averageValue: benchmark.average.revenue,
      format: formatRevenue,
    },
    {
      label: "Orders",
      storeValue: benchmark.store.orders,
      averageValue: benchmark.average.orders,
      format: formatOrders,
    },
    {
      label: "Avg Basket",
      storeValue: benchmark.store.avgBasketValue,
      averageValue: benchmark.average.avgBasketValue,
      format: formatBasket,
    },
    {
      label: "Conversion",
      storeValue: benchmark.store.conversionRate,
      averageValue: benchmark.average.conversionRate,
      format: formatConversion,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {blocks.map((block) => {
        const deltaPercent =
          block.averageValue !== 0 ? (block.storeValue - block.averageValue) / block.averageValue : 0;
        const deltaTone =
          deltaPercent > 0
            ? "text-mint-700"
            : deltaPercent < 0
              ? "text-rose-700"
              : "text-ink-700";

        return (
          <Card className="space-y-3" key={block.label}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-ink-700">
              {block.label}
            </p>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-ink-900">
                {block.format(block.storeValue)}
              </p>
              <p className="mt-2 text-sm text-ink-700">vs. ø {block.format(block.averageValue)}</p>
            </div>
            <p className={`text-sm font-medium ${deltaTone}`}>{formatDelta(deltaPercent)}</p>
          </Card>
        );
      })}
    </div>
  );
}
