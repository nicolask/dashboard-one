import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const findManyMock = vi.fn();
const groupByMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    store: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
    },
    dailyStoreMetric: {
      findMany: findManyMock,
      groupBy: groupByMock,
    },
  },
}));

describe("store KPI helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns mapped store details or null", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "store-1",
      code: "BER-01",
      name: "Berlin Mitte",
      city: "Berlin",
      region: "Ost",
      format: "flagship",
      sizeBand: "large",
      openedAt: new Date("2024-01-01T00:00:00.000Z"),
      isActive: true,
    });
    findUniqueMock.mockResolvedValueOnce(null);

    const { getStoreById } = await import("@/lib/kpi/stores");

    await expect(getStoreById("store-1")).resolves.toMatchObject({
      id: "store-1",
      code: "BER-01",
      name: "Berlin Mitte",
    });
    await expect(getStoreById("missing")).resolves.toBeNull();
  });

  it("builds store benchmark snapshots across network, format, and top quartile groups", async () => {
    findManyMock
      .mockResolvedValueOnce([
        { revenue: 100, orders: 10, conversionRate: 0.1 },
        { revenue: 200, orders: 20, conversionRate: 0.2 },
      ])
      .mockResolvedValueOnce([
        {
          storeId: "store-1",
          revenue: 100,
          orders: 10,
          conversionRate: 0.1,
          store: { format: "flagship" },
        },
        {
          storeId: "store-1",
          revenue: 200,
          orders: 20,
          conversionRate: 0.2,
          store: { format: "flagship" },
        },
        {
          storeId: "store-2",
          revenue: 90,
          orders: 9,
          conversionRate: 0.08,
          store: { format: "mall" },
        },
        {
          storeId: "store-3",
          revenue: 400,
          orders: 40,
          conversionRate: 0.25,
          store: { format: "flagship" },
        },
      ]);

    const { getStoreBenchmark } = await import("@/lib/kpi/stores");
    const result = await getStoreBenchmark("store-1", 30, "flagship");

    expect(result.store.revenue).toBe(300);
    expect(result.store.orders).toBe(30);
    expect(result.store.avgBasketValue).toBe(10);
    expect(result.store.conversionRate).toBeCloseTo(0.15);
    expect(result.networkAverage.revenue).toBeCloseTo(263.3333333333);
    expect(result.networkAverage.orders).toBeCloseTo(26.3333333333);
    expect(result.networkAverage.avgBasketValue).toBe(10);
    expect(result.networkAverage.conversionRate).toBeCloseTo(0.16);
    expect(result.formatAverage.revenue).toBe(350);
    expect(result.formatAverage.orders).toBe(35);
    expect(result.formatAverage.avgBasketValue).toBe(10);
    expect(result.formatAverage.conversionRate).toBeCloseTo(0.2);
    expect(result.topQuartile.revenue).toBe(400);
    expect(result.topQuartile.orders).toBe(40);
    expect(result.topQuartile.avgBasketValue).toBe(10);
    expect(result.topQuartile.conversionRate).toBeCloseTo(0.25);
    expect(result.storeFormat).toBe("flagship");
    expect(result.networkStoreCount).toBe(3);
    expect(result.formatStoreCount).toBe(2);
    expect(result.topQuartileStoreCount).toBe(1);
  });

  it("returns empty snapshots and zero counts for missing comparison groups", async () => {
    findManyMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const { getStoreBenchmark } = await import("@/lib/kpi/stores");
    const result = await getStoreBenchmark("store-1", 30, "urban");

    expect(result.store).toEqual({
      revenue: 0,
      orders: 0,
      avgBasketValue: 0,
      conversionRate: 0,
    });
    expect(result.networkAverage).toEqual({
      revenue: 0,
      orders: 0,
      avgBasketValue: 0,
      conversionRate: 0,
    });
    expect(result.formatAverage).toEqual({
      revenue: 0,
      orders: 0,
      avgBasketValue: 0,
      conversionRate: 0,
    });
    expect(result.topQuartile).toEqual({
      revenue: 0,
      orders: 0,
      avgBasketValue: 0,
      conversionRate: 0,
    });
    expect(result.storeFormat).toBe("urban");
    expect(result.networkStoreCount).toBe(0);
    expect(result.formatStoreCount).toBe(0);
    expect(result.topQuartileStoreCount).toBe(0);
  });

  it("ranks stores by revenue and falls back to unknown labels when metadata is missing", async () => {
    groupByMock
      .mockResolvedValueOnce([
        {
          storeId: "store-1",
          _sum: { revenue: 300, orders: 30, visitors: 200 },
        },
        {
          storeId: "store-2",
          _sum: { revenue: 100, orders: 5, visitors: 50 },
        },
      ])
      .mockResolvedValueOnce([
        {
          storeId: "store-1",
          _sum: { revenue: 200 },
        },
      ]);
    findManyMock.mockResolvedValue([
      {
        id: "store-1",
        code: "BER-01",
        name: "Berlin Mitte",
      },
    ]);

    const { getStoreRanking } = await import("@/lib/kpi/stores");
    const result = await getStoreRanking(30);

    expect(result).toEqual([
      {
        storeId: "store-1",
        storeCode: "BER-01",
        storeName: "Berlin Mitte",
        revenue: 300,
        orders: 30,
        avgBasketValue: 10,
        conversionRate: 0.15,
        revenueRank: 1,
        revenueGrowth: 0.5,
      },
      {
        storeId: "store-2",
        storeCode: "UNKNOWN",
        storeName: "Unknown Store",
        revenue: 100,
        orders: 5,
        avgBasketValue: 20,
        conversionRate: 0.1,
        revenueRank: 2,
        revenueGrowth: 0,
      },
    ]);
  });
});
