import { type NextRequest, NextResponse } from "next/server";
import { requireApiCurrentUser } from "@/lib/auth/api-auth";
import { getMetricsTimeSeries } from "@/lib/kpi/timeseries";
import type { TimeSeriesMetric } from "@/lib/kpi/timeseries-types";

const VALID_METRICS: TimeSeriesMetric[] = ["revenue", "orders", "conversion", "traffic"];
const VALID_DAYS = [7, 30, 90];

export async function GET(request: NextRequest) {
  const currentUser = await requireApiCurrentUser();

  if (currentUser instanceof Response) {
    return currentUser;
  }

  const { searchParams } = request.nextUrl;

  const daysParam = Number(searchParams.get("days") ?? "30");
  const days = VALID_DAYS.includes(daysParam) ? daysParam : 30;

  const metricParam = searchParams.get("metric") ?? "revenue";
  const metric = VALID_METRICS.includes(metricParam as TimeSeriesMetric)
    ? (metricParam as TimeSeriesMetric)
    : "revenue";

  const storeId = searchParams.get("storeId") ?? undefined;

  const data = await getMetricsTimeSeries(days, metric, storeId);
  return NextResponse.json(data);
}
