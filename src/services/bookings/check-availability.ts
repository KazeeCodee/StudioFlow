export type BookingInterval = {
  startsAt: Date;
  endsAt: Date;
};

export function hasOverlap(target: BookingInterval, intervals: BookingInterval[]) {
  return intervals.some(
    (interval) => target.startsAt < interval.endsAt && target.endsAt > interval.startsAt,
  );
}
