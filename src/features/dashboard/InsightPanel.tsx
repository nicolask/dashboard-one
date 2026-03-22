import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Insight } from "@/lib/kpi";

type InsightPanelProps = {
  insights: Insight[];
};

const SCENARIO_CONFIG: Record<string, { label: string; className: string }> = {
  store_slump: { label: "Store Slump", className: "bg-rose-100 text-rose-800" },
  promo_week: { label: "Promo Week", className: "bg-amber-100 text-amber-800" },
  traffic_surge: { label: "Traffic Surge", className: "bg-sky-100 text-sky-800" },
  competitor_opening: {
    label: "Competitor Opening",
    className: "bg-violet-100 text-violet-800",
  },
};

function getScenarioDisplay(scenarioSlug: string) {
  return (
    SCENARIO_CONFIG[scenarioSlug] ?? {
      label: scenarioSlug.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      className: "bg-ink-100 text-ink-700",
    }
  );
}

function formatDuration(durationDays: number) {
  return `${durationDays} ${durationDays === 1 ? "day" : "days"}`;
}

function formatDeviation(deviationPercent: number) {
  const sign = deviationPercent > 0 ? "+" : deviationPercent < 0 ? "-" : "";
  return `${sign}${Math.abs(deviationPercent * 100).toFixed(1)} %`;
}

function getDeviationClassName(deviationPercent: number) {
  if (deviationPercent > 0) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (deviationPercent < 0) {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-ink-100 text-ink-700";
}

function InsightCard({ insight }: { insight: Insight }) {
  const scenario = getScenarioDisplay(insight.scenarioSlug);

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-white/70 bg-white/45 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${scenario.className}`}>
          {scenario.label}
        </span>
        <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-ink-900">
          {insight.dateRangeLabel} · {formatDuration(insight.durationDays)}
        </span>
      </div>

      <div>
        <p className="font-medium text-ink-900">{insight.headline}</p>
        <p className="mt-2 text-sm leading-6 text-ink-700">{insight.detail}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getDeviationClassName(insight.deviationPercent)}`}
        >
          {formatDeviation(insight.deviationPercent)}
        </span>
        <Link
          className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          href={insight.storeUrl}
        >
          View store →
        </Link>
      </div>
    </div>
  );
}

export function InsightPanel({ insights }: InsightPanelProps) {
  const active = insights.filter((insight) => insight.isActive);
  const historical = insights.filter((insight) => !insight.isActive);
  const showTierHeaders = active.length > 0 && historical.length > 0;

  return (
    <Card className="space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">Insights</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          Explainable performance signals
        </h2>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-[1.5rem] bg-white/50 px-4 py-5 text-sm text-ink-700">
          No active anomalies detected.
        </div>
      ) : (
        <div className="space-y-3">
          {showTierHeaders ? (
            <p className="px-1 text-xs font-semibold uppercase tracking-widest text-ink-500">
              Active alerts
            </p>
          ) : null}
          {active.map((insight) => (
            <InsightCard insight={insight} key={insight.id} />
          ))}

          {historical.length > 0 ? (
            <>
              {showTierHeaders ? (
                <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-widest text-ink-500">
                  Historical context
                </p>
              ) : null}
              {historical.map((insight) => (
                <InsightCard insight={insight} key={insight.id} />
              ))}
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}
