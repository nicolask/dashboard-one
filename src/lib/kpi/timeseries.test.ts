import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDateRanges } from "@/lib/kpi/types";

const groupByMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dailyStoreMetric: {
      groupBy: groupByMock,
    },
  },
}));

describe("getMetricsTimeSeries", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("calculates conversion as weighted orders over visitors per day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));

    groupByMock.mockResolvedValue([
      {
        date: new Date("2026-03-20T00:00:00.000Z"),
        _sum: { revenue: 1200, orders: 12, visitors: 100 },
      },
      {
        date: new Date("2026-03-21T00:00:00.000Z"),
        _sum: { revenue: 900, orders: 10, visitors: 200 },
      },
    ]);

    const { getMetricsTimeSeries } = await import("@/lib/kpi/timeseries");
    const result = await getMetricsTimeSeries(30, "conversion");
    const { current } = buildDateRanges(30);

    expect(groupByMock).toHaveBeenCalledWith({
      by: ["date"],
      where: {
        date: {
          gte: current.from,
          lte: current.to,
        },
      },
      _sum: { revenue: true, orders: true, visitors: true },
      orderBy: { date: "asc" },
    });

    expect(result).toEqual([
      { date: "2026-03-20", value: 12 },
      { date: "2026-03-21", value: 5 },
    ]);
  });

  it("returns zero conversion when visitors are zero", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));

    groupByMock.mockResolvedValue([
      {
        date: new Date("2026-03-21T00:00:00.000Z"),
        _sum: { revenue: 0, orders: 4, visitors: 0 },
      },
    ]);

    const { getMetricsTimeSeries } = await import("@/lib/kpi/timeseries");
    const result = await getMetricsTimeSeries(7, "conversion");

    expect(result).toEqual([{ date: "2026-03-21", value: 0 }]);
  });

  it("keeps the other metric series unchanged", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));

    groupByMock.mockResolvedValue([
      {
        date: new Date("2026-03-21T00:00:00.000Z"),
        _sum: { revenue: 1234, orders: 56, visitors: 789 },
      },
    ]);

    const { getMetricsTimeSeries } = await import("@/lib/kpi/timeseries");

    await expect(getMetricsTimeSeries(7, "revenue")).resolves.toEqual([
      { date: "2026-03-21", value: 1234 },
    ]);
    await expect(getMetricsTimeSeries(7, "orders")).resolves.toEqual([
      { date: "2026-03-21", value: 56 },
    ]);
    await expect(getMetricsTimeSeries(7, "traffic")).resolves.toEqual([
      { date: "2026-03-21", value: 789 },
    ]);
  });

  it("does not use a simple average when store weights differ", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));

    groupByMock.mockResolvedValue([
      {
        date: new Date("2026-03-21T00:00:00.000Z"),
        _sum: { revenue: 0, orders: 101, visitors: 1001 },
      },
    ]);

    const { getMetricsTimeSeries } = await import("@/lib/kpi/timeseries");
    const result = await getMetricsTimeSeries(7, "conversion");

    expect(result).toEqual([{ date: "2026-03-21", value: 10.08991008991009 }]);
    expect(result[0]?.value).not.toBe(50.5);
  });
});
