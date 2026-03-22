import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InsightPanel } from "@/features/dashboard/InsightPanel";
import type { Insight } from "@/lib/kpi";

describe("InsightPanel", () => {
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
        headline: "Hamburg Altona saw a 12.4% conversion drop despite a 45.0% visitor increase during the traffic surge.",
        detail: "Conversion averaged 4.2% over 8 days vs. 4.8% prior - more footfall, fewer buyers.",
        priority: 0.124,
        durationDays: 8,
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
        headline: "München Maxvorstadt revenue is 18.1% below baseline since a competitor opened nearby.",
        detail: "Revenue averaged EUR 82.00 over 30 days vs. EUR 100.00 in the preceding period.",
        priority: 0.181,
        durationDays: 30,
        deviationPercent: -0.181,
        affectedMetric: "revenue",
        storeUrl: "/stores/store-3",
      },
    ];

    render(<InsightPanel insights={insights} />);

    expect(screen.getByText("Store Slump")).toBeInTheDocument();
    expect(screen.getByText("Traffic Surge")).toBeInTheDocument();
    expect(screen.getByText("Competitor Opening")).toBeInTheDocument();
    expect(screen.getByText("4 days")).toBeInTheDocument();
    expect(screen.getByText("8 days")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
    expect(screen.getByText(/18.3% below/i)).toBeInTheDocument();
    expect(screen.getByText("-18.3 %")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view store/i })).toHaveLength(3);
  });
});
