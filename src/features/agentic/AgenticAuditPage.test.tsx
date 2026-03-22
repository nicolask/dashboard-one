import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgenticAuditPage } from "@/features/agentic/AgenticAuditPage";
import { snapshot } from "@/features/agentic/snapshot-data";

describe("AgenticAuditPage", () => {
  it("renders the main audit sections and snapshot values", () => {
    render(<AgenticAuditPage />);

    expect(screen.getByText("Agentic Development Audit")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: new RegExp(`retail dashboard — in ~${snapshot.actualHours}h`, "i"),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Einordnung")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /code volume by workstream/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /plausible senior build effort by slice/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /^4–6×$/i })).toBeInTheDocument();
  });

  it("renders all condition entries from the snapshot data", () => {
    render(<AgenticAuditPage />);

    for (const condition of snapshot.conditions) {
      expect(screen.getAllByRole("heading", { level: 3, name: condition.heading })[0]).toBeInTheDocument();
      expect(screen.getAllByText(condition.body)[0]).toBeInTheDocument();
    }
  });
});
