import { Card } from "@/components/ui/card";
import { formatOrders, formatRevenue } from "@/lib/kpi";
import type { TopProductEntry } from "@/lib/kpi";

type TopProductsTableProps = {
  entries: TopProductEntry[];
};

export function TopProductsTable({ entries }: TopProductsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/70 px-6 py-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
          Top Products
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          Best sellers by revenue
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-white/60 text-xs uppercase tracking-[0.16em] text-ink-700">
            <tr>
              <th className="px-6 py-4 font-medium">#</th>
              <th className="px-6 py-4 font-medium">SKU</th>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Revenue</th>
              <th className="px-6 py-4 font-medium">Units</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr className="odd:bg-white/30 even:bg-brand-100/25" key={entry.productId}>
                <td className="px-6 py-4 text-sm font-semibold text-ink-900">{index + 1}</td>
                <td className="px-6 py-4 text-sm text-ink-900">{entry.sku}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-ink-900">{entry.productName}</p>
                </td>
                <td className="px-6 py-4 text-sm text-ink-700">{entry.categoryName}</td>
                <td className="px-6 py-4 text-sm text-ink-900">
                  {formatRevenue(entry.revenue)}
                </td>
                <td className="px-6 py-4 text-sm text-ink-900">
                  {formatOrders(entry.unitsSold)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
