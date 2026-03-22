import { prisma } from "@/lib/db/prisma";
import { formatRevenue } from "@/lib/kpi/format";
import { buildDateRanges } from "@/lib/kpi/types";

type AffectedMetric = "revenue" | "conversion";

type InsightSourceRow = {
  date: Date;
  storeId: string;
  storeCode: string;
  storeName: string;
  scenarioSlug: string;
  revenue: number;
  conversionRate: number;
  visitors: number;
};

type InsightGroup = {
  scenarioSlug: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  durationDays: number;
  earliestDate: Date;
  scenarioAvgRevenue: number;
  scenarioAvgConversion: number;
  scenarioAvgVisitors: number;
};

type BaselineSnapshot = {
  avgRevenue: number;
  avgConversion: number;
  avgVisitors: number;
};

type InsightRuleInput = {
  group: InsightGroup;
  baseline: BaselineSnapshot;
};

type InsightRuleResult = {
  headline: string;
  detail: string;
  affectedMetric: AffectedMetric;
  deviationPercent: number;
};

export type Insight = {
  id: string;
  scenarioSlug: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  headline: string;
  detail: string;
  priority: number;
  durationDays: number;
  deviationPercent: number;
  affectedMetric: AffectedMetric;
  storeUrl: string;
};

function getBaselineDeviation(current: number, baseline: number) {
  return baseline !== 0 ? (current - baseline) / baseline : 0;
}

function formatDeviationPercent(deviationPercent: number) {
  return `${Math.abs(deviationPercent * 100).toFixed(1)}%`;
}

function getDeviationText(deviationPercent: number, negativeWord: string, positiveWord: string) {
  if (deviationPercent < 0) {
    return `${formatDeviationPercent(deviationPercent)} ${negativeWord}`;
  }

  if (deviationPercent > 0) {
    return `${formatDeviationPercent(deviationPercent)} ${positiveWord}`;
  }

  return "0.0% in line with";
}

