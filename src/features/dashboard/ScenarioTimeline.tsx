import Link from "next/link";
import type { ScenarioTimelineData } from "@/lib/kpi";

type ScenarioTimelineProps = {
  data: ScenarioTimelineData;
};

const DAY_IN_MS = 86_400_000;
const TRACK_WIDTH = 1000;
const TRACK_HEIGHT = 40;
const TRACK_RADIUS = 20;

function fmtAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function getScenarioFill(slug: string) {
  if (slug === "promo_week") {
    return "rgb(251 191 36 / 0.9)";
  }

  if (slug === "store_slump") {
    return "rgb(251 113 133 / 0.9)";
  }

  return "rgb(148 163 184 / 0.9)";
}

function ScenarioDot({ slug }: { slug: string }) {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      height="10"
      viewBox="0 0 10 10"
      width="10"
    >
      <circle cx="5" cy="5" fill={getScenarioFill(slug)} r="5" />
    </svg>
  );
}

export function ScenarioTimeline({ data }: ScenarioTimelineProps) {
  if (data.spans.length === 0) {
    return null;
  }

  const totalMs = Date.parse(data.timelineEnd) - Date.parse(data.timelineStart) + DAY_IN_MS;

  if (totalMs <= 0) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-[0_18px_44px_rgb(15_23_42_/_0.08)] backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-700">
          Scenario History
        </p>
        <p className="text-xs text-ink-500">Full 120-day window · independent of date range filter</p>
      </div>

      <div className="relative mt-4">
        <svg
          aria-hidden="true"
          className="block h-10 w-full"
          preserveAspectRatio="none"
          viewBox={`0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`}
        >
          <rect
            fill="rgb(241 245 249 / 0.6)"
            height={TRACK_HEIGHT}
            rx={TRACK_RADIUS}
            width={TRACK_WIDTH}
            x="0"
            y="0"
          />
          <rect
            fill="none"
            height={TRACK_HEIGHT - 1}
            rx={TRACK_RADIUS}
            stroke="rgb(255 255 255 / 0.7)"
            width={TRACK_WIDTH - 1}
            x="0.5"
            y="0.5"
          />
          {data.spans.map((span) => {
            const left =
              ((Date.parse(span.startDate) - Date.parse(data.timelineStart)) / totalMs) * TRACK_WIDTH;
            const width =
              ((Date.parse(span.endDate) - Date.parse(span.startDate) + DAY_IN_MS) / totalMs) *
              TRACK_WIDTH;

            return (
              <rect
                fill={getScenarioFill(span.slug)}
                height={TRACK_HEIGHT - 4}
                key={`${span.slug}:${span.startDate}:rect`}
                rx="4"
                width={Math.max(width, 16)}
                x={left}
                y="2"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0">
          {data.spans.map((span) => {
            const leftPct =
              ((Date.parse(span.startDate) - Date.parse(data.timelineStart)) / totalMs) * 100;
            const widthPct =
              ((Date.parse(span.endDate) - Date.parse(span.startDate) + DAY_IN_MS) / totalMs) * 100;
            const label = span.storeId ? `${span.label} · ${span.storeName}` : span.label;
            const style = {
              left: `${leftPct}%`,
              width: `${Math.max(widthPct, 1.5)}%`,
            };

            if (span.storeUrl) {
              return (
                <Link
                  aria-label={label}
                  className="absolute top-0 h-10 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  href={span.storeUrl}
                  key={`${span.slug}:${span.startDate}`}
                  style={style}
                  title={`${label} · ${fmtAxisDate(span.startDate)}–${fmtAxisDate(span.endDate)}`}
                />
              );
            }

            return (
              <div
                aria-label={label}
                className="absolute top-0 h-10 rounded-sm"
                key={`${span.slug}:${span.startDate}`}
                style={style}
                title={`${label} · ${fmtAxisDate(span.startDate)}–${fmtAxisDate(span.endDate)}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex justify-between text-xs text-ink-500">
        <span>{fmtAxisDate(data.timelineStart)}</span>
        <span>{fmtAxisDate(data.timelineEnd)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.spans.map((span) => {
          const label = span.storeId ? `${span.label} · ${span.storeName}` : span.label;
          const content = (
            <>
              <ScenarioDot slug={span.slug} />
              <span className="font-medium text-ink-900">{label}</span>
              <span className="text-ink-500">
                {fmtAxisDate(span.startDate)}-{fmtAxisDate(span.endDate)}
              </span>
            </>
          );

          if (span.storeUrl) {
            return (
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-xs shadow-[0_10px_24px_rgb(15_23_42_/_0.06)] transition-colors hover:bg-white"
                href={span.storeUrl}
                key={`${span.slug}:${span.startDate}:legend`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs"
              key={`${span.slug}:${span.startDate}:legend`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
