import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KpiChart } from "@/features/dashboard/KpiChart";
import type { TimeSeriesPoint } from "@/lib/kpi/timeseries-types";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: TimeSeriesPoint[];
  }) => <div data-points={JSON.stringify(data)} data-testid="line-chart">{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  Tooltip: () => null,
  Line: () => null,
}));

const fetchMock = vi.fn<typeof fetch>();

const INITIAL_REVENUE_DATA: TimeSeriesPoint[] = [
  { date: "2026-03-20", value: 1200 },
  { date: "2026-03-21", value: 1400 },
];

const NEXT_REVENUE_DATA: TimeSeriesPoint[] = [
  { date: "2026-03-14", value: 820 },
  { date: "2026-03-21", value: 975 },
];

function getRenderedData() {
  const raw = screen.getByTestId("line-chart").getAttribute("data-points");

  return raw ? (JSON.parse(raw) as TimeSeriesPoint[]) : [];
}

function mockFetchJson(data: TimeSeriesPoint[]) {
  fetchMock.mockResolvedValueOnce({
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response);
}

function createDeferredJsonResponse(data: TimeSeriesPoint[]) {
  let resolveJson: (() => void) | null = null;

  const response = {
    json: vi.fn(
      () =>
        new Promise<TimeSeriesPoint[]>((resolve) => {
          resolveJson = () => resolve(data);
        }),
    ),
  } as unknown as Response;

  return {
    response,
    resolve() {
      resolveJson?.();
    },
  };
}

describe("KpiChart", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders revenue data from initial props", () => {
    render(<KpiChart days={30} initialData={INITIAL_REVENUE_DATA} />);

    expect(screen.getByRole("button", { name: "Revenue" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getRenderedData()).toEqual(INITIAL_REVENUE_DATA);
  });

  it("fetches a new metric for the current day range", async () => {
    const ordersData = [{ date: "2026-03-21", value: 64 }];
    mockFetchJson(ordersData);

    render(<KpiChart days={30} initialData={INITIAL_REVENUE_DATA} />);
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/kpi/timeseries?days=30&metric=orders");
    });

    await waitFor(() => {
      expect(getRenderedData()).toEqual(ordersData);
    });
  });

  it("includes the store id when fetching store-scoped series", async () => {
    const ordersData = [{ date: "2026-03-21", value: 64 }];
    mockFetchJson(ordersData);

    render(<KpiChart days={30} initialData={INITIAL_REVENUE_DATA} storeId="store_123" />);
    fireEvent.click(screen.getByRole("button", { name: "Orders" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/kpi/timeseries?days=30&metric=orders&storeId=store_123",
      );
    });
  });

  it("syncs new revenue props without an extra fetch when revenue stays active", () => {
    const { rerender } = render(<KpiChart days={30} initialData={INITIAL_REVENUE_DATA} />);

    rerender(<KpiChart days={7} initialData={NEXT_REVENUE_DATA} />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getRenderedData()).toEqual(NEXT_REVENUE_DATA);
    expect(screen.getByText(/trend/i)).toHaveTextContent("last 7 days");
  });

  it("keeps the active metric and refetches it when the day range changes", async () => {
    const orders30 = [{ date: "2026-03-21", value: 64 }];
    const orders7 = [{ date: "2026-03-21", value: 18 }];
    mockFetchJson(orders30);
    mockFetchJson(orders7);

    const { rerender } = render(<KpiChart days={30} initialData={INITIAL_REVENUE_DATA} />);

    fireEvent.click(screen.getByRole("button", { name: "Orders" }));

    await waitFor(() => {
      expect(getRenderedData()).toEqual(orders30);
    });

    rerender(<KpiChart days={7} initialData={NEXT_REVENUE_DATA} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/kpi/timeseries?days=7&metric=orders");
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Orders" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(getRenderedData()).toEqual(orders7);
    });
  });

  it("ignores stale responses when a newer request finishes later", async () => {
    const slowOrders = createDeferredJsonResponse([{ date: "2026-03-21", value: 64 }]);
    const fastOrders = createDeferredJsonResponse([{ date: "2026-03-21", value: 18 }]);

    fetchMock.mockResolvedValueOnce(slowOrders.response).mockResolvedValueOnce(fastOrders.response);

    const { rerender } = render(<KpiChart days={30} initialData={INITIAL_REVENUE_DATA} />);

    fireEvent.click(screen.getByRole("button", { name: "Orders" }));
    rerender(<KpiChart days={7} initialData={NEXT_REVENUE_DATA} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      fastOrders.resolve();
    });

    await waitFor(() => {
      expect(getRenderedData()).toEqual([{ date: "2026-03-21", value: 18 }]);
    });

    await act(async () => {
      slowOrders.resolve();
    });

    await waitFor(() => {
      expect(getRenderedData()).toEqual([{ date: "2026-03-21", value: 18 }]);
    });
  });
});
