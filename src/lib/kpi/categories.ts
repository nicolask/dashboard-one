import { prisma } from "@/lib/db/prisma";
import { buildDateRanges } from "@/lib/kpi/types";

export type CategoryShareEntry = {
  categoryId: string;
  categoryName: string;
  revenue: number;
  revenueShare: number;
  orderCount: number;
};

export async function getCategoryPerformance(days: number): Promise<CategoryShareEntry[]> {
  const { current } = buildDateRanges(days);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        orderedAt: {
          gte: current.from,
          lte: current.to,
        },
      },
    },
    include: {
      order: {
        select: {
          id: true,
        },
      },
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  const categoryMap = new Map<
    string,
    { categoryName: string; revenue: number; orderIds: Set<string> }
  >();

  for (const item of orderItems) {
    const categoryId = item.product.category.id;
    const existing = categoryMap.get(categoryId) ?? {
      categoryName: item.product.category.name,
      revenue: 0,
      orderIds: new Set<string>(),
    };

    existing.revenue += item.lineRevenue;
    existing.orderIds.add(item.order.id);
    categoryMap.set(categoryId, existing);
  }

  const totalRevenue = Array.from(categoryMap.values()).reduce(
    (sum, category) => sum + category.revenue,
    0,
  );

  return Array.from(categoryMap.entries())
    .map(([categoryId, category]) => ({
      categoryId,
      categoryName: category.categoryName,
      revenue: category.revenue,
      revenueShare: totalRevenue !== 0 ? category.revenue / totalRevenue : 0,
      orderCount: category.orderIds.size,
    }))
    .sort((left, right) => right.revenue - left.revenue);
}
