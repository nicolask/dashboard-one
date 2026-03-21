import { prisma } from "@/lib/db/prisma";
import { buildDateRanges } from "@/lib/kpi/types";

export type StoreDetail = {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
  format: string;
  sizeBand: string;
  openedAt: Date;
  isActive: boolean;
};

export type StoreBenchmarkSnapshot = {
  revenue: number;
  orders: number;
  avgBasketValue: number;
  conversionRate: number;
};

export type StoreBenchmark = {
  store: StoreBenchmarkSnapshot;
  average: StoreBenchmarkSnapshot;
};

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

function buildMetricWhere(range: { from: Date; to: Date }, storeId?: string) {
  return {
    date: {
      gte: range.from,
      lte: range.to,
    },
    ...(storeId ? { storeId } : {}),
  };
}

function buildBenchmarkSnapshot(
  metrics: Array<{ revenue: number; orders: number; conversionRate: number }>,
): StoreBenchmarkSnapshot {
  if (metrics.length === 0) {
    return {
      revenue: 0,
      orders: 0,
      avgBasketValue: 0,
      conversionRate: 0,
    };
  }

  let revenue = 0;
  let orders = 0;
  let conversionRateTotal = 0;

  for (const metric of metrics) {
    revenue += metric.revenue;
    orders += metric.orders;
    conversionRateTotal += metric.conversionRate;
  }

  return {
    revenue,
    orders,
    avgBasketValue: orders !== 0 ? revenue / orders : 0,
    conversionRate: conversionRateTotal / metrics.length,
  };
}

function averageSnapshots(snapshots: StoreBenchmarkSnapshot[]): StoreBenchmarkSnapshot {
  if (snapshots.length === 0) {
    return {
      revenue: 0,
      orders: 0,
      avgBasketValue: 0,
      conversionRate: 0,
    };
  }

  let revenue = 0;
  let orders = 0;
  let avgBasketValue = 0;
  let conversionRate = 0;

  for (const snapshot of snapshots) {
    revenue += snapshot.revenue;
    orders += snapshot.orders;
    avgBasketValue += snapshot.avgBasketValue;
    conversionRate += snapshot.conversionRate;
  }

  return {
    revenue: revenue / snapshots.length,
    orders: orders / snapshots.length,
    avgBasketValue: avgBasketValue / snapshots.length,
    conversionRate: conversionRate / snapshots.length,
  };
}

export async function getStoreById(storeId: string): Promise<StoreDetail | null> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return null;
  }

  return {
    id: store.id,
    code: store.code,
    name: store.name,
    city: store.city,
    region: store.region,
    format: store.format,
    sizeBand: store.sizeBand,
    openedAt: store.openedAt,
    isActive: store.isActive,
  };
}

export async function getStoreBenchmark(storeId: string, days: number): Promise<StoreBenchmark> {
  const { current } = buildDateRanges(days);

  const [storeMetrics, allMetrics] = await Promise.all([
    prisma.dailyStoreMetric.findMany({
      where: buildMetricWhere(current, storeId),
      select: {
        revenue: true,
        orders: true,
        conversionRate: true,
      },
    }),
    prisma.dailyStoreMetric.findMany({
      where: buildMetricWhere(current),
      select: {
        storeId: true,
        revenue: true,
        orders: true,
        conversionRate: true,
      },
    }),
  ]);

  const groupedMetrics = new Map<
    string,
    Array<{ revenue: number; orders: number; conversionRate: number }>
  >();

  for (const metric of allMetrics) {
    const storeEntries = groupedMetrics.get(metric.storeId) ?? [];
    storeEntries.push({
      revenue: metric.revenue,
      orders: metric.orders,
      conversionRate: metric.conversionRate,
    });
    groupedMetrics.set(metric.storeId, storeEntries);
  }

  return {
    store: buildBenchmarkSnapshot(storeMetrics),
    average: averageSnapshots(
      Array.from(groupedMetrics.values(), (metrics) => buildBenchmarkSnapshot(metrics)),
    ),
  };
}

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
