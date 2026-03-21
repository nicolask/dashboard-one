import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("joins only truthy class names", () => {
    expect(cn("alpha", false, undefined, "beta", null, "gamma")).toBe("alpha beta gamma");
  });
});
