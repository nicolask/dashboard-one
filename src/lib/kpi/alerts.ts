import { prisma } from "@/lib/db/prisma";
import { buildDateRanges } from "@/lib/kpi/types";

export type AlertEntry = {
  id: string;
  date: Date;
  storeCode: string;
  storeName: string;
  scenarioSlug: string;
  revenue: number;
  conversionRate: number;
};

export async function getActiveAlerts(days: number): Promise<AlertEntry[]> {
  const { current } = buildDateRanges(days);

  const alerts = await prisma.dailyStoreMetric.findMany({
    where: {
      date: {
        gte: current.from,
        lte: current.to,
      },
      scenarioSlug: {
        not: null,
      },
    },
    include: {
      store: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 20,
  });

  return alerts.map((alert) => ({
    id: alert.id,
    date: alert.date,
    storeCode: alert.store.code,
    storeName: alert.store.name,
    scenarioSlug: alert.scenarioSlug ?? "",
    revenue: alert.revenue,
    conversionRate: alert.conversionRate,
  }));
}
