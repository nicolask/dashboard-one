import { prisma } from "@/lib/db/prisma";
import { buildDateRanges, calcKpi, type DateRange, type KpiValue } from "@/lib/kpi/types";

export type CostSummary = {
  totalCost: number;
  staffCost: number;
  rentCost: number;
  otherCost: number;
  staffHours: number;
  profit: number;
  costRatio: number;
  revenuePerStaffHour: number;
};

export type CostKpis = {
  profit: KpiValue;
  totalCost: KpiValue;
  costRatio: KpiValue;
  revenuePerStaffHour: KpiValue;
};

const EMPTY_COST_SUMMARY: CostSummary = {
  totalCost: 0,
  staffCost: 0,
  rentCost: 0,
  otherCost: 0,
  staffHours: 0,
  profit: 0,
  costRatio: 0,
  revenuePerStaffHour: 0,
};

function buildCostWhere(range: { from: Date; to: Date }, storeId?: string) {
  return {
    date: {
      gte: range.from,
      lte: range.to,
    },
    ...(storeId ? { storeId } : {}),
  };
}

async function fetchCostSummaryForRange(range: DateRange, storeId?: string): Promise<CostSummary> {
  const [costs, metrics] = await Promise.all([
    prisma.dailyStoreCost.findMany({
      where: buildCostWhere(range, storeId),
    }),
    prisma.dailyStoreMetric.findMany({
      where: buildCostWhere(range, storeId),
      select: {
        date: true,
        storeId: true,
        revenue: true,
        marginAmount: true,
      },
    }),
  ]);

  if (costs.length === 0) {
    return EMPTY_COST_SUMMARY;
  }

  const metricLookup = new Map(
    metrics.map((metric) => [
      `${metric.storeId}::${metric.date.toISOString()}`,
      metric,
    ]),
  );

  let totalCost = 0;
  let staffCost = 0;
  let rentCost = 0;
  let otherCost = 0;
  let staffHours = 0;
  let totalRevenue = 0;
  let totalMarginAmount = 0;

  for (const cost of costs) {
    const metric = metricLookup.get(`${cost.storeId}::${cost.date.toISOString()}`);

    if (!metric) {
      continue;
    }

    totalCost += cost.totalCost;
    staffCost += cost.staffCost;
    rentCost += cost.rentCost;
    otherCost += cost.otherCost;
    staffHours += cost.staffHours;
    totalRevenue += metric.revenue;
    totalMarginAmount += metric.marginAmount;
  }

  return {
    totalCost,
    staffCost,
    rentCost,
    otherCost,
    staffHours,
    profit: totalMarginAmount - totalCost,
    costRatio: totalRevenue !== 0 ? totalCost / totalRevenue : 0,
    revenuePerStaffHour: staffHours !== 0 ? totalRevenue / staffHours : 0,
  };
}

export async function getDailyStoreCostSummary(
  days: number,
  storeId?: string,
): Promise<CostSummary> {
  const { current } = buildDateRanges(days);
  return fetchCostSummaryForRange(current, storeId);
}

export async function getCostKpis(days: number, storeId?: string): Promise<CostKpis> {
  const { current, previous } = buildDateRanges(days);

  const [currentSummary, previousSummary] = await Promise.all([
    fetchCostSummaryForRange(current, storeId),
    fetchCostSummaryForRange(previous, storeId),
  ]);

  return {
    profit: calcKpi(currentSummary.profit, previousSummary.profit),
    totalCost: calcKpi(currentSummary.totalCost, previousSummary.totalCost),
    costRatio: calcKpi(currentSummary.costRatio, previousSummary.costRatio),
    revenuePerStaffHour: calcKpi(
      currentSummary.revenuePerStaffHour,
      previousSummary.revenuePerStaffHour,
    ),
  };
}
