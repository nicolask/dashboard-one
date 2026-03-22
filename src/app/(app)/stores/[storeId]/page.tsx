import { notFound } from "next/navigation";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { DayRangeSelector } from "@/features/dashboard/DayRangeSelector";
import { InsightPanel } from "@/features/dashboard/InsightPanel";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { KpiChart } from "@/features/dashboard/KpiChart";
import { TopProductsTable } from "@/features/dashboard/TopProductsTable";
import { StoreBenchmarkRow } from "@/features/stores/StoreBenchmarkRow";
import { StoreDetailHeader } from "@/features/stores/StoreDetailHeader";
import { getMetricsTimeSeries } from "@/lib/kpi/timeseries";
import {
  formatBasket,
  formatConversion,
  formatOrders,
  formatRevenue,
  getActiveInsights,
  getAvgBasketKpi,
  getConversionKpi,
  getOrdersKpi,
  getRevenueKpi,
  getStoreBenchmark,
  getStoreById,
  getTopProducts,
} from "@/lib/kpi";

type StoreDetailPageProps = {
  params: Promise<{
    storeId: string;
  }>;
  searchParams?: Promise<{
    days?: string;
  }>;
};

function parseDays(value?: string) {
  const days = Number(value);
  return days === 7 || days === 30 || days === 90 ? days : 30;
}

export default async function StoreDetailPage({ params, searchParams }: StoreDetailPageProps) {
  const [{ storeId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const days = parseDays(resolvedSearchParams?.days);

  const store = await getStoreById(storeId);

  if (!store) {
    notFound();
  }

  const [revenue, orders, basket, conversion, timeseries, products, insights, benchmark] =
    await Promise.all([
      getRevenueKpi(days, storeId),
      getOrdersKpi(days, storeId),
      getAvgBasketKpi(days, storeId),
      getConversionKpi(days, storeId),
      getMetricsTimeSeries(days, "revenue", storeId),
      getTopProducts(days, storeId),
      getActiveInsights(30, storeId),
      getStoreBenchmark(storeId, days, store.format),
    ]);

  return (
    <DashboardFrame
      activePath="/dashboard"
      eyebrow="Store Detail"
      title={store.name}
      description="Drill into store-scoped KPIs, benchmark performance, top products, and explainable insights for a single location."
    >
      <section className="space-y-5">
        <StoreDetailHeader store={store} />

        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-[0_18px_44px_rgb(15_23_42_/_0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
              Time Range
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Compare this store against its own previous period and three peer benchmarks: network average, format average, and top-quartile.
            </p>
          </div>
          <DayRangeSelector currentDays={days} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            delta={revenue.deltaPercent}
            deltaLabel={`vs. previous ${days}d`}
            label="Revenue"
            value={formatRevenue(revenue.value)}
          />
          <KpiCard
            delta={orders.deltaPercent}
            deltaLabel={`vs. previous ${days}d`}
            label="Orders"
            value={formatOrders(orders.value)}
          />
          <KpiCard
            delta={basket.deltaPercent}
            deltaLabel={`vs. previous ${days}d`}
            label="Avg Basket"
            value={formatBasket(basket.value)}
          />
          <KpiCard
            delta={conversion.delta}
            deltaLabel={`vs. previous ${days}d`}
            deltaMode="pp"
            label="Conversion"
            value={formatConversion(conversion.value)}
          />
        </div>

        <KpiChart days={days} initialData={timeseries} storeId={storeId} />

        <StoreBenchmarkRow benchmark={benchmark} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <TopProductsTable entries={products} />
          <InsightPanel insights={insights} />
        </div>
      </section>
    </DashboardFrame>
  );
}
