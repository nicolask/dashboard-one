import { Card } from "@/components/ui/card";
import { formatConversion } from "@/lib/kpi";
import type { AlertEntry } from "@/lib/kpi";

type AlertPanelProps = {
  alerts: AlertEntry[];
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

function formatAlertDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <Card className="space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
          Alert Panel
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          Active anomalies in the last 30 days
        </h2>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-[1.5rem] bg-white/50 px-4 py-5 text-sm text-ink-700">
          Keine aktiven Anomalien
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
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
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClassName(alert.scenarioSlug)}`}
                  >
                    {alert.scenarioSlug}
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
          ))}
        </div>
      )}
    </Card>
  );
}
