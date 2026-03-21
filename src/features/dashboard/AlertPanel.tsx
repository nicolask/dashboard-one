"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { AlertEntry } from "@/lib/kpi/alerts";
import { formatConversion } from "@/lib/kpi/format";

type AlertPanelProps = {
  alerts: AlertEntry[];
};

const SCENARIO_CONFIG: Record<string, { label: string; emoji: string }> = {
  store_slump: { label: "Store Slump", emoji: "📉" },
  promo_week: { label: "Promo Week", emoji: "🏷️" },
};

function getBadgeClassName(scenarioSlug: string) {
  if (scenarioSlug === "store_slump") {
    return "bg-rose-100 text-rose-800";
  }

  if (scenarioSlug === "promo_week") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-ink-100 text-ink-700";
}

function getScenarioDisplay(slug: string): { label: string; emoji: string } {
  return (
    SCENARIO_CONFIG[slug] ?? {
      label: slug.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      emoji: "⚠️",
    }
  );
}

function formatAlertDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = alerts.reduce<
    Record<string, { count: number; emoji: string; label: string }>
  >((accumulator, alert) => {
    const { emoji, label } = getScenarioDisplay(alert.scenarioSlug);

    if (!accumulator[alert.scenarioSlug]) {
      accumulator[alert.scenarioSlug] = { count: 0, emoji, label };
    }

    accumulator[alert.scenarioSlug].count++;

    return accumulator;
  }, {});

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
            Alert Panel
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
            Active anomalies in the last 30 days
          </h2>
        </div>

        {alerts.length > 0 ? (
          <button
            className="shrink-0 text-sm text-ink-700 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? "▲ Hide" : "▼ Show"}
          </button>
        ) : null}
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-[1.5rem] bg-white/50 px-4 py-5 text-sm text-ink-700">
          Keine aktiven Anomalien
        </p>
      ) : expanded ? (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const { emoji, label } = getScenarioDisplay(alert.scenarioSlug);

            return (
              <div
                className="flex flex-col gap-3 rounded-[1.5rem] border border-white/70 bg-white/45 px-4 py-4 md:flex-row md:items-center md:justify-between"
                key={alert.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink-900">
                      {alert.storeName} ({alert.storeCode})
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClassName(alert.scenarioSlug)}`}
                    >
                      <span aria-hidden="true">{emoji}</span>
                      <span>{label}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-700">{formatAlertDate(alert.date)}</p>
                </div>

                <div className="text-sm text-ink-700 md:text-right">
                  <p className="font-medium text-ink-900">
                    Conversion {formatConversion(alert.conversionRate)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).map(([scenarioSlug, entry]) => (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClassName(scenarioSlug)}`}
              key={scenarioSlug}
            >
              <span aria-hidden="true">{entry.emoji}</span>
              <span>
                {entry.count} {entry.label}
                {entry.count > 1 ? "s" : ""}
              </span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
