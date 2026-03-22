import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dailyStoreMetric: {
      findMany: findManyMock,
    },
  },
}));

describe("getActiveInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups rows by scenario and store, builds store baselines, and sorts active insights ahead of historical ones", async () => {
    findManyMock
      .mockResolvedValueOnce([
        {
          date: new Date("2026-03-20T00:00:00.000Z"),
          storeId: "store-leipzig",
          scenarioSlug: "store_slump",
          revenue: 80,
          conversionRate: 0.12,
          visitors: 102,
          store: { id: "store-leipzig", code: "LEI-01", name: "Leipzig Gohlis" },
        },
        {
          date: new Date("2026-03-19T00:00:00.000Z"),
          storeId: "store-leipzig",
          scenarioSlug: "store_slump",
          revenue: 100,
          conversionRate: 0.11,
          visitors: 98,
          store: { id: "store-leipzig", code: "LEI-01", name: "Leipzig Gohlis" },
        },
        {
          date: new Date("2026-03-18T00:00:00.000Z"),
          storeId: "store-berlin",
          scenarioSlug: "promo_week",
          revenue: 260,
          conversionRate: 0.22,
          visitors: 210,
          store: { id: "store-berlin", code: "BER-02", name: "Berlin Mitte" },
        },
        {
          date: new Date("2026-03-17T00:00:00.000Z"),
          storeId: "store-berlin",
          scenarioSlug: "ops_issue",
          revenue: 150,
          conversionRate: 0.18,
          visitors: 170,
          store: { id: "store-berlin", code: "BER-02", name: "Berlin Mitte" },
        },
        {
          date: new Date("2026-03-16T00:00:00.000Z"),
          storeId: "store-hamburg",
          scenarioSlug: "traffic_surge",
          revenue: 210,
          conversionRate: 0.12,
          visitors: 290,
          store: { id: "store-hamburg", code: "HAM-01", name: "Hamburg Altona" },
        },
        {
          date: new Date("2026-03-15T00:00:00.000Z"),
          storeId: "store-hamburg",
          scenarioSlug: "traffic_surge",
          revenue: 205,
          conversionRate: 0.11,
          visitors: 300,
          store: { id: "store-hamburg", code: "HAM-01", name: "Hamburg Altona" },
        },
        {
          date: new Date("2026-03-14T00:00:00.000Z"),
          storeId: "store-munich",
          scenarioSlug: "competitor_opening",
          revenue: 130,
          conversionRate: 0.08,
          visitors: 145,
          store: { id: "store-munich", code: "MUC-01", name: "München Maxvorstadt" },
        },
        {
          date: new Date("2026-03-13T00:00:00.000Z"),
          storeId: "store-munich",
          scenarioSlug: "competitor_opening",
          revenue: 120,
          conversionRate: 0.09,
          visitors: 140,
          store: { id: "store-munich", code: "MUC-01", name: "München Maxvorstadt" },
        },
      ])
      .mockResolvedValueOnce([
        {
          storeId: "store-leipzig",
          date: new Date("2026-02-17T00:00:00.000Z"),
          revenue: 200,
          conversionRate: 0.2,
          visitors: 100,
        },
        {
          storeId: "store-leipzig",
          date: new Date("2026-03-10T00:00:00.000Z"),
          revenue: 250,
          conversionRate: 0.22,
          visitors: 108,
        },
        {
          storeId: "store-berlin",
          date: new Date("2026-02-16T00:00:00.000Z"),
          revenue: 100,
          conversionRate: 0.1,
          visitors: 120,
        },
        {
          storeId: "store-berlin",
          date: new Date("2026-03-16T00:00:00.000Z"),
          revenue: 100,
          conversionRate: 0.1,
          visitors: 120,
        },
        {
          storeId: "store-hamburg",
          date: new Date("2026-03-12T00:00:00.000Z"),
          revenue: 220,
          conversionRate: 0.2,
          visitors: 200,
        },
        {
          storeId: "store-munich",
          date: new Date("2026-03-12T00:00:00.000Z"),
          revenue: 200,
          conversionRate: 0.1,
          visitors: 150,
        },
      ]);

    const { getActiveInsights } = await import("@/lib/kpi/insights");
    const insights = await getActiveInsights(30);

    expect(findManyMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          scenarioSlug: { not: null },
        }),
      }),
    );
    expect(findManyMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: {
            in: ["store-leipzig", "store-berlin", "store-hamburg", "store-munich"],
          },
        }),
      }),
    );

    expect(insights).toHaveLength(5);

    const promoInsight = insights.find((insight) => insight.id === "promo_week:store-berlin");
    const trafficSurgeInsight = insights.find((insight) => insight.id === "traffic_surge:store-hamburg");
    const storeSlumpInsight = insights.find((insight) => insight.id === "store_slump:store-leipzig");
    const competitorInsight = insights.find(
      (insight) => insight.id === "competitor_opening:store-munich",
    );
    const fallbackInsight = insights.find((insight) => insight.id === "ops_issue:store-berlin");

    expect(insights.map((insight) => insight.id)).toEqual([
      "promo_week:store-berlin",
      "store_slump:store-leipzig",
      "ops_issue:store-berlin",
      "traffic_surge:store-hamburg",
      "competitor_opening:store-munich",
    ]);
    expect(promoInsight).toMatchObject({
      id: "promo_week:store-berlin",
      storeId: "store-berlin",
      durationDays: 1,
      isActive: true,
      dateRangeLabel: "Mar 18",
      deviationPercent: 1.6,
      storeUrl: "/stores/store-berlin",
    });
    expect(promoInsight?.headline).toContain("160.0% above-average revenue");

    expect(trafficSurgeInsight).toMatchObject({
      id: "traffic_surge:store-hamburg",
      durationDays: 2,
      isActive: true,
      dateRangeLabel: "Mar 15–16",
      affectedMetric: "conversion",
    });
    expect(trafficSurgeInsight?.deviationPercent).toBeCloseTo(-0.425, 10);
    expect(trafficSurgeInsight?.headline).toContain("is seeing a 42.5% conversion drop");
    expect(trafficSurgeInsight?.headline).toContain("47.5% visitor increase");
    expect(trafficSurgeInsight?.detail).toContain(
      "Conversion averaged 11.5% over 2 days vs. 20.0% prior",
    );

    expect(storeSlumpInsight).toMatchObject({
      id: "store_slump:store-leipzig",
      durationDays: 2,
      isActive: true,
      dateRangeLabel: "Mar 19–20",
      deviationPercent: -0.6,
      affectedMetric: "revenue",
    });
    expect(storeSlumpInsight?.headline).toContain("60.0% below");
    expect(storeSlumpInsight?.headline).toContain("with stable visitor numbers");
    expect(storeSlumpInsight?.detail).toContain("over the last 2 days");

    expect(competitorInsight).toMatchObject({
      id: "competitor_opening:store-munich",
      durationDays: 2,
      isActive: false,
      dateRangeLabel: "Mar 13–14",
      affectedMetric: "revenue",
    });
    expect(competitorInsight?.deviationPercent).toBeCloseTo(-0.375, 10);
    expect(competitorInsight?.headline).toContain("After a competitor opened nearby (Mar 13–14)");
    expect(competitorInsight?.headline).toContain("37.5% below baseline");
    expect(competitorInsight?.detail).toContain("€125.00");
    expect(competitorInsight?.detail).toContain("€200.00");
    expect(competitorInsight?.detail).toContain("Mar 13–14");

    expect(fallbackInsight).toMatchObject({
      isActive: true,
      dateRangeLabel: "Mar 17",
    });
    expect(fallbackInsight?.headline).toContain("has an active alert");
    expect(fallbackInsight?.headline).toContain("Ops Issue (1 day)");
    expect(fallbackInsight?.detail).toContain("prior-period baseline");
  });

  it("is zero-safe when there is no baseline revenue", async () => {
    findManyMock
      .mockResolvedValueOnce([
        {
          date: new Date("2026-03-20T00:00:00.000Z"),
          storeId: "store-leipzig",
          scenarioSlug: "store_slump",
          revenue: 80,
          conversionRate: 0.12,
          visitors: 80,
          store: { id: "store-leipzig", code: "LEI-01", name: "Leipzig Gohlis" },
        },
      ])
      .mockResolvedValueOnce([]);

    const { getActiveInsights } = await import("@/lib/kpi/insights");
    const insights = await getActiveInsights(30, "store-leipzig");

    expect(insights).toHaveLength(1);
    expect(insights[0].deviationPercent).toBe(0);
    expect(insights[0].headline).toContain("0.0% in line with");
    expect(insights[0]).toMatchObject({
      isActive: true,
      dateRangeLabel: "Mar 20",
    });
  });
});
