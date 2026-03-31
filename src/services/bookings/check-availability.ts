export type BookingInterval = {
  startsAt: Date;
  endsAt: Date;
};

export function applyBookingBuffer(
  interval: BookingInterval,
  bufferHours: number,
) {
  const bufferMs = bufferHours * 3_600_000;

  return {
    startsAt: new Date(interval.startsAt.getTime() - bufferMs),
    endsAt: new Date(interval.endsAt.getTime() + bufferMs),
  };
}

export function hasOverlap(target: BookingInterval, intervals: BookingInterval[]) {
  return intervals.some(
    (interval) => target.startsAt < interval.endsAt && target.endsAt > interval.startsAt,
  );
}
