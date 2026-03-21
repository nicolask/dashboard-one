import { prisma } from "@/lib/db/prisma";
import { buildDateRanges } from "@/lib/kpi/types";

export type TopProductEntry = {
  productId: string;
  sku: string;
  productName: string;
  categoryName: string;
  revenue: number;
  unitsSold: number;
};

export async function getTopProducts(
  days: number,
  storeId?: string,
  limit = 10,
): Promise<TopProductEntry[]> {
  const { current } = buildDateRanges(days);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        ...(storeId ? { storeId } : {}),
        orderedAt: {
          gte: current.from,
          lte: current.to,
        },
      },
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  const productMap = new Map<
    string,
    {
      sku: string;
      productName: string;
      categoryName: string;
      revenue: number;
      unitsSold: number;
    }
  >();

  for (const item of orderItems) {
    const existing = productMap.get(item.productId) ?? {
      sku: item.product.sku,
      productName: item.product.name,
      categoryName: item.product.category.name,
      revenue: 0,
      unitsSold: 0,
    };

    existing.revenue += item.lineRevenue;
    existing.unitsSold += item.quantity;
    productMap.set(item.productId, existing);
  }

  return Array.from(productMap.entries())
    .map(([productId, product]) => ({
      productId,
      sku: product.sku,
      productName: product.productName,
      categoryName: product.categoryName,
      revenue: product.revenue,
      unitsSold: product.unitsSold,
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, limit);
}
