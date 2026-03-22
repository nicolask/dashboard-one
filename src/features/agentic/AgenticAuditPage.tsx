import { Card } from "@/components/ui/card";
import { snapshot } from "@/features/agentic/snapshot-data";


const metricCards = [
  {
    value: `~${snapshot.locTotal.toLocaleString("en-US")}`,
    label: "Total LOC in repo (excl. node_modules, .next)",
  },
  {
    value: `~${snapshot.locNonTest.toLocaleString("en-US")}`,
    label: "Application code (non-test)",
  },
  {
    value: snapshot.locTests.toLocaleString("en-US"),
    label: "Test coverage lines",
  },
] as const;

const barRoleClassNames = {
  feature: "bg-brand-500 text-white",
  tests: "bg-emerald-500 text-white",
  scaffold: "bg-slate-400 text-slate-950",
  config: "bg-slate-300 text-slate-950",
} as const;

function formatHours(hours: number) {
  return `~${hours} h`;
}

function getPercent(value: number, total: number) {
  return `${Math.max((value / total) * 100, 6)}%`;
}

function Divider() {
  return <div className="h-px w-full bg-white/70" aria-hidden="true" />;
}

export function AgenticAuditPage() {
  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
              Agentic Development Audit
            </p>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Retail Dashboard — in ~{snapshot.actualHours}h
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-ink-700">
                Point-in-time snapshot generated on {snapshot.generatedAt}, covering{" "}
                {snapshot.commitCount} commits and {snapshot.completedTaskCount} completed tasks.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-brand-200 bg-brand-50 px-6 py-5 text-right">
            <p className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
              {formatHours(snapshot.actualHours)}
            </p>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-ink-700">
              actual build time
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {metricCards.map((metric) => (
            <div
              className="rounded-[1.5rem] border border-white/70 bg-white/55 p-5"
              key={metric.label}
            >
              <p className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-700">{metric.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
            Einordnung
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
            Bedingungen hinter dem Vergleich
          </h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {snapshot.conditions.map((condition) => (
            <div
              className="rounded-[1.5rem] border border-white/70 bg-white/45 p-5"
              key={condition.heading}
            >
              <h3 className="text-lg font-semibold text-ink-900">{condition.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-700">{condition.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
            Kontext-Budget
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
            Token-Verbrauch — grobe Einordnung
          </h2>
        </div>
        <p className="text-sm leading-7 text-ink-700">{snapshot.tokenEstimate.body}</p>
        <p className="text-xs text-ink-700">
          Schätzung vom {snapshot.tokenEstimate.asOf} · Stand:{" "}
          {snapshot.tokenEstimate.completedTasksAtEstimate} abgeschlossene Tasks
        </p>
      </Card>

      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
            LOC Breakdown
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
            Code volume by workstream
          </h2>
        </div>

        <div className="space-y-4">
          {snapshot.locBreakdown.map((entry) => (
            <div className="space-y-2" key={entry.label}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="font-medium text-ink-900">{entry.label}</p>
                <p className="text-ink-700">{entry.loc.toLocaleString("en-US")} LOC</p>
              </div>
              <div className="h-11 rounded-full bg-white/55 p-1">
                <div
                  className={`flex h-full items-center justify-end rounded-full px-4 text-sm font-semibold ${barRoleClassNames[entry.role]}`}
                  style={{ width: getPercent(entry.loc, snapshot.locTotal) }}
                >
                  {entry.loc.toLocaleString("en-US")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Divider />

      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
            Human Estimate
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
            Plausible senior build effort by slice
          </h2>
        </div>

        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          {snapshot.taskBreakdown.map((row) => (
            <div
              className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/70 bg-white/45 px-4 py-3"
              key={row.label}
            >
              <p className="text-sm font-medium text-ink-900">{row.label}</p>
              <p className="shrink-0 text-sm font-semibold text-ink-700">{row.seniorHours}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-brand-200 bg-brand-50 px-5 py-4 text-sm font-medium text-ink-900">
          Senior Dev total: ~{snapshot.seniorDevHoursLow}-{snapshot.seniorDevHoursHigh}h ·
          Mid-Level: ~{snapshot.midDevHoursLow}-{snapshot.midDevHoursHigh}h
        </div>
      </Card>

      <Divider />

      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
            Speedup
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            {snapshot.speedupLow}–{snapshot.speedupHigh}×
          </h2>
          <p className="text-sm leading-6 text-ink-700">
            speedup vs. senior developer — without architectural quality loss
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              label: `Human-Orchestrated Agentic — ~${snapshot.actualHours}h`,
              value: snapshot.actualHours,
              className: "bg-brand-500",
            },
            {
              label: `Senior Dev - ~${snapshot.seniorDevHoursHigh}h`,
              value: snapshot.seniorDevHoursHigh,
              className: "bg-slate-400",
            },
            {
              label: `Mid-Level Dev - ~${snapshot.midDevHoursHigh}h`,
              value: snapshot.midDevHoursHigh,
              className: "bg-slate-300",
            },
          ].map((entry) => (
            <div className="space-y-2" key={entry.label}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="font-medium text-ink-900">{entry.label}</p>
                <p className="text-ink-700">{entry.value}h</p>
              </div>
              <div className="h-3 rounded-full bg-white/55">
                <div
                  className={`h-full rounded-full ${entry.className}`}
                  style={{ width: getPercent(entry.value, snapshot.midDevHoursHigh) }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/70 pt-5 text-sm text-ink-700 md:flex-row md:items-center md:justify-between">
          <p>{snapshot.footerNote}</p>
          <p>{snapshot.stack}</p>
        </div>
      </Card>
    </div>
  );
}
