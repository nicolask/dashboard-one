import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiCurrentUserMock = vi.fn();
const getMetricsTimeSeriesMock = vi.fn();

vi.mock("@/lib/auth/api-auth", () => ({
  requireApiCurrentUser: requireApiCurrentUserMock,
}));

vi.mock("@/lib/kpi/timeseries", () => ({
  getMetricsTimeSeries: getMetricsTimeSeriesMock,
}));

describe("GET /api/kpi/timeseries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 and skips the KPI query when unauthorized", async () => {
    requireApiCurrentUserMock.mockResolvedValue(
      Response.json({ error: "unauthorized" }, { status: 401 }),
    );

    const { GET } = await import("@/app/api/kpi/timeseries/route");
    const response = await GET({
      nextUrl: new URL("http://localhost/api/kpi/timeseries?days=7&metric=orders"),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(getMetricsTimeSeriesMock).not.toHaveBeenCalled();
  });

  it("returns KPI data for an authenticated user", async () => {
    requireApiCurrentUserMock.mockResolvedValue({
      id: "user_123",
      email: "alice@example.com",
    });
    getMetricsTimeSeriesMock.mockResolvedValue([
      { date: "2026-03-20", value: 1200 },
      { date: "2026-03-21", value: 1400 },
    ]);

    const { GET } = await import("@/app/api/kpi/timeseries/route");
    const response = await GET({
      nextUrl: new URL("http://localhost/api/kpi/timeseries?days=7&metric=revenue"),
    } as never);

    expect(getMetricsTimeSeriesMock).toHaveBeenCalledWith(7, "revenue", undefined);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { date: "2026-03-20", value: 1200 },
      { date: "2026-03-21", value: 1400 },
    ]);
  });

  it("falls back to default query values for invalid params", async () => {
    requireApiCurrentUserMock.mockResolvedValue({
      id: "user_456",
      email: "bob@example.com",
    });
    getMetricsTimeSeriesMock.mockResolvedValue([]);

    const { GET } = await import("@/app/api/kpi/timeseries/route");
    const response = await GET({
      nextUrl: new URL("http://localhost/api/kpi/timeseries?days=999&metric=bogus"),
    } as never);

    expect(getMetricsTimeSeriesMock).toHaveBeenCalledWith(30, "revenue", undefined);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });
});
