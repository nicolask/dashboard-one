import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("joins only truthy class names", () => {
    expect(cn("alpha", false, undefined, "beta", null, "gamma")).toBe("alpha beta gamma");
  });

  it("prefers the last conflicting Tailwind utility", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("supports clsx-style conditional inputs", () => {
    expect(cn("alpha", ["beta", { gamma: true, delta: false }])).toBe("alpha beta gamma");
  });
});
