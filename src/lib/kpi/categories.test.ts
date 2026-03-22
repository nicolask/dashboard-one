import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    orderItem: {
      findMany: findManyMock,
    },
  },
}));

describe("getCategoryPerformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aggregates revenue share and unique order counts by category", async () => {
    findManyMock.mockResolvedValue([
      {
        lineRevenue: 120,
        order: { id: "o-1" },
        product: {
          category: { id: "cat-1", name: "Electronics" },
        },
      },
      {
        lineRevenue: 80,
        order: { id: "o-1" },
        product: {
          category: { id: "cat-1", name: "Electronics" },
        },
      },
      {
        lineRevenue: 100,
        order: { id: "o-2" },
        product: {
          category: { id: "cat-2", name: "Home" },
        },
      },
    ]);

    const { getCategoryPerformance } = await import("@/lib/kpi/categories");
    const result = await getCategoryPerformance(30);

    expect(result).toEqual([
      {
        categoryId: "cat-1",
        categoryName: "Electronics",
        revenue: 200,
        revenueShare: 200 / 300,
        orderCount: 1,
      },
      {
        categoryId: "cat-2",
        categoryName: "Home",
        revenue: 100,
        revenueShare: 100 / 300,
        orderCount: 1,
      },
    ]);
  });

  it("is zero-safe when no revenue exists", async () => {
    findManyMock.mockResolvedValue([]);

    const { getCategoryPerformance } = await import("@/lib/kpi/categories");

    await expect(getCategoryPerformance(7)).resolves.toEqual([]);
  });
});
