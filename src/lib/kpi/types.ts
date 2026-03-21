export type KpiValue = {
  value: number;
  previousValue: number;
  delta: number;
  deltaPercent: number;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export function buildDateRanges(days: number): {
  current: DateRange;
  previous: DateRange;
} {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date(to);
  from.setDate(to.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  prevTo.setHours(23, 59, 59, 999);

  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevTo.getDate() - days + 1);
  prevFrom.setHours(0, 0, 0, 0);

  return { current: { from, to }, previous: { from: prevFrom, to: prevTo } };
}

export function calcKpi(current: number, previous: number): KpiValue {
  const delta = current - previous;
  const deltaPercent = previous !== 0 ? delta / previous : 0;

  return {
    value: current,
    previousValue: previous,
    delta,
    deltaPercent,
  };
}
