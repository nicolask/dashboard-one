import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { Card } from "@/components/ui/card";
import { DayRangeSelector } from "@/features/dashboard/DayRangeSelector";
import { InsightPanel } from "@/features/dashboard/InsightPanel";
import { CategoryPerformanceList } from "@/features/dashboard/CategoryPerformanceList";
import { KpiCard } from "@/features/dashboard/KpiCard";
import { KpiChart } from "@/features/dashboard/KpiChart";
import { StoreRankingTable } from "@/features/dashboard/StoreRankingTable";
import { TopProductsTable } from "@/features/dashboard/TopProductsTable";
import { getMetricsTimeSeries } from "@/lib/kpi/timeseries";
import {
  getAvgBasketKpi,
  getActiveInsights,
  getCategoryPerformance,
  getConversionKpi,
  getOrdersKpi,
  getTopProducts,
  getRevenueKpi,
  getStoreRanking,
  formatBasket,
  formatConversion,
  formatOrders,
  formatRevenue,
} from "@/lib/kpi";

const cards = [
  {
    title: "Auth status",
    value: "Local credentials",
    detail: "Planned seam for OIDC and provider-backed identity later.",
  },
  {
    title: "Data sources",
    value: "0 connected",
    detail: "External systems can be added behind sync jobs and cache tables.",
  },
  {
    title: "Storage path",
    value: "SQLite first",
    detail: "Model for easy Prisma migration to PostgreSQL when needed.",
  },
];

type DashboardPageProps = {
  searchParams?: Promise<{
    days?: string;
  }>;
};

function parseDays(value?: string) {
  const days = Number(value);
  return days === 7 || days === 30 || days === 90 ? days : 30;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const days = parseDays(params?.days);

  const [
    revenue,
    orders,
    basket,
    conversion,
    insights,
    storeRanking,
    categoryPerformance,
    topProducts,
    revenueTimeSeries,
  ] =
    await Promise.all([
      getRevenueKpi(days),
      getOrdersKpi(days),
      getAvgBasketKpi(days),
      getConversionKpi(days),
      getActiveInsights(30),
      getStoreRanking(days),
      getCategoryPerformance(days),
      getTopProducts(days),
      getMetricsTimeSeries(days, "revenue"),
    ]);

  return (
    <DashboardFrame
      activePath="/dashboard"
      eyebrow="Dashboard"
      title="Retail performance overview"
      description="A first retail BI snapshot built on seeded store metrics, with server-side KPI queries and a URL-driven day range for comparing recent performance."
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-[0_18px_44px_rgb(15_23_42_/_0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
              Time Range
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Compare the current window with the immediately preceding period.
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

        <KpiChart days={days} initialData={revenueTimeSeries} />

        <InsightPanel insights={insights} />

        <StoreRankingTable entries={storeRanking} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <CategoryPerformanceList entries={categoryPerformance} />
          <TopProductsTable entries={topProducts} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card className="space-y-3" key={card.title}>
            <p className="text-sm font-medium text-ink-700">{card.title}</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              {card.value}
            </h2>
            <p className="text-sm leading-6 text-ink-700">{card.detail}</p>
          </Card>
        ))}
      </section>
    </DashboardFrame>
  );
}
