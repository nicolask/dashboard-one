import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDateRanges, calcKpi } from "@/lib/kpi/types";

afterEach(() => {
  vi.useRealTimers();
});

describe("buildDateRanges", () => {
  it("builds adjacent one-day current and previous ranges without overlap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));

    const { current, previous } = buildDateRanges(1);

    expect(current.from.getHours()).toBe(0);
    expect(current.from.getMinutes()).toBe(0);
    expect(current.from.getSeconds()).toBe(0);
    expect(current.from.getMilliseconds()).toBe(0);
    expect(current.to.getHours()).toBe(23);
    expect(current.to.getMinutes()).toBe(59);
    expect(current.to.getSeconds()).toBe(59);
    expect(current.to.getMilliseconds()).toBe(999);
    expect(previous.from.getHours()).toBe(0);
    expect(previous.to.getHours()).toBe(23);
    expect(current.from.getTime() - previous.to.getTime()).toBe(1);
  });

  it("builds matching current and previous windows for larger ranges", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T14:20:00.000Z"));

    const { current, previous } = buildDateRanges(90);

    expect(current.from.getFullYear()).toBe(2025);
    expect(current.from.getMonth()).toBe(11);
    expect(current.from.getDate()).toBe(22);
    expect(current.to.getFullYear()).toBe(2026);
    expect(current.to.getMonth()).toBe(2);
    expect(current.to.getDate()).toBe(21);
    expect(previous.from.getFullYear()).toBe(2025);
    expect(previous.from.getMonth()).toBe(8);
    expect(previous.from.getDate()).toBe(23);
    expect(previous.to.getFullYear()).toBe(2025);
    expect(previous.to.getMonth()).toBe(11);
    expect(previous.to.getDate()).toBe(21);
    expect(current.from.getHours()).toBe(0);
    expect(current.to.getHours()).toBe(23);
    expect(previous.from.getHours()).toBe(0);
    expect(previous.to.getHours()).toBe(23);
    expect(current.from.getTime() - previous.to.getTime()).toBe(1);
  });
});

describe("calcKpi", () => {
  it("calculates a positive delta and deltaPercent", () => {
    expect(calcKpi(120, 100)).toEqual({
      value: 120,
      previousValue: 100,
      delta: 20,
      deltaPercent: 0.2,
    });
  });

  it("calculates a negative delta and preserves the sign", () => {
    expect(calcKpi(75, 100)).toEqual({
      value: 75,
      previousValue: 100,
      delta: -25,
      deltaPercent: -0.25,
    });
  });

  it("returns zero deltas when values are equal", () => {
    expect(calcKpi(42, 42)).toEqual({
      value: 42,
      previousValue: 42,
      delta: 0,
      deltaPercent: 0,
    });
  });

  it("avoids division by zero when there is no previous value", () => {
    expect(calcKpi(42, 0)).toEqual({
      value: 42,
      previousValue: 0,
      delta: 42,
      deltaPercent: 0,
    });
  });
});
