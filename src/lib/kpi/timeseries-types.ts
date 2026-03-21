export type TimeSeriesMetric = "revenue" | "orders" | "conversion" | "traffic";

export type TimeSeriesPoint = {
  date: string; // YYYY-MM-DD
  value: number;
};
