import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const aggregateMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dailyStoreMetric: {
      aggregate: aggregateMock,
    },
  },
}));

describe("conversion KPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates conversion from weighted orders and visitors", async () => {
    aggregateMock
      .mockResolvedValueOnce({ _sum: { orders: 90, visitors: 1000 } })
      .mockResolvedValueOnce({ _sum: { orders: 80, visitors: 1000 } });

    const { getConversionKpi } = await import("@/lib/kpi/conversion");
    const result = await getConversionKpi(30);

    expect(result.value).toBeCloseTo(0.09);
    expect(result.previousValue).toBeCloseTo(0.08);
    expect(result.delta).toBeCloseTo(0.01);
    expect(result.deltaPercent).toBeCloseTo(0.125);
  });

  it("returns zero conversion when visitors are zero in either period", async () => {
    aggregateMock
      .mockResolvedValueOnce({ _sum: { orders: 4, visitors: 0 } })
      .mockResolvedValueOnce({ _sum: { orders: 2, visitors: 40 } });

    const { getConversionKpi } = await import("@/lib/kpi/conversion");

    await expect(getConversionKpi(7)).resolves.toEqual({
      value: 0,
      previousValue: 0.05,
      delta: -0.05,
      deltaPercent: -1,
    });
  });

  it("applies store scoping when a storeId is given", async () => {
    aggregateMock
      .mockResolvedValueOnce({ _sum: { orders: 10, visitors: 100 } })
      .mockResolvedValueOnce({ _sum: { orders: 8, visitors: 100 } });

    const { getConversionKpi } = await import("@/lib/kpi/conversion");
    await getConversionKpi(30, "store-berlin");

    expect(aggregateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          storeId: "store-berlin",
        }),
      }),
    );
  });
});
