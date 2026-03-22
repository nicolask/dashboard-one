import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const aggregateMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    dailyStoreMetric: {
      findMany: findManyMock,
      aggregate: aggregateMock,
    },
  },
}));

describe("getScenarioTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups spans by scenario slug and derives store drilldown links", async () => {
    findManyMock.mockResolvedValue([
      {
        date: new Date("2026-01-05T00:00:00.000Z"),
        scenarioSlug: "promo_week",
        storeId: "store-1",
        store: { id: "store-1", name: "Berlin Mitte" },
      },
      {
        date: new Date("2026-01-07T00:00:00.000Z"),
        scenarioSlug: "promo_week",
        storeId: "store-2",
        store: { id: "store-2", name: "Hamburg Altona" },
      },
      {
        date: new Date("2026-03-10T00:00:00.000Z"),
        scenarioSlug: "store_slump",
        storeId: "store-3",
        store: { id: "store-3", name: "Leipzig Gohlis" },
      },
      {
        date: new Date("2026-03-14T00:00:00.000Z"),
        scenarioSlug: "store_slump",
        storeId: "store-3",
        store: { id: "store-3", name: "Leipzig Gohlis" },
      },
      {
        date: new Date("2026-03-16T00:00:00.000Z"),
        scenarioSlug: "ops_issue",
        storeId: "store-4",
        store: { id: "store-4", name: "Munich Maxvorstadt" },
      },
    ]);
    aggregateMock.mockResolvedValue({
      _min: { date: new Date("2025-12-01T00:00:00.000Z") },
      _max: { date: new Date("2026-03-29T00:00:00.000Z") },
    });

    const { getScenarioTimeline } = await import("@/lib/kpi/scenarios");
    const result = await getScenarioTimeline();

    expect(findManyMock).toHaveBeenCalledWith({
      where: { scenarioSlug: { not: null } },
      select: {
        date: true,
        scenarioSlug: true,
        storeId: true,
        store: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });
    expect(aggregateMock).toHaveBeenCalledWith({
      _min: { date: true },
      _max: { date: true },
    });

    expect(result).toMatchObject({
      timelineStart: "2025-12-01",
      timelineEnd: "2026-03-29",
    });
    expect(result.spans).toEqual([
      {
        slug: "promo_week",
        label: "Promo Week",
        startDate: "2026-01-05",
        endDate: "2026-01-07",
        affectedStoreCount: 2,
        storeId: null,
        storeName: null,
        storeUrl: null,
      },
      {
        slug: "store_slump",
        label: "Store Slump",
        startDate: "2026-03-10",
        endDate: "2026-03-14",
        affectedStoreCount: 1,
        storeId: "store-3",
        storeName: "Leipzig Gohlis",
        storeUrl: "/stores/store-3",
      },
      {
        slug: "ops_issue",
        label: "Ops Issue",
        startDate: "2026-03-16",
        endDate: "2026-03-16",
        affectedStoreCount: 1,
        storeId: "store-4",
        storeName: "Munich Maxvorstadt",
        storeUrl: "/stores/store-4",
      },
    ]);
  });

  it("returns a today fallback when the table is empty", async () => {
    findManyMock.mockResolvedValue([]);
    aggregateMock.mockResolvedValue({
      _min: { date: null },
      _max: { date: null },
    });

    const { getScenarioTimeline } = await import("@/lib/kpi/scenarios");
    const result = await getScenarioTimeline("store-1");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        scenarioSlug: { not: null },
        storeId: "store-1",
      },
      select: {
        date: true,
        scenarioSlug: true,
        storeId: true,
        store: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });
    expect(result).toEqual({
      spans: [],
      timelineStart: "2026-03-22",
      timelineEnd: "2026-03-22",
    });
  });
});
