import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dailyStoreCostFindManyMock = vi.fn();
const dailyStoreMetricFindManyMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dailyStoreCost: {
      findMany: dailyStoreCostFindManyMock,
    },
    dailyStoreMetric: {
      findMany: dailyStoreMetricFindManyMock,
    },
  },
}));

describe("cost KPI helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("joins cost rows with metric rows and computes profit, ratios, and staff productivity", async () => {
    dailyStoreCostFindManyMock.mockResolvedValueOnce([
      {
        date: new Date("2026-03-20T00:00:00.000Z"),
        storeId: "store-1",
        totalCost: 300,
        staffCost: 200,
        rentCost: 80,
        otherCost: 20,
        staffHours: 10,
      },
      {
        date: new Date("2026-03-19T00:00:00.000Z"),
        storeId: "store-1",
        totalCost: 200,
        staffCost: 120,
        rentCost: 60,
        otherCost: 20,
        staffHours: 5,
      },
      {
        date: new Date("2026-03-18T00:00:00.000Z"),
        storeId: "store-1",
        totalCost: 999,
        staffCost: 999,
        rentCost: 0,
        otherCost: 0,
        staffHours: 99,
      },
    ]);
    dailyStoreMetricFindManyMock.mockResolvedValueOnce([
      {
        date: new Date("2026-03-20T00:00:00.000Z"),
        storeId: "store-1",
        revenue: 1000,
        marginAmount: 500,
      },
      {
        date: new Date("2026-03-19T00:00:00.000Z"),
        storeId: "store-1",
        revenue: 600,
        marginAmount: 300,
      },
    ]);

    const { getDailyStoreCostSummary } = await import("@/lib/kpi/costs");
    const result = await getDailyStoreCostSummary(30);

    expect(result).toEqual({
      totalCost: 500,
      staffCost: 320,
      rentCost: 140,
      otherCost: 40,
      staffHours: 15,
      profit: 300,
      costRatio: 0.3125,
      revenuePerStaffHour: 1600 / 15,
    });
  });

  it("scopes both queries by store when storeId is provided", async () => {
    dailyStoreCostFindManyMock.mockResolvedValueOnce([]);
    dailyStoreMetricFindManyMock.mockResolvedValueOnce([]);

    const { getDailyStoreCostSummary } = await import("@/lib/kpi/costs");
    await getDailyStoreCostSummary(7, "store-123");

    expect(dailyStoreCostFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: "store-123",
        }),
      }),
    );
    expect(dailyStoreMetricFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: "store-123",
        }),
      }),
    );
  });

  it("returns a zeroed summary when no cost rows exist in the window", async () => {
    dailyStoreCostFindManyMock.mockResolvedValueOnce([]);
    dailyStoreMetricFindManyMock.mockResolvedValueOnce([
      {
        date: new Date("2026-03-20T00:00:00.000Z"),
        storeId: "store-1",
        revenue: 1000,
        marginAmount: 500,
      },
    ]);

    const { getDailyStoreCostSummary } = await import("@/lib/kpi/costs");

    await expect(getDailyStoreCostSummary(30, "missing-store")).resolves.toEqual({
      totalCost: 0,
      staffCost: 0,
      rentCost: 0,
      otherCost: 0,
      staffHours: 0,
      profit: 0,
      costRatio: 0,
      revenuePerStaffHour: 0,
    });
  });

  it("keeps division-based fields zero-safe when revenue or staff hours are zero", async () => {
    dailyStoreCostFindManyMock.mockResolvedValueOnce([
      {
        date: new Date("2026-03-20T00:00:00.000Z"),
        storeId: "store-1",
        totalCost: 100,
        staffCost: 100,
        rentCost: 0,
        otherCost: 0,
        staffHours: 0,
      },
    ]);
    dailyStoreMetricFindManyMock.mockResolvedValueOnce([
      {
        date: new Date("2026-03-20T00:00:00.000Z"),
        storeId: "store-1",
        revenue: 0,
        marginAmount: 20,
      },
    ]);

    const { getDailyStoreCostSummary } = await import("@/lib/kpi/costs");

    await expect(getDailyStoreCostSummary(30)).resolves.toEqual({
      totalCost: 100,
      staffCost: 100,
      rentCost: 0,
      otherCost: 0,
      staffHours: 0,
      profit: -80,
      costRatio: 0,
      revenuePerStaffHour: 0,
    });
  });

  it("builds KPI deltas for current versus previous periods", async () => {
    dailyStoreCostFindManyMock
      .mockResolvedValueOnce([
        {
          date: new Date("2026-03-20T00:00:00.000Z"),
          storeId: "store-1",
          totalCost: 600,
          staffCost: 400,
          rentCost: 150,
          otherCost: 50,
          staffHours: 20,
        },
      ])
      .mockResolvedValueOnce([
        {
          date: new Date("2026-02-20T00:00:00.000Z"),
          storeId: "store-1",
          totalCost: 400,
          staffCost: 250,
          rentCost: 120,
          otherCost: 30,
          staffHours: 10,
        },
      ]);
    dailyStoreMetricFindManyMock
      .mockResolvedValueOnce([
        {
          date: new Date("2026-03-20T00:00:00.000Z"),
          storeId: "store-1",
          revenue: 2000,
          marginAmount: 1000,
        },
      ])
      .mockResolvedValueOnce([
        {
          date: new Date("2026-02-20T00:00:00.000Z"),
          storeId: "store-1",
          revenue: 1000,
          marginAmount: 500,
        },
      ]);

    const { getCostKpis } = await import("@/lib/kpi/costs");

    await expect(getCostKpis(30, "store-1")).resolves.toEqual({
      profit: {
        value: 400,
        previousValue: 100,
        delta: 300,
        deltaPercent: 3,
      },
      totalCost: {
        value: 600,
        previousValue: 400,
        delta: 200,
        deltaPercent: 0.5,
      },
      costRatio: {
        value: 0.3,
        previousValue: 0.4,
        delta: -0.10000000000000003,
        deltaPercent: -0.25000000000000006,
      },
      revenuePerStaffHour: {
        value: 100,
        previousValue: 100,
        delta: 0,
        deltaPercent: 0,
      },
    });
  });
});
