import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    orderItem: {
      findMany: findManyMock,
    },
  },
}));

describe("getTopProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aggregates units and revenue, sorts by revenue, and respects the limit", async () => {
    findManyMock.mockResolvedValue([
      {
        productId: "p-1",
        quantity: 2,
        lineRevenue: 80,
        product: {
          sku: "SKU-1",
          name: "Product One",
          category: { name: "Electronics" },
        },
      },
      {
        productId: "p-1",
        quantity: 1,
        lineRevenue: 40,
        product: {
          sku: "SKU-1",
          name: "Product One",
          category: { name: "Electronics" },
        },
      },
      {
        productId: "p-2",
        quantity: 4,
        lineRevenue: 90,
        product: {
          sku: "SKU-2",
          name: "Product Two",
          category: { name: "Home" },
        },
      },
    ]);

    const { getTopProducts } = await import("@/lib/kpi/products");
    const result = await getTopProducts(30, undefined, 1);

    expect(result).toEqual([
      {
        productId: "p-1",
        sku: "SKU-1",
        productName: "Product One",
        categoryName: "Electronics",
        revenue: 120,
        unitsSold: 3,
      },
    ]);
  });

  it("adds the store filter when a storeId is provided", async () => {
    findManyMock.mockResolvedValue([]);

    const { getTopProducts } = await import("@/lib/kpi/products");
    await getTopProducts(7, "store-123");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          order: expect.objectContaining({
            storeId: "store-123",
          }),
        }),
      }),
    );
  });
});
