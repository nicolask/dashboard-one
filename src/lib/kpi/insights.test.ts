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

  it("groups rows by scenario and store, builds store baselines, and sorts by priority", async () => {
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
          storeId: { in: ["store-leipzig", "store-berlin"] },
        }),
      }),
    );

    expect(insights).toHaveLength(3);
    expect(insights[0]).toMatchObject({
      id: "promo_week:store-berlin",
      storeId: "store-berlin",
      durationDays: 1,
      deviationPercent: 1.6,
      storeUrl: "/stores/store-berlin",
    });
    expect(insights[0].headline).toContain("160.0% above-average revenue");

    expect(insights[1]).toMatchObject({
      id: "store_slump:store-leipzig",
      durationDays: 2,
      deviationPercent: -0.6,
      affectedMetric: "revenue",
    });
    expect(insights[1].headline).toContain("60.0% below");
    expect(insights[1].headline).toContain("with stable visitor numbers");
    expect(insights[1].detail).toContain("over the last 2 days");

    expect(insights[2].headline).toContain("Ops Issue (1 day)");
    expect(insights[2].detail).toContain("prior-period baseline");
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
  });
});
