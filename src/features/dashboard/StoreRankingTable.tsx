import { Fragment } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatBasket, formatConversion, formatOrders, formatRevenue } from "@/lib/kpi/format";
import type { StoreRankingEntry } from "@/lib/kpi";

type StoreRankingTableProps = {
  entries: StoreRankingEntry[];
};

function formatGrowth(delta: number) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta * 100).toFixed(1)} %`;
}

export function StoreRankingTable({ entries }: StoreRankingTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/70 px-6 py-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
          Store Comparison
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          Revenue ranking by store
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-white/60 text-xs uppercase tracking-[0.16em] text-ink-700">
            <tr>
              <th className="px-6 py-4 font-medium">#</th>
              <th className="px-6 py-4 font-medium">Store</th>
              <th className="px-6 py-4 font-medium">Revenue</th>
              <th className="px-6 py-4 font-medium">Orders</th>
              <th className="px-6 py-4 font-medium">Avg Basket</th>
              <th className="px-6 py-4 font-medium">Conversion</th>
              <th className="px-6 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const growthClassName =
                entry.revenueGrowth > 0
                  ? "text-emerald-600"
                  : entry.revenueGrowth < 0
                    ? "text-rose-600"
                    : "text-ink-500";
              const rowToneClassName = index % 2 === 0 ? "bg-white/30" : "bg-brand-100/25";

              return (
                <Fragment key={entry.storeId}>
                  <tr className={rowToneClassName}>
                    <td className="px-6 py-4 text-sm font-semibold text-ink-900">
                      {entry.revenueRank}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-ink-900">{entry.storeName}</p>
                        <p className="mt-1 text-sm text-ink-700">{entry.storeCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-900">
                      {formatRevenue(entry.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-900">
                      {formatOrders(entry.orders)}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-900">
                      {formatBasket(entry.avgBasketValue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-900">
                      {formatConversion(entry.conversionRate)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        className="font-medium text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                        href={`/stores/${entry.storeId}`}
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                  <tr className={rowToneClassName}>
                    <td className="px-6 pb-4 pt-0 text-xs text-ink-500" colSpan={7}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/60 pt-3">
                        <span className="uppercase tracking-[0.12em]">Revenue growth</span>
                        <span className={`font-medium ${growthClassName}`}>
                          {formatGrowth(entry.revenueGrowth)}
                        </span>
                        <span>vs. previous period</span>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
