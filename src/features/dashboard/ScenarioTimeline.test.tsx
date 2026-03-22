import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScenarioTimeline } from "@/features/dashboard/ScenarioTimeline";
import type { ScenarioTimelineData } from "@/lib/kpi";

afterEach(() => {
  cleanup();
});

describe("ScenarioTimeline", () => {
  it("renders nothing when there are no spans", () => {
    const { container } = render(
      <ScenarioTimeline
        data={{
          spans: [],
          timelineStart: "2026-01-01",
          timelineEnd: "2026-04-30",
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders scenario bands, labels, and store links", () => {
    const data: ScenarioTimelineData = {
      timelineStart: "2026-01-01",
      timelineEnd: "2026-04-30",
      spans: [
        {
          slug: "promo_week",
          label: "Promo Week",
          startDate: "2026-03-01",
          endDate: "2026-03-07",
          affectedStoreCount: 3,
          storeId: null,
          storeName: null,
          storeUrl: null,
        },
        {
          slug: "store_slump",
          label: "Store Slump",
          startDate: "2026-03-15",
          endDate: "2026-03-20",
          affectedStoreCount: 1,
          storeId: "store-1",
          storeName: "Leipzig Gohlis",
          storeUrl: "/stores/store-1",
        },
        {
          slug: "traffic_surge",
          label: "Traffic Surge",
          startDate: "2026-02-10",
          endDate: "2026-02-17",
          affectedStoreCount: 1,
          storeId: "store-2",
          storeName: "Hamburg Altona",
          storeUrl: "/stores/store-2",
        },
      ],
    };

    render(<ScenarioTimeline data={data} />);

    expect(screen.getByText("Scenario History")).toBeInTheDocument();
    expect(
      screen.getByText("Full 120-day window · independent of date range filter"),
    ).toBeInTheDocument();
    expect(screen.getByText("Promo Week")).toBeInTheDocument();
    expect(screen.getByText("Store Slump · Leipzig Gohlis")).toBeInTheDocument();
    expect(screen.getByText("Traffic Surge · Hamburg Altona")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Store Slump · Leipzig Gohlis" })).toHaveAttribute(
      "href",
      "/stores/store-1",
    );
    expect(screen.getByRole("link", { name: "Traffic Surge · Hamburg Altona" })).toHaveAttribute(
      "href",
      "/stores/store-2",
    );
    expect(screen.getByText("10 Feb 26-17 Feb 26")).toBeInTheDocument();
    expect(screen.getByText("1 Mar 26-7 Mar 26")).toBeInTheDocument();
    expect(screen.getByText("15 Mar 26-20 Mar 26")).toBeInTheDocument();
    expect(screen.getByText("1 Jan 26")).toBeInTheDocument();
    expect(screen.getByText("30 Apr 26")).toBeInTheDocument();
  });

  it("renders a full-width single-day span when the timeline bounds collapse", () => {
    render(
      <ScenarioTimeline
        data={{
          timelineStart: "2026-03-22",
          timelineEnd: "2026-03-22",
          spans: [
            {
              slug: "store_slump",
              label: "Store Slump",
              startDate: "2026-03-22",
              endDate: "2026-03-22",
              affectedStoreCount: 1,
              storeId: "store-1",
              storeName: "Leipzig Gohlis",
              storeUrl: "/stores/store-1",
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByText("22 Mar 26").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: "Store Slump · Leipzig Gohlis" })).toHaveAttribute(
      "href",
      "/stores/store-1",
    );
  });
});
