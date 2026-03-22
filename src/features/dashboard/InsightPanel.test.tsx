import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InsightPanel } from "@/features/dashboard/InsightPanel";
import type { Insight } from "@/lib/kpi";

describe("InsightPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders an empty state when no insights exist", () => {
    render(<InsightPanel insights={[]} />);

    expect(screen.getByText(/no active anomalies detected/i)).toBeInTheDocument();
  });

  it("renders insight cards with badges and store links", () => {
    const insights: Insight[] = [
      {
        id: "store_slump:store-1",
        scenarioSlug: "store_slump",
        storeId: "store-1",
        storeCode: "LEI-01",
        storeName: "Leipzig Gohlis",
        headline: "Leipzig Gohlis is 18.3% below its prior-period average revenue.",
        detail: "Revenue averaged EUR 82.00 over the last 4 days vs. EUR 100.00 in the preceding period.",
        priority: 0.183,
        durationDays: 4,
        isActive: true,
        dateRangeLabel: "Mar 18–21",
        deviationPercent: -0.183,
        affectedMetric: "revenue",
        storeUrl: "/stores/store-1",
      },
      {
        id: "traffic_surge:store-2",
        scenarioSlug: "traffic_surge",
        storeId: "store-2",
        storeCode: "HAM-01",
        storeName: "Hamburg Altona",
        headline: "Hamburg Altona is seeing a 12.4% conversion drop despite a 45.0% visitor increase during the traffic surge.",
        detail: "Conversion averaged 4.2% over 8 days vs. 4.8% prior - more footfall, fewer buyers.",
        priority: 0.124,
        durationDays: 8,
        isActive: true,
        dateRangeLabel: "Mar 12–19",
        deviationPercent: -0.124,
        affectedMetric: "conversion",
        storeUrl: "/stores/store-2",
      },
      {
        id: "competitor_opening:store-3",
        scenarioSlug: "competitor_opening",
        storeId: "store-3",
        storeCode: "MUC-01",
        storeName: "München Maxvorstadt",
        headline: "After a competitor opened nearby (Mar 1–30), München Maxvorstadt revenue ran 18.1% below baseline.",
        detail: "Revenue averaged EUR 82.00 over 30 days (Mar 1–30) vs. EUR 100.00 in the preceding period.",
        priority: 0.181,
        durationDays: 30,
        isActive: false,
        dateRangeLabel: "Mar 1–30",
        deviationPercent: -0.181,
        affectedMetric: "revenue",
        storeUrl: "/stores/store-3",
      },
    ];

    render(<InsightPanel insights={insights} />);

    expect(screen.getByText("Store Slump")).toBeInTheDocument();
    expect(screen.getByText("Traffic Surge")).toBeInTheDocument();
    expect(screen.getByText("Competitor Opening")).toBeInTheDocument();
    expect(screen.getByText("Explainable performance signals")).toBeInTheDocument();
    expect(screen.getByText("Active alerts")).toBeInTheDocument();
    expect(screen.getByText("Historical context")).toBeInTheDocument();
    expect(screen.getByText("Mar 18–21 · 4 days")).toBeInTheDocument();
    expect(screen.getByText("Mar 12–19 · 8 days")).toBeInTheDocument();
    expect(screen.getByText("Mar 1–30 · 30 days")).toBeInTheDocument();
    expect(screen.getByText(/18.3% below/i)).toBeInTheDocument();
    expect(screen.getByText("-18.3 %")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view store/i })).toHaveLength(3);
  });

  it("omits tier headers when only one insight tier is present", () => {
    const insights: Insight[] = [
      {
        id: "promo_week:store-1",
        scenarioSlug: "promo_week",
        storeId: "store-1",
        storeCode: "BER-02",
        storeName: "Berlin Mitte",
        headline: "Berlin Mitte is showing 18.3% above-average revenue since Promo Week began.",
        detail: "Revenue averaged EUR 118.00 over 4 days — up from EUR 100.00 in the prior period.",
        priority: 0.183,
        durationDays: 4,
        isActive: true,
        dateRangeLabel: "Mar 18–21",
        deviationPercent: 0.183,
        affectedMetric: "revenue",
        storeUrl: "/stores/store-1",
      },
    ];

    render(<InsightPanel insights={insights} />);

    expect(screen.queryByText("Active alerts")).not.toBeInTheDocument();
    expect(screen.queryByText("Historical context")).not.toBeInTheDocument();
    expect(screen.getByText("Mar 18–21 · 4 days")).toBeInTheDocument();
  });

  it("renders single-day labels without repeating the day number", () => {
    const insights: Insight[] = [
      {
        id: "ops_issue:store-1",
        scenarioSlug: "ops_issue",
        storeId: "store-1",
        storeCode: "BER-02",
        storeName: "Berlin Mitte",
        headline: "Berlin Mitte has an active alert: Ops Issue (1 day).",
        detail: "Revenue averaged EUR 118.00 vs. a prior-period baseline of EUR 100.00.",
        priority: 0.183,
        durationDays: 1,
        isActive: true,
        dateRangeLabel: "Mar 18",
        deviationPercent: 0.183,
        affectedMetric: "revenue",
        storeUrl: "/stores/store-1",
      },
    ];

    render(<InsightPanel insights={insights} />);

    expect(screen.getByText("Mar 18 · 1 day")).toBeInTheDocument();
    expect(screen.queryByText("Mar 18–18 · 1 day")).not.toBeInTheDocument();
  });
});
