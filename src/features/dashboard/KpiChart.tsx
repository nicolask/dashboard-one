"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatOrders, formatRevenue } from "@/lib/kpi/format";
import type { TimeSeriesMetric, TimeSeriesPoint } from "@/lib/kpi/timeseries-types";

type MetricOption = {
  key: TimeSeriesMetric;
  label: string;
  format: (v: number) => string;
  color: string;
};

const METRIC_OPTIONS: MetricOption[] = [
  { key: "revenue", label: "Revenue", format: formatRevenue, color: "#0891b2" },
  { key: "orders", label: "Orders", format: formatOrders, color: "#8b5cf6" },
  { key: "conversion", label: "Conversion", format: (v) => `${v.toFixed(1)} %`, color: "#10b981" },
  { key: "traffic", label: "Traffic", format: formatOrders, color: "#f59e0b" },
];

function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

type KpiChartProps = {
  initialData: TimeSeriesPoint[];
  days: number;
  storeId?: string;
};

async function fetchMetricSeries(days: number, metric: TimeSeriesMetric, storeId?: string) {
  const searchParams = new URLSearchParams({
    days: String(days),
    metric,
  });

  if (storeId) {
    searchParams.set("storeId", storeId);
  }

  const response = await fetch(`/api/kpi/timeseries?${searchParams.toString()}`);
  return (await response.json()) as TimeSeriesPoint[];
}

export function KpiChart({ initialData, days, storeId }: KpiChartProps) {
  const [metric, setMetric] = useState<TimeSeriesMetric>("revenue");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const latestRequestKeyRef = useRef<string | null>(null);

  const loadMetricSeries = useCallback(
    async (nextMetric: TimeSeriesMetric, nextDays: number, nextStoreId?: string) => {
      const requestKey = `${nextMetric}:${nextDays}:${nextStoreId ?? "all"}:${Date.now()}`;
      latestRequestKeyRef.current = requestKey;
      setLoading(true);

      try {
        const nextData = await fetchMetricSeries(nextDays, nextMetric, nextStoreId);

        if (latestRequestKeyRef.current !== requestKey) {
          return;
        }

        setData(nextData);
      } finally {
        if (latestRequestKeyRef.current === requestKey) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const handleMetricChange = useCallback(
    async (next: TimeSeriesMetric) => {
      if (next === metric) return;
      setMetric(next);
      if (next === "revenue") {
        latestRequestKeyRef.current = null;
        setLoading(false);
        setData(initialData);
        return;
      }
    },
    [initialData, metric],
  );

  useEffect(() => {
    if (metric === "revenue") {
      latestRequestKeyRef.current = null;
      setLoading(false);
      setData(initialData);
      return;
    }

    void loadMetricSeries(metric, days, storeId);
  }, [days, initialData, loadMetricSeries, metric, storeId]);

  const activeOption = METRIC_OPTIONS.find((o) => o.key === metric)!;
  // Show roughly 5–7 labels regardless of range
  const tickInterval = days === 7 ? 0 : days === 30 ? 4 : 12;

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-ink-700">
          Trend — last {days} days
        </p>
        <div className="inline-flex rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_14px_30px_rgb(15_23_42_/_0.08)] backdrop-blur">
          {METRIC_OPTIONS.map((opt) => {
            const isActive = opt.key === metric;
            return (
              <button
                aria-pressed={isActive}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                  isActive
                    ? "bg-brand-500 text-white shadow-[0_12px_24px_rgb(8_145_178_/_0.22)]"
                    : "text-ink-700 hover:-translate-y-0.5 hover:bg-brand-100 hover:text-ink-900",
                ].join(" ")}
                disabled={loading}
                key={opt.key}
                onClick={() => handleMetricChange(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className={loading ? "opacity-40 transition-opacity" : "transition-opacity"}>
        <ResponsiveContainer height={240} width="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 2" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              interval={tickInterval}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={formatDateLabel}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(255,255,255,0.7)",
                borderRadius: "1rem",
                boxShadow: "0 8px 24px rgb(15 23 42 / 0.10)",
                fontSize: 13,
              }}
              formatter={(value) =>
                typeof value === "number"
                  ? [activeOption.format(value), activeOption.label]
                  : [String(value), activeOption.label]
              }
              labelFormatter={(label) =>
                typeof label === "string" ? formatDateLabel(label) : String(label)
              }
              labelStyle={{ color: "#334155", fontWeight: 600, marginBottom: 2 }}
            />
            <Line
              dataKey="value"
              dot={false}
              stroke={activeOption.color}
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
