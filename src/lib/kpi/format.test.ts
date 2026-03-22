import { describe, expect, it } from "vitest";

import {
  formatBasket,
  formatCostRatio,
  formatConversion,
  formatOrders,
  formatRevenue,
  formatRevenuePerStaffHour,
} from "@/lib/kpi/format";

describe("formatRevenue", () => {
  it("formats million-scale values compactly", () => {
    const formatted = formatRevenue(1_240_000);
    expect(formatted).toContain("1.24");
    expect(formatted).toMatch(/[A-Z€]/);
  });

  it("formats thousand-scale values compactly", () => {
    const formatted = formatRevenue(124_000);
    expect(formatted).toContain("124");
    expect(formatted.toLowerCase()).toContain("k");
  });

  it("formats smaller values as currency with decimals", () => {
    const formatted = formatRevenue(87.5);
    expect(formatted).toContain("87.50");
    expect(formatted).toContain("€");
  });
});

describe("formatOrders", () => {
  it("formats orders with grouping separators", () => {
    expect(formatOrders(12345)).toBe("12,345");
  });
});

describe("formatBasket", () => {
  it("formats basket values as fixed currency", () => {
    const formatted = formatBasket(42);
    expect(formatted).toContain("42.00");
    expect(formatted).toContain("€");
  });
});

describe("formatConversion", () => {
  it("formats non-zero conversion values as percentages", () => {
    expect(formatConversion(0.0423)).toBe("4.23 %");
  });

  it("formats zero conversion cleanly", () => {
    expect(formatConversion(0)).toBe("0.00 %");
  });
});

describe("formatCostRatio", () => {
  it("formats cost ratios as one-decimal percentages", () => {
    expect(formatCostRatio(0.314)).toBe("31.4 %");
  });
});

describe("formatRevenuePerStaffHour", () => {
  it("formats revenue per staff hour as fixed currency", () => {
    const formatted = formatRevenuePerStaffHour(42);
    expect(formatted).toContain("42.00");
    expect(formatted).toContain("€");
  });
});
