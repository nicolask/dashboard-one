import { prisma } from "@/lib/db/prisma";
import { buildDateRanges, calcKpi, type KpiValue } from "@/lib/kpi/types";

function buildMetricWhere(range: { from: Date; to: Date }, storeId?: string) {
  return {
    date: {
      gte: range.from,
      lte: range.to,
    },
    ...(storeId ? { storeId } : {}),
  };
}

export async function getConversionKpi(days: number, storeId?: string): Promise<KpiValue> {
  const { current, previous } = buildDateRanges(days);

  const [currentAggregate, previousAggregate] = await Promise.all([
    prisma.dailyStoreMetric.aggregate({
      where: buildMetricWhere(current, storeId),
      _sum: {
        orders: true,
        visitors: true,
      },
    }),
    prisma.dailyStoreMetric.aggregate({
      where: buildMetricWhere(previous, storeId),
      _sum: {
        orders: true,
        visitors: true,
      },
    }),
  ]);

  const currentOrders = currentAggregate._sum.orders ?? 0;
  const currentVisitors = currentAggregate._sum.visitors ?? 0;
  const previousOrders = previousAggregate._sum.orders ?? 0;
  const previousVisitors = previousAggregate._sum.visitors ?? 0;

  const currentConversion = currentVisitors !== 0 ? currentOrders / currentVisitors : 0;
  const previousConversion = previousVisitors !== 0 ? previousOrders / previousVisitors : 0;

  return calcKpi(currentConversion, previousConversion);
}