function titleizeScenarioSlug(scenarioSlug: string) {
  return scenarioSlug.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildInsightGroups(rows: InsightSourceRow[]): InsightGroup[] {
  const groupedRows = new Map<string, InsightSourceRow[]>();

  for (const row of rows) {
    const key = `${row.scenarioSlug}:${row.storeId}`;
    const existingRows = groupedRows.get(key) ?? [];
    existingRows.push(row);
    groupedRows.set(key, existingRows);
  }

  return Array.from(groupedRows.values(), (groupRows) => {
    const [firstRow] = groupRows;

    return {
      scenarioSlug: firstRow.scenarioSlug,
      storeId: firstRow.storeId,
      storeCode: firstRow.storeCode,
      storeName: firstRow.storeName,
      durationDays: groupRows.length,
      earliestDate: groupRows.reduce(
        (earliest, row) => (row.date < earliest ? row.date : earliest),
        groupRows[0].date,
      ),
      scenarioAvgRevenue: average(groupRows.map((row) => row.revenue)),
      scenarioAvgConversion: average(groupRows.map((row) => row.conversionRate)),
      scenarioAvgVisitors: average(groupRows.map((row) => row.visitors)),
    };
  });
}

function buildStoreBaselineWindows(groups: InsightGroup[]) {
  const storeEarliestDate = new Map<string, Date>();

  for (const group of groups) {
    const existingDate = storeEarliestDate.get(group.storeId);

    if (!existingDate || group.earliestDate < existingDate) {
      storeEarliestDate.set(group.storeId, group.earliestDate);
    }
  }

  const windows = new Map<
    string,
    {
      from: Date;
      to: Date;
    }
  >();

  for (const [storeId, earliestDate] of storeEarliestDate) {
    const baselineTo = new Date(earliestDate);
    baselineTo.setDate(baselineTo.getDate() - 1);
    baselineTo.setHours(23, 59, 59, 999);

    const baselineFrom = new Date(baselineTo);
    baselineFrom.setDate(baselineTo.getDate() - 29);
    baselineFrom.setHours(0, 0, 0, 0);

    windows.set(storeId, {
      from: baselineFrom,
      to: baselineTo,
    });
  }

  return windows;
}

function buildBaselineSnapshots(
  rows: Array<{
    storeId: string;
    date: Date;
    revenue: number;
    conversionRate: number;
    visitors: number;
  }>,
  windows: Map<string, { from: Date; to: Date }>,
) {
  const groupedRows = new Map<
    string,
    Array<{
      revenue: number;
      conversionRate: number;
      visitors: number;
    }>
  >();

  for (const row of rows) {
    const window = windows.get(row.storeId);

    if (!window || row.date < window.from || row.date > window.to) {
      continue;
    }

    const existingRows = groupedRows.get(row.storeId) ?? [];
    existingRows.push({
      revenue: row.revenue,
      conversionRate: row.conversionRate,
      visitors: row.visitors,
    });
    groupedRows.set(row.storeId, existingRows);
  }

  return new Map(
    Array.from(windows.keys(), (storeId) => {
      const baselineRows = groupedRows.get(storeId) ?? [];

      return [
        storeId,
        {
          avgRevenue: average(baselineRows.map((row) => row.revenue)),
          avgConversion: average(baselineRows.map((row) => row.conversionRate)),
          avgVisitors: average(baselineRows.map((row) => row.visitors)),
        } satisfies BaselineSnapshot,
      ];
    }),
  );
}

const insightRules: Record<string, (input: InsightRuleInput) => InsightRuleResult> = {
  store_slump: ({ group, baseline }) => {
    const deviationPercent = getBaselineDeviation(group.scenarioAvgRevenue, baseline.avgRevenue);
    const visitorsStable =
      baseline.avgVisitors > 0 &&
      Math.abs((group.scenarioAvgVisitors - baseline.avgVisitors) / baseline.avgVisitors) <= 0.1;
    const visitorClause = visitorsStable ? " with stable visitor numbers" : "";

    return {
      affectedMetric: "revenue",
      deviationPercent,
      headline: `${group.storeName} is ${getDeviationText(deviationPercent, "below", "above")} its prior-period average revenue${visitorClause}.`,
      detail: `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over the last ${group.durationDays} days vs. ${formatRevenue(baseline.avgRevenue)} in the preceding period.`,
    };
  },
  promo_week: ({ group, baseline }) => {
    const deviationPercent = getBaselineDeviation(group.scenarioAvgRevenue, baseline.avgRevenue);
    const performanceText =
      deviationPercent < 0
        ? `${formatDeviationPercent(deviationPercent)} below-average`
        : deviationPercent > 0
          ? `${formatDeviationPercent(deviationPercent)} above-average`
          : "in-line";
    const directionWord = deviationPercent >= 0 ? "up" : "down";

    return {
      affectedMetric: "revenue",
      deviationPercent,
      headline: `${group.storeName} is showing ${performanceText} revenue since Promo Week began.`,
      detail: `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over ${group.durationDays} days — ${directionWord} from ${formatRevenue(baseline.avgRevenue)} in the prior period.`,
    };
  },
  traffic_surge: ({ group, baseline }) => {
    const deviationPercent = getBaselineDeviation(
      group.scenarioAvgConversion,
      baseline.avgConversion,
    );
    const visitorChangePercent = getBaselineDeviation(
      group.scenarioAvgVisitors,
      baseline.avgVisitors,
    );

    return {
      affectedMetric: "conversion",
      deviationPercent,
      headline: `${group.storeName} saw a ${formatDeviationPercent(deviationPercent)} conversion drop despite a ${Math.abs(visitorChangePercent * 100).toFixed(1)}% visitor increase during the traffic surge.`,
      detail: `Conversion averaged ${(group.scenarioAvgConversion * 100).toFixed(1)}% over ${group.durationDays} days vs. ${(baseline.avgConversion * 100).toFixed(1)}% prior - more footfall, fewer buyers.`,
    };
  },
  competitor_opening: ({ group, baseline }) => {
    const deviationPercent = getBaselineDeviation(group.scenarioAvgRevenue, baseline.avgRevenue);

    return {
      affectedMetric: "revenue",
      deviationPercent,
      headline: `${group.storeName} revenue is ${formatDeviationPercent(deviationPercent)} below baseline since a competitor opened nearby.`,
      detail: `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} over ${group.durationDays} days vs. ${formatRevenue(baseline.avgRevenue)} in the preceding period.`,
    };
  },
};

function buildFallbackInsight({ group, baseline }: InsightRuleInput): InsightRuleResult {
  const deviationPercent = getBaselineDeviation(group.scenarioAvgRevenue, baseline.avgRevenue);
  const dayLabel = group.durationDays === 1 ? "day" : "days";

  return {
    affectedMetric: "revenue",
    deviationPercent,
    headline: `${group.storeName} has an active alert: ${titleizeScenarioSlug(group.scenarioSlug)} (${group.durationDays} ${dayLabel}).`,
    detail: `Revenue averaged ${formatRevenue(group.scenarioAvgRevenue)} vs. a prior-period baseline of ${formatRevenue(baseline.avgRevenue)}.`,
  };
}

function buildInsight(group: InsightGroup, baseline: BaselineSnapshot): Insight {
  const rule = insightRules[group.scenarioSlug];
  const result = rule ? rule({ group, baseline }) : buildFallbackInsight({ group, baseline });

  return {
    id: `${group.scenarioSlug}:${group.storeId}`,
    scenarioSlug: group.scenarioSlug,
    storeId: group.storeId,
    storeCode: group.storeCode,
    storeName: group.storeName,
    headline: result.headline,
    detail: result.detail,
    priority: Math.abs(result.deviationPercent),
    durationDays: group.durationDays,
    deviationPercent: result.deviationPercent,
    affectedMetric: result.affectedMetric,
    storeUrl: `/stores/${group.storeId}`,
  };
}

export async function getActiveInsights(days: number, storeId?: string): Promise<Insight[]> {
  const { current } = buildDateRanges(days);

  const alertRows = await prisma.dailyStoreMetric.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      date: {
        gte: current.from,
        lte: current.to,
      },
      scenarioSlug: {
        not: null,
      },
    },
    include: {
      store: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const sourceRows: InsightSourceRow[] = alertRows.map((row) => ({
    date: row.date,
    storeId: row.storeId,
    storeCode: row.store.code,
    storeName: row.store.name,
    scenarioSlug: row.scenarioSlug ?? "",
    revenue: row.revenue,
    conversionRate: row.conversionRate,
    visitors: row.visitors,
  }));

  const groups = buildInsightGroups(sourceRows);

  if (groups.length === 0) {
    return [];
  }

  const baselineWindows = buildStoreBaselineWindows(groups);
  const baselineRanges = Array.from(baselineWindows.values());
  const baselineFrom = baselineRanges.reduce(
    (earliest, range) => (range.from < earliest ? range.from : earliest),
    baselineRanges[0].from,
  );
  const baselineTo = baselineRanges.reduce(
    (latest, range) => (range.to > latest ? range.to : latest),
    baselineRanges[0].to,
  );

  const baselineRows = await prisma.dailyStoreMetric.findMany({
    where: {
      storeId: {
        in: Array.from(baselineWindows.keys()),
      },
      date: {
        gte: baselineFrom,
        lte: baselineTo,
      },
    },
    select: {
      storeId: true,
      date: true,
      revenue: true,
      conversionRate: true,
      visitors: true,
    },
  });

  const baselines = buildBaselineSnapshots(baselineRows, baselineWindows);

  return groups
    .map((group) => buildInsight(group, baselines.get(group.storeId) ?? {
      avgRevenue: 0,
      avgConversion: 0,
      avgVisitors: 0,
    }))
    .sort((left, right) => right.priority - left.priority);
}
