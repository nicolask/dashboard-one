import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const aggregateMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dailyStoreMetric: {
      aggregate: aggregateMock,
    },
  },
}));

describe("revenue KPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates revenue and orders deltas from current and previous aggregates", async () => {
    aggregateMock
      .mockResolvedValueOnce({ _sum: { revenue: 1200, orders: 24 } })
      .mockResolvedValueOnce({ _sum: { revenue: 1000, orders: 20 } })
      .mockResolvedValueOnce({ _sum: { revenue: 1200, orders: 24 } })
      .mockResolvedValueOnce({ _sum: { revenue: 1000, orders: 20 } });

    const { getRevenueKpi, getOrdersKpi } = await import("@/lib/kpi/revenue");

    await expect(getRevenueKpi(30)).resolves.toEqual({
      value: 1200,
      previousValue: 1000,
      delta: 200,
      deltaPercent: 0.2,
    });
    await expect(getOrdersKpi(30)).resolves.toEqual({
      value: 24,
      previousValue: 20,
      delta: 4,
      deltaPercent: 0.2,
    });
  });

  it("scopes the aggregate queries by store when storeId is provided", async () => {
    aggregateMock
      .mockResolvedValueOnce({ _sum: { revenue: 600, orders: 10 } })
      .mockResolvedValueOnce({ _sum: { revenue: 300, orders: 5 } });

    const { getRevenueKpi } = await import("@/lib/kpi/revenue");
    await getRevenueKpi(7, "store-123");

    expect(aggregateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: "store-123",
        }),
      }),
    );
    expect(aggregateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: "store-123",
        }),
      }),
    );
  });

  it("keeps average basket zero-safe when there are no orders", async () => {
    aggregateMock
      .mockResolvedValueOnce({ _sum: { revenue: 500, orders: 0 } })
      .mockResolvedValueOnce({ _sum: { revenue: 300, orders: 10 } });

    const { getAvgBasketKpi } = await import("@/lib/kpi/revenue");

    await expect(getAvgBasketKpi(30)).resolves.toEqual({
      value: 0,
      previousValue: 30,
      delta: -30,
      deltaPercent: -1,
    });
  });
});
