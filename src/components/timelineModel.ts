export function clampPeriodIndex(value: number, periodCount: number) {
  if (periodCount <= 0) return 0;
  return Math.min(periodCount - 1, Math.max(0, Math.round(value)));
}

export function getPeriodRangeValue(periodId: string, periodIds: string[]) {
  const index = periodIds.indexOf(periodId);
  return index < 0 ? 0 : index;
}
