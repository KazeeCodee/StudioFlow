import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { memberPlans } from "@/lib/db/schema";

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

export function mapBookingTransactionError(error: unknown): Error {
  if (getPostgresErrorCode(error) === "23P01") {
    return new Error("El espacio ya tiene una reserva superpuesta.");
  }

  return error instanceof Error ? error : new Error("No pudimos completar la reserva.");
}
