import { prisma } from "@/lib/db/prisma";
import { buildDateRanges } from "@/lib/kpi/types";
import type { TimeSeriesMetric, TimeSeriesPoint } from "@/lib/kpi/timeseries-types";

export async function getMetricsTimeSeries(
  days: number,
  metric: TimeSeriesMetric,
  storeId?: string,
): Promise<TimeSeriesPoint[]> {
  const { current } = buildDateRanges(days);

  const where = {
    date: { gte: current.from, lte: current.to },
    ...(storeId ? { storeId } : {}),
  };

  const rows = await prisma.dailyStoreMetric.groupBy({
    by: ["date"],
    where,
    _sum: { revenue: true, orders: true, visitors: true },
    orderBy: { date: "asc" },
  });

  return rows.map((row) => {
    let value: number;
    switch (metric) {
      case "revenue":
        value = row._sum.revenue ?? 0;
        break;
      case "orders":
        value = row._sum.orders ?? 0;
        break;
      case "conversion":
        value =
          (row._sum.visitors ?? 0) !== 0
            ? ((row._sum.orders ?? 0) / (row._sum.visitors ?? 0)) * 100
            : 0;
        break;
      case "traffic":
        value = row._sum.visitors ?? 0;
        break;
    }
    return { date: row.date.toISOString().slice(0, 10), value };
  });
}
