import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiCard } from "@/features/dashboard/KpiCard";

describe("KpiCard", () => {
  it("renders percent deltas by default", () => {
    render(<KpiCard delta={0.125} label="Revenue" value="EUR 12,400" deltaLabel="vs. previous 30d" />);

    expect(screen.getByText("+12.5 %")).toBeInTheDocument();
    expect(screen.getByText("vs. previous 30d")).toBeInTheDocument();
  });

  it("renders conversion deltas in percentage points", () => {
    render(
      <KpiCard
        delta={0.0025}
        deltaLabel="vs. previous 7d"
        deltaMode="pp"
        label="Conversion"
        value="3.20 %"
      />,
    );

    expect(screen.getByText("+0.25 pp")).toBeInTheDocument();
  });

  it("renders negative conversion delta in percentage points", () => {
    render(
      <KpiCard
        delta={-0.003}
        deltaLabel="vs. previous 30d"
        deltaMode="pp"
        label="Conversion"
        value="2.70 %"
      />,
    );

    expect(screen.getByText("−0.30 pp")).toBeInTheDocument();
  });

  it("keeps the default label when none is provided", () => {
    render(<KpiCard delta={0} label="Orders" value="120" />);

    expect(screen.getByText("0.0 %")).toBeInTheDocument();
    expect(screen.getByText("vs. previous period")).toBeInTheDocument();
  });
});
