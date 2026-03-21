import { prisma } from "@/lib/db/prisma";
import { buildDateRanges } from "@/lib/kpi/types";

export type StoreRankingEntry = {
  storeId: string;
  storeCode: string;
  storeName: string;
  revenue: number;
  orders: number;
  avgBasketValue: number;
  conversionRate: number;
  revenueRank: number;
};

export async function getStoreRanking(days: number): Promise<StoreRankingEntry[]> {
  const { current } = buildDateRanges(days);

  const groupedMetrics = await prisma.dailyStoreMetric.groupBy({
    by: ["storeId"],
    where: {
      date: {
        gte: current.from,
        lte: current.to,
      },
    },
    _sum: {
      revenue: true,
      orders: true,
      visitors: true,
    },
    orderBy: {
      _sum: {
        revenue: "desc",
      },
    },
  });

  const stores = await prisma.store.findMany({
    where: {
      id: {
        in: groupedMetrics.map((entry) => entry.storeId),
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  const storesById = new Map(stores.map((store) => [store.id, store]));

  return groupedMetrics.map((entry, index) => {
    const revenue = entry._sum.revenue ?? 0;
    const orders = entry._sum.orders ?? 0;
    const visitors = entry._sum.visitors ?? 0;
    const store = storesById.get(entry.storeId);

    return {
      storeId: entry.storeId,
      storeCode: store?.code ?? "UNKNOWN",
      storeName: store?.name ?? "Unknown Store",
      revenue,
      orders,
      avgBasketValue: orders !== 0 ? revenue / orders : 0,
      conversionRate: visitors !== 0 ? orders / visitors : 0,
      revenueRank: index + 1,
    };
  });
}
