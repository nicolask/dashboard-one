import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { snapshot } from "@/features/agentic/snapshot-data";

describe("snapshot-data", () => {
  it("keeps the snapshot as a plain data module with no React imports", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/features/agentic/snapshot-data.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["']react["']/i);
    expect(source).not.toMatch(/jsx|tsx/i);
  });

  it("contains the expected top-level snapshot structure", () => {
    expect(snapshot.conditions).toHaveLength(4);
    expect(snapshot.locBreakdown).toHaveLength(5);
    expect(snapshot.taskBreakdown.length).toBeGreaterThan(0);
    expect(snapshot.actualHours).toBeGreaterThan(0);
  });
});
