import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, memberPlans } from "@/lib/db/schema";

export type BookingTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

export async function lockBookingSpace(
  tx: BookingTransaction,
  spaceId: string,
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${spaceId}, 0))`,
  );
}

export async function lockBooking(
  tx: BookingTransaction,
  bookingId: string,
) {
  await tx.execute(sql`
    select ${bookings.id}
    from ${bookings}
    where ${bookings.id} = ${bookingId}
    for update
  `);
}

export async function lockMemberPlan(
  tx: BookingTransaction,
  memberPlanId: string,
) {
  await tx.execute(sql`
    select ${memberPlans.id}
    from ${memberPlans}
    where ${memberPlans.id} = ${memberPlanId}
    for update
  `);
}

export async function lockActiveMemberPlan(
  tx: BookingTransaction,
  memberId: string,
) {
  await tx.execute(sql`
    select ${memberPlans.id}
    from ${memberPlans}
    where ${memberPlans.memberId} = ${memberId}
      and ${memberPlans.status} = 'active'
    for update
  `);
}

export async function runBookingTransaction<T>(
  spaceId: string,
  operation: (tx: BookingTransaction) => Promise<T>,
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    await lockBookingSpace(tx, spaceId);
    return operation(tx);
  });
}

function getPostgresErrorCode(error: unknown) {
  let current = error;

  while (current && typeof current === "object") {
    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }

    current = "cause" in current ? current.cause : null;
  }

  return null;
}

export function mapBookingTransactionError(
  error: unknown,
  overlapMessage = "El espacio ya tiene una reserva superpuesta.",
): Error {
  if (getPostgresErrorCode(error) === "23P01") {
    return new Error(overlapMessage);
  }

  return error instanceof Error ? error : new Error("No pudimos completar la reserva.");
}
