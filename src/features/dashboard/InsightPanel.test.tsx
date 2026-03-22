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
    ];

    render(<InsightPanel insights={insights} />);

    expect(screen.getByText("Store Slump")).toBeInTheDocument();
    expect(screen.getByText("4 days")).toBeInTheDocument();
    expect(screen.getByText(/18.3% below/i)).toBeInTheDocument();
    expect(screen.getByText("-18.3 %")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view store/i })).toHaveAttribute(
      "href",
      "/stores/store-1",
    );
  });
});
