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

async function getRevenueAndOrders(days: number, storeId?: string) {
  const { current, previous } = buildDateRanges(days);

  const [currentAggregate, previousAggregate] = await Promise.all([
    prisma.dailyStoreMetric.aggregate({
      where: buildMetricWhere(current, storeId),
      _sum: {
        revenue: true,
        orders: true,
      },
    }),
    prisma.dailyStoreMetric.aggregate({
      where: buildMetricWhere(previous, storeId),
      _sum: {
        revenue: true,
        orders: true,
      },
    }),
  ]);

  return {
    currentRevenue: currentAggregate._sum.revenue ?? 0,
    previousRevenue: previousAggregate._sum.revenue ?? 0,
    currentOrders: currentAggregate._sum.orders ?? 0,
    previousOrders: previousAggregate._sum.orders ?? 0,
  };
}

export async function getRevenueKpi(days: number, storeId?: string): Promise<KpiValue> {
  const { currentRevenue, previousRevenue } = await getRevenueAndOrders(days, storeId);
  return calcKpi(currentRevenue, previousRevenue);
}

export async function getOrdersKpi(days: number, storeId?: string): Promise<KpiValue> {
  const { currentOrders, previousOrders } = await getRevenueAndOrders(days, storeId);
  return calcKpi(currentOrders, previousOrders);
}

export async function getAvgBasketKpi(days: number, storeId?: string): Promise<KpiValue> {
  const { currentRevenue, previousRevenue, currentOrders, previousOrders } =
    await getRevenueAndOrders(days, storeId);

  const currentAvgBasket = currentOrders !== 0 ? currentRevenue / currentOrders : 0;
  const previousAvgBasket = previousOrders !== 0 ? previousRevenue / previousOrders : 0;

  return calcKpi(currentAvgBasket, previousAvgBasket);
}
